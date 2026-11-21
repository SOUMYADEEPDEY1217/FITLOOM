import { z } from "zod";

export const GarmentTypeSchema = z.enum(["tshirt", "shirt", "trousers", "kurti"]);
export type GarmentType = z.infer<typeof GarmentTypeSchema>;

export const AppFitPreferenceSchema = z.enum(["slim", "regular", "relaxed", "oversized"]);
export type AppFitPreference = z.infer<typeof AppFitPreferenceSchema>;

export const EngineFitPreferenceSchema = z.enum(["slim", "regular", "relaxed", "extended"]);
export type EngineFitPreference = z.infer<typeof EngineFitPreferenceSchema>;

/**
 * Maps app-level fit preference to avatar engine ease preset:
 * "oversized" -> "extended"
 * "slim", "regular", "relaxed" -> pass-through
 */
export function mapAppFitToEngine(fit: AppFitPreference | string): EngineFitPreference {
  const normalized = (fit || "regular").toLowerCase();
  if (normalized === "oversized") return "extended";
  if (normalized === "slim" || normalized === "relaxed" || normalized === "extended") {
    return normalized as EngineFitPreference;
  }
  return "regular";
}

export const AvatarGenderSchema = z.enum(["female", "male", "neutral"]);
export type AvatarGender = z.infer<typeof AvatarGenderSchema>;

export const AvatarPresetInputSchema = z
  .object({
    gender: AvatarGenderSchema.optional().default("neutral"),
  })
  .optional()
  .default({ gender: "neutral" });

export type AvatarPresetInput = z.infer<typeof AvatarPresetInputSchema>;

export const AvatarSizingInputSchema = z.object({
  avatarId: z
    .string()
    .regex(/^[a-f0-9]{8}$/, "Invalid avatarId format")
    .optional(),
  garmentType: GarmentTypeSchema.default("tshirt"),
  fitPreference: AppFitPreferenceSchema.optional(),
  customChart: z.string().optional().default(""),
  chartUnit: z.enum(["in", "cm"]).optional().default("in"),
  chartType: z.enum(["garment", "body"]).optional().default("garment"),
});

export type AvatarSizingInput = z.infer<typeof AvatarSizingInputSchema>;

export const EngineHealthSchema = z.object({
  status: z.string(),
  model_ready: z.boolean(),
  cuda_available: z.boolean(),
});

export type EngineHealth = z.infer<typeof EngineHealthSchema>;

export const EnginePresetResponseSchema = z.object({
  avatar_id: z.string().regex(/^[a-f0-9]{8}$/),
  measurements: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  apose_url: z.string(),
  tpose_url: z.string(),
});

export type EnginePresetResponse = z.infer<typeof EnginePresetResponseSchema>;

export const ZoneFitSchema = z.object({
  ease_cm: z.number(),
  ease_in: z.number(),
  label: z.string(),
  tension: z.number(),
  penalty: z.number(),
  garment_cm: z.number().optional(),
  body_cm: z.number().optional(),
});

export const GarmentSizeItemSchema = z.object({
  size: z.string(),
  fit_score: z.number(),
  overall: z.string(),
  garment_spec_cm: z.record(z.string(), z.number()).optional(),
  zones: z.record(z.string(), ZoneFitSchema),
  notes: z.array(z.string()),
});

export const EngineSizingResponseSchema = z.object({
  garment_type: z.string(),
  gender: z.string(),
  fit_preference: z.string(),
  recommended_size: z.string(),
  recommended_score: z.number(),
  sizes: z.array(GarmentSizeItemSchema),
});

export type EngineSizingResponse = z.infer<typeof EngineSizingResponseSchema>;
