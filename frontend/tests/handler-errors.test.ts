import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler, resetRateLimitStore } from "@/server/api/handler";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Mock the database client for isolated unit tests
vi.mock("@/server/db", () => {
  return {
    db: {
      select: vi.fn(),
      execute: vi.fn(),
    },
  };
});

describe("Handler Status Paths: 400, 401, 403, 413, 415, 429, 500", () => {
  const TestSchema = z.object({
    name: z.string().min(3),
    count: z.number().int().positive(),
  });

  it("returns 400 on malformed JSON body", async () => {
    const handler = createApiHandler(async (ctx) => ctx.body, {
      schema: TestSchema,
    });

    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: "not-json-content{{{",
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 on Zod schema validation failure with field errors", async () => {
    const handler = createApiHandler(async (ctx) => ctx.body, {
      schema: TestSchema,
    });

    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ name: "a", count: -5 }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fieldErrors).toBeDefined();
    expect(json.error.fieldErrors.name).toBeDefined();
    expect(json.error.fieldErrors.count).toBeDefined();
  });

  it("returns 401 when auth is required but session is missing", async () => {
    const handler = createApiHandler(async (ctx) => ctx.user, {
      authRequired: true,
    });

    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce(null as any);

    const req = new NextRequest("http://localhost:3000/api/protected");
    const res = await handler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 when user lacks required role", async () => {
    const handler = createApiHandler(async () => ({ adminData: true }), {
      authRequired: true,
      requiredRole: "admin",
    });

    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
      session: { id: "sess-123" },
    } as any);

    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "customer" }]),
    });
    vi.mocked(db.select).mockReturnValueOnce({ from: mockFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/admin-only");
    const res = await handler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("returns 403 when partner is suspended (PARTNER_SUSPENDED)", async () => {
    const handler = createApiHandler(async () => ({ partnerData: true }), {
      authRequired: true,
      partnerRequired: true,
    });

    vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
      user: { id: "user-123", email: "partner@example.com", name: "Partner User" },
      session: { id: "sess-123" },
    } as any);

    const mockRolesFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ role: "seller" }]),
    });
    const mockPartnerFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "partner-123",
            operationalStatus: "suspended",
            verificationStatus: "verified",
          },
        ]),
      }),
    });

    vi.mocked(db.select)
      .mockReturnValueOnce({ from: mockRolesFrom } as any)
      .mockReturnValueOnce({ from: mockPartnerFrom } as any);

    const req = new NextRequest("http://localhost:3000/api/partner-portal");
    const res = await handler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("PARTNER_SUSPENDED");
  });

  it("returns 413 when body exceeds size limit", async () => {
    const handler = createApiHandler(async (ctx) => ctx.body);

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": "2000000",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ data: "oversized" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("returns 415 when Content-Type is not application/json on mutating body", async () => {
    const handler = createApiHandler(async (ctx) => ctx.body);

    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        origin: "http://localhost:3000",
      },
      body: "plain text string",
    });

    const res = await handler(req);
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("returns 429 when rate limit exceeded", async () => {
    resetRateLimitStore();
    const handler = createApiHandler(async () => ({ ok: true }), {
      rateLimit: { maxRequests: 1, windowMs: 60_000 },
    });

    const req = new NextRequest("http://localhost:3000/api/rate-limit-test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    await handler(req); // hit 1
    const res = await handler(req); // hit 2 (blocked)
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("returns 500 on unhandled exception", async () => {
    const handler = createApiHandler(async () => {
      throw new Error("Simulated unexpected crash");
    });

    const req = new NextRequest("http://localhost:3000/api/crash");
    const res = await handler(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
