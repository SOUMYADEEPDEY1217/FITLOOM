import { z } from "zod";

export const FitPreferenceSchema = z.enum([
  "slim",
  "regular",
  "relaxed",
  "oversized",
]);
export type FitPreference = z.infer<typeof FitPreferenceSchema>;

export const FIT_PREFERENCE_EASE_CM: Record<FitPreference, number> = {
  slim: 5,
  regular: 8,
  relaxed: 12,
  oversized: 15,
};

export function getFitPreferenceEaseCm(pref: FitPreference): number {
  return FIT_PREFERENCE_EASE_CM[pref] ?? 8;
}

export const BodyTypeSchema = z.enum([
  "hourglass",
  "athletic",
  "rectangle",
  "pear",
  "inverted-triangle",
]);
export type BodyType = z.infer<typeof BodyTypeSchema>;

export const BodyProfileSchema = z.object({
  heightCm: z
    .number()
    .min(130, "Height must be between 130 and 220 cm")
    .max(220, "Height must be between 130 and 220 cm"),
  weightKg: z
    .number()
    .min(35, "Weight must be between 35 and 180 kg")
    .max(180, "Weight must be between 35 and 180 kg")
    .optional(),
  bodyType: BodyTypeSchema.optional(),
  chestCm: z
    .number()
    .min(70, "Chest must be between 70 and 150 cm")
    .max(150, "Chest must be between 70 and 150 cm"),
  waistCm: z
    .number()
    .min(55, "Waist must be between 55 and 140 cm")
    .max(140, "Waist must be between 55 and 140 cm"),
  hipCm: z
    .number()
    .min(75, "Hip must be between 75 and 155 cm")
    .max(155, "Hip must be between 75 and 155 cm"),
  shoulderCm: z
    .number()
    .min(34, "Shoulder must be between 34 and 65 cm")
    .max(65, "Shoulder must be between 34 and 65 cm"),
  sleeveCm: z
    .number()
    .min(50, "Sleeve length must be between 50 and 80 cm")
    .max(80, "Sleeve length must be between 50 and 80 cm"),
  inseamCm: z
    .number()
    .min(55, "Inseam must be between 55 and 105 cm")
    .max(105, "Inseam must be between 55 and 105 cm"),
  fitPreference: FitPreferenceSchema,
});
export type BodyProfile = z.infer<typeof BodyProfileSchema>;

export type GarmentType = "tshirt" | "shirt" | "trousers" | "kurti";

export interface MockGarment {
  id: string;
  name: string;
  category: "Shirts" | "Outerwear" | "Trousers" | "T-Shirts" | "Hoodies" | "Kurtis";
  garmentType?: GarmentType;
  fitType: "Slim" | "Regular" | "Relaxed";
  occasion: "Work / Casual" | "Formal / Work" | "Casual / Travel" | "Streetwear";
  color: string;
  swatchHex: string;
  image?: string;
  fabric: string;
  stretchNote: string;
  priceInr: number;
  rating: number;
  reviewCount: number;
  sizes: Array<"S" | "M" | "L" | "XL">;
  chestMapCm: Record<"S" | "M" | "L" | "XL", number>;
  waistMapCm: Record<"S" | "M" | "L" | "XL", number>;
  description: string;
}

export const INITIAL_MOCK_BODY_PROFILE: BodyProfile = {
  heightCm: 168,
  weightKg: 58,
  bodyType: "hourglass",
  chestCm: 92,
  waistCm: 70,
  hipCm: 98,
  shoulderCm: 40,
  sleeveCm: 59,
  inseamCm: 78,
  fitPreference: "regular",
};

