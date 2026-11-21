import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { userRoles, partners } from "@/server/db/schema";

export interface ApiSuccessEnvelope<T = unknown> {
  ok: true;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiResponseEnvelope<T = unknown> =
  | ApiSuccessEnvelope<T>
  | ApiErrorEnvelope;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// In-memory sliding window rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

export function resetRateLimitStore() {
  rateLimitStore.clear();
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

export interface HandlerContext<TBody = unknown> {
  req: NextRequest;
  requestId: string;
  body: TBody;
  user?: { id: string; email: string; name: string };
  roles: string[];
  partner?: typeof partners.$inferSelect | null;
  params?: Record<string, string | string[]>;
}

export interface RouteHandlerOptions<TBody = unknown> {
  schema?: ZodSchema<TBody>;
  authRequired?: boolean;
  requiredRole?: "customer" | "seller" | "tailor" | "admin";
  partnerRequired?: boolean;
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  skipCsrf?: boolean;
  successStatus?: number;
}

const MAX_BODY_BYTES = 1024 * 1024; // 1MB payload cap

function isAllowedOrigin(origin: string | null, reqOrigin: string): boolean {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin).origin;
    if (originUrl === reqOrigin) return true;

    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "http://localhost:3000";
    const allowedList = allowedOriginsEnv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    return allowedList.includes(originUrl.toLowerCase());
  } catch {
    return false;
  }
}

