export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload };

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// ==========================================
// Auth API Types
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  accountStatus?: string;
  createdAt?: string;
}

export interface UserPartner {
  type: string;
  verificationStatus: string;
  operationalStatus: string;
}

export interface UserMeResponse {
  user: User;
  capabilities: string[];
  partners: UserPartner[];
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

// ==========================================
// Body Profile API Types
// ==========================================

export type BodyTypeOption =
  | "hourglass"
  | "athletic"
  | "rectangle"
  | "pear"
  | "inverted-triangle";

export type FitPreferenceOption = "slim" | "regular" | "relaxed" | "oversized";

export interface BodyProfilePayload {
  heightCm: number;
  weightKg?: number;
  bodyType?: BodyTypeOption;
  chestCm: number;
  waistCm: number;
  hipCm?: number;
  shoulderCm?: number;
  sleeveCm?: number;
  inseamCm?: number;
  fitPreference: FitPreferenceOption;
}

export interface BodyProfileData extends BodyProfilePayload {
  userId?: string;
  updatedAt?: string;
}

export interface MeasurementHistoryItem {
  id: string;
  chestCm: number;
  waistCm: number;
  note?: string | null;
  recordedAt: string;
  fullSnapshot?: unknown;
}

export interface BodyProfileResponse {
  profile: BodyProfileData | null;
  history: MeasurementHistoryItem[];
}

// ==========================================
// Avatar API Types
// ==========================================

export interface AvatarStatusResponse {
  status: "ok";
  modelReady: boolean;
  cudaAvailable: boolean;
}

export interface AvatarPresetInput {
  gender?: "female" | "male" | "neutral";
}

export interface AvatarPresetResponse {
  avatarId: string;
  measurements: Record<string, number>;
  assets: {
    apose: string;
    tpose: string;
    measurements: string;
  };
  createdAt: string;
}

// ==========================================
// Catalogue & Products API Types
// ==========================================

export interface ProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  garmentType?: "tshirt" | "shirt" | "trousers" | "kurti";
  search?: string;
}

export interface ProductItem {
  id: string;
  sellerPartnerId: string | null;
  name: string;
  description: string | null;
  category: string;
  garmentType: string | null;
  fitType: string;
  occasion: string;
  color: string;
  swatchHex: string;
  imageUrl: string | null;
  fabric: string;
  stretchNote: string;
  priceInr: number;
  inventoryQty: number;
  customFitEligible: boolean;
  ratingAvg: number;
  reviewCount: number;
  status: string;
  updatedAt: string;
  sizes: string[];
}

export interface ProductsResponse {
  products: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductMeasurement {
  id: string;
  size: string;
  chestCm: number | null;
  waistCm: number | null;
  extraDimsCm: Record<string, number> | null;
}

export interface ProductDetailItem extends ProductItem {
  chestMapCm: Record<string, number>;
  waistMapCm: Record<string, number>;
  measurements: ProductMeasurement[];
}

export interface ProductResponse {
  product: ProductDetailItem;
}

// ==========================================
// Avatar Dress API Types
// ==========================================

export interface AvatarDressInput {
  avatarId: string;
  garmentType: "tshirt" | "shirt" | "trousers" | "kurti";
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  fitPreference?: "slim" | "regular" | "relaxed" | "oversized";
}

export interface AvatarDressGarment {
  type: string;
  size: string;
  fitPreference?: string;
  url: string;
}

export interface AvatarDressResponse {
  mode: "live_ai" | "fallback_demo";
  garment: AvatarDressGarment;
}

// ==========================================
// Fit-Check API Types
// ==========================================

export interface FitCheckInput {
  productId: string;
  size?: string;
  fitPreference?: "slim" | "regular" | "relaxed" | "oversized";
}

export interface FitCheckSizeBreakdown {
  size: string;
  primaryGarmentCm: number;
  primaryEaseCm: number;
  secondaryGarmentCm: number | null;
  secondaryEaseCm: number | null;
  distanceFromTargetCm: number;
  isRecommended: boolean;
  statusNote: string;
}

export interface FitCheckAlternativeSize {
  size: string;
  relationship: string;
  primaryEaseCm: number;
  secondaryEaseCm: number | null;
  note: string;
}

export interface FitCheckComparison {
  fieldKey: string;
  label: string;
  compatibility: string;
  bodyValueCm: number | null;
  garmentValueCm: number | null;
  easeCm: number | null;
  targetEaseCm: number | null;
  verdictLabel: string;
  badgeVariant: string;
  explanation: string;
}

export interface FitCheckResponse {
  productId: string;
  productName: string;
  category: string;
  garmentType: string | null;
  fitPreference: string;
  targetEaseCm: number;
  recommendedSize: string | null;
  selectedSize: string | null;
  selectedSizeVerdict: FitCheckSizeBreakdown | null;
  status: string;
  sizeBreakdown: FitCheckSizeBreakdown[];
  alternativeSizes: FitCheckAlternativeSize[];
  comparisons: FitCheckComparison[];
  summaryHeadline: string;
  reasoning: string[];
  evidenceSummary: string;
  escalateToCustomFit: boolean;
  escalationReason: string | null;
}

