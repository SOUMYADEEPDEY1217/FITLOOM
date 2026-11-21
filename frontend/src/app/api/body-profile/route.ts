import { eq, desc } from "drizzle-orm";
import { createApiHandler } from "@/server/api/handler";
import { db } from "@/server/db";
import { bodyProfiles, measurementHistory } from "@/server/db/schema";
import { BodyProfile } from "@/lib/mock-data";
import { StrictBodyProfileSchema } from "@/server/api/schemas";

function round01(val: number | undefined): number | undefined {
  if (val === undefined || val === null) return undefined;
  return Math.round(val * 10) / 10;
}

async function getMeasurementHistory(userId: string) {
  const rows = await db
    .select({
      id: measurementHistory.id,
      chestCm: measurementHistory.chestCm,
      waistCm: measurementHistory.waistCm,
      note: measurementHistory.note,
      recordedAt: measurementHistory.recordedAt,
      fullSnapshot: measurementHistory.fullSnapshot,
    })
    .from(measurementHistory)
    .where(eq(measurementHistory.userId, userId))
    .orderBy(desc(measurementHistory.recordedAt))
    .limit(5);

  return rows.map((r) => ({
    id: r.id,
    chestCm: Number(r.chestCm),
    waistCm: Number(r.waistCm),
    note: r.note,
    recordedAt: r.recordedAt,
    fullSnapshot: r.fullSnapshot,
  }));
}

export const GET = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;

    const profileList = await db
      .select()
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userId, userId))
      .limit(1);

    const history = await getMeasurementHistory(userId);

    if (profileList.length === 0) {
      return {
        profile: null,
        history,
      };
    }

    const p = profileList[0];
    const profile = {
      userId: p.userId,
      heightCm: Number(p.heightCm),
      weightKg: p.weightKg ? Number(p.weightKg) : undefined,
      bodyType: p.bodyType,
      chestCm: Number(p.chestCm),
      waistCm: Number(p.waistCm),
      hipCm: p.hipCm ? Number(p.hipCm) : undefined,
      shoulderCm: p.shoulderCm ? Number(p.shoulderCm) : undefined,
      sleeveCm: p.sleeveCm ? Number(p.sleeveCm) : undefined,
      inseamCm: p.inseamCm ? Number(p.inseamCm) : undefined,
      fitPreference: p.fitPreference,
      updatedAt: p.updatedAt,
    };

    return {
      profile,
      history,
    };
  },
  {
    authRequired: true,
  }
);

export const PUT = createApiHandler(
  async (ctx) => {
    const userId = ctx.user!.id;
    const body = ctx.body as BodyProfile;

    // Round values to 0.1 cm precision
    const roundedHeight = round01(body.heightCm)!;
    const roundedWeight = round01(body.weightKg);
    const roundedChest = round01(body.chestCm)!;
    const roundedWaist = round01(body.waistCm)!;
    const roundedHip = round01(body.hipCm);
    const roundedShoulder = round01(body.shoulderCm);
    const roundedSleeve = round01(body.sleeveCm);
    const roundedInseam = round01(body.inseamCm);

    // Fetch existing profile to detect chest or waist changes
    const existingList = await db
      .select({
        chestCm: bodyProfiles.chestCm,
        waistCm: bodyProfiles.waistCm,
      })
      .from(bodyProfiles)
      .where(eq(bodyProfiles.userId, userId))
      .limit(1);

    const existing = existingList[0];
    const chestChanged =
      !existing || Number(existing.chestCm) !== roundedChest;
    const waistChanged =
      !existing || Number(existing.waistCm) !== roundedWaist;

    // Log to measurement_history ONLY if chest or waist changed
    if (chestChanged || waistChanged) {
      await db.insert(measurementHistory).values({
        userId,
        chestCm: roundedChest.toFixed(1),
        waistCm: roundedWaist.toFixed(1),
        note: existing ? "Measurement update" : "Initial body profile",
        fullSnapshot: {
          heightCm: roundedHeight,
          weightKg: roundedWeight,
          bodyType: body.bodyType,
          chestCm: roundedChest,
          waistCm: roundedWaist,
          hipCm: roundedHip,
          shoulderCm: roundedShoulder,
          sleeveCm: roundedSleeve,
          inseamCm: roundedInseam,
          fitPreference: body.fitPreference,
        },
      });
    }

    // Upsert into body_profiles
    const [savedProfile] = await db
      .insert(bodyProfiles)
      .values({
        userId,
        heightCm: roundedHeight.toFixed(1),
        weightKg: roundedWeight ? roundedWeight.toFixed(1) : null,
        bodyType: body.bodyType || null,
        chestCm: roundedChest.toFixed(1),
        waistCm: roundedWaist.toFixed(1),
        hipCm: roundedHip ? roundedHip.toFixed(1) : null,
        shoulderCm: roundedShoulder ? roundedShoulder.toFixed(1) : null,
        sleeveCm: roundedSleeve ? roundedSleeve.toFixed(1) : null,
        inseamCm: roundedInseam ? roundedInseam.toFixed(1) : null,
        fitPreference: body.fitPreference,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: bodyProfiles.userId,
        set: {
          heightCm: roundedHeight.toFixed(1),
          weightKg: roundedWeight ? roundedWeight.toFixed(1) : null,
          bodyType: body.bodyType || null,
          chestCm: roundedChest.toFixed(1),
          waistCm: roundedWaist.toFixed(1),
          hipCm: roundedHip ? roundedHip.toFixed(1) : null,
          shoulderCm: roundedShoulder ? roundedShoulder.toFixed(1) : null,
          sleeveCm: roundedSleeve ? roundedSleeve.toFixed(1) : null,
          inseamCm: roundedInseam ? roundedInseam.toFixed(1) : null,
          fitPreference: body.fitPreference,
          updatedAt: new Date(),
        },
      })
      .returning();

    const history = await getMeasurementHistory(userId);

    const profile = {
      userId: savedProfile.userId,
      heightCm: Number(savedProfile.heightCm),
      weightKg: savedProfile.weightKg ? Number(savedProfile.weightKg) : undefined,
      bodyType: savedProfile.bodyType,
      chestCm: Number(savedProfile.chestCm),
      waistCm: Number(savedProfile.waistCm),
      hipCm: savedProfile.hipCm ? Number(savedProfile.hipCm) : undefined,
      shoulderCm: savedProfile.shoulderCm ? Number(savedProfile.shoulderCm) : undefined,
      sleeveCm: savedProfile.sleeveCm ? Number(savedProfile.sleeveCm) : undefined,
      inseamCm: savedProfile.inseamCm ? Number(savedProfile.inseamCm) : undefined,
      fitPreference: savedProfile.fitPreference,
      updatedAt: savedProfile.updatedAt,
    };

    return {
      profile,
      history,
    };
  },
  {
    authRequired: true,
    schema: StrictBodyProfileSchema,
  }
);
