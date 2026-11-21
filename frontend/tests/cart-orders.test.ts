import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { GET as getCart, POST as postCart } from "@/app/api/cart/route";
import {
  PATCH as patchCartItem,
  DELETE as deleteCartItem,
} from "@/app/api/cart/[itemId]/route";
import { GET as getOrders, POST as postOrders } from "@/app/api/orders/route";
import {
  GET as getOrderById,
  PATCH as patchOrderById,
} from "@/app/api/orders/[id]/route";
import * as txModule from "@/server/db/transaction";

vi.mock("@/server/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn(),
    },
  };
});

describe("Cart & Orders Endpoints (/api/cart, /api/orders)", () => {
  const customerUser = {
    id: "user-cust-001",
    email: "customer@fitloom.com",
    name: "Customer One",
  };

  const sellerPartnerId = "partner-seller-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockCustomerSession(user = customerUser) {
    vi.spyOn(auth.api, "getSession").mockResolvedValue({
      user,
      session: { id: "sess-123" },
    } as any);

    // Mock user_roles DB check in handler.ts
    const mockRoleWhere = vi.fn().mockResolvedValue([{ role: "customer" }]);
    const mockRoleFrom = vi.fn().mockReturnValue({ where: mockRoleWhere });
    return mockRoleFrom;
  }

  // ===========================================================================
  // 1. Auth & CSRF Guards
  // ===========================================================================
  describe("Security: 401 Unauthorized & 403 CSRF", () => {
    it("returns 401 on GET /api/cart without session", async () => {
      vi.spyOn(auth.api, "getSession").mockResolvedValueOnce(null as any);

      const req = new NextRequest("http://localhost:3000/api/cart");
      const res = await getCart(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 on POST /api/cart without Origin header (CSRF protection)", async () => {
      mockCustomerSession();

      const req = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          size: "M",
          quantity: 1,
        }),
      });

      const res = await postCart(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  // ===========================================================================
  // 2. Cart Upsert & Qty Limits
  // ===========================================================================
  describe("Cart Operations: /api/cart", () => {
    it("inserts a new item into cart when not previously added", async () => {
      const mockRoleFrom = mockCustomerSession();

      // 1. roles check
      // 2. product check
      const mockProductWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "sky-oxford-shirt",
            name: "Sky Oxford Shirt",
            priceInr: 1499,
            status: "active",
            moderationStatus: "approved",
            sellerPartnerId,
          },
        ]),
      });
      // 3. garment measurements check
      const mockMeasureWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: "m-1" }]),
      });
      // 4. existing cart check (empty)
      const mockCartWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockProductWhere }) } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockMeasureWhere }) } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockCartWhere }) } as any);

      const mockReturning = vi.fn().mockResolvedValue([{ id: "cart-item-1" }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);

      const req = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          size: "M",
          quantity: 2,
        }),
      });

      const res = await postCart(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.id).toBe("cart-item-1");
      expect(json.data.quantity).toBe(2);
      expect(json.data.unitPriceInr).toBe(1499);
      expect(json.data.lineTotalInr).toBe(2998);
    });

    it("clamps quantity to 10 when upserting existing cart item", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockProductWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "sky-oxford-shirt",
            name: "Sky Oxford Shirt",
            priceInr: 1499,
            status: "active",
            moderationStatus: "approved",
            sellerPartnerId,
          },
        ]),
      });
      const mockMeasureWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: "m-1" }]),
      });
      // Existing item already has quantity 8
      const mockCartWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: "cart-item-1", quantity: 8 }]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockProductWhere }) } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockMeasureWhere }) } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockCartWhere }) } as any);

      const mockUpdateWhere = vi.fn().mockResolvedValue({});
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);

      const req = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          size: "M",
          quantity: 5, // 8 + 5 = 13, clamped to 10
        }),
      });

      const res = await postCart(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.quantity).toBe(10);
      expect(mockSet).toHaveBeenCalledWith({ quantity: 10 });
    });

    it("rejects invalid size not present in garment_measurements", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockProductWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "sky-oxford-shirt",
            name: "Sky Oxford Shirt",
            priceInr: 1499,
            status: "active",
            moderationStatus: "approved",
            sellerPartnerId,
          },
        ]),
      });
      // Measurement not found
      const mockMeasureWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockProductWhere }) } as any)
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: mockMeasureWhere }) } as any);

      const req = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          productId: "sky-oxford-shirt",
          size: "XL",
          quantity: 1,
        }),
      });

      const res = await postCart(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("SIZE_UNAVAILABLE");
    });
  });

  // ===========================================================================
  // 3. Cart Price From DB & Subtotal Calculation
  // ===========================================================================
  describe("GET /api/cart: Price integrity", () => {
    it("computes subtotal from DB product prices rather than any client assertion", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockCartJoinWhere = vi.fn().mockResolvedValue([
        {
          id: "item-1",
          productId: "sky-oxford-shirt",
          selectedSize: "M",
          quantity: 2,
          customfitRequestId: null,
          productName: "Sky Oxford Shirt",
          priceInr: 1499,
          imageUrl: "/img/1.png",
          category: "Shirts",
          fabric: "Cotton",
          color: "Blue",
          swatchHex: "#93C5FD",
          sellerPartnerId,
          productStatus: "active",
          moderationStatus: "approved",
        },
        {
          id: "item-2",
          productId: "classic-chinos",
          selectedSize: "L",
          quantity: 1,
          customfitRequestId: null,
          productName: "Classic Chinos",
          priceInr: 1899,
          imageUrl: "/img/2.png",
          category: "Trousers",
          fabric: "Twill",
          color: "Khaki",
          swatchHex: "#D4B996",
          sellerPartnerId,
          productStatus: "active",
          moderationStatus: "approved",
        },
      ]);

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: mockCartJoinWhere,
            }),
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/cart");
      const res = await getCart(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.items).toHaveLength(2);
      expect(json.data.totalUnits).toBe(3);
      // (1499 * 2) + (1899 * 1) = 2998 + 1899 = 4897
      expect(json.data.subtotalInr).toBe(4897);
    });
  });

  // ===========================================================================
  // 4. Cart Item Access & Modification Isolation
  // ===========================================================================
  describe("Cart Item Operations: /api/cart/[itemId]", () => {
    it("returns 404 when user attempts to PATCH another user's cart item", async () => {
      const mockRoleFrom = mockCustomerSession();

      // Item not found under this user's userId
      const mockJoinWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: mockJoinWhere,
            }),
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/cart/item-other-user", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ quantity: 3 }),
      });

      const res = await patchCartItem(req, {
        params: Promise.resolve({ itemId: "item-other-user" }),
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when user attempts to DELETE another user's cart item", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockWhere,
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/cart/item-other-user", {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
        },
      });

      const res = await deleteCartItem(req, {
        params: Promise.resolve({ itemId: "item-other-user" }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 5. Checkout & Orders: Empty Cart & Option B Split Calculation
  // ===========================================================================
  describe("Orders Operations: /api/orders", () => {
    const validShippingBody = {
      name: "Riya Sen",
      email: "riya@fitloom.com",
      phone: "+91 98300 12345",
      address: "12 Ballygunge Park Road",
      city: "Kolkata",
      state: "West Bengal",
      pincode: "700019",
      paymentLabel: "Demo Card",
    };

    it("returns 400 CART_INVALID when checkout is attempted with empty cart", async () => {
      const mockRoleFrom = mockCustomerSession();

      // Empty cart
      const mockCartJoinWhere = vi.fn().mockResolvedValue([]);

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: mockCartJoinWhere,
            }),
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify(validShippingBody),
      });

      const res = await postOrders(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("CART_INVALID");
    });

    it("creates checkout_group and orders inside transaction with server-calculated totals", async () => {
      const mockRoleFrom = mockCustomerSession();

      // Cart with 2 products from the same seller
      const mockCartJoinWhere = vi.fn().mockResolvedValue([
        {
          id: "item-1",
          productId: "sky-oxford-shirt",
          selectedSize: "M",
          quantity: 2,
          customfitRequestId: null,
          productName: "Sky Oxford Shirt",
          priceInr: 1499,
          sellerPartnerId,
          productStatus: "active",
          moderationStatus: "approved",
        },
        {
          id: "item-2",
          productId: "classic-chinos",
          selectedSize: "L",
          quantity: 1,
          customfitRequestId: null,
          productName: "Classic Chinos",
          priceInr: 1899,
          sellerPartnerId,
          productStatus: "active",
          moderationStatus: "approved",
        },
      ]);

      const mockMeasurementsWhere = vi.fn().mockResolvedValue([
        {
          productId: "sky-oxford-shirt",
          size: "M",
          chestCm: "100.0",
          waistCm: "88.0",
          extraDimsCm: null,
        },
        {
          productId: "classic-chinos",
          size: "L",
          chestCm: "106.0",
          waistCm: "94.0",
          extraDimsCm: null,
        },
      ]);

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: mockCartJoinWhere,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockMeasurementsWhere,
          }),
        } as any);

      // Mock transaction helper to execute callback with mock tx
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue({}),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      };

      vi.spyOn(txModule, "withCheckoutTransaction").mockImplementation(
        async (cb: any) => cb(mockTx)
      );

      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify(validShippingBody),
      });

      const res = await postOrders(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.grandTotalInr).toBe(4897); // 1499*2 + 1899*1
      expect(json.data.orders).toHaveLength(1);
      expect(json.data.orders[0].totalInr).toBe(4897);
      expect(mockTx.delete).toHaveBeenCalled(); // Cart cleared
    });

    it("verifies transaction rollback on failure propagates error without completing", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockCartJoinWhere = vi.fn().mockResolvedValue([
        {
          id: "item-1",
          productId: "sky-oxford-shirt",
          selectedSize: "M",
          quantity: 1,
          customfitRequestId: null,
          productName: "Sky Oxford Shirt",
          priceInr: 1499,
          sellerPartnerId,
          productStatus: "active",
          moderationStatus: "approved",
        },
      ]);

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: mockCartJoinWhere,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        } as any);

      // Simulate a failure inside the SQL transaction
      vi.spyOn(txModule, "withCheckoutTransaction").mockRejectedValueOnce(
        new Error("SQL_DEADLOCK_OR_CONSTRAINT_VIOLATION")
      );

      const req = new NextRequest("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify(validShippingBody),
      });

      const res = await postOrders(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe("INTERNAL_ERROR");
    });
  });

  // ===========================================================================
  // 6. Strict Order Access Isolation (404 on Other User's Orders)
  // ===========================================================================
  describe("Order Isolation: /api/orders/[id]", () => {
    it("returns 404 when Customer A tries to read Customer B's order", async () => {
      const mockRoleFrom = mockCustomerSession({
        id: "customer-a",
        email: "a@fitloom.com",
        name: "Customer A",
      });

      // No rows returned because customerId does not match customer-a
      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockWhere,
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/orders/ord_customer_b_order");
      const res = await getOrderById(req, {
        params: Promise.resolve({ id: "ord_customer_b_order" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when Customer A tries to cancel Customer B's order", async () => {
      const mockRoleFrom = mockCustomerSession({
        id: "customer-a",
        email: "a@fitloom.com",
        name: "Customer A",
      });

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockWhere,
          }),
        } as any);

      const req = new NextRequest("http://localhost:3000/api/orders/ord_customer_b_order", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          action: "cancel",
          reason: "Unauthorized attempt",
        }),
      });

      const res = await patchOrderById(req, {
        params: Promise.resolve({ id: "ord_customer_b_order" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("cancels an order when requested by its owner in Placed stage", async () => {
      const mockRoleFrom = mockCustomerSession();

      const mockWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: "ord_own_123",
            customerId: customerUser.id,
            stage: "Placed",
            allocatedAmountInr: 2998,
            totalInr: 2998,
          },
        ]),
      });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockRoleFrom } as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: mockWhere,
          }),
        } as any);

      const mockUpdateWhere = vi.fn().mockResolvedValue({});
      const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);

      const req = new NextRequest("http://localhost:3000/api/orders/ord_own_123", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          action: "cancel",
          reason: "Changed my mind",
        }),
      });

      const res = await patchOrderById(req, {
        params: Promise.resolve({ id: "ord_own_123" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.stage).toBe("Cancelled");
      expect(json.data.refundedAmountInr).toBe(2998);
    });
  });
});
