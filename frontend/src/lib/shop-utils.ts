import { MockGarment } from "@/lib/mock-data";

export type GarmentSize = MockGarment["sizes"][number];
export type PriceRangeKey = "all" | "under-1500" | "1500-3500" | "above-3500";
export type ShopSortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "rating-desc";

export interface ShopFilterState {
  query: string;
  category: string;
  fitType: string;
  occasion: string;
  size: string;
  priceRange: PriceRangeKey;
  sortBy: ShopSortKey;
}

export const INITIAL_SHOP_FILTERS: ShopFilterState = {
  query: "",
  category: "All",
  fitType: "All",
  occasion: "All",
  size: "All",
  priceRange: "all",
  sortBy: "default",
};

export const PRICE_RANGE_OPTIONS: ReadonlyArray<{
  key: PriceRangeKey;
  label: string;
}> = [
  { key: "all", label: "All Prices" },
  { key: "under-1500", label: "Under ₹1,500" },
  { key: "1500-3500", label: "₹1,500 – ₹3,500" },
  { key: "above-3500", label: "Above ₹3,500" },
];

export const SORT_OPTIONS: ReadonlyArray<{
  key: ShopSortKey;
  label: string;
}> = [
  { key: "default", label: "Default Order" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "name-asc", label: "Name: A to Z" },
  { key: "rating-desc", label: "Rating: High to Low" },
];

export interface CategoryDiscoveryItem {
  name: string;
  count: number;
  previewImage?: string;
  previewSwatchHex?: string;
}

export function deriveCategoryDiscovery(
  garments: readonly MockGarment[]
): CategoryDiscoveryItem[] {
  const counts = new Map<string, CategoryDiscoveryItem>();
  for (const g of garments) {
    const existing = counts.get(g.category);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(g.category, {
        name: g.category,
        count: 1,
        previewImage: g.image,
        previewSwatchHex: g.swatchHex,
      });
    }
  }
  return Array.from(counts.values());
}

export function deriveFilterFacets(garments: readonly MockGarment[]) {
  const categories = Array.from(new Set(garments.map((g) => g.category)));
  const fitTypes = Array.from(new Set(garments.map((g) => g.fitType)));
  const occasions = Array.from(new Set(garments.map((g) => g.occasion)));
  const sizes = Array.from(new Set(garments.flatMap((g) => g.sizes)));

  return {
    categories: ["All", ...categories],
    fitTypes: ["All", ...fitTypes],
    occasions: ["All", ...occasions],
    sizes: ["All", ...sizes],
  };
}

export function matchesPriceRange(
  priceInr: number,
  range: PriceRangeKey
): boolean {
  if (range === "under-1500") return priceInr < 1500;
  if (range === "1500-3500") return priceInr >= 1500 && priceInr <= 3500;
  if (range === "above-3500") return priceInr > 3500;
  return true;
}

