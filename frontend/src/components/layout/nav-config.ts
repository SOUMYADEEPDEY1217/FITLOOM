import type { MockRole } from "@/components/providers/fitloom-provider";
import { getWorkspaceLinks } from "@/lib/workspace-config";

export interface NavLinkItem {
  href: string;
  label: string;
}

export const NAV_LINKS: readonly NavLinkItem[] = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Style Studio" },
  { href: "/fit-check", label: "Fit Check" },
  { href: "/try-on", label: "Try-On (Coming Soon)" },
  { href: "/customfit", label: "CUSTOMFIT" },
  { href: "/tailor", label: "For Tailors" },
  { href: "/about", label: "About" },
];

/**
 * Returns role-scoped primary navigation links so workspace roles
 * see only their own workspace links and never cross-workspace links.
 */
export function getVisiblePrimaryNavLinks(
  role: MockRole
): readonly NavLinkItem[] {
  if (role === "seller") {
    return getWorkspaceLinks("seller");
  }
  if (role === "tailor") {
    return getWorkspaceLinks("tailor");
  }
  if (role === "admin") {
    return getWorkspaceLinks("admin");
  }
  return NAV_LINKS;
}

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (trimmed.length > 1) {
    return trimmed.replace(/\/+$/, "");
  }
  return trimmed;
}

/**
 * Matches exact route paths and nested subroutes without false-positive
 * matches on the homepage "/" or loose substring matches.
 */
export function isNavLinkActive(pathname: string, href: string): boolean {
  const cleanPath = normalizePathname(pathname);
  const cleanHref = normalizePathname(href);

  if (cleanHref === "/") {
    return cleanPath === "/";
  }

  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
}

export interface RoleNavigationConfig {
  roleBadge: string;
  badgeVariant: "default" | "success" | "neutral" | "info" | "secondary";
  desktopCta: { href: string; label: string };
  drawerPrimary: { href: string; label: string };
  drawerSecondary: { href: string; label: string };
  accountUtilityLink?: { href: string; label: string };
}

export function getRoleNavigation(role: MockRole): RoleNavigationConfig {
  if (role === "seller") {
    return {
      roleBadge: "Seller Demo",
      badgeVariant: "info",
      desktopCta: { href: "/seller", label: "Seller Mode" },
      drawerPrimary: { href: "/seller", label: "Seller Workspace" },
      drawerSecondary: { href: "/seller/orders", label: "Seller Orders" },
      accountUtilityLink: { href: "/account", label: "Account & Role Switcher" },
    };
  }

  if (role === "tailor") {
    return {
      roleBadge: "Tailor Demo",
      badgeVariant: "default",
      desktopCta: { href: "/tailor", label: "Tailor Mode" },
      drawerPrimary: { href: "/tailor", label: "Tailor Workspace" },
      drawerSecondary: { href: "/tailor/orders", label: "Order Queue" },
      accountUtilityLink: { href: "/account", label: "Account & Role Switcher" },
    };
  }

  if (role === "admin") {
    return {
      roleBadge: "Admin Demo",
      badgeVariant: "secondary",
      desktopCta: { href: "/admin", label: "Admin Mode" },
      drawerPrimary: { href: "/admin", label: "Admin Workspace" },
      drawerSecondary: { href: "/admin/partners", label: "Partner Oversight" },
      accountUtilityLink: { href: "/account", label: "Account & Role Switcher" },
    };
  }

  if (role === "customer") {
    return {
      roleBadge: "Customer Demo",
      badgeVariant: "success",
      desktopCta: { href: "/dashboard", label: "Dashboard" },
      drawerPrimary: { href: "/dashboard", label: "Customer Dashboard" },
      drawerSecondary: { href: "/account", label: "Account & Role" },
    };
  }

  return {
    roleBadge: "Guest",
    badgeVariant: "neutral",
    desktopCta: { href: "/login", label: "Log In" },
    drawerPrimary: { href: "/login", label: "Log In" },
    drawerSecondary: { href: "/signup", label: "Sign Up" },
  };
}