export const MOCK_GARMENTS: MockGarment[] = [
  {
    id: "sky-oxford-shirt",
    name: "Sky Oxford Shirt",
    category: "Shirts",
    garmentType: "shirt",
    fitType: "Regular",
    occasion: "Work / Casual",
    color: "Sky Blue",
    swatchHex: "#93C5FD",
    image: "/assets/products/sky-oxford-shirt.png",
    fabric: "100% Combed Cotton Oxford",
    stretchNote: "Low natural stretch; crisp structured collar & tailored cuff.",
    priceInr: 1499,
    rating: 4.7,
    reviewCount: 2340,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 82, M: 88, L: 94, XL: 100 },
    description:
      "A classic Oxford shirt with a clean, versatile cut engineered for all-day office or weekend wear.",
  },
  {
    id: "olive-linen-shirt",
    name: "Olive Linen Shirt",
    category: "Shirts",
    garmentType: "shirt",
    fitType: "Regular",
    occasion: "Casual / Travel",
    color: "Olive",
    swatchHex: "#65A30D",
    image: "/assets/products/olive-linen-shirt.jpg",
    fabric: "70% European Linen / 30% Cotton",
    stretchNote: "Breathable open weave with natural relaxed drape.",
    priceInr: 1299,
    rating: 4.5,
    reviewCount: 890,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 96, M: 102, L: 108, XL: 114 },
    waistMapCm: { S: 84, M: 90, L: 96, XL: 102 },
    description:
      "Lightweight linen-blend shirt with soft shoulder slope and breathable summer airflow.",
  },
  {
    id: "classic-navy-shirt",
    name: "Classic Navy Shirt",
    category: "Shirts",
    garmentType: "shirt",
    fitType: "Slim",
    occasion: "Formal / Work",
    color: "Navy",
    swatchHex: "#1E3A8A",
    image: "/assets/products/classic-navy-shirt.png",
    fabric: "98% Supima Cotton / 2% Elastane",
    stretchNote: "2-way micro-stretch for closer slim-fit tailoring.",
    priceInr: 1399,
    rating: 4.6,
    reviewCount: 1520,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 92, M: 98, L: 104, XL: 110 },
    waistMapCm: { S: 78, M: 84, L: 90, XL: 96 },
    description:
      "Sharp navy poplin shirt with contoured waist darts and wrinkle-resistant finish.",
  },
  {
    id: "structured-atelier-bomber",
    name: "Structured Atelier Bomber",
    category: "Outerwear",
    garmentType: "shirt",
    fitType: "Relaxed",
    occasion: "Streetwear",
    color: "Pearl White",
    swatchHex: "#E2E8F0",
    image: "/assets/products/structured-atelier-bomber.jpg",
    fabric: "Matte Technical Twill (Low Stretch)",
    stretchNote: "Structured outer shell; +8 cm layering ease.",
    priceInr: 4290,
    rating: 4.9,
    reviewCount: 412,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 100, M: 106, L: 112, XL: 118 },
    waistMapCm: { S: 88, M: 94, L: 100, XL: 106 },
    description:
      "Architectural cropped bomber jacket with violet-lined storm collar and articulated sleeves.",
  },
  {
    id: "architectural-pleated-trouser",
    name: "Architectural Pleated Trouser",
    category: "Trousers",
    garmentType: "trousers",
    fitType: "Relaxed",
    occasion: "Work / Casual",
    color: "Charcoal Violet",
    swatchHex: "#312E81",
    image: "/assets/products/architectural-pleated-trouser.png",
    fabric: "Breathable Wool-Blend Twill",
    stretchNote: "Natural drape with adjustable side-tab waist.",
    priceInr: 3190,
    rating: 4.8,
    reviewCount: 620,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 72, M: 78, L: 84, XL: 90 },
    description:
      "Single-pleat tailored trousers designed for balanced hip ease and clean vertical drape.",
  },
  {
    id: "violet-studio-tee",
    name: "Atelier Heavyweight Tee",
    category: "T-Shirts",
    garmentType: "tshirt",
    fitType: "Relaxed",
    occasion: "Casual / Travel",
    color: "Deep Violet",
    swatchHex: "#6633EE",
    image: "/assets/products/violet-studio-tee.png",
    fabric: "260 GSM Organic Jersey",
    stretchNote: "Natural knit recovery; dropped shoulder silhouette.",
    priceInr: 1190,
    rating: 4.7,
    reviewCount: 980,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 98, M: 104, L: 110, XL: 116 },
    waistMapCm: { S: 90, M: 96, L: 102, XL: 108 },
    description:
      "Heavyweight studio tee engineered to hold clean boxy proportions without cling.",
  },
  {
    id: "monochrome-silk-shirt",
    name: "Monochrome Silk Blend Shirt",
    category: "Shirts",
    garmentType: "shirt",
    fitType: "Slim",
    occasion: "Formal / Work",
    color: "Off-White",
    swatchHex: "#F8FAFC",
    image: "/assets/products/sky-oxford-shirt.png",
    fabric: "60% Mulberry Silk / 40% Egyptian Cotton",
    stretchNote: "Subtle fluid drape with high tensile sheen.",
    priceInr: 2899,
    rating: 4.8,
    reviewCount: 410,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 92, M: 98, L: 104, XL: 110 },
    waistMapCm: { S: 80, M: 86, L: 92, XL: 98 },
    description:
      "Luxurious silk-blend evening shirt with concealed placket and French cuffs.",
  },
  {
    id: "classic-crewneck-tee",
    name: "Classic Everyday Crewneck",
    category: "T-Shirts",
    garmentType: "tshirt",
    fitType: "Regular",
    occasion: "Casual / Travel",
    color: "Heather Grey",
    swatchHex: "#94A3B8",
    image: "/assets/products/violet-studio-tee.png",
    fabric: "100% Combed Ring-Spun Cotton",
    stretchNote: "Pre-shrunk 180 GSM single jersey with ribbed collar.",
    priceInr: 799,
    rating: 4.6,
    reviewCount: 1820,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 84, M: 90, L: 96, XL: 102 },
    description:
      "Essential lightweight cotton crewneck tee engineered for effortless daily rotation.",
  },
  {
    id: "oversized-graphic-tee",
    name: "Tokyo Typographic Oversized Tee",
    category: "T-Shirts",
    garmentType: "tshirt",
    fitType: "Relaxed",
    occasion: "Streetwear",
    color: "Washed Black",
    swatchHex: "#18181B",
    image: "/assets/products/violet-studio-tee.png",
    fabric: "100% Heavyweight Cotton 240 GSM",
    stretchNote: "Substantial boxy drape with dropped shoulder line.",
    priceInr: 1299,
    rating: 4.9,
    reviewCount: 750,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 104, M: 110, L: 116, XL: 122 },
    waistMapCm: { S: 96, M: 102, L: 108, XL: 114 },
    description:
      "Architectural drop-shoulder streetwear tee with tactile screenprinted typography.",
  },
  {
    id: "selvedge-denim-jeans",
    name: "Raw Indigo Selvedge Denim",
    category: "Trousers",
    garmentType: "trousers",
    fitType: "Regular",
    occasion: "Work / Casual",
    color: "Raw Indigo",
    swatchHex: "#1E1B4B",
    image: "/assets/products/architectural-pleated-trouser.png",
    fabric: "13.5 oz Kurabo Japanese Selvedge Cotton",
    stretchNote: "Zero synthetic stretch; breaks in naturally to your body over time.",
    priceInr: 4499,
    rating: 4.9,
    reviewCount: 520,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 76, M: 82, L: 88, XL: 94 },
    description:
      "Heritage raw selvedge denim with clean straight leg and copper hardware.",
  },
  {
    id: "tailored-chinos",
    name: "Essential Flat-Front Chinos",
    category: "Trousers",
    garmentType: "trousers",
    fitType: "Slim",
    occasion: "Formal / Work",
    color: "British Khaki",
    swatchHex: "#D97706",
    image: "/assets/products/architectural-pleated-trouser.png",
    fabric: "97% Brushed Cotton Twill / 3% Spandex",
    stretchNote: "Comfort stretch waistband and clean tapered hem.",
    priceInr: 2199,
    rating: 4.7,
    reviewCount: 1140,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 74, M: 80, L: 86, XL: 92 },
    description:
      "Modern flat-front chinos balancing boardroom formality with relaxed weekend comfort.",
  },
  {
    id: "chikankari-cotton-kurti",
    name: "Handcrafted Chikankari Cotton Kurti",
    category: "Kurtis",
    garmentType: "kurti",
    fitType: "Regular",
    occasion: "Casual / Travel",
    color: "Pastel Mint",
    swatchHex: "#6EE7B7",
    image: "/assets/products/sky-oxford-shirt.png",
    fabric: "100% Breathable Mulmul Cotton",
    stretchNote: "Soft lightweight weave with delicate artisanal hand embroidery.",
    priceInr: 1899,
    rating: 4.8,
    reviewCount: 1320,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 96, M: 102, L: 108, XL: 114 },
    waistMapCm: { S: 88, M: 94, L: 100, XL: 106 },
    description:
      "Authentic Lucknowi Chikankari tunic with round notched neck and side slits for graceful movement.",
  },
  {
    id: "anarkali-embroidered-kurti",
    name: "Festive Embroidered Anarkali Kurti",
    category: "Kurtis",
    garmentType: "kurti",
    fitType: "Relaxed",
    occasion: "Formal / Work",
    color: "Crimson Maroon",
    swatchHex: "#991B1B",
    image: "/assets/products/structured-atelier-bomber.jpg",
    fabric: "Chanderi Silk Blend with Zari Detailing",
    stretchNote: "Structured empire bodice flowing into a voluminous flared ghera.",
    priceInr: 3499,
    rating: 4.9,
    reviewCount: 680,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 94, M: 100, L: 106, XL: 112 },
    waistMapCm: { S: 82, M: 88, L: 94, XL: 100 },
    description:
      "Regal flared Anarkali silhouette tailored with intricate golden zari motifs and lining.",
  },
  {
    id: "tussar-silk-straight-kurti",
    name: "Tussar Silk Straight Kurti",
    category: "Kurtis",
    garmentType: "kurti",
    fitType: "Slim",
    occasion: "Work / Casual",
    color: "Honey Ochre",
    swatchHex: "#B45309",
    image: "/assets/products/olive-linen-shirt.jpg",
    fabric: "Pure Handloom Tussar Silk",
    stretchNote: "Crisp natural slub texture with minimal stretch; tailored fit.",
    priceInr: 2799,
    rating: 4.7,
    reviewCount: 390,
    sizes: ["S", "M", "L", "XL"],
    chestMapCm: { S: 92, M: 98, L: 104, XL: 110 },
    waistMapCm: { S: 80, M: 86, L: 92, XL: 98 },
    description:
      "Sophisticated contemporary straight-cut kurti with mandarin collar and mother-of-pearl buttons.",
  },
];

