import { eq } from "drizzle-orm";
import { createApiHandler, ApiError } from "@/server/api/handler";
import { db } from "@/server/db";
import { bodyProfiles, avatars } from "@/server/db/schema";
import { createAvatarFromImages } from "@/server/avatar";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/jpg"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per photo

export const POST = createApiHandler(
  async ({ user, req }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw new ApiError(400, "BAD_REQUEST", "Failed to parse form data");
    }

    const frontEntry = formData.get("front");
    const sideEntry = formData.get("side");

    // 1. Validate front photo (required)
    if (!frontEntry || typeof frontEntry === "string") {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Front photo is required",
        { front: "Front photo is required" }
      );
    }

    const frontFile = frontEntry as File;
    if (frontFile.size === 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Front photo cannot be empty",
        { front: "Front photo cannot be empty" }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(frontFile.type.toLowerCase())) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Only JPEG and PNG images are allowed",
        { front: "Must be JPEG or PNG format" }
      );
    }

    if (frontFile.size > MAX_FILE_SIZE_BYTES) {
      throw new ApiError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Front photo must be 5MB or less",
        { front: "File size exceeds 5MB limit" }
      );
    }

    // 2. Validate side photo (optional)
    let sideFile: File | undefined = undefined;
    if (sideEntry && typeof sideEntry !== "string" && (sideEntry as File).size > 0) {
      const candidate = sideEntry as File;
      if (!ALLOWED_MIME_TYPES.has(candidate.type.toLowerCase())) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Only JPEG and PNG images are allowed",
          { side: "Must be JPEG or PNG format" }
        );
      }
      if (candidate.size > MAX_FILE_SIZE_BYTES) {
        throw new ApiError(
          413,
          "PAYLOAD_TOO_LARGE",
          "Side photo must be 5MB or less",
          { side: "File size exceeds 5MB limit" }
        );
      }
      sideFile = candidate;
    }

    // 3. Resolve user profile for sizing context if available
    const profiles = await db
      .select()
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userId, user.id))
      .limit(1);

    const profile = profiles[0];
    const heightCm = profile?.heightCm ? Number(profile.heightCm) : undefined;
    const weightKg = profile?.weightKg ? Number(profile.weightKg) : undefined;
    const genderForm = formData.get("gender");
    const gender = typeof genderForm === "string" && ["neutral", "male", "female"].includes(genderForm)
      ? genderForm
      : "neutral";

    // 4. Forward to avatar engine (photos are streamed in-memory, never stored or logged)
    const engineResult = await createAvatarFromImages({
      front: frontFile,
      side: sideFile,
      gender,
      heightCm,
      weightKg,
    });

    // 5. Save ownership in avatars table exactly like preset flow
    const [inserted] = await db
      .insert(avatars)
      .values({
        userId: user.id,
        avatarId: engineResult.avatar_id,
        metadata: {
          measurements: engineResult.measurements,
          gender,
          source: "photos",
          calibration: engineResult.calibration,
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
    rateLimit: { maxRequests: 3, windowMs: 60_000 },
    multipart: true,
    successStatus: 201,
  }
);
