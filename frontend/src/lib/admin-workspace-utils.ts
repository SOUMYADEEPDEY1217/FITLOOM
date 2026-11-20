import { z } from "zod";
import { MOCK_TAILORS } from "@/lib/mock-data";
import type {
  MockOrder,
  MockUser,
} from "@/components/providers/fitloom-provider";
import {
  type CatalogModerationStatus,
  SELLER_COLLECTIVE_ID,
  SELLER_COLLECTIVE_NAME,
  SELLER_VERVE_ID,
  SELLER_VERVE_NAME,
  type SellerCatalogProduct,
} from "@/lib/seller-workspace-utils";

export type PartnerType = "seller" | "tailor";
export type PartnerVerificationStatus =
  | "pending_demo"
  | "verified_demo"
  | "rejected_demo";
export type PartnerOperationalStatus = "active" | "suspended";

export interface DemoPartnerRecord {
  id: string;
  name: string;
  type: PartnerType;
  city: string;
  specialtyOrCategory: string;
  email?: string;
  registrationSource: "Seeded Demo Partner" | "Session Onboarding";
  verificationStatus: PartnerVerificationStatus;
  operationalStatus: PartnerOperationalStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  updatedAt?: string;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  area: "partners" | "catalogue" | "orders";
  targetId: string;
  action: string;
  note?: string;
}

export const AdminModerationReasonSchema = z
  .string()
  .trim()
  .min(5, "Please provide a clear reason (minimum 5 characters).")
  .max(300, "Reason must be 300 characters or fewer.");

export const AdminOversightNoteSchema = z
  .string()
  .trim()
  .min(5, "Oversight note must be at least 5 characters.")
  .max(300, "Oversight note must be 300 characters or fewer.");

/**
 * Derives baseline demo partners exclusively from MOCK_TAILORS and known demo Sellers.
 * Never fabricates external legal documents or fake companies.
 */
export function buildInitialPartners(): DemoPartnerRecord[] {
  const sellerSeeds: DemoPartnerRecord[] = [
    {
      id: SELLER_VERVE_ID,
      name: SELLER_VERVE_NAME,
      type: "seller",
      city: "Mumbai",
      specialtyOrCategory: "Shirts & Technical Outerwear",
      email: "seller.demo@fitloom.local",
      registrationSource: "Seeded Demo Partner",
      verificationStatus: "verified_demo",
      operationalStatus: "active",
      updatedAt: "2026-11-18",
    },
    {
      id: SELLER_COLLECTIVE_ID,
      name: SELLER_COLLECTIVE_NAME,
      type: "seller",
      city: "Bengaluru",
      specialtyOrCategory: "Trousers & Studio Basics",
      registrationSource: "Seeded Demo Partner",
      verificationStatus: "pending_demo",
      operationalStatus: "active",
      updatedAt: "2026-11-18",
    },
  ];

  const tailorSeeds: DemoPartnerRecord[] = MOCK_TAILORS.map((t, index) => ({
    id: t.id,
    name: t.name,
    type: "tailor",
    city: t.city,
    specialtyOrCategory: t.specialty,
    email: index === 0 ? "tailor.demo@fitloom.local" : undefined,
    registrationSource: "Seeded Demo Partner",
    verificationStatus: index === 0 ? "verified_demo" : "pending_demo",
    operationalStatus: "active",
    updatedAt: "2026-11-18",
  }));

  return [...sellerSeeds, ...tailorSeeds];
}

export function normalizePartnerMatch(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function doesPartnerMatchUser(
  partner: DemoPartnerRecord,
  user: MockUser
): boolean {
  if (user.role !== "seller" && user.role !== "tailor") return false;
  if (partner.type !== user.role) return false;

  if (
    user.id === "tailor-arjun-demo" ||
    normalizePartnerMatch(user.email) === "tailor.demo@fitloom.local"
  ) {
    return (
      partner.id === "tailor-arjun" ||
      normalizePartnerMatch(partner.email) === "tailor.demo@fitloom.local"
    );
  }

  if (
    user.id &&
    (partner.id === user.id ||
      normalizePartnerMatch(partner.email) === normalizePartnerMatch(user.email))
  ) {
    return true;
  }

  return normalizePartnerMatch(partner.name) === normalizePartnerMatch(user.name);
}

export function findMatchingPartnerForUser(
  user: MockUser,
  partners: readonly DemoPartnerRecord[]
): DemoPartnerRecord | null {
  if (user.role !== "seller" && user.role !== "tailor") return null;
  return partners.find((p) => doesPartnerMatchUser(p, user)) ?? null;
}

export function evaluatePartnerSuspension(
  user: MockUser,
  requiredRole: "seller" | "tailor" | "admin",
  partners: readonly DemoPartnerRecord[]
): {
  suspended: boolean;
  partner: DemoPartnerRecord | null;
  reason?: string;
} {
  if (requiredRole === "admin") {
    return { suspended: false, partner: null };
  }
  if (user.role !== requiredRole) {
    return { suspended: false, partner: null };
  }
  const matched = findMatchingPartnerForUser(user, partners);
  if (matched && matched.operationalStatus === "suspended") {
    return {
      suspended: true,
      partner: matched,
      reason: matched.suspensionReason,
    };
  }
  return { suspended: false, partner: matched };
}

export type PartnerActionType = "verify" | "reject" | "suspend" | "reactivate";

export function validatePartnerTransition(
  partner: DemoPartnerRecord,
  action: PartnerActionType,
  reason?: string
): { ok: true; reason?: string } | { ok: false; error: string } {
  if (action === "verify") {
    if (partner.operationalStatus === "suspended") {
      return {
        ok: false,
        error: "Reactivate this suspended partner before granting demo verification.",
      };
    }
    if (partner.verificationStatus === "verified_demo") {
      return {
        ok: false,
        error: `${partner.name} is already marked Verified (Demo).`,
      };
    }
    return { ok: true };
  }

  if (action === "reject") {
    const parsed = AdminModerationReasonSchema.safeParse(reason ?? "");
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Provide a clear verification rejection reason.",
      };
    }
    return { ok: true, reason: parsed.data };
  }

  if (action === "suspend") {
    if (partner.operationalStatus === "suspended") {
      return {
        ok: false,
        error: `${partner.name} is already suspended.`,
      };
    }
    const parsed = AdminModerationReasonSchema.safeParse(reason ?? "");
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Provide a clear suspension reason (min 5 characters).",
      };
    }
    return { ok: true, reason: parsed.data };
  }

  if (action === "reactivate") {
    if (partner.operationalStatus === "active") {
      return {
        ok: false,
        error: `${partner.name} is already active.`,
      };
    }
    return { ok: true };
  }

  return { ok: false, error: "Unsupported partner action." };
}

