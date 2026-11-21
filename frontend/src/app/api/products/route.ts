import { eq, and, ilike, or, count, inArray, asc } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { products, garmentMeasurements } from "@/server/db/schema";
import { ProductsQuerySchema } from "@/server/api/schemas";

export const dynamic = "force-dynamic";

export const GET = createApiHandler(
  async ({ req }) => {
    const searchParams = req.nextUrl.searchParams;
    const rawQuery = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      garmentType: searchParams.get("garmentType") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const validationResult = ProductsQuerySchema.safeParse(rawQuery);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid query parameters",
        fieldErrors
      );
    }

    const { page, limit, category, garmentType, search } = validationResult.data;

    // Build filter predicates
    const conditions = [
      eq(products.status, "active"),
      eq(products.moderationStatus, "approved"),
    ];

    if (category && category.toLowerCase() !== "all") {
      conditions.push(ilike(products.category, category));
    }

    if (garmentType) {
      conditions.push(eq(products.garmentType, garmentType));
    }

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
          ilike(products.fabric, pattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);
    const total = totalCountResult[0]?.total ?? 0;

    // Fetch paginated products
    const offset = (page - 1) * limit;
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
      .where(whereClause)
      .orderBy(asc(products.id))
      .limit(limit)
      .offset(offset);

    // Fetch size options for the retrieved products
    const productIds = productRows.map((p) => p.id);
    const measurementMap = new Map<string, string[]>();

    if (productIds.length > 0) {
      const measurementRows = await db
        .select({
          productId: garmentMeasurements.productId,
          size: garmentMeasurements.size,
        })
        .from(garmentMeasurements)
        .where(inArray(garmentMeasurements.productId, productIds));

      for (const m of measurementRows) {
        const existing = measurementMap.get(m.productId) || [];
        if (!existing.includes(m.size)) {
          existing.push(m.size);
        }
        measurementMap.set(m.productId, existing);
      }
    }

    const sizeOrder = ["S", "M", "L", "XL"];
    const formattedProducts = productRows.map((p) => {
      const sizes = (measurementMap.get(p.id) || []).sort(
        (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
      );
      return {
        ...p,
        ratingAvg: Number(p.ratingAvg),
        sizes,
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  {
    authRequired: false,
  }
);
