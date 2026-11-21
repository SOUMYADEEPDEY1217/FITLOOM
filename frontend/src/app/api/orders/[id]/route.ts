export const dynamic = "force-dynamic";

import { eq, and } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { OrderActionSchema, type OrderActionInput } from "@/server/api/schemas";
import { db } from "@/server/db";
import { orders, orderItems, products } from "@/server/db/schema";

/**
 * GET /api/orders/[id]
 * Customer capability: fetch a specific order and its items.
 * STRICT OWNER ISOLATION: returns 404 if order does not exist OR belongs to another customer.
 */
export const GET = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const orderId = ctx.params?.id as string;

    if (!orderId) {
      throw new ApiError(400, "BAD_REQUEST", "Order ID is required.");
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, userId)))
      .limit(1);

    if (orderRows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "Order not found.");
    }

    const order = orderRows[0];

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        name: orderItems.productNameSnapshot,
        size: orderItems.selectedSize,
        quantity: orderItems.quantity,
        priceInr: orderItems.unitPriceInr,
        lineTotalInr: orderItems.unitPriceInr,
        sellerPartnerId: orderItems.sellerPartnerId,
        customfitNotes: orderItems.customfitNotes,
        garmentDimensionsSnapshot: orderItems.garmentDimensionsSnapshot,
        imageUrl: products.imageUrl,
        category: products.category,
        fabric: products.fabric,
        color: products.color,
        swatchHex: products.swatchHex,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const populatedItems = items.map((it) => ({
      ...it,
      lineTotalInr: it.priceInr * it.quantity,
    }));

    return {
      order: {
        ...order,
        items: populatedItems,
      },
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);

/**
 * PATCH /api/orders/[id]
 * Customer capability: Cancel or request return for an owned order.
 * Actions:
 * - cancel: Allowed when stage is Placed, Cutting, or Pending Tailor Acceptance.
 * - return: Allowed when stage is Delivered.
 */
export const PATCH = createApiHandler<OrderActionInput>(
  async (ctx) => {
    const userId = ctx.user!.id;
    const orderId = ctx.params?.id as string;

    if (!orderId) {
      throw new ApiError(400, "BAD_REQUEST", "Order ID is required.");
    }

    const { action, reason } = ctx.body;

    // Strict owner query
    const orderRows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.customerId, userId)))
      .limit(1);

    if (orderRows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "Order not found.");
    }

    const order = orderRows[0];

    if (action === "cancel") {
      const cancellableStages = [
        "Placed",
        "Cutting",
        "Pending Tailor Acceptance",
      ];
      if (order.stage === "Cancelled") {
        throw new ApiError(400, "ORDER_ALREADY_CANCELLED", "Order is already cancelled.");
      }
      if (!cancellableStages.includes(order.stage)) {
        throw new ApiError(
          400,
          "CANNOT_CANCEL_ORDER",
          `Order cannot be cancelled in stage "${order.stage}".`
        );
      }

      await db
        .update(orders)
        .set({
          stage: "Cancelled",
          cancelOrReturnReason: reason,
          refundedAmountInr: order.allocatedAmountInr,
        })
        .where(eq(orders.id, order.id));

      return {
        id: order.id,
        stage: "Cancelled",
        refundedAmountInr: order.allocatedAmountInr,
        cancelOrReturnReason: reason,
      };
    } else if (action === "return") {
      if (order.stage !== "Delivered") {
        throw new ApiError(
          400,
          "CANNOT_RETURN_ORDER",
          `Returns can only be requested for delivered orders (current stage: "${order.stage}").`
        );
      }

      await db
        .update(orders)
        .set({
          stage: "Return Requested",
          cancelOrReturnReason: reason,
        })
        .where(eq(orders.id, order.id));

      return {
        id: order.id,
        stage: "Return Requested",
        cancelOrReturnReason: reason,
      };
    }

    throw new ApiError(400, "BAD_REQUEST", "Unsupported order action.");
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: OrderActionSchema,
  }
);
