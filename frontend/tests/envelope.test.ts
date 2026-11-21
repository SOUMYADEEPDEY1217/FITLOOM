import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createApiHandler, ApiError } from "@/server/api/handler";

describe("Uniform Response Envelope & Error Formatting", () => {
  it("formats successful handler response into { ok: true, data }", async () => {
    const handler = createApiHandler(async () => {
      return { status: "active", count: 42 };
    });

    const req = new NextRequest("http://localhost:3000/api/test-ok");
    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeDefined();
    expect(json).toEqual({
      ok: true,
      data: { status: "active", count: 42 },
    });
  });

  it("formats expected ApiError into { ok: false, error: { code, message, fieldErrors? } }", async () => {
    const handler = createApiHandler(async () => {
      throw new ApiError(400, "CUSTOM_BAD_REQUEST", "Custom error message", {
        email: "Invalid email",
      });
    });

    const req = new NextRequest("http://localhost:3000/api/test-error");
    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      ok: false,
      error: {
        code: "CUSTOM_BAD_REQUEST",
        message: "Custom error message",
        fieldErrors: { email: "Invalid email" },
      },
    });
  });

  it("sanitizes unhandled thrown error into INTERNAL_ERROR without leaking internals", async () => {
    const handler = createApiHandler(async () => {
      throw new Error("Sensitive database table users_secret_creds not found!");
    });

    const req = new NextRequest("http://localhost:3000/api/test-crash");
    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
    // Ensure no leaks in JSON response
    expect(JSON.stringify(json)).not.toContain("Sensitive database table");
  });
});
