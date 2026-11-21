import { z } from "zod";
import { env } from "@/server/env";
import { ApiError } from "@/server/api/handler";

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
