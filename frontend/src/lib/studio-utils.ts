import { type MockGarment } from "@/lib/mock-data";
import { type GarmentSize } from "@/lib/shop-utils";

export interface ValidatedOutfitCartItem {
  garment: MockGarment;
  size: GarmentSize;
}

export type StudioBagValidationResult =
  | {
      ok: true;
      items: ValidatedOutfitCartItem[];
    }
  | {
      ok: false;
      missingGarments: MockGarment[];
      invalidGarments: MockGarment[];
      error: string;
    };

/**
 * Returns the customer's explicitly selected size only if it exists in garment.sizes.
 * Never falls back to "M" or garment.sizes[0].
 */
export function resolveExplicitGarmentSize(
  garment: MockGarment,
  selected: GarmentSize | "" | undefined | null
): GarmentSize | "" {
  if (!selected) return "";
  return garment.sizes.includes(selected) ? selected : "";
}

/**
 * Validates that every selected outfit garment has a customer-selected size
 * included in that garment's available sizes array before any item is added to cart.
 */
export function validateExplicitOutfitSizes(
  garments: readonly MockGarment[],
  sizeMap: Readonly<Partial<Record<string, GarmentSize | "" | undefined>>>
): StudioBagValidationResult {
  if (garments.length === 0) {
    return {
      ok: false,
      missingGarments: [],
      invalidGarments: [],
      error:
        "Select at least one garment layer before adding items to your bag.",
    };
  }

  const missingGarments: MockGarment[] = [];
  const invalidGarments: MockGarment[] = [];
  const validatedItems: ValidatedOutfitCartItem[] = [];

  for (const garment of garments) {
    const raw = sizeMap[garment.id];
    if (!raw) {
      missingGarments.push(garment);
      continue;
    }
    if (!garment.sizes.includes(raw)) {
      invalidGarments.push(garment);
      continue;
    }
    validatedItems.push({ garment, size: raw });
  }

  if (missingGarments.length > 0 || invalidGarments.length > 0) {
    const parts: string[] = [];
    if (missingGarments.length > 0) {
      parts.push(
        `select a size for ${missingGarments.map((g) => g.name).join(", ")}`
      );
    }
    if (invalidGarments.length > 0) {
      parts.push(
        `choose an available size for ${invalidGarments
          .map((g) => g.name)
          .join(", ")}`
      );
    }
    return {
      ok: false,
      missingGarments,
      invalidGarments,
      error: `Please ${parts.join(" and ")} before adding the outfit to bag.`,
    };
  }

  return {
    ok: true,
    items: validatedItems,
  };
}
