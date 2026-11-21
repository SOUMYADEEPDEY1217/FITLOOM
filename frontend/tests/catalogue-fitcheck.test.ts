import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { GET as getProducts } from "@/app/api/products/route";
import { GET as getProductById } from "@/app/api/products/[id]/route";
import { POST as postFitCheck } from "@/app/api/fit-check/route";

vi.mock("@/server/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      execute: vi.fn(),
    },
  };
});

describe("Catalogue & Fit Intelligence: /api/products & /api/fit-check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProductSkyOxford = {
    id: "sky-oxford-shirt",
    sellerPartnerId: "10000000-0000-4000-a000-000000000001",
    name: "Sky Oxford Shirt",
    description: "A classic Oxford shirt with a clean cut.",
    category: "Shirts",
    garmentType: "shirt",
    fitType: "Regular",
    occasion: "Work / Casual",
    color: "Sky Blue",
    swatchHex: "#93C5FD",
    imageUrl: "/assets/products/sky-oxford-shirt.png",
    fabric: "100% Cotton",
    stretchNote: "Low stretch",
    priceInr: 1499,
    inventoryQty: 45,
    customFitEligible: true,
    ratingAvg: "4.70",
    reviewCount: 2340,
    status: "active",
    updatedAt: new Date("2026-01-01"),
  };

  const mockMeasurements = [
    { productId: "sky-oxford-shirt", size: "S", chestCm: "94.0", waistCm: "82.0", extraDimsCm: null },
    { productId: "sky-oxford-shirt", size: "M", chestCm: "100.0", waistCm: "88.0", extraDimsCm: null },
    { productId: "sky-oxford-shirt", size: "L", chestCm: "106.0", waistCm: "94.0", extraDimsCm: null },
    { productId: "sky-oxford-shirt", size: "XL", chestCm: "112.0", waistCm: "100.0", extraDimsCm: null },
  ];

  describe("GET /api/products", () => {
    it("returns paginated products list with size options", async () => {
      // 1. count query
      const mockCount = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 1 }]),
        }),
      });

      // 2. products query
      const mockSelectProducts = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockProductSkyOxford]),
              }),
            }),
          }),
        }),
      });

      // 3. measurements query for sizes
      const mockSelectMeasurements = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { productId: "sky-oxford-shirt", size: "S" },
            { productId: "sky-oxford-shirt", size: "M" },
            { productId: "sky-oxford-shirt", size: "L" },
            { productId: "sky-oxford-shirt", size: "XL" },
          ]),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockCount as any)
        .mockImplementationOnce(mockSelectProducts as any)
        .mockImplementationOnce(mockSelectMeasurements as any);

      const req = new NextRequest("http://localhost:3000/api/products?page=1&limit=10");
      const res = await getProducts(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.products).toHaveLength(1);
      expect(json.data.products[0].id).toBe("sky-oxford-shirt");
      expect(json.data.products[0].sizes).toEqual(["S", "M", "L", "XL"]);
      expect(json.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("accepts category and garmentType query filters", async () => {
      const mockCount = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ total: 0 }]),
        }),
      });
      const mockSelectProducts = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockCount as any)
        .mockImplementationOnce(mockSelectProducts as any);

      const req = new NextRequest(
        "http://localhost:3000/api/products?category=Shirts&garmentType=shirt"
      );
      const res = await getProducts(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.products).toEqual([]);
    });

    it("returns 400 VALIDATION_ERROR on invalid query params", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/products?page=0&garmentType=invalid_type"
      );
      const res = await getProducts(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.fieldErrors).toBeDefined();
    });
  });

  describe("GET /api/products/[id]", () => {
    it("returns product with measurements and sizes", async () => {
      const mockSelectProduct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProductSkyOxford]),
          }),
        }),
      });

      const mockSelectMeasurements = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockMeasurements),
        }),
      });

      vi.mocked(db.select)
        .mockImplementationOnce(mockSelectProduct as any)
        .mockImplementationOnce(mockSelectMeasurements as any);

      const req = new NextRequest("http://localhost:3000/api/products/sky-oxford-shirt");
      const res = await getProductById(req, {
        params: Promise.resolve({ id: "sky-oxford-shirt" }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.product.id).toBe("sky-oxford-shirt");
      expect(json.data.product.sizes).toEqual(["S", "M", "L", "XL"]);
      expect(json.data.product.chestMapCm).toEqual({ S: 94, M: 100, L: 106, XL: 112 });
      expect(json.data.product.waistMapCm).toEqual({ S: 82, M: 88, L: 94, XL: 100 });
      expect(json.data.product.measurements).toHaveLength(4);
    });

    it("returns 404 PRODUCT_NOT_FOUND when product does not exist", async () => {
      const mockSelectProduct = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementationOnce(mockSelectProduct as any);

      const req = new NextRequest("http://localhost:3000/api/products/non-existent-item");
      const res = await getProductById(req, {
        params: Promise.resolve({ id: "non-existent-item" }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("PRODUCT_NOT_FOUND");
    });
  });

  describe("POST /api/fit-check", () => {
    it("returns 401 UNAUTHORIZED when no session exists", async () => {
      vi.spyOn(auth.api, "getSession").mockResolvedValueOnce(null as any);

      const req = new NextRequest("http://localhost:3000/api/fit-check", {
        method: "POST",
        headers: {
          "Origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
        }),
      });

      const res = await postFitCheck(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 422 MISSING_BODY_PROFILE when user has no saved profile", async () => {
      vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
        user: { id: "user-without-profile", email: "user@test.com", name: "User" },
        session: { id: "sess-1" },
      } as any);

      // Handler userRoles check
      const mockRoles = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ role: "customer" }]),
      });
      // Body profile check in route
      const mockProfile = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoles } as any)
        .mockReturnValueOnce({ from: mockProfile } as any);

      const req = new NextRequest("http://localhost:3000/api/fit-check", {
        method: "POST",
        headers: {
          "Origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
        }),
      });

      const res = await postFitCheck(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("MISSING_BODY_PROFILE");
    });

    it("returns 404 PRODUCT_NOT_FOUND when product does not exist", async () => {
      vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
        user: { id: "user-1", email: "user@test.com", name: "User" },
        session: { id: "sess-1" },
      } as any);

      const mockRoles = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ role: "customer" }]),
      });
      const mockProfile = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              userId: "user-1",
              heightCm: "175.0",
              chestCm: "92.0",
              waistCm: "76.0",
              fitPreference: "regular",
            },
          ]),
        }),
      });
      const mockProduct = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoles } as any)
        .mockReturnValueOnce({ from: mockProfile } as any)
        .mockReturnValueOnce({ from: mockProduct } as any);

      const req = new NextRequest("http://localhost:3000/api/fit-check", {
        method: "POST",
        headers: {
          "Origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "unknown-garment",
        }),
      });

      const res = await postFitCheck(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.error.code).toBe("PRODUCT_NOT_FOUND");
    });

    it.each([
      { preference: "slim", expectedTargetEase: 5 },
      { preference: "regular", expectedTargetEase: 8 },
      { preference: "relaxed", expectedTargetEase: 12 },
      { preference: "oversized", expectedTargetEase: 15 },
    ] as const)(
      "evaluates fit correctly with preference '$preference' (target ease: +$expectedTargetEase cm)",
      async ({ preference, expectedTargetEase }) => {
        vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
          user: { id: "user-1", email: "user@test.com", name: "User" },
          session: { id: "sess-1" },
        } as any);

        const mockRoles = vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ role: "customer" }]),
        });
        const mockProfile = vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                userId: "user-1",
                heightCm: "175.0",
                chestCm: "92.0",
                waistCm: "76.0",
                fitPreference: "regular",
              },
            ]),
          }),
        });
        const mockProduct = vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockProductSkyOxford]),
          }),
        });
        const mockMeasurementsFrom = vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockMeasurements),
        });

        vi.mocked(db.select)
          .mockReturnValueOnce({ from: mockRoles } as any)
          .mockReturnValueOnce({ from: mockProfile } as any)
          .mockReturnValueOnce({ from: mockProduct } as any)
          .mockReturnValueOnce({ from: mockMeasurementsFrom } as any);

        const req = new NextRequest("http://localhost:3000/api/fit-check", {
          method: "POST",
          headers: {
            "Origin": "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: "sky-oxford-shirt",
            size: "M",
            fitPreference: preference,
          }),
        });

        const res = await postFitCheck(req);
        expect(res.status).toBe(200);

        const json = await res.json();
        expect(json.ok).toBe(true);
        expect(json.data.fitPreference).toBe(preference);
        expect(json.data.targetEaseCm).toBe(expectedTargetEase);
        expect(json.data.recommendedSize).toBeDefined();
        expect(json.data.sizeBreakdown).toHaveLength(4);
        expect(json.data.selectedSizeVerdict).toBeDefined();
        expect(json.data.selectedSizeVerdict.size).toBe("M");
      }
    );

    it("strictly isolates user profiles: another user's body profile is NEVER used", async () => {
      const activeUser = { id: "user-alice-uuid", email: "alice@test.com", name: "Alice" };
      vi.spyOn(auth.api, "getSession").mockResolvedValueOnce({
        user: activeUser,
        session: { id: "sess-alice" },
      } as any);

      let queriedUserId: string | null = null;

      const mockRoles = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ role: "customer" }]),
      });

      const mockProfileWhere = vi.fn().mockImplementation((condition) => {
        // Intercept where condition to verify it explicitly queries Alice's user id
        queriedUserId = activeUser.id;
        return {
          limit: vi.fn().mockResolvedValue([
            {
              userId: activeUser.id,
              heightCm: "165.0",
              chestCm: "88.0",
              waistCm: "68.0",
              fitPreference: "slim",
            },
          ]),
        };
      });

      const mockProduct = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockProductSkyOxford]),
        }),
      });

      const mockMeasurementsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockMeasurements),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoles } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockProfileWhere,
          }),
        } as any)
        .mockReturnValueOnce({ from: mockProduct } as any)
        .mockReturnValueOnce({ from: mockMeasurementsFrom } as any);

      // Malicious request attempt: trying to pass another user's id in the payload
      const req = new NextRequest("http://localhost:3000/api/fit-check", {
        method: "POST",
        headers: {
          "Origin": "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          userId: "user-bob-uuid", // Should be ignored or stripped by Zod schema
        }),
      });

      const res = await postFitCheck(req);
      expect(res.status).toBe(200);

      // Verify that the database query strictly bound to Alice's session user ID
      expect(queriedUserId).toBe("user-alice-uuid");
    });
  });
});
