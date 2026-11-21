import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { products, garmentMeasurements } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export const GET = createApiHandler(
  async ({ params }) => {
    const id = params?.id;
    if (!id || typeof id !== "string") {
      throw new ApiError(400, "BAD_REQUEST", "Product ID required");
    }

    const productRows = await db
      .select({
        id: products.id,
        sellerPartnerId: products.sellerPartnerId,
        name: products.name,
        description: products.description,
        category: products.category,
        garmentType: products.garmentType,
        fitType: products.fitType,
        occasion: products.occasion,
        color: products.color,
        swatchHex: products.swatchHex,
        imageUrl: products.imageUrl,
        fabric: products.fabric,
        stretchNote: products.stretchNote,
        priceInr: products.priceInr,
        inventoryQty: products.inventoryQty,
        customFitEligible: products.customFitEligible,
        ratingAvg: products.ratingAvg,
        reviewCount: products.reviewCount,
        status: products.status,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (productRows.length === 0 || productRows[0].status === "inactive") {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    const prod = productRows[0];

    // Fetch size measurements
    const measurementRows = await db
      .select({
        id: garmentMeasurements.id,
        size: garmentMeasurements.size,
        chestCm: garmentMeasurements.chestCm,
        waistCm: garmentMeasurements.waistCm,
        extraDimsCm: garmentMeasurements.extraDimsCm,
      })
      .from(garmentMeasurements)
      .where(eq(garmentMeasurements.productId, id));

    const sizeOrder = ["S", "M", "L", "XL"];
    const sortedMeasurements = [...measurementRows].sort(
      (a, b) => sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size)
    );

    const sizes = sortedMeasurements.map((m) => m.size);
    const chestMapCm: Record<string, number> = {};
    const waistMapCm: Record<string, number> = {};

    const formattedMeasurements = sortedMeasurements.map((m) => {
      const chest = m.chestCm ? Number(m.chestCm) : null;
      const waist = m.waistCm ? Number(m.waistCm) : null;
      if (chest !== null) chestMapCm[m.size] = chest;
      if (waist !== null) waistMapCm[m.size] = waist;
      return {
        id: m.id,
        size: m.size,
        chestCm: chest,
        waistCm: waist,
        extraDimsCm: m.extraDimsCm,
      };
    });

    return {
      product: {
        ...prod,
        ratingAvg: Number(prod.ratingAvg),
        sizes,
        chestMapCm,
        waistMapCm,
        measurements: formattedMeasurements,
      },
    };
  },
  {
    authRequired: false,
  }
);
