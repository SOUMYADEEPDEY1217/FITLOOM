import { z } from "zod";
import type {
  MockOrder,
  MockUser,
  OrderStage,
} from "@/components/providers/fitloom-provider";

export interface TailorWorkshopProfile {
  workshopName: string;
  city: string;
  specialty: string;
  weeklyCapacityOrders: number;
  turnaroundDays: number;
  acceptingCustomOrders: boolean;
  updatedAt?: string;
}

export const INITIAL_TAILOR_WORKSHOP_PROFILE: TailorWorkshopProfile = {
  workshopName: "Atelier Arjun & Co.",
  city: "Kolkata",
  specialty: "Bespoke Shirts & Structured Blazers",
  weeklyCapacityOrders: 15,
  turnaroundDays: 6,
  acceptingCustomOrders: true,
  updatedAt: "2026-11-17",
};

function parseWholeNumber(label: string, min: number, max: number) {
  return z.preprocess(
    (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : Number.NaN;
      }
      return val;
    },
    z
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} must be a valid number.`,
      })
      .finite(`${label} must be a valid number.`)
      .int(`${label} must be a whole number.`)
      .min(min, `${label} must be between ${min} and ${max}.`)
      .max(max, `${label} must be between ${min} and ${max}.`)
  );
}

export const TailorWorkshopProfileSchema = z.object({
  workshopName: z
    .string()
    .trim()
    .min(2, "Workshop name must be at least 2 characters.")
    .max(80, "Workshop name must be 80 characters or fewer."),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters.")
    .max(60, "City must be 60 characters or fewer."),
  specialty: z
    .string()
    .trim()
    .min(3, "Primary specialty must be at least 3 characters.")
    .max(120, "Primary specialty must be 120 characters or fewer."),
  weeklyCapacityOrders: parseWholeNumber("Weekly stitching capacity", 1, 500),
  turnaroundDays: parseWholeNumber("Standard turnaround days", 1, 60),
  acceptingCustomOrders: z.boolean(),
});

export type TailorWorkshopProfileInput = z.input<
  typeof TailorWorkshopProfileSchema
>;

export const TailorRegistrationSchema = z.object({
  workshop: z
    .string()
    .trim()
    .min(2, "Workshop / Studio name must be at least 2 characters.")
    .max(80, "Workshop / Studio name must be 80 characters or fewer."),
  city: z
    .string()
    .trim()
    .min(2, "City is required (minimum 2 characters).")
    .max(60, "City must be 60 characters or fewer."),
  specialty: z
    .string()
    .trim()
    .min(3, "Primary specialty must be at least 3 characters.")
    .max(120, "Primary specialty must be 120 characters or fewer."),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid workshop email address."),
  weeklyCapacityOrders: parseWholeNumber("Weekly stitching capacity", 1, 500),
});

export type TailorRegistrationInput = z.input<typeof TailorRegistrationSchema>;

export const TailorRejectionReasonSchema = z
  .string()
  .trim()
  .min(5, "Please provide a clear rejection reason (minimum 5 characters).")
  .max(300, "Rejection reason must be 300 characters or fewer.");

export const TAILOR_PRODUCTION_STAGES: readonly OrderStage[] = [
  "Cutting",
  "Stitching in Progress",
  "Quality Check",
  "Out for Delivery",
  "Delivered",
] as const;

export const IN_PRODUCTION_STAGES: readonly OrderStage[] = [
  "Cutting",
  "Stitching in Progress",
  "Quality Check",
  "Out for Delivery",
] as const;

export type TailorOrderFilterTab = "all" | "new" | "prod" | "done" | "closed";

export function normalizeWorkshopName(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isDefaultDemoTailorUser(user: MockUser): boolean {
  return (
    user.id === "tailor-arjun-demo" ||
    user.email.trim().toLowerCase() === "tailor.demo@fitloom.local"
  );
}

/**
 * Resolves the workshop names owned by the active Tailor session.
 * Default demo tailor owns its workshop record plus "Atelier Arjun & Co.";
 * custom or separately registered workshops own only their own workshop name.
 */
export function getOwnedWorkshopNames(
  user: MockUser,
  workshopProfile?: Pick<TailorWorkshopProfile, "workshopName">
): string[] {
  if (user.role !== "tailor") return [];

  const names = new Set<string>();
  const profileName = normalizeWorkshopName(workshopProfile?.workshopName);
  if (profileName) {
    names.add(profileName);
  }

  if (isDefaultDemoTailorUser(user)) {
    names.add(normalizeWorkshopName("Atelier Arjun & Co."));
  } else {
    const userName = normalizeWorkshopName(user.name);
    if (userName) {
      names.add(userName);
    }
  }

  return Array.from(names);
}

/**
 * Checks workshop ownership wherever order.tailorName exists in the model.
 * Never fabricates or assigns ownership onto records lacking tailorName.
 */
export function isOrderOwnedByTailorWorkshop(
  order: MockOrder,
  user: MockUser,
  workshopProfile?: Pick<TailorWorkshopProfile, "workshopName">
): boolean {
  if (user.role !== "tailor") return false;
  const assigned = normalizeWorkshopName(order.tailorName);
  if (!assigned) {
    return true;
  }
  const ownedNames = getOwnedWorkshopNames(user, workshopProfile);
  return ownedNames.includes(assigned);
}

/**
 * Filters orders to active Tailor-owned CUSTOMFIT orders only.
 * Standard seller orders (isCustomFit === false) are always excluded.
 */
export function getTailorOrders(
  orders: readonly MockOrder[],
  user: MockUser,
  workshopProfile?: Pick<TailorWorkshopProfile, "workshopName">
): MockOrder[] {
  if (user.role !== "tailor") return [];
  return orders.filter(
    (order) =>
      order.isCustomFit === true &&
      isOrderOwnedByTailorWorkshop(order, user, workshopProfile)
  );
}

export function filterTailorOrdersByTab(
  tailorOrders: readonly MockOrder[],
  tab: TailorOrderFilterTab
): MockOrder[] {
  if (tab === "new") {
    return tailorOrders.filter((o) => o.stage === "Pending Tailor Acceptance");
  }
  if (tab === "prod") {
    return tailorOrders.filter((o) => IN_PRODUCTION_STAGES.includes(o.stage));
  }
  if (tab === "done") {
    return tailorOrders.filter((o) => o.stage === "Delivered");
  }
  if (tab === "closed") {
    return tailorOrders.filter(
      (o) =>
        o.stage === "Cancelled" ||
        o.stage === "Rejected by Tailor" ||
        o.stage === "Return Requested"
    );
  }
  return [...tailorOrders];
}

export type TailorOrderLookupResult =
  | { status: "ok"; order: MockOrder }
  | { status: "not_found" }
  | { status: "not_customfit"; orderId: string }
  | { status: "not_owned"; orderId: string; assignedWorkshopName: string };

/**
 * Exact ID lookup with strict CUSTOMFIT and workshop ownership checks.
 * Never falls back to orders[0].
 */
export function lookupTailorOrderById(params: {
  orders: readonly MockOrder[];
  orderId: string;
  user: MockUser;
  workshopProfile?: Pick<TailorWorkshopProfile, "workshopName">;
}): TailorOrderLookupResult {
  const { orders, orderId, user, workshopProfile } = params;
  const trimmedId = orderId.trim();
  const match = orders.find((o) => o.id === trimmedId);
  if (!match) {
    return { status: "not_found" };
  }
  if (!match.isCustomFit) {
    return { status: "not_customfit", orderId: match.id };
  }
  if (!isOrderOwnedByTailorWorkshop(match, user, workshopProfile)) {
    return {
      status: "not_owned",
      orderId: match.id,
      assignedWorkshopName: match.tailorName?.trim() || "another workshop",
    };
  }
  return { status: "ok", order: match };
}

export function getNextAllowedProductionStage(
  currentStage: OrderStage
): OrderStage | null {
  const index = TAILOR_PRODUCTION_STAGES.indexOf(currentStage);
  if (index === -1 || index >= TAILOR_PRODUCTION_STAGES.length - 1) {
    return null;
  }
  return TAILOR_PRODUCTION_STAGES[index + 1] ?? null;
}

export type StageMutationValidationResult =
  | { ok: true; nextStage: OrderStage }
  | { ok: false; error: string };

export function validateTailorAcceptOrder(
  order: MockOrder
): StageMutationValidationResult {
  if (!order.isCustomFit) {
    return {
      ok: false,
      error: "Only CUSTOMFIT orders can be accepted in the Tailor workspace.",
    };
  }
  if (order.stage === "Cancelled") {
    return {
      ok: false,
      error: "Cancelled orders cannot be accepted or progressed.",
    };
  }
  if (order.stage === "Rejected by Tailor") {
    return {
      ok: false,
      error: "Rejected orders cannot be re-accepted.",
    };
  }
  if (order.stage !== "Pending Tailor Acceptance") {
    return {
      ok: false,
      error: `Order ${order.id} has already passed initial acceptance (${order.stage}).`,
    };
  }
  return { ok: true, nextStage: "Cutting" };
}

export function validateTailorRejectOrder(
  order: MockOrder,
  reason: string
): { ok: true; reason: string } | { ok: false; error: string } {
  if (!order.isCustomFit) {
    return {
      ok: false,
      error: "Only CUSTOMFIT orders can be rejected in the Tailor workspace.",
    };
  }
  if (order.stage === "Cancelled") {
    return {
      ok: false,
      error: "Cancelled orders cannot be rejected or modified.",
    };
  }
  if (order.stage !== "Pending Tailor Acceptance") {
    return {
      ok: false,
      error: `Order ${order.id} cannot be rejected from stage "${order.stage}".`,
    };
  }
  const parsed = TailorRejectionReasonSchema.safeParse(reason);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a clear rejection reason.",
    };
  }
  return { ok: true, reason: parsed.data };
}

export function validateTailorAdvanceStage(
  order: MockOrder,
  targetStage: OrderStage
): StageMutationValidationResult {
  if (!order.isCustomFit) {
    return {
      ok: false,
      error: "Only CUSTOMFIT orders can advance in the Tailor workspace.",
    };
  }
  if (order.stage === "Cancelled") {
    return {
      ok: false,
      error: "Cancelled orders cannot progress to further stages.",
    };
  }
  if (order.stage === "Rejected by Tailor") {
    return {
      ok: false,
      error: "Rejected orders cannot enter production stages.",
    };
  }
  if (order.stage === "Return Requested") {
    return {
      ok: false,
      error: "Orders with an open return request cannot advance in production.",
    };
  }
  if (order.stage === "Delivered") {
    return {
      ok: false,
      error: "Delivered orders have already completed all production stages.",
    };
  }
  if (order.stage === "Pending Tailor Acceptance") {
    return {
      ok: false,
      error: "Accept this order first before updating production stages.",
    };
  }
  if (!TAILOR_PRODUCTION_STAGES.includes(targetStage)) {
    return {
      ok: false,
      error: `"${targetStage}" is not a valid tailor production stage.`,
    };
  }
  if (order.stage === targetStage) {
    return {
      ok: false,
      error: `Order ${order.id} is already in "${targetStage}".`,
    };
  }

  const nextAllowed = getNextAllowedProductionStage(order.stage);
  if (!nextAllowed || targetStage !== nextAllowed) {
    return {
      ok: false,
      error: nextAllowed
        ? `Production stages must progress sequentially. Next allowed stage is "${nextAllowed}".`
        : "No further production stages are available.",
    };
  }

  return { ok: true, nextStage: targetStage };
}

export function formatTailorStageVariant(
  stage: OrderStage
): "default" | "success" | "amber" | "info" | "neutral" {
  if (stage === "Delivered") return "success";
  if (
    stage === "Cancelled" ||
    stage === "Rejected by Tailor" ||
    stage === "Return Requested"
  ) {
    return "amber";
  }
  if (stage === "Pending Tailor Acceptance") return "info";
  return "default";
}
