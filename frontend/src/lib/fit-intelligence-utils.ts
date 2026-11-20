import {
  BodyProfile,
  FitPreference,
  MockGarment,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import {
  LengthFieldKey,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  cmToInchesNumber,
} from "@/lib/body-profile-utils";
import { GarmentSize } from "@/lib/shop-utils";
import { BadgeVariant } from "@/components/ui/badge";

export type FitEvaluationStatus =
  | "invalid_product"
  | "missing_body_profile"
  | "missing_garment_measurements"
  | "incomplete_body_measurements"
  | "no_supported_recommendation"
  | "ready";

export type DimensionCompatibility =
  | "primary_anchor"
  | "secondary_compatible"
  | "unavailable_garment_spec"
  | "missing_body_measurement"
  | "not_applicable";

export interface DimensionComparisonRow {
  fieldKey: LengthFieldKey;
  label: string;
  compatibility: DimensionCompatibility;
  bodyValueCm: number | null;
  garmentValueCm: number | null;
  easeCm: number | null;
  targetEaseCm: number | null;
  verdictLabel: string;
  badgeVariant: BadgeVariant;
  explanation: string;
}

export interface AlternativeSizeInfo {
  size: GarmentSize;
  relationship: "Size Down" | "Size Up" | "Alternative";
  primaryEaseCm: number;
  secondaryEaseCm: number | null;
  note: string;
}

export interface SizeBreakdownRow {
  size: GarmentSize;
  primaryGarmentCm: number | null;
  primaryEaseCm: number | null;
  secondaryGarmentCm: number | null;
  secondaryEaseCm: number | null;
  distanceFromTargetCm: number | null;
  isRecommended: boolean;
  statusNote: string;
}

export interface FitEvaluationResult {
  status: FitEvaluationStatus;
  garmentCategory: MockGarment["category"] | null;
  isTrouser: boolean;
  fitPreference: FitPreference;
  targetEaseCm: number;
  primaryAnchor: "chest" | "waist";
  recommendedSize: GarmentSize | null;
  alternativeSizes: AlternativeSizeInfo[];
  sizeBreakdown: SizeBreakdownRow[];
  comparisons: DimensionComparisonRow[];
  unavailableDimensions: string[];
  notApplicableDimensions: string[];
  summaryHeadline: string;
  reasoning: string[];
  evidenceSummary: string;
  escalateToCustomFit: boolean;
  escalationReason: string | null;
}

const UPPER_BODY_CATEGORIES: ReadonlySet<MockGarment["category"]> = new Set([
  "Shirts",
  "Outerwear",
  "T-Shirts",
  "Hoodies",
]);

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isValidMeasure(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Formats a measurement value or ease delta in cm or inches for explanatory copy.
 */
export function formatMeasureValue(
  cm: number | null | undefined,
  unit: MeasurementUnit,
  signed = false
): string {
  if (!isValidMeasure(cm) && !(signed && typeof cm === "number" && Number.isFinite(cm))) {
    return "Unavailable";
  }
  const raw = cm as number;
  const converted = unit === "in" ? round1(raw / 2.54) : round1(raw);
  if (signed) {
    const sign = converted > 0 ? "+" : "";
    return `${sign}${converted} ${unit}`;
  }
  return `${converted} ${unit}`;
}

export function formatCmDelta(
  deltaCm: number,
  unit: MeasurementUnit
): string {
  const converted =
    unit === "in"
      ? round1(deltaCm / 2.54)
      : round1(deltaCm);
  const sign = converted > 0 ? "+" : "";
  return `${sign}${converted} ${unit}`;
}

export function formatEaseThresholdCm(
  easeCm: number,
  unit: MeasurementUnit
): string {
  return unit === "in"
    ? `+${cmToInchesNumber(easeCm)} in (+${easeCm} cm)`
    : `+${easeCm} cm`;
}

function classifyEaseVerdict(
  easeCm: number,
  targetEaseCm: number
): { label: string; variant: BadgeVariant; note: string } {
  if (easeCm < 0) {
    return {
      label: "Tighter than body",
      variant: "destructive",
      note: "Garment dimension is smaller than your body measurement.",
    };
  }
  if (easeCm < 2) {
    return {
      label: "Very snug",
      variant: "warning",
      note: "Minimal breathing room (under 2 cm ease).",
    };
  }
  const deltaFromTarget = round1(easeCm - targetEaseCm);
  if (Math.abs(deltaFromTarget) <= 3) {
    return {
      label: "Matches preference",
      variant: "success",
      note: "Close to your selected fit ease target.",
    };
  }
  if (deltaFromTarget < -3) {
    return {
      label: "Closer than target",
      variant: "amber",
      note: "Positive clearance, though slimmer than your target ease.",
    };
  }
  if (deltaFromTarget <= 7) {
    return {
      label: "Roomier drape",
      variant: "info",
      note: "Provides noticeably extra ease beyond your target.",
    };
  }
  return {
    label: "Noticeably loose",
    variant: "warning",
    note: "Substantially looser than your selected fit ease target.",
  };
}

function buildEmptyComparisons(
  bodyProfile: BodyProfile | null | undefined,
  hasBodyProfile: boolean,
  garment: MockGarment | null | undefined
): DimensionComparisonRow[] {
  const isTrouser = garment?.category === "Trousers";
  return MEASUREMENT_FIELDS.map((meta) => {
    const bodyVal =
      hasBodyProfile && bodyProfile && isValidMeasure(bodyProfile[meta.key])
        ? bodyProfile[meta.key]
        : null;

    if (isTrouser && (meta.key === "chestCm" || meta.key === "shoulderCm" || meta.key === "sleeveCm")) {
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "not_applicable",
        bodyValueCm: bodyVal,
        garmentValueCm: null,
        easeCm: null,
        targetEaseCm: null,
        verdictLabel: "Not applicable",
        badgeVariant: "outline",
        explanation: "Upper-body dimension excluded from Trousers sizing.",
      };
    }
    if (!isTrouser && meta.key === "inseamCm") {
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "not_applicable",
        bodyValueCm: bodyVal,
        garmentValueCm: null,
        easeCm: null,
        targetEaseCm: null,
        verdictLabel: "Not applicable",
        badgeVariant: "outline",
        explanation: "Lower-body trouser dimension not applicable to tops/outerwear.",
      };
    }

    return {
      fieldKey: meta.key,
      label: meta.label,
      compatibility: bodyVal === null ? "missing_body_measurement" : "unavailable_garment_spec",
      bodyValueCm: bodyVal,
      garmentValueCm: null,
      easeCm: null,
      targetEaseCm: null,
      verdictLabel: bodyVal === null ? "Body measurement missing" : "Unavailable",
      badgeVariant: "neutral",
      explanation:
        bodyVal === null
          ? "Add this measurement in your Body Profile."
          : "No comparison could be computed without a selected size.",
    };
  });
}

