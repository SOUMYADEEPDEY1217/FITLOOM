export const dynamic = "force-dynamic";

import { eq, desc, inArray } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { CheckoutShippingSchema, type CheckoutShippingInput } from "@/server/api/schemas";
import { db } from "@/server/db";
import {
  cartItems,
  products,
  garmentMeasurements,
  checkoutGroups,
  orders,
  orderItems,
} from "@/server/db/schema";
import { withCheckoutTransaction } from "@/server/db/transaction";

/**
 * GET /api/orders
 * Customer capability: fetch all orders placed by the authenticated customer.
 * Strict owner isolation: only returns the caller's orders.
 */
export const GET = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;

    // 1. Fetch orders placed by this customer
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return { orders: [] };
    }

    const orderIds = userOrders.map((o) => o.id);

    // 2. Fetch all line items for these orders
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        name: orderItems.productNameSnapshot,
        size: orderItems.selectedSize,
        quantity: orderItems.quantity,
        priceInr: orderItems.unitPriceInr,
        lineTotalInr: orderItems.unitPriceInr, // calculate line total below
        sellerPartnerId: orderItems.sellerPartnerId,
        customfitNotes: orderItems.customfitNotes,
        imageUrl: products.imageUrl,
        category: products.category,
        fabric: products.fabric,
        color: products.color,
        swatchHex: products.swatchHex,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds));

    // Map items to their parent order
    const itemsByOrderId = new Map<string, typeof items>();
    for (const item of items) {
      const existing = itemsByOrderId.get(item.orderId) || [];
      existing.push({
        ...item,
        lineTotalInr: item.priceInr * item.quantity,
      });
      itemsByOrderId.set(item.orderId, existing);
    }

    const populatedOrders = userOrders.map((order) => {
      const orderLineItems = itemsByOrderId.get(order.id) || [];
      return {
        ...order,
        items: orderLineItems,
      };
    });

    return { orders: populatedOrders };
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);

/**
 * POST /api/orders
 * Customer capability: Demo checkout placing orders from active cart.
 * Option B Split Orders:
 * - One checkout_groups record linking payment/shipping.
 * - One standard order per distinct seller partner.
 * - Snapshots created in order_items.
 * - Cart cleared.
 * - Executed inside atomic SQL transaction with automatic rollback on error.
 */
export const POST = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const shipping = ctx.body as CheckoutShippingInput;

    // 1. Re-read cart items from database (never trust client amounts)
    const rawCartItems = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        selectedSize: cartItems.selectedSize,
        quantity: cartItems.quantity,
        customfitRequestId: cartItems.customfitRequestId,
        productName: products.name,
        priceInr: products.priceInr,
        sellerPartnerId: products.sellerPartnerId,
        productStatus: products.status,
        moderationStatus: products.moderationStatus,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    if (rawCartItems.length === 0) {
      throw new ApiError(
        400,
        "CART_INVALID",
        "Your cart is empty. Add products before placing an order."
      );
    }

    // 2. Validate all cart products
    for (const item of rawCartItems) {
      if (item.productStatus !== "active" || item.moderationStatus !== "approved") {
        throw new ApiError(
          400,
          "CART_INVALID",
          `Product "${item.productName}" is no longer available for purchase.`
        );
      }

      // Schema check constraint requires seller_partner_id NOT NULL for standard orders
      if (!item.sellerPartnerId) {
        throw new ApiError(
          400,
          "CART_INVALID",
          `Product "${item.productName}" has no assigned seller partner and cannot be purchased.`
        );
      }
    }

    // 3. Fetch garment measurements snapshot for all products & sizes in cart
    const productIds = Array.from(new Set(rawCartItems.map((i) => i.productId)));
    const measurementRows = await db
      .select({
        productId: garmentMeasurements.productId,
        size: garmentMeasurements.size,
        chestCm: garmentMeasurements.chestCm,
        waistCm: garmentMeasurements.waistCm,
        extraDimsCm: garmentMeasurements.extraDimsCm,
      })
      .from(garmentMeasurements)
      .where(inArray(garmentMeasurements.productId, productIds));

    const measurementMap = new Map<string, { chestCm: string | null; waistCm: string | null; extraDimsCm: unknown }>();
    for (const m of measurementRows) {
      measurementMap.set(`${m.productId}:${m.size}`, {
        chestCm: m.chestCm,
        waistCm: m.waistCm,
        extraDimsCm: m.extraDimsCm,
      });
    }

    // 4. Compute totals and group by seller_partner_id (Option B multi-seller split)
    let grandTotalInr = 0;
    const itemsBySeller = new Map<string, typeof rawCartItems>();

    for (const item of rawCartItems) {
      const lineTotal = item.priceInr * item.quantity;
      grandTotalInr += lineTotal;

      const sellerId = item.sellerPartnerId!;
      const group = itemsBySeller.get(sellerId) || [];
      group.push(item);
      itemsBySeller.set(sellerId, group);
    }

    // Generate unique IDs
    const now = Date.now();
    const checkoutGroupId = `cg_${now}_${Math.random().toString(36).substring(2, 9)}`;

    // 5. Execute checkout inside atomic transaction
    const result = await withCheckoutTransaction(async (tx) => {
      // 5a. Insert parent checkout_group
      await tx.insert(checkoutGroups).values({
        id: checkoutGroupId,
        customerId: userId,
        grandTotalInr,
        paymentMode: "demo",
        paymentProvider: null,
        paymentReference: `demo_tx_${now}_${Math.random().toString(36).substring(2, 7)}`,
        paymentStatus: "completed",
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingPincode: shipping.pincode,
      });

      const createdOrders = [];

      // 5b. Insert one child order per distinct seller partner
      for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
        const orderId = `ord_${now}_${Math.random().toString(36).substring(2, 9)}`;
        const sellerTotalInr = sellerItems.reduce(
          (sum, it) => sum + it.priceInr * it.quantity,
          0
        );

        await tx.insert(orders).values({
          id: orderId,
          checkoutGroupId,
          customerId: userId,
          fulfillmentType: "standard",
          sellerPartnerId: sellerId,
          tailorPartnerId: null,
          customerName: shipping.name,
          customerEmail: shipping.email,
          customerPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingPincode: shipping.pincode,
          paymentLabel: shipping.paymentLabel || "Demo Card",
          totalInr: sellerTotalInr,
          allocatedAmountInr: sellerTotalInr,
          refundedAmountInr: 0,
          stage: "Placed",
        });

        // 5c. Insert order_items snapshot rows
        for (const it of sellerItems) {
          const dims = measurementMap.get(`${it.productId}:${it.selectedSize}`) || null;

          await tx.insert(orderItems).values({
            orderId,
            productId: it.productId,
            sellerPartnerId: sellerId,
            productNameSnapshot: it.productName,
            selectedSize: it.selectedSize,
            garmentDimensionsSnapshot: dims,
            unitPriceInr: it.priceInr,
            quantity: it.quantity,
            customfitRequestId: it.customfitRequestId,
          });
        }

        createdOrders.push({
          id: orderId,
          sellerPartnerId: sellerId,
          totalInr: sellerTotalInr,
          stage: "Placed",
          itemCount: sellerItems.length,
        });
      }

      // 5d. Clear the user's cart
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return {
        checkoutGroupId,
        grandTotalInr,
        orders: createdOrders,
      };
    });

    return result;
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: CheckoutShippingSchema,
    successStatus: 201,
  }
);
