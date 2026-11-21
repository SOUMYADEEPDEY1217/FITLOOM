import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { bodyProfiles, avatars } from "@/server/db/schema";
import { createPresetAvatar, AvatarPresetInputSchema } from "@/server/avatar";

export const POST = createApiHandler(
  async ({ user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    // 1. Fetch user's saved body profile
    const profiles = await db
      .select()
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userId, user.id))
      .limit(1);

    if (profiles.length === 0) {
      throw new ApiError(
        422,
        "MISSING_BODY_PROFILE",
        "Body profile required to generate preset avatar"
      );
    }

    const p = profiles[0];
    const heightCm = Number(p.heightCm);
    const chestCm = Number(p.chestCm);
    const waistCm = Number(p.waistCm);
    const hipCm = p.hipCm ? Number(p.hipCm) : undefined;

    // 2. Call engine preset
    const gender = body?.gender || "neutral";
    const engineResult = await createPresetAvatar({
      gender,
      heightCm,
      chestCm,
      waistCm,
      hipCm,
    });

    // 3. Save ownership in avatars table
    const [inserted] = await db
      .insert(avatars)
      .values({
        userId: user.id,
        avatarId: engineResult.avatar_id,
        metadata: {
          measurements: engineResult.measurements,
          gender,
          source: "preset",
          createdAt: new Date().toISOString(),
        },
      })
      .returning();

    return {
      avatarId: engineResult.avatar_id,
      measurements: engineResult.measurements,
      assets: {
        apose: `/api/avatar/assets/${engineResult.avatar_id}/apose.glb`,
        tpose: `/api/avatar/assets/${engineResult.avatar_id}/tpose.glb`,
        measurements: `/api/avatar/assets/${engineResult.avatar_id}/measurements.json`,
      },
      createdAt: inserted.createdAt,
    };
  },
  {
    authRequired: true,
    requiredRole: "customer",
    schema: AvatarPresetInputSchema,
    successStatus: 201,
  }
);
