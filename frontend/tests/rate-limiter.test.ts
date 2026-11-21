import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createApiHandler, resetRateLimitStore } from "@/server/api/handler";

describe("API Route Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under the rate limit threshold", async () => {
    const handler = createApiHandler(
      async () => ({ ok: true }),
      {
        rateLimit: { maxRequests: 3, windowMs: 60_000 },
      }
    );

    const req1 = new NextRequest("http://localhost:3000/api/rate-test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const res1 = await handler(req1);
    expect(res1.status).toBe(200);

    const req2 = new NextRequest("http://localhost:3000/api/rate-test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const res2 = await handler(req2);
    expect(res2.status).toBe(200);

    const req3 = new NextRequest("http://localhost:3000/api/rate-test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const res3 = await handler(req3);
    expect(res3.status).toBe(200);
  });

  it("blocks requests exceeding rate limit with HTTP 429 and Retry-After header", async () => {
    const handler = createApiHandler(
      async () => ({ ok: true }),
      {
        rateLimit: { maxRequests: 2, windowMs: 30_000 },
      }
    );

    const req = new NextRequest("http://localhost:3000/api/rate-test", {
      headers: { "x-forwarded-for": "192.168.1.200" },
    });

    await handler(req); // hit 1
    await handler(req); // hit 2

    const blockedRes = await handler(req); // hit 3 (blocked)
    const json = await blockedRes.json();

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBe("30");
    expect(json).toEqual({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    });
  });
});
