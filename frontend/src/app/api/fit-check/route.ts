import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { products, garmentMeasurements, bodyProfiles } from "@/server/db/schema";
import { FitCheckInputSchema } from "@/server/api/schemas";
import {
  BodyProfile,
  BodyType,
  FitPreference,
  GarmentType,
  MockGarment,
  INITIAL_MOCK_BODY_PROFILE,
} from "@/lib/mock-data";
import { evaluateGarmentFit } from "@/lib/fit-intelligence-utils";
import { GarmentSize } from "@/lib/shop-utils";

export const POST = createApiHandler(
  async ({ user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    // 1. Load the saved body profile for the authenticated session user
    const profileRows = await db
      .select()
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userId, user.id))
      .limit(1);

    if (profileRows.length === 0) {
      throw new ApiError(
        422,
        "MISSING_BODY_PROFILE",
        "Body profile required for fit check"
      );
    }

    const p = profileRows[0];
    const activePreference: FitPreference =
      body.fitPreference ??
      (p.fitPreference ? (p.fitPreference as FitPreference) : "regular");

    const bodyProfile: BodyProfile = {
      heightCm: Number(p.heightCm),
      weightKg: p.weightKg ? Number(p.weightKg) : undefined,
      bodyType: p.bodyType ? (p.bodyType as BodyType) : undefined,
      chestCm: Number(p.chestCm),
      waistCm: Number(p.waistCm),
      hipCm: p.hipCm ? Number(p.hipCm) : INITIAL_MOCK_BODY_PROFILE.hipCm,
      shoulderCm: p.shoulderCm
        ? Number(p.shoulderCm)
        : INITIAL_MOCK_BODY_PROFILE.shoulderCm,
      sleeveCm: p.sleeveCm
        ? Number(p.sleeveCm)
        : INITIAL_MOCK_BODY_PROFILE.sleeveCm,
      inseamCm: p.inseamCm
        ? Number(p.inseamCm)
        : INITIAL_MOCK_BODY_PROFILE.inseamCm,
      fitPreference: activePreference,
    };

    // 2. Fetch the product
    const productRows = await db
      .select()
      .from(products)
      .where(eq(products.id, body.productId))
      .limit(1);

    if (productRows.length === 0 || productRows[0].status === "inactive") {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    const prod = productRows[0];

    // 3. Fetch garment measurements
    const measurementRows = await db
      .select({
        id: garmentMeasurements.id,
        size: garmentMeasurements.size,
        chestCm: garmentMeasurements.chestCm,
        waistCm: garmentMeasurements.waistCm,
      })
      .from(garmentMeasurements)
      .where(eq(garmentMeasurements.productId, prod.id));

    const sizeOrder: readonly GarmentSize[] = ["S", "M", "L", "XL"];
    const availableSizes: GarmentSize[] = [];
    const chestMapCm: Partial<Record<GarmentSize, number>> = {};
    const waistMapCm: Partial<Record<GarmentSize, number>> = {};

    for (const sz of sizeOrder) {
      const m = measurementRows.find((row) => row.size === sz);
      if (m) {
        availableSizes.push(sz);
        if (m.chestCm) chestMapCm[sz] = Number(m.chestCm);
        if (m.waistCm) waistMapCm[sz] = Number(m.waistCm);
      }
    }

    const garment: MockGarment = {
      id: prod.id,
      name: prod.name,
      category: prod.category as MockGarment["category"],
      garmentType: (prod.garmentType as GarmentType) ?? undefined,
      fitType: prod.fitType as MockGarment["fitType"],
      occasion: prod.occasion as MockGarment["occasion"],
      color: prod.color,
      swatchHex: prod.swatchHex,
      image: prod.imageUrl ?? undefined,
      fabric: prod.fabric,
      stretchNote: prod.stretchNote,
      priceInr: prod.priceInr,
      rating: Number(prod.ratingAvg),
      reviewCount: prod.reviewCount,
      sizes: availableSizes,
      chestMapCm: chestMapCm as Record<GarmentSize, number>,
      waistMapCm: waistMapCm as Record<GarmentSize, number>,
      description: prod.description ?? "",
    };

    // 4. Reuse evaluateGarmentFit from fit-intelligence-utils
    const fitResult = evaluateGarmentFit({
      garment,
      bodyProfile,
      hasBodyProfile: true,
      fitPreferenceOverride: body.fitPreference,
    });

    const selectedSizeVerdict = body.size
      ? fitResult.sizeBreakdown.find((b) => b.size === body.size) ?? null
      : null;

    return {
      productId: prod.id,
      productName: prod.name,
      category: prod.category,
      garmentType: prod.garmentType,
      fitPreference: fitResult.fitPreference,
      targetEaseCm: fitResult.targetEaseCm,
      recommendedSize: fitResult.recommendedSize,
      selectedSize: body.size ?? null,
      selectedSizeVerdict,
      status: fitResult.status,
      sizeBreakdown: fitResult.sizeBreakdown,
      alternativeSizes: fitResult.alternativeSizes,
      comparisons: fitResult.comparisons,
      summaryHeadline: fitResult.summaryHeadline,
      reasoning: fitResult.reasoning,
      evidenceSummary: fitResult.evidenceSummary,
      escalateToCustomFit: fitResult.escalateToCustomFit,
      escalationReason: fitResult.escalationReason,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: FitCheckInputSchema,
  }
);
