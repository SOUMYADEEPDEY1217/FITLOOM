import { z } from "zod";
import { MOCK_GARMENTS, type MockGarment } from "@/lib/mock-data";
import type {
  MockOrder,
  MockUser,
  OrderStage,
} from "@/components/providers/fitloom-provider";

export type GarmentCategory = MockGarment["category"];
export type GarmentFitType = MockGarment["fitType"];
export type GarmentOccasion = MockGarment["occasion"];
export type GarmentSize = MockGarment["sizes"][number];

export type SellerProductStatus =
  | "draft"
  | "active"
  | "out_of_stock"
  | "inactive";

export type CatalogModerationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended";

export interface SellerCatalogProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerCity?: string;
  name: string;
  description: string;
  category: GarmentCategory;
  fitType: GarmentFitType;
  occasion: GarmentOccasion;
  color: string;
  swatchHex: string;
  image?: string;
  fabric: string;
  stretchNote: string;
  priceInr: number;
  sizes: GarmentSize[];
  chestMapCm: Record<GarmentSize, number>;
  waistMapCm: Record<GarmentSize, number>;
  /**
   * Explicit seller-entered stock count, or null when unverified/not provided
   * on base catalogue seeds (never fabricated).
   */
  inventoryQty: number | null;
  status: SellerProductStatus;
  moderationStatus: CatalogModerationStatus;
  moderationReason?: string;
  customFitEligible: boolean;
  rating: number;
  reviewCount: number;
  isCoreSeed?: boolean;
  updatedAt?: string;
}

export const GARMENT_CATEGORIES: readonly GarmentCategory[] = [
  "Shirts",
  "Outerwear",
  "Trousers",
  "T-Shirts",
  "Hoodies",
] as const;

export const GARMENT_FIT_TYPES: readonly GarmentFitType[] = [
  "Slim",
  "Regular",
  "Relaxed",
] as const;

export const GARMENT_OCCASIONS: readonly GarmentOccasion[] = [
  "Work / Casual",
  "Formal / Work",
  "Casual / Travel",
  "Streetwear",
] as const;

export const GARMENT_SIZES: readonly GarmentSize[] = [
  "S",
  "M",
  "L",
  "XL",
] as const;

export const APPROVED_PRODUCT_IMAGES: ReadonlyArray<{
  label: string;
  value: string;
}> = [
  { label: "Sky Oxford Shirt", value: "/assets/products/sky-oxford-shirt.png" },
  { label: "Olive Linen Shirt", value: "/assets/products/olive-linen-shirt.jpg" },
  {
    label: "Classic Navy Shirt",
    value: "/assets/products/classic-navy-shirt.png",
  },
  {
    label: "Structured Atelier Bomber",
    value: "/assets/products/structured-atelier-bomber.jpg",
  },
  {
    label: "Architectural Pleated Trouser",
    value: "/assets/products/architectural-pleated-trouser.png",
  },
  { label: "Atelier Heavyweight Tee", value: "/assets/products/violet-studio-tee.png" },
];

export const SELLER_VERVE_ID = "seller-verve-demo";
export const SELLER_VERVE_NAME = "Verve Studio (Demo Seller)";
export const SELLER_COLLECTIVE_ID = "seller-fitloom-house";
export const SELLER_COLLECTIVE_NAME = "FITLOOM Flagship Collective";

/**
 * Seeds initial seller-associated catalogue records from MOCK_GARMENTS
 * without mutating MOCK_GARMENTS or fabricating inventory quantities.
 */
export function buildInitialSellerProducts(): SellerCatalogProduct[] {
  return MOCK_GARMENTS.map((garment, idx) => {
    const ownedByVerve = idx < 4;
    return {
      id: garment.id,
      sellerId: ownedByVerve ? SELLER_VERVE_ID : SELLER_COLLECTIVE_ID,
      sellerName: ownedByVerve ? SELLER_VERVE_NAME : SELLER_COLLECTIVE_NAME,
      sellerCity: ownedByVerve ? "Mumbai" : "Bengaluru",
      name: garment.name,
      description: garment.description,
      category: garment.category,
      fitType: garment.fitType,
      occasion: garment.occasion,
      color: garment.color,
      swatchHex: garment.swatchHex,
      image: garment.image,
      fabric: garment.fabric,
      stretchNote: garment.stretchNote,
      priceInr: garment.priceInr,
      sizes: [...garment.sizes],
      chestMapCm: { ...garment.chestMapCm },
      waistMapCm: { ...garment.waistMapCm },
      inventoryQty: null,
      status: "active",
      moderationStatus: "approved",
      customFitEligible: garment.sizes.length > 0,
      rating: garment.rating,
      reviewCount: garment.reviewCount,
      isCoreSeed: true,
      updatedAt: "2026-11-18",
    };
  });
}

