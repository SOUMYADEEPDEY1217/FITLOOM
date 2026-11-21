import type { GarmentTypeOption, FitPreferenceAvatarOption } from "@/lib/api/types";

export type AvatarGarmentSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface GarmentTypeOptionItem {
  value: GarmentTypeOption;
  label: string;
  category: string;
}

export const GARMENT_TYPE_OPTIONS: ReadonlyArray<GarmentTypeOptionItem> = [
  { value: "tshirt", label: "T-Shirt", category: "T-Shirts" },
  { value: "shirt", label: "Shirt", category: "Shirts" },
  { value: "trousers", label: "Trousers", category: "Trousers" },
  { value: "kurti", label: "Kurti", category: "Kurtis" },
];

export const SIZE_OPTIONS: ReadonlyArray<AvatarGarmentSize> = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
];

export interface FitPreferenceOptionItem {
  value: FitPreferenceAvatarOption;
  label: string;
  easeCm: number;
}

export const FIT_PREFERENCE_OPTIONS: ReadonlyArray<FitPreferenceOptionItem> = [
  { value: "slim", label: "Slim", easeCm: 5 },
  { value: "regular", label: "Regular", easeCm: 8 },
  { value: "relaxed", label: "Relaxed", easeCm: 12 },
  { value: "oversized", label: "Oversized", easeCm: 15 },
];
