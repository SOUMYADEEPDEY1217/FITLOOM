import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createApiHandler } from "@/server/api/handler";

describe("CSRF / Same-Origin Verification", () => {
  const mutatingHandler = createApiHandler(
    async () => ({ success: true })
  );

  it("allows mutating requests from matching local host origin", async () => {
    const req = new NextRequest("http://localhost:3000/api/mutate", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({ item: "value" }),
    });

    const res = await mutatingHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("blocks mutating requests from untrusted external origins with HTTP 403", async () => {
    const req = new NextRequest("http://localhost:3000/api/mutate", {
      method: "POST",
      headers: {
        origin: "https://malicious-attacker-site.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ item: "exploit" }),
    });

    const res = await mutatingHandler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Cross-origin request forbidden",
      },
    });
  });

  it("allows GET requests regardless of external origin", async () => {
    const getHandler = createApiHandler(async () => ({ data: "safe" }));

    const req = new NextRequest("http://localhost:3000/api/safe-read", {
      method: "GET",
      headers: {
        origin: "https://some-external-site.com",
      },
    });

    const res = await getHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