export function createApiHandler<TBody = unknown, TResult = unknown>(
  handlerFn: (ctx: HandlerContext<TBody>) => Promise<TResult>,
  options: RouteHandlerOptions<TBody> = {}
) {
  return async (
    req: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse<ApiResponseEnvelope<TResult>>> => {
    // 1. Request ID
    const requestId =
      req.headers.get("x-request-id") ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

    const responseHeaders = new Headers();
    responseHeaders.set("x-request-id", requestId);
    responseHeaders.set("Content-Type", "application/json");

    try {
      const method = req.method.toUpperCase();
      const nextUrl = req.nextUrl || new URL(req.url);
      const reqOrigin = nextUrl.origin;

      // 2. Same-origin (CSRF) check on mutating methods
      if (
        !options.skipCsrf &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(method)
      ) {
        const originHeader = req.headers.get("origin");
        const refererHeader = req.headers.get("referer");
        const originToCheck = originHeader || (refererHeader ? new URL(refererHeader).origin : null);

        // If origin header is present, verify it matches allowed origins or host origin
        if (originToCheck && !isAllowedOrigin(originToCheck, reqOrigin)) {
          throw new ApiError(403, "FORBIDDEN", "Cross-origin request forbidden");
        }
      }

      // 3. Rate limit (per IP, per route)
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      const routePath = nextUrl.pathname;
      const rateLimitKey = `${ip}:${routePath}:${method}`;
      const maxRequests = options.rateLimit?.maxRequests ?? 60;
      const windowMs = options.rateLimit?.windowMs ?? 60_000;

      if (!checkRateLimit(rateLimitKey, maxRequests, windowMs)) {
        responseHeaders.set("Retry-After", Math.ceil(windowMs / 1000).toString());
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Too many requests. Please try again later."
        );
      }

      // 4. Server-side auth and capability check
      let user: { id: string; email: string; name: string } | undefined;
      let roles: string[] = [];

      if (options.authRequired || options.requiredRole || options.partnerRequired) {
        const session = await auth.api.getSession({
          headers: req.headers,
        });

        if (!session || !session.user) {
          throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
        }

        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        };

        // Query user roles from DB (never trusted from client)
        const userRolesRecords = await db
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));

        roles = userRolesRecords.map((r) => r.role);

        if (options.requiredRole) {
          const hasRole =
            roles.includes(options.requiredRole) || roles.includes("admin");
          if (!hasRole) {
            throw new ApiError(403, "FORBIDDEN", "Insufficient permissions");
          }
        }
      }

      // 5. Partner checks (verified and not suspended)
      let partnerRecord: typeof partners.$inferSelect | null = null;
      if (options.partnerRequired && user) {
        const partnerList = await db
          .select()
          .from(partners)
          .where(eq(partners.ownerUserId, user.id))
          .limit(1);

        if (partnerList.length === 0) {
          throw new ApiError(403, "NOT_A_PARTNER", "No partner account found");
        }

        partnerRecord = partnerList[0];

        if (partnerRecord.operationalStatus === "suspended") {
          throw new ApiError(
            403,
            "PARTNER_SUSPENDED",
            "Partner account is suspended"
          );
        }

        if (partnerRecord.verificationStatus !== "verified") {
          throw new ApiError(
            403,
            "PARTNER_NOT_VERIFIED",
            "Partner account is not yet verified"
          );
        }
      }

      // 6. Size-capped JSON body + Zod validation
      let parsedBody: TBody = undefined as unknown as TBody;

      if (["POST", "PUT", "PATCH"].includes(method)) {
        const contentType = req.headers.get("content-type") || "";

        const contentLengthHeader = req.headers.get("content-length");
        if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_BODY_BYTES) {
          throw new ApiError(
            413,
            "PAYLOAD_TOO_LARGE",
            "Request body exceeds 1MB limit"
          );
        }

        let rawText = "";
        try {
          rawText = await req.text();
        } catch {
          rawText = "";
        }

        if (rawText.length > MAX_BODY_BYTES) {
          throw new ApiError(
            413,
            "PAYLOAD_TOO_LARGE",
            "Request body exceeds 1MB limit"
          );
        }

        if (rawText.trim().length > 0) {
          if (!contentType.includes("application/json")) {
            throw new ApiError(
              415,
              "UNSUPPORTED_MEDIA_TYPE",
              "Content-Type must be application/json"
            );
          }

          try {
            parsedBody = JSON.parse(rawText) as TBody;
          } catch {
            throw new ApiError(400, "BAD_REQUEST", "Invalid JSON body");
          }
        }

        if (options.schema) {
          const validationResult = options.schema.safeParse(parsedBody);
          if (!validationResult.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of validationResult.error.issues) {
              const key = issue.path.join(".") || "body";
              if (!fieldErrors[key]) {
                fieldErrors[key] = issue.message;
              }
            }
            throw new ApiError(
              400,
              "VALIDATION_ERROR",
              "Validation failed",
              fieldErrors
            );
          }
          parsedBody = validationResult.data;
        }
      }

      // Resolve route params if provided (Promise in Next.js 15)
      let resolvedParams: Record<string, string | string[]> | undefined;
      const routeContext = args[0] as
        | { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> }
        | undefined;
      if (routeContext?.params) {
        resolvedParams =
          typeof (routeContext.params as Promise<Record<string, string | string[]>>).then === "function"
            ? await (routeContext.params as Promise<Record<string, string | string[]>>)
            : (routeContext.params as Record<string, string | string[]>);
      }

      // Execute route business logic
      const result = await handlerFn({
        req,
        requestId,
        body: parsedBody,
        user,
        roles,
        partner: partnerRecord,
        params: resolvedParams,
      });

      // 7. Uniform success envelope
      return NextResponse.json<ApiResponseEnvelope<TResult>>(
        {
          ok: true,
          data: result,
        },
        {
          status: options.successStatus || 200,
          headers: responseHeaders,
        }
      );
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        return NextResponse.json<ApiResponseEnvelope<TResult>>(
          {
            ok: false,
            error: {
              code: err.code,
              message: err.message,
              ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
            },
          },
          {
            status: err.status,
            headers: responseHeaders,
          }
        );
      }

      // 8. Unknown errors become generic INTERNAL_ERROR (log server-side, never leak)
      console.error(`[API_ERROR] [${requestId}]`, err);

      return NextResponse.json<ApiResponseEnvelope<TResult>>(
        {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        },
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }
  };
}
