import { ApiError, ApiResponse } from "./types";

export interface CreateAvatarFromImagesOptions {
  front: File | Blob;
  side?: File | Blob | null;
  gender?: "neutral" | "male" | "female" | string;
}

export interface AvatarFromImagesResponse {
  avatarId: string;
  measurements: Record<string, number | string>;
  assets: {
    apose: string;
    tpose: string;
    measurements: string;
  };
  createdAt: string;
}

/**
 * Uploads front and optional side photos to generate a 3D avatar via the avatar engine.
 * Photos are streamed directly to the engine and never stored locally.
 */
export async function createAvatarFromImages(
  options: CreateAvatarFromImagesOptions
): Promise<AvatarFromImagesResponse> {
  const formData = new FormData();
  formData.append("front", options.front);
  if (options.side) {
    formData.append("side", options.side);
  }
  if (options.gender) {
    formData.append("gender", options.gender);
  }

  const response = await fetch("/api/avatar/from-images", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  let json: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  // Handle standard FITLOOM uniform response envelope: { ok: true, data } | { ok: false, error }
  if (json && typeof json === "object" && "ok" in json) {
    const envelope = json as ApiResponse<AvatarFromImagesResponse>;
    if (envelope.ok) {
      return envelope.data;
    } else {
      throw new ApiError(
        response.status,
        envelope.error?.code || "REQUEST_FAILED",
        envelope.error?.message || response.statusText || "Request failed",
        envelope.error?.fieldErrors
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      "REQUEST_FAILED",
      response.statusText || "Request failed"
    );
  }

  return json as AvatarFromImagesResponse;
}
