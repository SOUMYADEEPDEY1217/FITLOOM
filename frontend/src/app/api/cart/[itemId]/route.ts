export const dynamic = "force-dynamic";

import { eq, and } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { CartItemPatchSchema, type CartItemPatchInput } from "@/server/api/schemas";
import { db } from "@/server/db";
import { cartItems, products } from "@/server/db/schema";

/**
 * PATCH /api/cart/[itemId]
 * Update quantity for an item in the user's cart (1..10).
 */
export const PATCH = createApiHandler<CartItemPatchInput>(
  async (ctx) => {
    const userId = ctx.user!.id;
    const itemId = ctx.params?.itemId as string;

    if (!itemId) {
      throw new ApiError(400, "BAD_REQUEST", "Cart item ID is required.");
    }

    const { quantity } = ctx.body;

    // Check ownership and existence
    const existingList = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        selectedSize: cartItems.selectedSize,
        priceInr: products.priceInr,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (existingList.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "Cart item not found.");
    }

    const existing = existingList[0];

    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));

    return {
      id: itemId,
      productId: existing.productId,
      size: existing.selectedSize,
      quantity,
      unitPriceInr: existing.priceInr,
      lineTotalInr: existing.priceInr * quantity,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: CartItemPatchSchema,
  }
);

/**
 * DELETE /api/cart/[itemId]
 * Remove an item from the user's cart.
 */
export const DELETE = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const itemId = ctx.params?.itemId as string;

    if (!itemId) {
      throw new ApiError(400, "BAD_REQUEST", "Cart item ID is required.");
    }

    const existing = await db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "Cart item not found.");
    }

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)));

    return {
      success: true,
      removedItemId: itemId,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);
