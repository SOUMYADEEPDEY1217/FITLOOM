import { MOCK_GARMENTS, type MockGarment } from "./mock-data";
import { type GarmentSize } from "./shop-utils";

export const MAX_COMPARE_ITEMS = 3;

export type CompareMeasurementUnit = "cm" | "in";

export interface ResolvedGarmentList {
  validItems: MockGarment[];
  invalidIds: string[];
  hasDuplicates: boolean;
}

/**
 * Deduplicates an ID list while preserving first-seen order and trimming empty strings.
 */
export function normalizeGarmentIdList(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawId of ids) {
    const id = rawId.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result;
}

/**
 * Separates valid catalog garments from missing/deleted garment IDs while avoiding duplicates.
 */
export function resolveGarmentReferences(
  ids: readonly string[],
  catalog: readonly MockGarment[] = MOCK_GARMENTS
): ResolvedGarmentList {
  const catalogById = new Map<string, MockGarment>();
  for (const garment of catalog) {
    catalogById.set(garment.id, garment);
  }

  const normalized = normalizeGarmentIdList(ids);
  const validItems: MockGarment[] = [];
  const invalidIds: string[] = [];

  for (const id of normalized) {
    const match = catalogById.get(id);
    if (match) {
      validItems.push(match);
    } else {
      invalidIds.push(id);
    }
  }

  return {
    validItems,
    invalidIds,
    hasDuplicates: normalized.length !== ids.filter((id) => Boolean(id.trim())).length,
  };
}

/**
 * Counts only unique, valid catalogue garment IDs in wishlist state
 * without mutating the underlying wishlist array.
 */
export function getValidWishlistCount(
  wishlistIds: readonly string[],
  catalog: readonly MockGarment[] = MOCK_GARMENTS
): number {
  return resolveGarmentReferences(wishlistIds, catalog).validItems.length;
}

/**
 * Toggles a garment ID in the wishlist without allowing duplicate IDs.
 */
export function toggleWishlistIds(
  currentIds: readonly string[],
  garmentId: string
): string[] {
  const normalized = normalizeGarmentIdList(currentIds);
  const cleanId = garmentId.trim();
  if (!cleanId) return normalized;

  if (normalized.includes(cleanId)) {
    return normalized.filter((id) => id !== cleanId);
  }
  return [...normalized, cleanId];
}

/**
 * Toggles a garment ID in compare state, enforcing uniqueness and MAX_COMPARE_ITEMS.
 * Matches existing Shop & Product Details UX by replacing the oldest item when adding past 3.
 */
export function toggleCompareIds(
  currentIds: readonly string[],
  garmentId: string,
  maxItems: number = MAX_COMPARE_ITEMS
): string[] {
  const normalized = normalizeGarmentIdList(currentIds).slice(-maxItems);
  const cleanId = garmentId.trim();
  if (!cleanId) return normalized;

  if (normalized.includes(cleanId)) {
    return normalized.filter((id) => id !== cleanId);
  }
  if (normalized.length >= maxItems) {
    return [...normalized.slice(-(maxItems - 1)), cleanId];
  }
  return [...normalized, cleanId];
}

/**
 * Adds a garment ID to compare strictly without exceeding maxItems.
 * Returns whether the item was already present or blocked by the limit.
 */
export function addCompareIdStrict(
  currentIds: readonly string[],
  garmentId: string,
  maxItems: number = MAX_COMPARE_ITEMS
): {
  nextIds: string[];
  added: boolean;
  reason?: "duplicate" | "limit-reached" | "invalid";
} {
  const normalized = normalizeGarmentIdList(currentIds);
  const cleanId = garmentId.trim();
  if (!cleanId) {
    return { nextIds: normalized, added: false, reason: "invalid" };
  }
  if (normalized.includes(cleanId)) {
    return { nextIds: normalized, added: false, reason: "duplicate" };
  }
  if (normalized.length >= maxItems) {
    return { nextIds: normalized, added: false, reason: "limit-reached" };
  }
  return { nextIds: [...normalized, cleanId], added: true };
}

