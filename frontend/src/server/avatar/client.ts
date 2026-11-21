import { env } from "@/server/env";
import { ApiError } from "@/server/api/handler";
import {
  EngineHealthSchema,
  EnginePresetResponseSchema,
  EngineSizingResponseSchema,
  mapAppFitToEngine,
  AppFitPreference,
  GarmentType,
  EngineHealth,
  EnginePresetResponse,
  EngineSizingResponse,
} from "./schemas";

function getServiceAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (env.AVATAR_SERVICE_TOKEN && env.AVATAR_SERVICE_TOKEN.trim().length > 0) {
    headers["Authorization"] = `Bearer ${env.AVATAR_SERVICE_TOKEN.trim()}`;
  }
  return headers;
}

/**
 * Checks avatar engine health.
 * Never leaks the engine URL or token in responses.
 */
export async function getEngineHealth(): Promise<EngineHealth> {
  const url = `${env.AVATAR_SERVICE_URL}/health`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getServiceAuthHeaders(),
      redirect: "manual",
      signal: AbortSignal.timeout(env.AVATAR_SERVICE_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Avatar service is temporarily unavailable"
      );
    }

    const data = await res.json();
    const parsed = EngineHealthSchema.safeParse(data);
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

/**
 * Calls engine preset avatar generation endpoint.
 */
export async function createPresetAvatar(params: {
  gender: string;
  heightCm: number;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  aPoseDeg?: number;
}): Promise<EnginePresetResponse> {
  const url = `${env.AVATAR_SERVICE_URL}/avatars/preset`;
  try {
    const formData = new FormData();
    formData.append("gender", params.gender || "neutral");
    formData.append("height_cm", String(params.heightCm));
    if (params.chestCm != null && !isNaN(params.chestCm)) {
      formData.append("chest_cm", String(params.chestCm));
    }
    if (params.waistCm != null && !isNaN(params.waistCm)) {
      formData.append("waist_cm", String(params.waistCm));
    }
    if (params.hipCm != null && !isNaN(params.hipCm)) {
      formData.append("hip_cm", String(params.hipCm));
    }
    if (params.aPoseDeg != null && !isNaN(params.aPoseDeg)) {
      formData.append("a_pose_deg", String(params.aPoseDeg));
    }

    const res = await fetch(url, {
      method: "POST",
      headers: getServiceAuthHeaders(),
      body: formData,
      redirect: "manual",
      signal: AbortSignal.timeout(env.AVATAR_SERVICE_TIMEOUT_MS),
    });

    if (!res.ok) {
      if (res.status === 422) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(
          422,
          "AVATAR_GENERATION_FAILED",
          errorData.detail || "Avatar generation failed"
        );
      }
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Avatar service is temporarily unavailable"
      );
    }

    const data = await res.json();
    const parsed = EnginePresetResponseSchema.safeParse(data);
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

/**
 * Calls engine sizing recommendation endpoint.
 */
export async function getGarmentSizing(params: {
  avatarId: string;
  garmentType: GarmentType | string;
  fitPreference: AppFitPreference | string;
  customChart?: string;
  chartUnit?: string;
  chartType?: string;
}): Promise<EngineSizingResponse> {
  if (!/^[a-f0-9]{8}$/.test(params.avatarId)) {
    throw new ApiError(400, "INVALID_AVATAR_ID", "Invalid avatar ID");
  }

  const url = `${env.AVATAR_SERVICE_URL}/avatars/${encodeURIComponent(
    params.avatarId
  )}/sizing`;

  try {
    const formData = new FormData();
    formData.append("garment_type", params.garmentType.toLowerCase());
    formData.append("fit_preference", mapAppFitToEngine(params.fitPreference));
    if (params.customChart) formData.append("custom_chart", params.customChart);
    if (params.chartUnit) formData.append("chart_unit", params.chartUnit);
    if (params.chartType) formData.append("chart_type", params.chartType);

    const res = await fetch(url, {
      method: "POST",
      headers: getServiceAuthHeaders(),
      body: formData,
      redirect: "manual",
      signal: AbortSignal.timeout(env.AVATAR_SERVICE_TIMEOUT_MS),
    });

    if (res.status === 404) {
      throw new ApiError(404, "AVATAR_NOT_FOUND", "Avatar not found on engine");
    }
    if (!res.ok) {
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Avatar service is temporarily unavailable"
      );
    }

    const data = await res.json();
    const parsed = EngineSizingResponseSchema.safeParse(data);
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

/**
 * Fetches an avatar asset stream from engine.
 * Maps client file names to safe engine routes.
 */
export async function fetchAssetStream(
  avatarId: string,
  filename: string
): Promise<Response> {
  if (!/^[a-f0-9]{8}$/.test(avatarId)) {
    throw new ApiError(400, "INVALID_AVATAR_ID", "Invalid avatar ID format");
  }

  let targetPath: string;
  if (filename === "apose.glb" || filename === "avatar_apose.glb") {
    targetPath = `/avatars/${avatarId}/apose.glb`;
  } else if (filename === "tpose.glb" || filename === "avatar_tpose.glb") {
    targetPath = `/avatars/${avatarId}/tpose.glb`;
  } else if (filename === "measurements.json") {
    targetPath = `/avatars/${avatarId}/measurements.json`;
  } else if (/^garment_[a-z0-9_]+\.glb$/.test(filename)) {
    targetPath = `/avatars/${avatarId}/garment/${filename}`;
  } else {
    throw new ApiError(
      400,
      "DISALLOWED_FILE",
      "Requested asset file is not permitted"
    );
  }

  const url = `${env.AVATAR_SERVICE_URL}${targetPath}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getServiceAuthHeaders(),
      redirect: "manual",
      signal: AbortSignal.timeout(env.AVATAR_SERVICE_TIMEOUT_MS),
    });

    if (res.status === 404) {
      throw new ApiError(404, "ASSET_NOT_FOUND", "Asset not found");
    }

    if (!res.ok) {
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Avatar service is temporarily unavailable"
      );
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const contentLength = res.headers.get("content-length");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "private, max-age=3600");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(res.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Avatar service is temporarily unavailable"
    );
  }
}
