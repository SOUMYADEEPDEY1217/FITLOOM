import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./client";
import { ApiError } from "./types";
import type { AvatarDressInput, AvatarDressResponse } from "./types";

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

  it("calls getProducts with query parameters", async () => {
    const mockProductsData = {
      products: [{ id: "sky-oxford-shirt", name: "Sky Oxford Shirt" }],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true, data: mockProductsData }),
    } as unknown as Response);

    const result = await api.getProducts({ category: "Shirts", garmentType: "shirt", search: "oxford" });
    expect(result).toEqual(mockProductsData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products?category=Shirts&garmentType=shirt&search=oxford"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls getProduct with ID parameter", async () => {
    const mockProduct = {
      product: { id: "sky-oxford-shirt", name: "Sky Oxford Shirt" },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true, data: mockProduct }),
    } as unknown as Response);

    const result = await api.getProduct("sky-oxford-shirt");
    expect(result).toEqual(mockProduct);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/products/sky-oxford-shirt",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("calls fitCheck with body payload", async () => {
    const mockFitResult = {
      productId: "sky-oxford-shirt",
      recommendedSize: "L",
      status: "ready",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true, data: mockFitResult }),
    } as unknown as Response);

    const result = await api.fitCheck({
      productId: "sky-oxford-shirt",
      fitPreference: "regular",
    });
    expect(result).toEqual(mockFitResult);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/fit-check",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          fitPreference: "regular",
        }),
      })
    );
  });

  it("calls dressAvatar with body payload", async () => {
    const mockDressResult: AvatarDressResponse = {
      mode: "live_ai",
      garment: {
        type: "shirt",
        size: "M",
        fitPreference: "regular",
        url: "/api/avatar/assets/avatar-123/garment_shirt_M.glb",
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true, data: mockDressResult }),
    } as unknown as Response);

    const input: AvatarDressInput = {
      avatarId: "avatar-123",
      garmentType: "shirt",
      size: "M",
      fitPreference: "regular",
    };
    const result = await api.dressAvatar(input);
    expect(result).toEqual(mockDressResult);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/avatar/dress",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      })
    );
  });

  it("handles dressAvatar 401 unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Please sign in" },
      }),
    } as unknown as Response);

    await expect(
      api.dressAvatar({
        avatarId: "avatar-123",
        garmentType: "shirt",
        size: "M",
      })
    ).rejects.toThrow(ApiError);

    try {
      await api.dressAvatar({
        avatarId: "avatar-123",
        garmentType: "shirt",
        size: "M",
      });
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe("UNAUTHORIZED");
      expect(apiErr.message).toBe("Please sign in");
    }
  });

  it("handles dressAvatar 404 avatar not found", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: false,
        error: { code: "AVATAR_NOT_FOUND", message: "Avatar not found" },
      }),
    } as unknown as Response);

    await expect(
      api.dressAvatar({
        avatarId: "avatar-123",
        garmentType: "shirt",
        size: "M",
      })
    ).rejects.toThrow(ApiError);
  });

  it("handles dressAvatar 422 validation error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid garment type" },
      }),
    } as unknown as Response);

    await expect(
      api.dressAvatar({
        avatarId: "avatar-123",
        garmentType: "invalid" as "tshirt" | "shirt" | "trousers" | "kurti",
        size: "M",
      })
    ).rejects.toThrow(ApiError);
  });

  it("handles dressAvatar 503 service unavailable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: false,
        error: { code: "SERVICE_UNAVAILABLE", message: "Avatar engine offline" },
      }),
    } as unknown as Response);

    await expect(
      api.dressAvatar({
        avatarId: "avatar-123",
        garmentType: "shirt",
        size: "M",
      })
    ).rejects.toThrow(ApiError);
  });
});