/**
 * Formats a garment's available measurement range for an attribute map (e.g., chestMapCm, waistMapCm),
 * returning "Not available" when no verified numeric values exist for the garment's available sizes.
 */
export function formatGarmentMeasurementRange(
  garment: MockGarment,
  metric: "chestMapCm" | "waistMapCm",
  unit: CompareMeasurementUnit = "cm"
): string {
  const map = garment[metric];
  if (!map || garment.sizes.length === 0) {
    return "Not available";
  }

  const values: number[] = [];
  for (const size of garment.sizes) {
    const val = map[size];
    if (typeof val === "number" && Number.isFinite(val) && val > 0) {
      values.push(val);
    }
  }

  if (values.length === 0) {
    return "Not available";
  }

  const minCm = Math.min(...values);
  const maxCm = Math.max(...values);

  if (unit === "in") {
    const minIn = (minCm / 2.54).toFixed(1);
    const maxIn = (maxCm / 2.54).toFixed(1);
    return minCm === maxCm ? `${minIn} in` : `${minIn} – ${maxIn} in`;
  }

  return minCm === maxCm ? `${minCm} cm` : `${minCm} – ${maxCm} cm`;
}

export interface CompareAttributeRow {
  key: string;
  label: string;
  getValue: (garment: MockGarment, unit: CompareMeasurementUnit) => string;
}

/**
 * Canonical comparison attributes strictly grounded in MockGarment properties.
 * Returns "Not available" whenever a property is absent or empty.
 */
export const COMPARE_ATTRIBUTE_ROWS: readonly CompareAttributeRow[] = [
  {
    key: "category",
    label: "Category",
    getValue: (g) => g.category?.trim() || "Not available",
  },
  {
    key: "price",
    label: "Price",
    getValue: (g) =>
      typeof g.priceInr === "number" && Number.isFinite(g.priceInr)
        ? `₹${g.priceInr.toLocaleString("en-IN")}`
        : "Not available",
  },
  {
    key: "sizes",
    label: "Available Sizes",
    getValue: (g) =>
      Array.isArray(g.sizes) && g.sizes.length > 0
        ? g.sizes.join(", ")
        : "Not available",
  },
  {
    key: "fitType",
    label: "Fit Silhouette",
    getValue: (g) => (g.fitType ? `${g.fitType} Fit` : "Not available"),
  },
  {
    key: "fabric",
    label: "Fabric",
    getValue: (g) => g.fabric?.trim() || "Not available",
  },
  {
    key: "stretchNote",
    label: "Stretch & Drape",
    getValue: (g) => g.stretchNote?.trim() || "Not available",
  },
  {
    key: "chestRange",
    label: "Chest Range (Garment)",
    getValue: (g, unit) => formatGarmentMeasurementRange(g, "chestMapCm", unit),
  },
  {
    key: "waistRange",
    label: "Waist Range (Garment)",
    getValue: (g, unit) => formatGarmentMeasurementRange(g, "waistMapCm", unit),
  },
  {
    key: "rating",
    label: "Customer Rating",
    getValue: (g) => {
      if (
        typeof g.rating === "number" &&
        Number.isFinite(g.rating) &&
        g.rating > 0
      ) {
        const countLabel =
          typeof g.reviewCount === "number" && g.reviewCount > 0
            ? ` (${g.reviewCount} reviews)`
            : "";
        return `${g.rating.toFixed(1)} / 5${countLabel}`;
      }
      return "Not available";
    },
  },
];

/**
 * Validates an explicit user-selected size for a garment before adding to cart.
 * Returns null if no size was explicitly chosen or if the size is not offered by the garment.
 */
export function validateExplicitGarmentSize(
  garment: MockGarment,
  selectedSize: GarmentSize | null | undefined
): GarmentSize | null {
  if (!selectedSize) return null;
  return garment.sizes.includes(selectedSize) ? selectedSize : null;
}