export interface FitZoneScore {
  zone: string;
  deltaCm: number;
  verdict: "Good fit" | "Slightly loose" | "Snug";
}

export interface MockFitPreviewResult {
  recommendedSize: "S" | "M" | "L" | "XL";
  zones: FitZoneScore[];
  reasoning: string;
  verdictTag: "Buy" | "Consider" | "Skip";
}

export function computeMockFitPreview(
  profile: BodyProfile,
  garment: MockGarment
): MockFitPreviewResult {
  const targetEase = getFitPreferenceEaseCm(profile.fitPreference);
  const isTrouser = garment.category === "Trousers";
  const desiredPrimary = isTrouser
    ? profile.waistCm + targetEase
    : profile.chestCm + targetEase;

  let bestSize: "S" | "M" | "L" | "XL" = garment.sizes[0] ?? "M";
  let smallestDiff = Infinity;

  for (const size of garment.sizes) {
    const garmentMetric = isTrouser
      ? garment.waistMapCm[size]
      : garment.chestMapCm[size];
    const diff = Math.abs(garmentMetric - desiredPrimary);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestSize = size;
    }
  }

  const chestEase = garment.chestMapCm[bestSize] - profile.chestCm;
  const waistEase = garment.waistMapCm[bestSize] - profile.waistCm;

  const toVerdict = (ease: number): FitZoneScore["verdict"] =>
    ease < 4 ? "Snug" : ease <= 11 ? "Good fit" : "Slightly loose";

  const verdictTag: MockFitPreviewResult["verdictTag"] =
    smallestDiff <= 3 ? "Buy" : smallestDiff <= 6 ? "Consider" : "Skip";

  const zones: FitZoneScore[] = [];
  if (!isTrouser && Number.isFinite(chestEase)) {
    zones.push({ zone: "Chest", deltaCm: chestEase, verdict: toVerdict(chestEase) });
  }
  if (Number.isFinite(waistEase)) {
    zones.push({ zone: "Waist", deltaCm: waistEase, verdict: toVerdict(waistEase) });
  }

  return {
    recommendedSize: bestSize,
    zones,
    reasoning: `Size ${bestSize} targets +${targetEase} cm ${
      isTrouser ? "waist" : "chest"
    } ease for your ${profile.fitPreference} preference in ${garment.fabric}.`,
    verdictTag,
  };
}