/**
 * Deterministic, explainable fit evaluation comparing BodyProfile against
 * semantically compatible garment measurements in MOCK_GARMENTS.
 * Never fabricates missing specs or confidence percentages.
 */
export function evaluateGarmentFit(params: {
  garment: MockGarment | null | undefined;
  bodyProfile: BodyProfile | null | undefined;
  hasBodyProfile: boolean;
  fitPreferenceOverride?: FitPreference;
  unit?: MeasurementUnit;
}): FitEvaluationResult {
  const {
    garment,
    bodyProfile,
    hasBodyProfile,
    fitPreferenceOverride,
    unit = "cm",
  } = params;
  const activePreference: FitPreference =
    fitPreferenceOverride ?? bodyProfile?.fitPreference ?? "regular";
  const targetEaseCm = getFitPreferenceEaseCm(activePreference);

  if (!garment) {
    return {
      status: "invalid_product",
      garmentCategory: null,
      isTrouser: false,
      fitPreference: activePreference,
      targetEaseCm,
      primaryAnchor: "chest",
      recommendedSize: null,
      alternativeSizes: [],
      sizeBreakdown: [],
      comparisons: [],
      unavailableDimensions: [],
      notApplicableDimensions: [],
      summaryHeadline: "Product Not Found",
      reasoning: [
        "The requested garment ID could not be matched in the catalogue.",
      ],
      evidenceSummary: "No garment selected",
      escalateToCustomFit: false,
      escalationReason: null,
    };
  }

  const isTrouser = garment.category === "Trousers";
  const isUpperBody = UPPER_BODY_CATEGORIES.has(garment.category);
  const primaryAnchor: "chest" | "waist" = isTrouser ? "waist" : "chest";

  const unavailableDimensions = isTrouser
    ? ["Height", "Hip", "Inseam"]
    : ["Height", "Hip", "Shoulder", "Sleeve Length"];
  const notApplicableDimensions = isTrouser
    ? ["Chest", "Shoulder", "Sleeve Length"]
    : ["Inseam"];

  if (!hasBodyProfile || !bodyProfile) {
    return {
      status: "missing_body_profile",
      garmentCategory: garment.category,
      isTrouser,
      fitPreference: activePreference,
      targetEaseCm,
      primaryAnchor,
      recommendedSize: null,
      alternativeSizes: [],
      sizeBreakdown: [],
      comparisons: buildEmptyComparisons(bodyProfile, false, garment),
      unavailableDimensions,
      notApplicableDimensions,
      summaryHeadline: "Body Profile Required for Fit Calibration",
      reasoning: [
        "No saved Body Profile measurements were found in your active session.",
        "Complete your measurements in Body Profile to evaluate compatible garment sizes.",
      ],
      evidenceSummary: "Missing Body Profile",
      escalateToCustomFit: false,
      escalationReason: null,
    };
  }

  // Verify garment has available sizes and valid primary compatible spec map
  const primaryGarmentMap = isTrouser ? garment.waistMapCm : garment.chestMapCm;
  const secondaryGarmentMap = isTrouser ? undefined : garment.waistMapCm;

  const validSizes = garment.sizes.filter((sz) =>
    isValidMeasure(primaryGarmentMap?.[sz])
  );

  if (garment.sizes.length === 0 || validSizes.length === 0) {
    return {
      status: "missing_garment_measurements",
      garmentCategory: garment.category,
      isTrouser,
      fitPreference: activePreference,
      targetEaseCm,
      primaryAnchor,
      recommendedSize: null,
      alternativeSizes: [],
      sizeBreakdown: [],
      comparisons: buildEmptyComparisons(bodyProfile, true, garment),
      unavailableDimensions,
      notApplicableDimensions,
      summaryHeadline: "Garment Measurement Specs Unavailable",
      reasoning: [
        `${garment.name} does not list valid ${primaryAnchor} measurements across available sizes.`,
        "FITLOOM will not guess a size without verified garment dimensions.",
      ],
      evidenceSummary: "Garment spec map unavailable",
      escalateToCustomFit: garment.sizes.length > 0,
      escalationReason:
        "Standard garment measurements are missing; consult Product Details or explore CUSTOMFIT tailoring.",
    };
  }

  const bodyPrimaryCm = isTrouser ? bodyProfile.waistCm : bodyProfile.chestCm;
  const bodySecondaryCm = isTrouser ? null : bodyProfile.waistCm;

  if (!isValidMeasure(bodyPrimaryCm)) {
    return {
      status: "incomplete_body_measurements",
      garmentCategory: garment.category,
      isTrouser,
      fitPreference: activePreference,
      targetEaseCm,
      primaryAnchor,
      recommendedSize: null,
      alternativeSizes: [],
      sizeBreakdown: [],
      comparisons: buildEmptyComparisons(bodyProfile, true, garment),
      unavailableDimensions,
      notApplicableDimensions,
      summaryHeadline: `Missing ${isTrouser ? "Waist" : "Chest"} Measurement`,
      reasoning: [
        `Evaluating ${garment.category} requires a valid ${
          isTrouser ? "waist" : "chest"
        } measurement in your Body Profile.`,
        "Update your Body Profile to receive a size recommendation.",
      ],
      evidenceSummary: "Incomplete Body Profile measurements",
      escalateToCustomFit: false,
      escalationReason: null,
    };
  }

  const hasValidBodySecondary =
    !isTrouser && isValidMeasure(bodySecondaryCm);
  const desiredPrimaryCm = round1(bodyPrimaryCm + targetEaseCm);

  interface CandidateEval {
    size: GarmentSize;
    primaryGarmentCm: number;
    primaryEaseCm: number;
    secondaryGarmentCm: number | null;
    secondaryEaseCm: number | null;
    diff: number;
    physicallyWearable: boolean;
  }

  const candidates: CandidateEval[] = validSizes.map((size) => {
    const pGarment = primaryGarmentMap[size];
    const pEase = round1(pGarment - bodyPrimaryCm);
    const sGarment =
      secondaryGarmentMap && isValidMeasure(secondaryGarmentMap[size])
        ? secondaryGarmentMap[size]
        : null;
    const sEase =
      hasValidBodySecondary && sGarment !== null
        ? round1(sGarment - (bodySecondaryCm as number))
        : null;
    const diff = round1(Math.abs(pGarment - desiredPrimaryCm));
    const secondaryOk = sEase === null || sEase >= 0;
    const physicallyWearable = pEase >= 0 && secondaryOk;

    return {
      size,
      primaryGarmentCm: pGarment,
      primaryEaseCm: pEase,
      secondaryGarmentCm: sGarment,
      secondaryEaseCm: sEase,
      diff,
      physicallyWearable,
    };
  });

  // Sort wearable candidates by closeness to desired primary dimension;
  // tie-break in favor of slightly more room rather than snugger tight fit.
  const wearableCandidates = candidates.filter((c) => c.physicallyWearable);
  const sortedWearable = [...wearableCandidates].sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.primaryEaseCm - a.primaryEaseCm;
  });

  const bestWearable = sortedWearable[0] ?? null;

  // Determine whether no standard size can support the user's proportions
  const MAX_TARGET_DEVIATION_CM = 12;
  const noSupportedFit =
    !bestWearable || bestWearable.diff > MAX_TARGET_DEVIATION_CM;

  const recommendedSize = noSupportedFit ? null : bestWearable.size;

  const sizeBreakdown: SizeBreakdownRow[] = garment.sizes.map((sz) => {
    const match = candidates.find((c) => c.size === sz);
    if (!match) {
      return {
        size: sz,
        primaryGarmentCm: null,
        primaryEaseCm: null,
        secondaryGarmentCm: null,
        secondaryEaseCm: null,
        distanceFromTargetCm: null,
        isRecommended: false,
        statusNote: "Garment spec unavailable for this size",
      };
    }

    let note = "";
    if (match.size === recommendedSize) {
      note = "Closest match to target ease";
    } else if (match.primaryEaseCm < 0) {
      note = `Tighter than body at ${primaryAnchor} (${formatCmDelta(match.primaryEaseCm, unit)})`;
    } else if (match.secondaryEaseCm !== null && match.secondaryEaseCm < 0) {
      note = `Tighter than body at waist (${formatCmDelta(match.secondaryEaseCm, unit)})`;
    } else if (match.primaryEaseCm < targetEaseCm) {
      note = `Closer fit (${formatCmDelta(match.primaryEaseCm, unit)} ${primaryAnchor} ease)`;
    } else {
      note = `Roomier fit (${formatCmDelta(match.primaryEaseCm, unit)} ${primaryAnchor} ease)`;
    }

    return {
      size: sz,
      primaryGarmentCm: match.primaryGarmentCm,
      primaryEaseCm: match.primaryEaseCm,
      secondaryGarmentCm: match.secondaryGarmentCm,
      secondaryEaseCm: match.secondaryEaseCm,
      distanceFromTargetCm: match.diff,
      isRecommended: match.size === recommendedSize,
      statusNote: note,
    };
  });

  // Evaluate all 7 body dimensions against the recommended size (or closest spec for inspection)
  const referenceEval = recommendedSize
    ? candidates.find((c) => c.size === recommendedSize) ?? null
    : null;

  const comparisons: DimensionComparisonRow[] = MEASUREMENT_FIELDS.map((meta) => {
    const bodyVal = isValidMeasure(bodyProfile[meta.key])
      ? bodyProfile[meta.key]
      : null;

    if (meta.key === "chestCm") {
      if (isTrouser) {
        return {
          fieldKey: meta.key,
          label: meta.label,
          compatibility: "not_applicable",
          bodyValueCm: bodyVal,
          garmentValueCm: null,
          easeCm: null,
          targetEaseCm: null,
          verdictLabel: "Not applicable",
          badgeVariant: "outline",
          explanation:
            "Chest measurement is excluded from Trousers sizing to avoid invalid dimension comparisons.",
        };
      }
      const gVal = referenceEval?.primaryGarmentCm ?? null;
      const ease = referenceEval?.primaryEaseCm ?? null;
      if (gVal === null || ease === null) {
        return {
          fieldKey: meta.key,
          label: meta.label,
          compatibility: "primary_anchor",
          bodyValueCm: bodyVal,
          garmentValueCm: null,
          easeCm: null,
          targetEaseCm: targetEaseCm,
          verdictLabel: "No size matched",
          badgeVariant: "warning",
          explanation:
            "No standard garment size matched your chest circumference within supported tolerances.",
        };
      }
      const v = classifyEaseVerdict(ease, targetEaseCm);
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "primary_anchor",
        bodyValueCm: bodyVal,
        garmentValueCm: gVal,
        easeCm: ease,
        targetEaseCm,
        verdictLabel: v.label,
        badgeVariant: v.variant,
        explanation: `Primary sizing anchor for ${garment.category}. ${v.note}`,
      };
    }

    if (meta.key === "waistCm") {
      if (isTrouser) {
        const gVal = referenceEval?.primaryGarmentCm ?? null;
        const ease = referenceEval?.primaryEaseCm ?? null;
        if (gVal === null || ease === null) {
          return {
            fieldKey: meta.key,
            label: meta.label,
            compatibility: "primary_anchor",
            bodyValueCm: bodyVal,
            garmentValueCm: null,
            easeCm: null,
            targetEaseCm,
            verdictLabel: "No size matched",
            badgeVariant: "warning",
            explanation:
              "No standard trouser size matched your waist circumference cleanly.",
          };
        }
        const v = classifyEaseVerdict(ease, targetEaseCm);
        return {
          fieldKey: meta.key,
          label: meta.label,
          compatibility: "primary_anchor",
          bodyValueCm: bodyVal,
          garmentValueCm: gVal,
          easeCm: ease,
          targetEaseCm,
          verdictLabel: v.label,
          badgeVariant: v.variant,
          explanation: `Primary sizing anchor for Trousers. ${v.note}`,
        };
      }

      // Upper-body waist (secondary compatible)
      if (!hasValidBodySecondary) {
        return {
          fieldKey: meta.key,
          label: meta.label,
          compatibility: "missing_body_measurement",
          bodyValueCm: null,
          garmentValueCm: referenceEval?.secondaryGarmentCm ?? null,
          easeCm: null,
          targetEaseCm: null,
          verdictLabel: "Body waist missing",
          badgeVariant: "warning",
          explanation:
            "Add your waist measurement in Body Profile to verify torso clearance.",
        };
      }

      const gVal = referenceEval?.secondaryGarmentCm ?? null;
      const ease = referenceEval?.secondaryEaseCm ?? null;
      if (gVal === null || ease === null) {
        return {
          fieldKey: meta.key,
          label: meta.label,
          compatibility: "unavailable_garment_spec",
          bodyValueCm: bodyVal,
          garmentValueCm: null,
          easeCm: null,
          targetEaseCm: null,
          verdictLabel: "Unavailable",
          badgeVariant: "neutral",
          explanation: "Garment waist spec is unavailable for this item.",
        };
      }

      const v = classifyEaseVerdict(ease, targetEaseCm);
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "secondary_compatible",
        bodyValueCm: bodyVal,
        garmentValueCm: gVal,
        easeCm: ease,
        targetEaseCm: null,
        verdictLabel: v.label,
        badgeVariant: v.variant,
        explanation: `Secondary torso clearance check. ${v.note}`,
      };
    }

    if (meta.key === "inseamCm" && isUpperBody) {
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "not_applicable",
        bodyValueCm: bodyVal,
        garmentValueCm: null,
        easeCm: null,
        targetEaseCm: null,
        verdictLabel: "Not applicable",
        badgeVariant: "outline",
        explanation: `Inseam applies to lower-body garments, not ${garment.category}.`,
      };
    }

    if (
      isTrouser &&
      (meta.key === "shoulderCm" || meta.key === "sleeveCm")
    ) {
      return {
        fieldKey: meta.key,
        label: meta.label,
        compatibility: "not_applicable",
        bodyValueCm: bodyVal,
        garmentValueCm: null,
        easeCm: null,
        targetEaseCm: null,
        verdictLabel: "Not applicable",
        badgeVariant: "outline",
        explanation: `${meta.label} is an upper-body dimension and is not applicable to Trousers.`,
      };
    }

    // Semantically relevant dimension, but missing from MOCK_GARMENTS spec sheet
    return {
      fieldKey: meta.key,
      label: meta.label,
      compatibility: bodyVal === null ? "missing_body_measurement" : "unavailable_garment_spec",
      bodyValueCm: bodyVal,
      garmentValueCm: null,
      easeCm: null,
      targetEaseCm: null,
      verdictLabel: "Unavailable in garment spec",
      badgeVariant: "neutral",
      explanation: `${meta.label} measurements are not provided for ${garment.name} in the catalogue dataset.`,
    };
  });

  if (noSupportedFit) {
    const largest = candidates[candidates.length - 1];
    const smallest = candidates[0];
    const reasonText = !bestWearable
      ? `Every available standard size (${garment.sizes.join(", ")}) leaves negative clearance on your ${
          candidates.some((c) => c.primaryEaseCm < 0) ? primaryAnchor : "waist"
        } (largest size ${largest.size} offers ${formatCmDelta(largest.primaryEaseCm, unit)} ${primaryAnchor} ease${
          largest.secondaryEaseCm !== null
            ? ` and ${formatCmDelta(largest.secondaryEaseCm, unit)} waist ease`
            : ""
        }).`
      : `Closest standard size ${bestWearable.size} yields ${formatCmDelta(bestWearable.primaryEaseCm, unit)} ${primaryAnchor} ease, which differs by ${formatMeasureValue(bestWearable.diff, unit)} from your ${activePreference} (${formatCmDelta(targetEaseCm, unit)}) target (smallest size ${smallest.size} is ${formatCmDelta(smallest.primaryEaseCm, unit)}).`;

    return {
      status: "no_supported_recommendation",
      garmentCategory: garment.category,
      isTrouser,
      fitPreference: activePreference,
      targetEaseCm,
      primaryAnchor,
      recommendedSize: null,
      alternativeSizes: [],
      sizeBreakdown,
      comparisons,
      unavailableDimensions,
      notApplicableDimensions,
      summaryHeadline: "No Standard Size Recommendation Supported",
      reasoning: [
        reasonText,
        "FITLOOM avoids forcing a mismatch when standard sizes S–XL fall outside wearable clearance or your selected fit ease.",
      ],
      evidenceSummary: isTrouser
        ? "Evaluated Waist only (no standard match)"
        : hasValidBodySecondary
        ? "Evaluated Chest & Waist (no standard match)"
        : "Evaluated Chest only (no standard match)",
      escalateToCustomFit: true,
      escalationReason:
        "Standard ready-to-wear sizes do not fit your measurements cleanly. Consider CUSTOMFIT made-to-measure tailoring.",
    };
  }

  // Build alternatives grounded strictly in existing garment sizes
  const recIndex = garment.sizes.indexOf(recommendedSize as GarmentSize);
  const alternativeSizes: AlternativeSizeInfo[] = [];

  if (recIndex > 0) {
    const downSize = garment.sizes[recIndex - 1];
    const downCand = candidates.find((c) => c.size === downSize);
    if (downCand && downCand.physicallyWearable) {
      alternativeSizes.push({
        size: downSize,
        relationship: "Size Down",
        primaryEaseCm: downCand.primaryEaseCm,
        secondaryEaseCm: downCand.secondaryEaseCm,
        note: `Closer fit with ${formatCmDelta(downCand.primaryEaseCm, unit)} ${primaryAnchor} ease if you prefer minimal drape.`,
      });
    }
  }
  if (recIndex >= 0 && recIndex < garment.sizes.length - 1) {
    const upSize = garment.sizes[recIndex + 1];
    const upCand = candidates.find((c) => c.size === upSize);
    if (upCand && upCand.physicallyWearable) {
      alternativeSizes.push({
        size: upSize,
        relationship: "Size Up",
        primaryEaseCm: upCand.primaryEaseCm,
        secondaryEaseCm: upCand.secondaryEaseCm,
        note: `Roomier option with ${formatCmDelta(upCand.primaryEaseCm, unit)} ${primaryAnchor} ease for extra layering or movement.`,
      });
    }
  }

  // Explain why recommendedSize was picked & detect chest-vs-waist proportion escalation
  const chestOnlyBest = [...candidates]
    .filter((c) => c.primaryEaseCm >= 0)
    .sort((a, b) => a.diff - b.diff || b.primaryEaseCm - a.primaryEaseCm)[0];

  const sizedUpForWaist =
    chestOnlyBest &&
    bestWearable &&
    chestOnlyBest.size !== bestWearable.size &&
    chestOnlyBest.secondaryEaseCm !== null &&
    chestOnlyBest.secondaryEaseCm < 0;

  const reasoning: string[] = [
    `Your ${activePreference} preference targets ${formatCmDelta(targetEaseCm, unit)} ease above your ${formatMeasureValue(bodyPrimaryCm, unit)} ${primaryAnchor} (${formatMeasureValue(desiredPrimaryCm, unit)} target garment ${primaryAnchor}).`,
    `Size ${recommendedSize} measures ${formatMeasureValue(bestWearable.primaryGarmentCm, unit)} at the ${primaryAnchor}, providing ${formatCmDelta(bestWearable.primaryEaseCm, unit)} ease.`,
  ];

  if (sizedUpForWaist && chestOnlyBest) {
    reasoning.push(
      `Sized up from ${chestOnlyBest.size} to ${recommendedSize} because Size ${chestOnlyBest.size} waist (${formatMeasureValue(chestOnlyBest.secondaryGarmentCm, unit)}) would be narrower than your ${formatMeasureValue(bodySecondaryCm, unit)} body waist.`
    );
  } else if (bestWearable.secondaryEaseCm !== null) {
    reasoning.push(
      `Torso waist clearance checks out at ${formatCmDelta(bestWearable.secondaryEaseCm, unit)} ease (${formatMeasureValue(bestWearable.secondaryGarmentCm, unit)} garment waist vs ${formatMeasureValue(bodySecondaryCm, unit)} body waist).`
    );
  } else if (isTrouser) {
    reasoning.push(
      `Evaluated strictly using Waist specs (${garment.stretchNote}). Upper-body measurements are excluded.`
    );
  }

  const escalateForProportion =
    Boolean(sizedUpForWaist) ||
    bestWearable.primaryEaseCm < 2 ||
    (bestWearable.secondaryEaseCm !== null && bestWearable.secondaryEaseCm < 2);

  return {
    status: "ready",
    garmentCategory: garment.category,
    isTrouser,
    fitPreference: activePreference,
    targetEaseCm,
    primaryAnchor,
    recommendedSize,
    alternativeSizes,
    sizeBreakdown,
    comparisons,
    unavailableDimensions,
    notApplicableDimensions,
    summaryHeadline: `Recommended Size: ${recommendedSize}`,
    reasoning,
    evidenceSummary: isTrouser
      ? "Matched on Waist (1 of 4 trouser dimensions available)"
      : hasValidBodySecondary
      ? "Matched on Chest & Waist (2 of 6 upper-body dimensions available)"
      : "Matched on Chest only (Body waist missing)",
    escalateToCustomFit: escalateForProportion,
    escalationReason: sizedUpForWaist
      ? "Sized up for waist clearance, creating extra chest ease — CUSTOMFIT tailoring can taper the silhouette."
      : escalateForProportion
      ? "Clearance is snug (< 2 cm ease) on at least one dimension — consider CUSTOMFIT tailoring for extra comfort."
      : null,
  };
}