export type CatalogModerationAction =
  | "approve"
  | "reject"
  | "suspend"
  | "restore";

export function validateCatalogModerationAction(
  product: SellerCatalogProduct,
  action: CatalogModerationAction,
  reason?: string
):
  | { ok: true; nextStatus: CatalogModerationStatus; reason?: string }
  | { ok: false; error: string } {
  if (action === "approve") {
    if (product.moderationStatus === "approved") {
      return {
        ok: false,
        error: `"${product.name}" is already approved in the demo catalogue.`,
      };
    }
    return { ok: true, nextStatus: "approved" };
  }

  if (action === "reject") {
    const parsed = AdminModerationReasonSchema.safeParse(reason ?? "");
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Provide a clear moderation rejection reason.",
      };
    }
    return { ok: true, nextStatus: "rejected", reason: parsed.data };
  }

  if (action === "suspend") {
    if (product.moderationStatus === "suspended") {
      return {
        ok: false,
        error: `"${product.name}" is already suspended.`,
      };
    }
    const parsed = AdminModerationReasonSchema.safeParse(reason ?? "");
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Provide a clear suspension reason (min 5 characters).",
      };
    }
    return { ok: true, nextStatus: "suspended", reason: parsed.data };
  }

  if (action === "restore") {
    if (product.moderationStatus === "approved") {
      return {
        ok: false,
        error: `"${product.name}" is already active/approved.`,
      };
    }
    return { ok: true, nextStatus: "approved" };
  }

  return { ok: false, error: "Unsupported moderation action." };
}

export interface AdminDashboardMetrics {
  totalCustomers: number;
  totalSellers: number;
  totalTailorPartners: number;
  pendingPartnerVerifications: number;
  suspendedPartners: number;
  totalListedProducts: number;
  activeCatalogueProducts: number;
  flaggedOrPendingProducts: number;
  totalStandardOrders: number;
  totalCustomFitOrders: number;
}

/**
 * Derives truthful Admin overview metrics exclusively from active session state.
 * Never fabricates platform revenue, conversion rates, or growth figures.
 */
export function computeAdminDashboardMetrics(params: {
  user: MockUser;
  partners: readonly DemoPartnerRecord[];
  products: readonly SellerCatalogProduct[];
  orders: readonly MockOrder[];
}): AdminDashboardMetrics {
  const { user, partners, products, orders } = params;

  const customerKeys = new Set<string>();
  for (const ord of orders) {
    const key =
      ord.customerId?.trim() ||
      ord.customerEmail?.trim().toLowerCase() ||
      ord.customerName.trim().toLowerCase();
    if (key) customerKeys.add(key);
  }
  if (user.role === "customer") {
    const key =
      user.id?.trim() ||
      user.email?.trim().toLowerCase() ||
      user.name.trim().toLowerCase();
    if (key) customerKeys.add(key);
  }

  const sellers = partners.filter((p) => p.type === "seller");
  const tailors = partners.filter((p) => p.type === "tailor");
  const suspendedSellerIds = new Set(
    sellers.filter((s) => s.operationalStatus === "suspended").map((s) => s.id)
  );

  return {
    totalCustomers: customerKeys.size,
    totalSellers: sellers.length,
    totalTailorPartners: tailors.length,
    pendingPartnerVerifications: partners.filter(
      (p) => p.verificationStatus === "pending_demo"
    ).length,
    suspendedPartners: partners.filter(
      (p) => p.operationalStatus === "suspended"
    ).length,
    totalListedProducts: products.length,
    activeCatalogueProducts: products.filter(
      (p) =>
        p.status === "active" &&
        p.moderationStatus === "approved" &&
        !suspendedSellerIds.has(p.sellerId)
    ).length,
    flaggedOrPendingProducts: products.filter(
      (p) => p.moderationStatus !== "approved"
    ).length,
    totalStandardOrders: orders.filter((o) => !o.isCustomFit).length,
    totalCustomFitOrders: orders.filter((o) => o.isCustomFit).length,
  };
}

export function formatVerificationLabel(
  status: PartnerVerificationStatus
): string {
  switch (status) {
    case "verified_demo":
      return "Verified (Demo)";
    case "pending_demo":
      return "Pending Demo Review";
    case "rejected_demo":
      return "Rejected (Demo)";
  }
}
