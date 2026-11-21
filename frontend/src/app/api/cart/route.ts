export const dynamic = "force-dynamic";

import { eq, and, sql } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { CartItemInputSchema, type CartItemInput } from "@/server/api/schemas";
import { db } from "@/server/db";
import { cartItems, products, garmentMeasurements } from "@/server/db/schema";

/**
 * GET /api/cart
 * Customer capability: fetch all items in the user's active cart.
 * Re-reads current product details, name, image, and price strictly from DB.
 */
export const GET = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;

    // Fetch user's cart items
    const rawItems = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        selectedSize: cartItems.selectedSize,
        quantity: cartItems.quantity,
        customfitRequestId: cartItems.customfitRequestId,
        productName: products.name,
        priceInr: products.priceInr,
        imageUrl: products.imageUrl,
        category: products.category,
        fabric: products.fabric,
        color: products.color,
        swatchHex: products.swatchHex,
        sellerPartnerId: products.sellerPartnerId,
        productStatus: products.status,
        moderationStatus: products.moderationStatus,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    let subtotalInr = 0;
    let totalUnits = 0;

    const items = rawItems.map((item) => {
      const lineTotalInr = item.priceInr * item.quantity;
      subtotalInr += lineTotalInr;
      totalUnits += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        name: item.productName,
        size: item.selectedSize,
        quantity: item.quantity,
        priceInr: item.priceInr,
        lineTotalInr,
        imageUrl: item.imageUrl,
        category: item.category,
        fabric: item.fabric,
        color: item.color,
        swatchHex: item.swatchHex,
        sellerPartnerId: item.sellerPartnerId,
        isPurchasable:
          item.productStatus === "active" &&
          item.moderationStatus === "approved",
        customfitRequestId: item.customfitRequestId,
      };
    });

    return {
      items,
      subtotalInr,
      totalUnits,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);

/**
 * POST /api/cart
 * Customer capability: Add or upsert an item in the cart.
 * Validates product exists, is active/approved, and size is in garment_measurements.
 * Upsert: same product+size increments quantity (clamped to max 10).
 */
export const POST = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const { productId, size, quantity } = ctx.body as CartItemInput;

    // 1. Verify product exists and is purchasable
    const productList = await db
      .select({
        id: products.id,
        name: products.name,
        priceInr: products.priceInr,
        status: products.status,
        moderationStatus: products.moderationStatus,
        sellerPartnerId: products.sellerPartnerId,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productList.length === 0) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    const product = productList[0];
    if (product.status !== "active" || product.moderationStatus !== "approved") {
      throw new ApiError(
        400,
        "PRODUCT_UNAVAILABLE",
        `Product "${product.name}" is currently unavailable for purchase.`
      );
    }

    // 2. Verify size exists in garment_measurements for standard sizes
    const measurements = await db
      .select({ id: garmentMeasurements.id })
      .from(garmentMeasurements)
      .where(
        and(
          eq(garmentMeasurements.productId, productId),
          eq(garmentMeasurements.size, size)
        )
      )
      .limit(1);

    if (measurements.length === 0) {
      throw new ApiError(
        400,
        "SIZE_UNAVAILABLE",
        `Size "${size}" is unavailable for "${product.name}".`
      );
    }

    // 3. Deterministic Upsert: check if already in cart
    const existingItems = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId),
          eq(cartItems.selectedSize, size),
          sql`${cartItems.customfitRequestId} IS NULL`
        )
      )
      .limit(1);

    let cartItemId: string;
    let finalQuantity: number;

    if (existingItems.length > 0) {
      const existing = existingItems[0];
      finalQuantity = Math.min(10, existing.quantity + quantity);

      await db
        .update(cartItems)
        .set({ quantity: finalQuantity })
        .where(eq(cartItems.id, existing.id));

      cartItemId = existing.id;
    } else {
      finalQuantity = Math.min(10, quantity);
      const inserted = await db
        .insert(cartItems)
        .values({
          userId,
          productId,
          selectedSize: size,
          quantity: finalQuantity,
        })
        .returning({ id: cartItems.id });

      cartItemId = inserted[0].id;
    }

    return {
      id: cartItemId,
      productId,
      size,
      quantity: finalQuantity,
      unitPriceInr: product.priceInr,
      lineTotalInr: product.priceInr * finalQuantity,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: CartItemInputSchema,
    successStatus: 200,
  }
);
