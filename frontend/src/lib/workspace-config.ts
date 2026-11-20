import type { MockRole } from "@/components/providers/fitloom-provider";

export type WorkspaceId = "seller" | "tailor" | "admin";
export type WorkspaceRole = Extract<MockRole, "seller" | "tailor" | "admin">;

export interface WorkspaceNavLink {
  href: string;
  label: string;
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  requiredRole: WorkspaceRole;
  roleLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  basePath: string;
  links: readonly WorkspaceNavLink[];
}

export const WORKSPACE_CONFIG: Record<WorkspaceId, WorkspaceDefinition> = {
  seller: {
    id: "seller",
    requiredRole: "seller",
    roleLabel: "Seller",
    eyebrow: "Seller Operations · Demo",
    title: "Seller Workspace",
    description:
      "Manage catalogue listings, inventory status, and standard ready-to-wear fulfillment.",
    basePath: "/seller",
    links: [
      { href: "/seller", label: "Overview" },
      { href: "/seller/products", label: "Products" },
      { href: "/seller/orders", label: "Orders" },
    ],
  },
  tailor: {
    id: "tailor",
    requiredRole: "tailor",
    roleLabel: "Partner Tailor",
    eyebrow: "Tailor Operations · Demo",
    title: "Partner Tailor Workspace",
    description:
      "Review CUSTOMFIT orders, customer measurement specs, production stages, and workshop capacity.",
    basePath: "/tailor",
    links: [
      { href: "/tailor", label: "Dashboard" },
      { href: "/tailor/orders", label: "Order Queue" },
      { href: "/tailor/profile", label: "Workshop Profile" },
    ],
  },
  admin: {
    id: "admin",
    requiredRole: "admin",
    roleLabel: "Admin",
    eyebrow: "Platform Oversight · Demo",
    title: "Admin Workspace",
    description:
      "Oversee partner verification, catalogue moderation, and customer orders.",
    basePath: "/admin",
    links: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/partners", label: "Partners" },
      { href: "/admin/catalogue", label: "Catalogue" },
      { href: "/admin/orders", label: "Orders" },
    ],
  },
};

export function getWorkspaceConfig(workspaceId: WorkspaceId): WorkspaceDefinition {
  return WORKSPACE_CONFIG[workspaceId];
}

export function getWorkspaceLinks(
  workspaceId: WorkspaceId
): readonly WorkspaceNavLink[] {
  return WORKSPACE_CONFIG[workspaceId].links;
}

export interface WorkspaceAccessEvaluation {
  allowed: boolean;
  currentRole: MockRole;
  requiredRole: WorkspaceRole;
}

/**
 * Pure access evaluation for mock role-guarded workspace routes.
 * Never mutates or silently switches user roles.
 */
export function evaluateWorkspaceAccess(
  currentRole: MockRole,
  requiredRole: WorkspaceRole
): WorkspaceAccessEvaluation {
  return {
    allowed: currentRole === requiredRole,
    currentRole,
    requiredRole,
  };
}

export function getDefaultLandingRouteForRole(role: MockRole): string {
  switch (role) {
    case "customer":
      return "/shop";
    case "seller":
      return "/seller";
    case "tailor":
      return "/tailor";
    case "admin":
      return "/admin";
    case "guest":
    default:
      return "/";
  }
}

export function getRoleDisplayLabel(role: MockRole): string {
  switch (role) {
    case "customer":
      return "Customer";
    case "seller":
      return "Seller";
    case "tailor":
      return "Partner Tailor";
    case "admin":
      return "Admin";
    case "guest":
    default:
      return "Guest";
  }
}