export interface DashboardFitSummary {
  isAvailable: boolean;
  headline: string;
  sublabel: string;
  supportedCount: number;
  totalCount: number;
  fitPreference: FitPreference | null;
}

/**
 * Produces a deterministic, non-percentage summary of Fit Intelligence availability
 * across a catalogue using actual Body Profile data and garment measurement specs.
 */
export function summarizeDashboardFitStatus(params: {
  bodyProfile: BodyProfile | null | undefined;
  hasBodyProfile: boolean;
  garments: readonly MockGarment[];
}): DashboardFitSummary {
  const { bodyProfile, hasBodyProfile, garments } = params;
  const totalCount = garments.length;

  if (!hasBodyProfile || !bodyProfile || totalCount === 0) {
    return {
      isAvailable: false,
      headline: "Unavailable",
      sublabel: "Complete Body Profile to enable fit checks →",
      supportedCount: 0,
      totalCount,
      fitPreference: null,
    };
  }

  let supportedCount = 0;
  for (const garment of garments) {
    const evalResult = evaluateGarmentFit({
      garment,
      bodyProfile,
      hasBodyProfile,
    });
    if (evalResult.status === "ready" && evalResult.recommendedSize !== null) {
      supportedCount += 1;
    }
  }

  const easeCm = getFitPreferenceEaseCm(bodyProfile.fitPreference);

  if (supportedCount === 0) {
    return {
      isAvailable: false,
      headline: "Unavailable",
      sublabel: `No standard size match yet (${bodyProfile.fitPreference} fit) →`,
      supportedCount: 0,
      totalCount,
      fitPreference: bodyProfile.fitPreference,
    };
  }

  return {
    isAvailable: true,
    headline: `${supportedCount} of ${totalCount} Matched`,
    sublabel: `Profile calibrated · ${bodyProfile.fitPreference} fit (+${easeCm} cm ease)`,
    supportedCount,
    totalCount,
    fitPreference: bodyProfile.fitPreference,
  };
}