function parseIntegerField(label: string, min: number, max: number) {
  return z.preprocess(
    (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return undefined;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : Number.NaN;
      }
      return val;
    },
    z
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} must be a valid number.`,
      })
      .finite(`${label} must be a valid number.`)
      .int(`${label} must be a whole number.`)
      .min(min, `${label} must be between ${min} and ${max}.`)
      .max(max, `${label} must be between ${min} and ${max}.`)
  );
}

const SizeDimensionMapSchema = z.object({
  S: parseIntegerField("Size S dimension (cm)", 50, 180),
  M: parseIntegerField("Size M dimension (cm)", 50, 180),
  L: parseIntegerField("Size L dimension (cm)", 50, 180),
  XL: parseIntegerField("Size XL dimension (cm)", 50, 180),
});

export const SellerProductFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters.")
    .max(80, "Product name must be 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(400, "Description must be 400 characters or fewer."),
  category: z.enum(["Shirts", "Outerwear", "Trousers", "T-Shirts", "Hoodies"]),
  fitType: z.enum(["Slim", "Regular", "Relaxed"]),
  occasion: z.enum([
    "Work / Casual",
    "Formal / Work",
    "Casual / Travel",
    "Streetwear",
  ]),
  color: z
    .string()
    .trim()
    .min(2, "Primary colour label is required.")
    .max(40, "Colour label must be 40 characters or fewer."),
  swatchHex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Swatch must be a valid 6-digit hex code (e.g. #6633EE)."),
  image: z.string().trim().optional(),
  fabric: z
    .string()
    .trim()
    .min(3, "Fabric specification is required.")
    .max(100, "Fabric note must be 100 characters or fewer."),
  stretchNote: z
    .string()
    .trim()
    .min(3, "Stretch / construction note is required.")
    .max(160, "Stretch note must be 160 characters or fewer."),
  priceInr: parseIntegerField("Price (INR)", 299, 99999),
  sizes: z
    .array(z.enum(["S", "M", "L", "XL"]))
    .min(1, "Select at least one available size."),
  chestMapCm: SizeDimensionMapSchema,
  waistMapCm: SizeDimensionMapSchema,
  inventoryQty: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return null;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : Number.NaN;
      }
      return val;
    },
    z
      .number({ invalid_type_error: "Inventory quantity must be a whole number." })
      .finite("Inventory quantity must be a valid number.")
      .int("Inventory quantity must be a whole number.")
      .min(0, "Inventory quantity cannot be negative.")
      .max(10000, "Inventory quantity cannot exceed 10,000 units.")
      .nullable()
  ),
  status: z.enum(["draft", "active", "out_of_stock", "inactive"]),
  customFitEligible: z.boolean(),
});

export type SellerProductFormInput = z.input<typeof SellerProductFormSchema>;
export type SellerProductFormData = z.output<typeof SellerProductFormSchema>;

export function resolveSellerId(user: MockUser): string {
  if (user.role !== "seller") return "";
  return (
    user.id?.trim() ||
    (user.email ? `user-${user.email.trim().toLowerCase()}` : "seller-session")
  );
}

export function isProductOwnedBySeller(
  product: SellerCatalogProduct,
  user: MockUser
): boolean {
  if (user.role !== "seller") return false;
  return product.sellerId === resolveSellerId(user);
}

export function getSellerOwnedProducts(
  products: readonly SellerCatalogProduct[],
  user: MockUser
): SellerCatalogProduct[] {
  if (user.role !== "seller") return [];
  const sellerId = resolveSellerId(user);
  return products.filter((p) => p.sellerId === sellerId);
}

export function generateUniqueProductId(
  name: string,
  existingIds: ReadonlySet<string>
): string {
  const baseSlug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "seller-garment";

  if (!existingIds.has(baseSlug)) return baseSlug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Checks whether a seller product satisfies all structural requirements
 * to safely participate in customer Fit Intelligence and CUSTOMFIT flows.
 */
export function hasCompleteFitDimensions(
  product: SellerCatalogProduct
): boolean {
  if (!product.sizes || product.sizes.length === 0) return false;
  return product.sizes.every((sz) => {
    const chest = product.chestMapCm?.[sz];
    const waist = product.waistMapCm?.[sz];
    return (
      typeof chest === "number" &&
      Number.isFinite(chest) &&
      chest >= 50 &&
      typeof waist === "number" &&
      Number.isFinite(waist) &&
      waist >= 50
    );
  });
}

export function isProductEligibleForCustomerCatalog(
  product: SellerCatalogProduct,
  suspendedSellerIds?: ReadonlySet<string>
): boolean {
  if (product.status !== "active") return false;
  if (product.moderationStatus !== "approved") return false;
  if (product.inventoryQty !== null && product.inventoryQty <= 0) return false;
  if (suspendedSellerIds?.has(product.sellerId)) return false;
  return hasCompleteFitDimensions(product);
}

export function toMockGarmentAdapter(
  product: SellerCatalogProduct
): MockGarment {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    fitType: product.fitType,
    occasion: product.occasion,
    color: product.color,
    swatchHex: product.swatchHex,
    image: product.image,
    fabric: product.fabric,
    stretchNote: product.stretchNote,
    priceInr: product.priceInr,
    rating: product.rating,
    reviewCount: product.reviewCount,
    sizes: [...product.sizes],
    chestMapCm: { ...product.chestMapCm },
    waistMapCm: { ...product.waistMapCm },
    description: product.description,
  };
}

export function selectEligibleCustomerGarments(
  products: readonly SellerCatalogProduct[],
  suspendedSellerIds?: ReadonlySet<string>
): MockGarment[] {
  return products
    .filter((p) => isProductEligibleForCustomerCatalog(p, suspendedSellerIds))
    .map(toMockGarmentAdapter);
}

export function isProductReferencedByOrders(
  productId: string,
  orders: readonly MockOrder[]
): string[] {
  return orders
    .filter((ord) => ord.items.some((item) => item.garmentId === productId))
    .map((ord) => ord.id);
}

/**
 * Standard Retail Order Lifecycle (must align with customer STANDARD_TIMELINE
 * and never mix with Tailor CUSTOMFIT production controls).
 */
export const STANDARD_ORDER_STAGES: readonly OrderStage[] = [
  "Placed",
  "Cutting",
  "Quality Check",
  "Out for Delivery",
  "Delivered",
] as const;

export function getSellerStandardOrders(
  orders: readonly MockOrder[],
  user: MockUser
): MockOrder[] {
  if (user.role !== "seller") return [];
  return orders.filter((o) => o.isCustomFit === false);
}

export function getNextStandardOrderStage(
  currentStage: OrderStage
): OrderStage | null {
  const idx = STANDARD_ORDER_STAGES.indexOf(currentStage);
  if (idx === -1 || idx >= STANDARD_ORDER_STAGES.length - 1) {
    return null;
  }
  return STANDARD_ORDER_STAGES[idx + 1] ?? null;
}

export function validateSellerAdvanceStandardOrder(
  order: MockOrder,
  targetStage: OrderStage
): { ok: true; nextStage: OrderStage } | { ok: false; error: string } {
  if (order.isCustomFit) {
    return {
      ok: false,
      error:
        "CUSTOMFIT tailored orders are managed by Partner Tailors and cannot be modified in the Seller workspace.",
    };
  }
  if (
    order.stage === "Cancelled" ||
    order.stage === "Delivered" ||
    order.stage === "Return Requested" ||
    order.stage === "Rejected by Tailor"
  ) {
    return {
      ok: false,
      error: `Orders with status "${order.stage}" cannot progress further.`,
    };
  }
  const nextAllowed = getNextStandardOrderStage(order.stage);
  if (!nextAllowed || targetStage !== nextAllowed) {
    return {
      ok: false,
      error: nextAllowed
        ? `Standard fulfillment advances sequentially. Next valid stage is "${nextAllowed}".`
        : "No further standard fulfillment stages available.",
    };
  }
  return { ok: true, nextStage: targetStage };
}

export function validateSellerCancelStandardOrder(
  order: MockOrder,
  reason: string
): { ok: true; reason: string } | { ok: false; error: string } {
  if (order.isCustomFit) {
    return {
      ok: false,
      error: "CUSTOMFIT orders cannot be cancelled from the Seller portal.",
    };
  }
  if (order.stage !== "Placed") {
    return {
      ok: false,
      error: `Only newly placed orders ("Placed") can be cancelled by Seller; current status is "${order.stage}".`,
    };
  }
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return {
      ok: false,
      error: "Enter a cancellation reason of at least 5 characters.",
    };
  }
  return { ok: true, reason: trimmed };
}

export interface SellerDashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  inactiveProducts: number;
  totalStandardOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  deliveredRevenueInr: number | null;
}

export function computeSellerDashboardMetrics(
  ownedProducts: readonly SellerCatalogProduct[],
  standardOrders: readonly MockOrder[]
): SellerDashboardMetrics {
  const completed = standardOrders.filter((o) => o.stage === "Delivered");
  const pending = standardOrders.filter((o) => o.stage === "Placed");
  const inProgress = standardOrders.filter((o) =>
    ["Cutting", "Quality Check", "Out for Delivery"].includes(o.stage)
  );

  // Revenue is only derived when at least one delivered standard order exists in session state
  const deliveredRevenueInr =
    completed.length > 0
      ? completed.reduce((sum, o) => sum + o.totalInr, 0)
      : null;

  return {
    totalProducts: ownedProducts.length,
    activeProducts: ownedProducts.filter((p) => p.status === "active").length,
    draftProducts: ownedProducts.filter((p) => p.status === "draft").length,
    outOfStockProducts: ownedProducts.filter(
      (p) => p.status === "out_of_stock"
    ).length,
    inactiveProducts: ownedProducts.filter((p) => p.status === "inactive").length,
    totalStandardOrders: standardOrders.length,
    pendingOrders: pending.length,
    inProgressOrders: inProgress.length,
    completedOrders: completed.length,
    deliveredRevenueInr,
  };
}

export function formatProductStatusLabel(status: SellerProductStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "out_of_stock":
      return "Out of Stock";
    case "inactive":
      return "Inactive";
  }
}

export function formatModerationStatusLabel(
  status: CatalogModerationStatus
): string {
  switch (status) {
    case "approved":
      return "Approved (Demo)";
    case "pending_review":
      return "Pending Review";
    case "rejected":
      return "Rejected";
    case "suspended":
      return "Suspended";
  }
}
