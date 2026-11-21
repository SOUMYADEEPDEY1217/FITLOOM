import { eq, desc } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { bodyProfiles, avatars } from "@/server/db/schema";
import { getGarmentSizing, AvatarSizingInputSchema } from "@/server/avatar";

export const POST = createApiHandler(
  async ({ user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    // 1. Determine target avatarId
    let targetAvatarId: string;
    if (!body.avatarId) {
      const latestAvatar = await db
        .select({ avatarId: avatars.avatarId })
        .from(avatars)
        .where(eq(avatars.userId, user.id))
        .orderBy(desc(avatars.createdAt))
        .limit(1);

      if (latestAvatar.length === 0) {
        throw new ApiError(404, "AVATAR_NOT_FOUND", "No avatar found for user");
      }
      targetAvatarId = latestAvatar[0].avatarId;
    } else {
      targetAvatarId = body.avatarId;
      // Verify ownership
      const owned = await db
        .select({ id: avatars.id, userId: avatars.userId })
        .from(avatars)
        .where(eq(avatars.avatarId, targetAvatarId))
        .limit(1);

      if (owned.length === 0 || owned[0].userId !== user.id) {
        // Return 404 (never 403) to prevent enumeration of other users' avatars
        throw new ApiError(404, "AVATAR_NOT_FOUND", "Avatar not found");
      }
    }

    // 2. Resolve fit preference if not provided
    let fitPref: string = body.fitPreference || "regular";
    if (!body.fitPreference) {
      const profile = await db
        .select({ fitPreference: bodyProfiles.fitPreference })
        .from(bodyProfiles)
        .where(eq(bodyProfiles.userId, user.id))
        .limit(1);
      if (profile[0]?.fitPreference) {
        fitPref = profile[0].fitPreference;
      }
    }

    // 3. Call engine sizing
    const sizing = await getGarmentSizing({
      avatarId: targetAvatarId,
      garmentType: body.garmentType || "tshirt",
      fitPreference: fitPref,
      customChart: body.customChart,
      chartUnit: body.chartUnit,
      chartType: body.chartType,
    });

    return sizing;
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: AvatarSizingInputSchema,
  }
);
