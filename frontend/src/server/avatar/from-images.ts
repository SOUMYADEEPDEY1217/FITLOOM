import { z } from "zod";
import { env } from "@/server/env";
import { ApiError } from "@/server/api/handler";

export const PhotoGenderSchema = z.enum(["neutral", "male", "female"]);
export type PhotoGender = z.infer<typeof PhotoGenderSchema>;

export const PhotoClothingFitSchema = z.enum(["fitted", "regular", "loose"]);
export type PhotoClothingFit = z.infer<typeof PhotoClothingFitSchema>;

export const PhotoBuildTypeSchema = z.enum(["slim", "average", "athletic", "broad"]);
export type PhotoBuildType = z.infer<typeof PhotoBuildTypeSchema>;

export const AvatarFromImagesFormSchema = z
  .object({
    gender: PhotoGenderSchema.optional().default("neutral"),
    height_cm: z
      .number({ invalid_type_error: "Height must be a valid number" })
      .finite("Height must be a finite number")
      .min(130, "Height must be between 130 and 220 cm")
      .max(220, "Height must be between 130 and 220 cm")
      .optional(),
    weight_kg: z
      .number({ invalid_type_error: "Weight must be a valid number" })
      .finite("Weight must be a finite number")
      .min(30, "Weight must be between 30 and 200 kg")
      .max(200, "Weight must be between 30 and 200 kg")
      .optional(),
    clothing_fit: PhotoClothingFitSchema.optional().default("regular"),
    build_type: PhotoBuildTypeSchema.optional().default("average"),
  })
  .strict();

export type AvatarFromImagesFormInput = z.infer<typeof AvatarFromImagesFormSchema>;

const FORM_KEY_ALIASES: Record<string, string> = {
  heightCm: "height_cm",
  weightKg: "weight_kg",
  clothingFit: "clothing_fit",
  buildType: "build_type",
};

export function extractFormFieldsFromFormData(
  formData: FormData
): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  for (const [entryKey, entryVal] of formData.entries()) {
    if (entryKey === "front" || entryKey === "side") continue;
    const key = FORM_KEY_ALIASES[entryKey] ?? entryKey;
    if (typeof entryVal !== "string") {
      raw[key] = entryVal;
      continue;
    }
    const trimmed = entryVal.trim();
    if (trimmed === "") continue;
    if (key === "height_cm" || key === "weight_kg") {
      raw[key] = Number(trimmed);
    } else {
      raw[key] = trimmed;
    }
  }
  return raw;
}

export const EngineFromImagesResponseSchema = z.object({
  avatar_id: z.string(),
  measurements: z.record(z.unknown()),
  calibration: z.record(z.unknown()).optional(),
  assets: z.object({
    apose_glb: z.string(),
    tpose_glb: z.string(),
    measurements_json: z.string(),
  }),
});

export type EngineFromImagesResponse = z.infer<typeof EngineFromImagesResponseSchema>;

export interface CreateAvatarFromImagesParams {
  front: Blob | File;
  side?: Blob | File | null;
  gender?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  clothingFit?: string;
  buildType?: string;
  aPoseDeg?: number;
}

function getServiceAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (env.AVATAR_SERVICE_TOKEN && env.AVATAR_SERVICE_TOKEN.trim().length > 0) {
    headers["Authorization"] = `Bearer ${env.AVATAR_SERVICE_TOKEN.trim()}`;
  }
  return headers;
}

/**
 * Calls avatar engine /avatars/from-images endpoint.
 * Photos are streamed/forwarded in-memory, never stored or logged.
 */
export async function createAvatarFromImages(
  params: CreateAvatarFromImagesParams
): Promise<EngineFromImagesResponse> {
  const url = `${env.AVATAR_SERVICE_URL}/avatars/from-images`;
  try {
    const formData = new FormData();
    const frontName = params.front instanceof File ? params.front.name : "front.jpg";
    formData.append("front", params.front, frontName);

    if (params.side) {
      const sideName = params.side instanceof File ? params.side.name : "side.jpg";
      formData.append("side", params.side, sideName);
    }

    formData.append("gender", params.gender || "neutral");
    if (params.heightCm != null && !isNaN(params.heightCm)) {
      formData.append("height_cm", String(params.heightCm));
    }
    if (params.weightKg != null && !isNaN(params.weightKg)) {
      formData.append("weight_kg", String(params.weightKg));
    }
    formData.append("clothing_fit", params.clothingFit || "regular");
    formData.append("build_type", params.buildType || "average");
    if (params.aPoseDeg != null && !isNaN(params.aPoseDeg)) {
      formData.append("a_pose_deg", String(params.aPoseDeg));
    }

    // Long timeout since neural inference is compute-intensive
    const timeoutMs = Math.max(Number(env.AVATAR_SERVICE_TIMEOUT_MS) || 60000, 120000);

    const res = await fetch(url, {
      method: "POST",
      headers: getServiceAuthHeaders(),
      body: formData,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      if (res.status === 422) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(
          422,
          "AVATAR_GENERATION_FAILED",
          errorData.detail || "Could not read a body in this photo, try again"
        );
      }
      if (res.status === 400) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(
          400,
          "BAD_REQUEST",
          errorData.detail || "Invalid image parameters"
        );
      }
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Avatar service is temporarily unavailable"
      );
    }

    const data = await res.json();
    const parsed = EngineFromImagesResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Invalid response from avatar service"
      );
    }
    return parsed.data;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Avatar service is temporarily unavailable"
    );
  }
}
