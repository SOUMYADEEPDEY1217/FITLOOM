import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./client";
import { ApiError } from "./types";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("unwraps successful { ok: true, data } responses", async () => {
    const mockData = { id: "123", name: "Test User" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true, data: mockData }),
    } as unknown as Response);

    const result = await api.get<typeof mockData>("/api/test");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
      })
    );
  });

  it("throws ApiError on { ok: false, error: { code, message, fieldErrors } }", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input fields",
          fieldErrors: { chestCm: "Too small" },
        },
      }),
    } as unknown as Response);

    await expect(api.post("/api/body-profile", { chestCm: 10 })).rejects.toThrow(
      ApiError
    );

    try {
      await api.post("/api/body-profile", { chestCm: 10 });
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe("VALIDATION_ERROR");
      expect(apiErr.message).toBe("Invalid input fields");
      expect(apiErr.fieldErrors).toEqual({ chestCm: "Too small" });
    }
  });

  it("handles 401 unauthorized and Better Auth error format", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    } as unknown as Response);

    await expect(api.post("/api/auth/sign-in/email", {})).rejects.toThrow(
      ApiError
    );

    try {
      await api.post("/api/auth/sign-in/email", {});
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe("INVALID_EMAIL_OR_PASSWORD");
      expect(apiErr.message).toBe("Invalid email or password");
    }
  });

  it("handles 204 No Content without error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as unknown as Response);

    const result = await api.delete("/api/items/1");
    expect(result).toBeUndefined();
  });
});