export interface MockTailor {
  id: string;
  name: string;
  city: string;
  specialty: string;
  turnaroundDays: number;
  rating: number;
  completedCount: number;
  feeInr: number;
}

export const MOCK_TAILORS: MockTailor[] = [
  {
    id: "tailor-arjun",
    name: "Atelier Arjun & Co.",
    city: "Kolkata",
    specialty: "Bespoke Shirts & Structured Blazers",
    turnaroundDays: 6,
    rating: 4.9,
    completedCount: 142,
    feeInr: 450,
  },
  {
    id: "tailor-meera",
    name: "Meera Bespoke Studio",
    city: "Bengaluru",
    specialty: "Tailored Trousers & Linen Resort Wear",
    turnaroundDays: 7,
    rating: 4.8,
    completedCount: 98,
    feeInr: 550,
  },
  {
    id: "tailor-paradox",
    name: "FITLOOM Partner Guild",
    city: "Mumbai",
    specialty: "Technical Outerwear & Precision Alterations",
    turnaroundDays: 5,
    rating: 4.9,
    completedCount: 210,
    feeInr: 600,
  },
];

export const CORE_MODULES = [
  {
    id: "body-profile",
    title: "Body Profile",
    href: "/body-profile",
    badge: "Measurements",
    summary:
      "Create your digital measurement profile with anatomical guidance and fit preferences.",
  },
  {
    id: "fit-intelligence",
    title: "Fit Intelligence",
    href: "/fit-check",
    badge: "Size Guidance",
    summary:
      "Get explainable size, ease, and zone-by-zone garment recommendations.",
  },
  {
    id: "virtual-try-on",
    title: "Avatar & Virtual Try-On",
    href: "/try-on",
    badge: "Demo Preview",
    summary:
      "Explore garment appearance in the simulated Fitting Room preview.",
  },
  {
    id: "fashion-intelligence",
    title: "Fashion Intelligence",
    href: "/studio",
    badge: "Wardrobe",
    summary:
      "Compose outfits in Style Studio and curate Saved Looks tailored to your wardrobe.",
  },
  {
    id: "customfit",
    title: "CUSTOMFIT",
    href: "/customfit",
    badge: "Made-to-Measure",
    summary:
      "Optional made-to-measure tailoring with partner tailors when standard sizes fall short.",
  },
  {
    id: "tailor-dashboard",
    title: "Tailor Dashboard",
    href: "/tailor",
    badge: "Partner Portal",
    summary:
      "Manage incoming custom orders, inspect measurements, accept/reject, and track production.",
  },
] as const;
