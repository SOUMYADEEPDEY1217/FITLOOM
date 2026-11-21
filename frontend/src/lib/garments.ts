import type { GarmentTypeOption, FitPreferenceAvatarOption } from "@/lib/api/types";

export type AvatarGarmentSize = string;

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

export const SIZE_OPTIONS: ReadonlyArray<string> = [
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

export interface FabricColorOption {
  name: string;
  hex: string;
}

export const FABRIC_COLOR_OPTIONS: ReadonlyArray<FabricColorOption> = [
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Slate", hex: "#334155" },
  { name: "Off White", hex: "#e2e8f0" },
  { name: "Olive Green", hex: "#3f6212" },
  { name: "Burgundy", hex: "#7f1d1d" },
];

export type GarmentViewMode = "fabric" | "heatmap";

