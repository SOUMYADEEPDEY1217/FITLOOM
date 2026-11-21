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
