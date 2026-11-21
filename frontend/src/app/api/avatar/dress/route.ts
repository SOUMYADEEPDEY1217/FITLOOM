import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { bodyProfiles, avatars } from "@/server/db/schema";
import {
  dressAvatar,
  AvatarDressInputSchema,
  resolveGarmentAssetFile,
  type AppFitPreference,
} from "@/server/avatar";

export const dynamic = "force-dynamic";

export const POST = createApiHandler(
  async ({ user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    // 1. Ownership check: avatar must exist and belong to the session user
    const owned = await db
      .select({ id: avatars.id, userId: avatars.userId })
      .from(avatars)
      .where(eq(avatars.avatarId, body.avatarId))
      .limit(1);

    if (owned.length === 0 || owned[0].userId !== user.id) {
      // Return 404 (never 403) to prevent enumeration of other users' avatars
      throw new ApiError(404, "AVATAR_NOT_FOUND", "Avatar not found");
    }

    // 2. Resolve fitPreference: default to user's saved body profile preference, or "regular"
    let fitPreference: AppFitPreference;
    if (body.fitPreference) {
      fitPreference = body.fitPreference;
    } else {
      const profile = await db
        .select({ fitPreference: bodyProfiles.fitPreference })
        .from(bodyProfiles)
        .where(eq(bodyProfiles.userId, user.id))
        .limit(1);

      if (profile[0]?.fitPreference) {
        fitPreference = profile[0].fitPreference as AppFitPreference;
      } else {
        fitPreference = "regular";
      }
    }

    // 3. Call engine dress endpoint via client method (maps oversized -> extended)
    const engineRes = await dressAvatar({
      avatarId: body.avatarId,
      garmentType: body.garmentType,
      size: body.size,
      fitPreference,
      colorHex: body.colorHex,
      viewMode: body.viewMode,
    });

    // 4. Resolve asset file and form customer URL
    const file = resolveGarmentAssetFile(engineRes.glb_url, body.garmentType);
    const assetUrl = `/api/avatar/assets/${body.avatarId}/${file}`;

    return {
      mode: "live_avatar_engine",
      garment: {
        type: body.garmentType,
        size: body.size,
        fitPreference,
        ...(body.colorHex ? { colorHex: body.colorHex } : {}),
        ...(body.viewMode ? { viewMode: body.viewMode } : {}),
        url: assetUrl,
      },
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
    rateLimit: { maxRequests: 10, windowMs: 60_000 },
    schema: AvatarDressInputSchema,
  }
);
