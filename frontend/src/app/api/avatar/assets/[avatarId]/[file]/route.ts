import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { avatars } from "@/server/db/schema";
import { fetchAssetStream } from "@/server/avatar";

export const GET = createApiHandler(
  async ({ user, params, req }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    let avatarId = Array.isArray(params?.avatarId)
      ? params.avatarId[0]
      : params?.avatarId;
    let file = Array.isArray(params?.file)
      ? params.file[0]
      : params?.file;

    // Resilient fallback from pathname if route params were not bound
    if (!avatarId || !file) {
      const match = req.nextUrl.pathname.match(
        /\/api\/avatar\/assets\/([^/]+)\/([^/]+)/
      );
      if (match) {
        avatarId = avatarId || match[1];
        file = file || match[2];
      }
    }

    if (!avatarId || !/^[a-f0-9]{8}$/.test(avatarId)) {
      throw new ApiError(400, "INVALID_AVATAR_ID", "Invalid avatar ID format");
    }

    if (!file) {
      throw new ApiError(400, "DISALLOWED_FILE", "Filename is required");
    }

    // Validate filename allow-list upfront
    const isAllowed =
      file === "apose.glb" ||
      file === "avatar_apose.glb" ||
      file === "tpose.glb" ||
      file === "avatar_tpose.glb" ||
      file === "measurements.json" ||
      /^garment_[a-z0-9_]+\.glb$/.test(file);

    if (!isAllowed) {
      throw new ApiError(
        400,
        "DISALLOWED_FILE",
        "Requested asset file is not permitted"
      );
    }

    // Ownership check: must exist in avatars table AND belong to current user
    const records = await db
      .select({ id: avatars.id, userId: avatars.userId })
      .from(avatars)
      .where(eq(avatars.avatarId, avatarId))
      .limit(1);

    // CRITICAL SECURITY RULE: Return 404 (never 403) to prevent enumeration of other users' avatars
    if (records.length === 0 || records[0].userId !== user.id) {
      throw new ApiError(404, "AVATAR_NOT_FOUND", "Avatar not found");
    }

    return await fetchAssetStream(avatarId, file);
  },
  {
    authRequired: true,
    requiredRole: "customer",
  }
);