export function filterAndSortGarments(
  garments: readonly MockGarment[],
  filters: ShopFilterState
): MockGarment[] {
  const q = filters.query.trim().toLowerCase();

  const matched = garments.filter((g) => {
    if (q) {
      const searchable = [
        g.name,
        g.category,
        g.fitType,
        g.occasion,
        g.color,
        g.fabric,
        g.stretchNote,
        g.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    if (filters.category !== "All" && g.category !== filters.category) {
      return false;
    }
    if (filters.fitType !== "All" && g.fitType !== filters.fitType) {
      return false;
    }
    if (filters.occasion !== "All" && g.occasion !== filters.occasion) {
      return false;
    }
    if (
      filters.size !== "All" &&
      !g.sizes.includes(filters.size as GarmentSize)
    ) {
      return false;
    }
    if (!matchesPriceRange(g.priceInr, filters.priceRange)) {
      return false;
    }

    return true;
  });

  if (filters.sortBy === "price-asc") {
    return [...matched].sort((a, b) => a.priceInr - b.priceInr);
  }
  if (filters.sortBy === "price-desc") {
    return [...matched].sort((a, b) => b.priceInr - a.priceInr);
  }
  if (filters.sortBy === "name-asc") {
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (filters.sortBy === "rating-desc") {
    return [...matched].sort(
      (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
    );
  }

  return matched;
}

export interface FeaturedDiscoveryItem {
  garment: MockGarment;
  highlightLabel: string;
}

/**
 * Selects featured highlights strictly grounded in existing rating & reviewCount fields.
 */
export function getFeaturedDiscoveries(
  garments: readonly MockGarment[]
): FeaturedDiscoveryItem[] {
  if (garments.length === 0) return [];

  const picks: FeaturedDiscoveryItem[] = [];
  const usedIds = new Set<string>();

  const highestRated = [...garments].sort(
    (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount
  )[0];
  if (highestRated) {
    picks.push({
      garment: highestRated,
      highlightLabel: `Top Rated (${highestRated.rating} ★)`,
    });
    usedIds.add(highestRated.id);
  }

  const mostReviewed = [...garments]
    .filter((g) => !usedIds.has(g.id))
    .sort((a, b) => b.reviewCount - a.reviewCount)[0];
  if (mostReviewed) {
    picks.push({
      garment: mostReviewed,
      highlightLabel: `Most Reviewed (${mostReviewed.reviewCount.toLocaleString("en-IN")})`,
    });
    usedIds.add(mostReviewed.id);
  }

  const nextRated = [...garments]
    .filter((g) => !usedIds.has(g.id))
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)[0];
  if (nextRated) {
    picks.push({
      garment: nextRated,
      highlightLabel: `Highly Rated (${nextRated.rating} ★)`,
    });
  }

  return picks;
}

export function getGarmentMeasurementSummary(garment: MockGarment): {
  hasSpecs: boolean;
  chestRangeText: string | null;
  waistRangeText: string | null;
} {
  if (!garment.sizes.length || !garment.chestMapCm) {
    return { hasSpecs: false, chestRangeText: null, waistRangeText: null };
  }
  const chestValues = garment.sizes
    .map((size) => garment.chestMapCm[size])
    .filter((val) => typeof val === "number" && Number.isFinite(val) && val > 0);
  const waistValues = garment.waistMapCm
    ? garment.sizes
        .map((size) => garment.waistMapCm[size])
        .filter(
          (val) => typeof val === "number" && Number.isFinite(val) && val > 0
        )
    : [];

  if (chestValues.length === 0 && waistValues.length === 0) {
    return { hasSpecs: false, chestRangeText: null, waistRangeText: null };
  }

  const chestMin = chestValues.length ? Math.min(...chestValues) : 0;
  const chestMax = chestValues.length ? Math.max(...chestValues) : 0;
  const waistMin = waistValues.length ? Math.min(...waistValues) : 0;
  const waistMax = waistValues.length ? Math.max(...waistValues) : 0;

  return {
    hasSpecs: true,
    chestRangeText: chestValues.length
      ? chestMin === chestMax
        ? `${chestMin} cm chest`
        : `${chestMin}–${chestMax} cm chest`
      : null,
    waistRangeText: waistValues.length
      ? waistMin === waistMax
        ? `${waistMin} cm waist`
        : `${waistMin}–${waistMax} cm waist`
      : null,
  };
}

export function getRelatedGarments(
  garments: readonly MockGarment[],
  current: MockGarment,
  limit = 3
): MockGarment[] {
  return garments
    .filter((g) => g.id !== current.id)
    .map((g) => {
      let overlap = 0;
      if (g.category === current.category) overlap += 3;
      if (g.fitType === current.fitType) overlap += 2;
      if (g.occasion === current.occasion) overlap += 1;
      return { garment: g, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((item) => item.garment);
}

export function countActiveFilters(filters: ShopFilterState): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.category !== "All") count += 1;
  if (filters.fitType !== "All") count += 1;
  if (filters.occasion !== "All") count += 1;
  if (filters.size !== "All") count += 1;
  if (filters.priceRange !== "all") count += 1;
  return count;
}
