import {
  BodyProfile,
  BodyProfileSchema,
  BodyType,
  BodyTypeSchema,
  FitPreference,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";

export type MeasurementUnit = "cm" | "in";

export type LengthFieldKey =
  | "heightCm"
  | "chestCm"
  | "waistCm"
  | "hipCm"
  | "shoulderCm"
  | "sleeveCm"
  | "inseamCm";

export type BodyProfileErrorKey =
  | LengthFieldKey
  | "weightKg"
  | "bodyType"
  | "fitPreference";

export interface MeasurementFieldMeta {
  key: LengthFieldKey;
  label: string;
  shortLabel: string;
  minCm: number;
  maxCm: number;
  guidance: string;
  placeholderCm: string;
  placeholderIn: string;
}

export const MEASUREMENT_FIELDS: readonly MeasurementFieldMeta[] = [
  {
    key: "heightCm",
    label: "Height",
    shortLabel: "Height",
    minCm: 130,
    maxCm: 220,
    guidance:
      "Stand barefoot straight against a flat wall and measure from the floor to the crown of your head.",
    placeholderCm: "168",
    placeholderIn: "66.1",
  },
  {
    key: "chestCm",
    label: "Chest",
    shortLabel: "Chest",
    minCm: 70,
    maxCm: 150,
    guidance:
      "Wrap the tape horizontally around the fullest part of your chest, keeping it level under your arms.",
    placeholderCm: "92",
    placeholderIn: "36.2",
  },
  {
    key: "waistCm",
    label: "Waist",
    shortLabel: "Waist",
    minCm: 55,
    maxCm: 140,
    guidance:
      "Measure around your natural waistline just above the navel without pulling the tape tight.",
    placeholderCm: "70",
    placeholderIn: "27.6",
  },
  {
    key: "hipCm",
    label: "Hip",
    shortLabel: "Hip",
    minCm: 75,
    maxCm: 155,
    guidance:
      "Stand with feet together and measure horizontally around the widest part of your hips and seat.",
    placeholderCm: "98",
    placeholderIn: "38.6",
  },
  {
    key: "shoulderCm",
    label: "Shoulder",
    shortLabel: "Shoulder",
    minCm: 34,
    maxCm: 65,
    guidance:
      "Measure across your upper back from the outer edge of one shoulder bone to the other.",
    placeholderCm: "40",
    placeholderIn: "15.7",
  },
  {
    key: "sleeveCm",
    label: "Sleeve Length",
    shortLabel: "Sleeve",
    minCm: 50,
    maxCm: 80,
    guidance:
      "With your arm slightly relaxed and bent, measure from the outer shoulder tip down to your wrist bone.",
    placeholderCm: "59",
    placeholderIn: "23.2",
  },
  {
    key: "inseamCm",
    label: "Inseam",
    shortLabel: "Inseam",
    minCm: 55,
    maxCm: 105,
    guidance:
      "Measure straight down the inside of your leg from the top crotch seam to your ankle bone.",
    placeholderCm: "78",
    placeholderIn: "30.7",
  },
] as const;

export const FIT_PREFERENCE_CARDS: ReadonlyArray<{
  id: FitPreference;
  label: string;
  easeNote: string;
  description: string;
}> = [
  {
    id: "slim",
    label: "Slim",
    easeNote: `+${getFitPreferenceEaseCm("slim")} cm ease`,
    description: "Closer taper through chest, waist & sleeve line.",
  },
  {
    id: "regular",
    label: "Regular",
    easeNote: `+${getFitPreferenceEaseCm("regular")} cm ease`,
    description: "Balanced everyday silhouette with natural movement.",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    easeNote: `+${getFitPreferenceEaseCm("relaxed")} cm ease`,
    description: "Looser drape through torso and shoulder line.",
  },
  {
    id: "oversized",
    label: "Oversized",
    easeNote: `+${getFitPreferenceEaseCm("oversized")} cm ease`,
    description: "Intentional dropped-shoulder architectural volume.",
  },
];

export const BODY_TYPE_OPTIONS: ReadonlyArray<{
  value: BodyType;
  label: string;
}> = [
  { value: "hourglass", label: "Hourglass" },
  { value: "athletic", label: "Athletic" },
  { value: "rectangle", label: "Rectangle" },
  { value: "pear", label: "Pear" },
  { value: "inverted-triangle", label: "Inverted Triangle" },
];

export function cmToInchesNumber(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function cmToInchesDisplay(cm: number): string {
  return String(cmToInchesNumber(cm));
}

export function inchesToCmNumber(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function formatLengthFromCm(
  cm: number | undefined,
  unit: MeasurementUnit
): string {
  if (typeof cm !== "number" || !Number.isFinite(cm) || cm <= 0) return "";
  return unit === "cm"
    ? String(Math.round(cm * 10) / 10)
    : cmToInchesDisplay(cm);
}

export type LengthDraftMap = Record<LengthFieldKey, string>;

export interface BodyProfileDraftState {
  unit: MeasurementUnit;
  lengths: LengthDraftMap;
  canonicalCm: LengthDraftMap;
  dirtyFields: LengthFieldKey[];
  weightKg: string;
  bodyType: BodyType | "";
  fitPreference: FitPreference;
}

export function createDraftFromProfile(
  profile: BodyProfile,
  hasSavedProfile: boolean,
  unit: MeasurementUnit = "cm"
): BodyProfileDraftState {
  const emptyMap: LengthDraftMap = {
    heightCm: "",
    chestCm: "",
    waistCm: "",
    hipCm: "",
    shoulderCm: "",
    sleeveCm: "",
    inseamCm: "",
  };

  if (!hasSavedProfile) {
    return {
      unit,
      lengths: { ...emptyMap },
      canonicalCm: { ...emptyMap },
      dirtyFields: [],
      weightKg: "",
      bodyType: "",
      fitPreference: profile?.fitPreference ?? "regular",
    };
  }

  const canonicalCm: LengthDraftMap = {
    heightCm: String(profile.heightCm),
    chestCm: String(profile.chestCm),
    waistCm: String(profile.waistCm),
    hipCm: String(profile.hipCm),
    shoulderCm: String(profile.shoulderCm),
    sleeveCm: String(profile.sleeveCm),
    inseamCm: String(profile.inseamCm),
  };

  const lengths: LengthDraftMap = {
    heightCm: formatLengthFromCm(profile.heightCm, unit),
    chestCm: formatLengthFromCm(profile.chestCm, unit),
    waistCm: formatLengthFromCm(profile.waistCm, unit),
    hipCm: formatLengthFromCm(profile.hipCm, unit),
    shoulderCm: formatLengthFromCm(profile.shoulderCm, unit),
    sleeveCm: formatLengthFromCm(profile.sleeveCm, unit),
    inseamCm: formatLengthFromCm(profile.inseamCm, unit),
  };

  return {
    unit,
    lengths,
    canonicalCm,
    dirtyFields: [],
    weightKg:
      typeof profile.weightKg === "number" && Number.isFinite(profile.weightKg)
        ? String(profile.weightKg)
        : "",
    bodyType: profile.bodyType ?? "",
    fitPreference: profile.fitPreference ?? "regular",
  };
}

/**
 * Converts draft values only when toggling between cm and inches.
 * Untouched fields restore exact canonical cm values to prevent conversion drift.
 */
export function switchDraftUnit(
  draft: BodyProfileDraftState,
  nextUnit: MeasurementUnit
): BodyProfileDraftState {
  if (draft.unit === nextUnit) return draft;

  const dirtySet = new Set<LengthFieldKey>(draft.dirtyFields);
  const nextCanonical = { ...draft.canonicalCm };
  const nextLengths: LengthDraftMap = { ...draft.lengths };

  for (const field of MEASUREMENT_FIELDS) {
    const key = field.key;
    const rawCurrent = draft.lengths[key].trim();

    if (!dirtySet.has(key)) {
      const savedNum = Number(nextCanonical[key]);
      if (nextCanonical[key].trim() !== "" && Number.isFinite(savedNum) && savedNum > 0) {
        nextLengths[key] =
          nextUnit === "cm"
            ? String(Math.round(savedNum * 10) / 10)
            : cmToInchesDisplay(savedNum);
      }
      continue;
    }

    if (rawCurrent === "") {
      nextCanonical[key] = "";
      nextLengths[key] = "";
      continue;
    }

    const parsed = Number(rawCurrent);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Preserve invalid user text verbatim without introducing NaN
      nextLengths[key] = draft.lengths[key];
      continue;
    }

    if (draft.unit === "in" && nextUnit === "cm") {
      const cmVal = inchesToCmNumber(parsed);
      nextCanonical[key] = String(cmVal);
      nextLengths[key] = String(cmVal);
    } else if (draft.unit === "cm" && nextUnit === "in") {
      const cmVal = Math.round(parsed * 10) / 10;
      nextCanonical[key] = String(cmVal);
      nextLengths[key] = cmToInchesDisplay(cmVal);
    }
  }

  return {
    ...draft,
    unit: nextUnit,
    lengths: nextLengths,
    canonicalCm: nextCanonical,
    dirtyFields: [],
  };
}

export function validateAndBuildBodyProfile(draft: BodyProfileDraftState): {
  ok: true;
  data: BodyProfile;
} | {
  ok: false;
  errors: Partial<Record<BodyProfileErrorKey, string>>;
} {
  const errors: Partial<Record<BodyProfileErrorKey, string>> = {};
  const dirtySet = new Set<LengthFieldKey>(draft.dirtyFields);
  const resolvedCm: Partial<Record<LengthFieldKey, number>> = {};

  for (const meta of MEASUREMENT_FIELDS) {
    const key = meta.key;
    const raw = draft.lengths[key].trim();

    if (raw === "") {
      errors[key] = `${meta.label} is required.`;
      continue;
    }

    const numeric = Number(raw);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      errors[key] = `Enter a valid number for ${meta.label.toLowerCase()}.`;
      continue;
    }

    let cmValue: number;
    if (!dirtySet.has(key) && draft.canonicalCm[key].trim() !== "") {
      const canonical = Number(draft.canonicalCm[key]);
      cmValue =
        Number.isFinite(canonical) && canonical > 0
          ? canonical
          : draft.unit === "in"
          ? inchesToCmNumber(numeric)
          : numeric;
    } else {
      cmValue =
        draft.unit === "in"
          ? inchesToCmNumber(numeric)
          : Math.round(numeric * 10) / 10;
    }

    if (cmValue < meta.minCm || cmValue > meta.maxCm) {
      const rangeText =
        draft.unit === "in"
          ? `${cmToInchesNumber(meta.minCm)}–${cmToInchesNumber(meta.maxCm)} in (${meta.minCm}–${meta.maxCm} cm)`
          : `${meta.minCm}–${meta.maxCm} cm`;
      errors[key] = `${meta.label} must be between ${rangeText}.`;
      continue;
    }

    resolvedCm[key] = cmValue;
  }

  // Optional Weight validation (in kg)
  let weightKg: number | undefined = undefined;
  const rawWeight = draft.weightKg.trim();
  if (rawWeight !== "") {
    const weightNum = Number(rawWeight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      errors.weightKg = "Enter a valid number in kg or leave Weight blank.";
    } else if (weightNum < 35 || weightNum > 180) {
      errors.weightKg = "Weight must be between 35 and 180 kg.";
    } else {
      weightKg = Math.round(weightNum * 10) / 10;
    }
  }

  // Optional Body Type validation
  let bodyType: BodyType | undefined = undefined;
  if (draft.bodyType !== "") {
    const parsedType = BodyTypeSchema.safeParse(draft.bodyType);
    if (!parsedType.success) {
      errors.bodyType = "Select a valid body type option.";
    } else {
      bodyType = parsedType.data;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const candidate = {
    heightCm: resolvedCm.heightCm!,
    chestCm: resolvedCm.chestCm!,
    waistCm: resolvedCm.waistCm!,
    hipCm: resolvedCm.hipCm!,
    shoulderCm: resolvedCm.shoulderCm!,
    sleeveCm: resolvedCm.sleeveCm!,
    inseamCm: resolvedCm.inseamCm!,
    weightKg,
    bodyType,
    fitPreference: draft.fitPreference,
  };

  const schemaResult = BodyProfileSchema.safeParse(candidate);
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      const pathKey = issue.path[0] as BodyProfileErrorKey | undefined;
      if (pathKey && !errors[pathKey]) {
        errors[pathKey] = issue.message;
      }
    }
    return { ok: false, errors };
  }

  return { ok: true, data: schemaResult.data };
}

/**
 * Resolves live valid cm values from current draft strings for illustrative avatar preview.
 */
export function resolveLivePreviewMetrics(
  draft: BodyProfileDraftState
): Partial<Record<LengthFieldKey, number>> {
  const dirtySet = new Set<LengthFieldKey>(draft.dirtyFields);
  const result: Partial<Record<LengthFieldKey, number>> = {};

  for (const meta of MEASUREMENT_FIELDS) {
    const key = meta.key;
    const raw = draft.lengths[key].trim();
    if (raw === "") continue;

    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) continue;

    if (!dirtySet.has(key) && draft.canonicalCm[key].trim() !== "") {
      const canonical = Number(draft.canonicalCm[key]);
      if (Number.isFinite(canonical) && canonical > 0) {
        result[key] = canonical;
        continue;
      }
    }
    result[key] = draft.unit === "in" ? inchesToCmNumber(num) : num;
  }

  return result;
}
