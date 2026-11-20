import {
  BodyProfile,
  FitPreference,
  MockGarment,
  MockTailor,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import {
  BodyProfileDraftState,
  BodyProfileErrorKey,
  MeasurementUnit,
  createDraftFromProfile,
  validateAndBuildBodyProfile,
} from "@/lib/body-profile-utils";
import { getGarmentMeasurementSummary } from "@/lib/shop-utils";

export type QuoteStatus = "pending" | "issued_demo";
export type TailorAcceptanceStatus = "pending" | "accepted_demo";
export type CustomFitRequestStage =
  | "pending_quote"
  | "quote_ready"
  | "quote_approved"
  | "added_to_bag";

export interface CustomFitQuote {
  garmentBasePriceInr: number;
  tailoringFeeInr: number;
  totalPriceInr: number;
  referenceTurnaroundDays: number;
  issuedNotice: string;
}

export interface CustomFitRequest {
  id: string;
  garmentId: string;
  garmentName: string;
  tailorId: string;
  tailorName: string;
  tailorCity: string;
  measurements: BodyProfile;
  fitPreference: FitPreference;
  adjustmentAreas: string[];
  notes: string;
  createdAt: string;
  quoteStatus: QuoteStatus;
  tailorAcceptanceStatus: TailorAcceptanceStatus;
  quote: CustomFitQuote | null;
  quoteApproved: boolean;
  stage: CustomFitRequestStage;
}

export const TAILORING_ADJUSTMENT_OPTIONS: ReadonlyArray<{
  id: string;
  label: string;
  categories: ReadonlyArray<MockGarment["category"]>;
}> = [
  {
    id: "waist-taper",
    label: "Waist Taper",
    categories: ["Shirts", "Outerwear", "T-Shirts", "Hoodies", "Trousers"],
  },
  {
    id: "sleeve-length",
    label: "Sleeve Length Adjustment",
    categories: ["Shirts", "Outerwear", "T-Shirts", "Hoodies"],
  },
  {
    id: "shoulder-slope",
    label: "Shoulder Width Balance",
    categories: ["Shirts", "Outerwear", "T-Shirts", "Hoodies"],
  },
  {
    id: "chest-ease",
    label: "Chest Ease Fine-Tuning",
    categories: ["Shirts", "Outerwear", "T-Shirts", "Hoodies"],
  },
  {
    id: "inseam-hem",
    label: "Inseam / Hem Length",
    categories: ["Trousers"],
  },
  {
    id: "hip-seat-ease",
    label: "Hip & Seat Room",
    categories: ["Trousers"],
  },
];

export function getAdjustmentOptionsForCategory(
  category: MockGarment["category"]
) {
  return TAILORING_ADJUSTMENT_OPTIONS.filter((opt) =>
    opt.categories.includes(category)
  );
}

/**
 * Checks garment CUSTOMFIT eligibility using the same rule as Product Details:
 * requires non-empty sizes and valid garment measurement specs.
 */
export function evaluateCustomFitEligibility(
  garment: MockGarment | null | undefined
): { eligible: boolean; reason: string } {
  if (!garment) {
    return {
      eligible: false,
      reason: "No valid garment was selected.",
    };
  }
  const summary = getGarmentMeasurementSummary(garment);
  if (garment.sizes.length === 0 || !summary.hasSpecs) {
    return {
      eligible: false,
      reason: `${garment.name} is ineligible for CUSTOMFIT because base size specifications are incomplete.`,
    };
  }
  return {
    eligible: true,
    reason: `Eligible for made-to-measure adjustments based on ${garment.category} specification specs.`,
  };
}

/**
 * Initializes CUSTOMFIT measurement draft.
 * Strictly leaves measurements blank if no saved Body Profile exists (never invents defaults).
 */
export function createInitialCustomFitDraft(
  bodyProfile: BodyProfile,
  hasBodyProfile: boolean,
  unit: MeasurementUnit = "cm"
): BodyProfileDraftState {
  return createDraftFromProfile(bodyProfile, hasBodyProfile, unit);
}

/**
 * Validates customer-provided measurements + optional tailoring notes.
 */
export function validateCustomFitSubmission(params: {
  garment: MockGarment | null | undefined;
  tailor: MockTailor | null | undefined;
  draft: BodyProfileDraftState;
  notes: string;
}):
  | { ok: true; measurements: BodyProfile; trimmedNotes: string }
  | {
      ok: false;
      formError: string;
      fieldErrors: Partial<Record<BodyProfileErrorKey, string>>;
    } {
  const { garment, tailor, draft, notes } = params;

  const eligibility = evaluateCustomFitEligibility(garment);
  if (!eligibility.eligible) {
    return {
      ok: false,
      formError: eligibility.reason,
      fieldErrors: {},
    };
  }

  if (!tailor) {
    return {
      ok: false,
      formError: "Select a partner workshop before submitting your request.",
      fieldErrors: {},
    };
  }

  if (notes.trim().length > 300) {
    return {
      ok: false,
      formError: "Tailoring notes must be 300 characters or fewer.",
      fieldErrors: {},
    };
  }

  const measurementCheck = validateAndBuildBodyProfile(draft);
  if (!measurementCheck.ok) {
    return {
      ok: false,
      formError:
        "Please enter valid measurements for all required fields before submitting.",
      fieldErrors: measurementCheck.errors,
    };
  }

  return {
    ok: true,
    measurements: measurementCheck.data,
    trimmedNotes: notes.trim(),
  };
}

/**
 * Creates a new pending CUSTOMFIT request.
 * Starts strictly with quoteStatus="pending" and tailorAcceptanceStatus="pending".
 */
export function createPendingCustomFitRequest(params: {
  garment: MockGarment;
  tailor: MockTailor;
  measurements: BodyProfile;
  adjustmentAreas: string[];
  notes: string;
  createdAt: string;
}): CustomFitRequest {
  const { garment, tailor, measurements, adjustmentAreas, notes, createdAt } =
    params;

  return {
    id: `CF-${Date.now().toString().slice(-6)}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`,
    garmentId: garment.id,
    garmentName: garment.name,
    tailorId: tailor.id,
    tailorName: tailor.name,
    tailorCity: tailor.city,
    measurements,
    fitPreference: measurements.fitPreference,
    adjustmentAreas: [...adjustmentAreas],
    notes,
    createdAt,
    quoteStatus: "pending",
    tailorAcceptanceStatus: "pending",
    quote: null,
    quoteApproved: false,
    stage: "pending_quote",
  };
}

/**
 * Simulates a workshop issuing a reference quote in the frontend demo.
 * Uses only existing catalogue garment.priceInr and tailor.feeInr — never invents pricing.
 */
export function issueDemoWorkshopQuote(
  request: CustomFitRequest,
  garment: MockGarment,
  tailor: MockTailor
): CustomFitRequest {
  const quote: CustomFitQuote = {
    garmentBasePriceInr: garment.priceInr,
    tailoringFeeInr: tailor.feeInr,
    totalPriceInr: garment.priceInr + tailor.feeInr,
    referenceTurnaroundDays: tailor.turnaroundDays,
    issuedNotice:
      "Frontend demo simulation using catalogue garment price + listed workshop reference fee.",
  };

  return {
    ...request,
    quoteStatus: "issued_demo",
    tailorAcceptanceStatus: "accepted_demo",
    quote,
    quoteApproved: false,
    stage: "quote_ready",
  };
}

/**
 * Customer approval gate: strictly refuses to approve if no quote exists.
 */
export function approveCustomFitQuote(
  request: CustomFitRequest
): { ok: true; updated: CustomFitRequest } | { ok: false; error: string } {
  if (!request.quote || request.quoteStatus !== "issued_demo") {
    return {
      ok: false,
      error:
        "Cannot approve quote: no workshop quote has been issued for this request yet.",
    };
  }
  if (request.tailorAcceptanceStatus === "pending") {
    return {
      ok: false,
      error:
        "Cannot approve quote while tailor acceptance is still pending.",
    };
  }
  return {
    ok: true,
    updated: {
      ...request,
      quoteApproved: true,
      stage: "quote_approved",
    },
  };
}

/**
 * Order/Bag confirmation gate: strictly blocks placing an order before customer quote approval.
 */
export function canConfirmCustomFitOrder(
  request: CustomFitRequest
): { allowed: true } | { allowed: false; reason: string } {
  if (!request.quote || request.quoteStatus !== "issued_demo") {
    return {
      allowed: false,
      reason: "Quote is pending — no verified quote exists yet.",
    };
  }
  if (request.tailorAcceptanceStatus === "pending") {
    return {
      allowed: false,
      reason: "Tailor acceptance is pending.",
    };
  }
  if (!request.quoteApproved) {
    return {
      allowed: false,
      reason:
        "Customer review and explicit quote approval are required before placing a CUSTOMFIT demo order.",
    };
  }
  return { allowed: true };
}

export function formatCustomFitNotesSummary(request: CustomFitRequest): string {
  const ease = getFitPreferenceEaseCm(request.fitPreference);
  const parts: string[] = [
    `${request.fitPreference} fit (+${ease} cm ease)`,
  ];
  if (request.adjustmentAreas.length > 0) {
    parts.push(`Focus: ${request.adjustmentAreas.join(", ")}`);
  }
  if (request.notes) {
    parts.push(request.notes);
  }
  return parts.join(" · ");
}
