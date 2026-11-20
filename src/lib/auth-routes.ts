export type RouteCategory =
  | "public"
  | "customer"
  | "seller"
  | "tailor"
  | "admin";

export const PUBLIC_STATIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/about",
  "/contact",
  "/faq",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
  "/shop",
  "/tailor/register",
] as const;

/**
 * Classifies any application pathname into its access category.
 */
export function getRouteCategory(pathname: string): RouteCategory {
  const clean = pathname.replace(/\/+$/, "") || "/";

  // Public static routes
  if (PUBLIC_STATIC_ROUTES.includes(clean as (typeof PUBLIC_STATIC_ROUTES)[number])) {
    return "public";
  }

  // Admin workspace routes
  if (clean === "/admin" || clean.startsWith("/admin/")) {
    return "admin";
  }

  // Seller workspace routes
  if (clean === "/seller" || clean.startsWith("/seller/")) {
    return "seller";
  }

  // Tailor workspace routes (excluding public /tailor/register)
  if (clean === "/tailor" || clean.startsWith("/tailor/")) {
    return "tailor";
  }

  // All remaining routes are protected customer account / personal features:
  // /dashboard, /account, /body-profile, /fit-check, /try-on, /studio,
  // /customfit, /cart, /checkout, /wishlist, /compare, /saved-looks, /orders, /orders/*
  return "customer";
}

/**
 * Determines whether a given user role is authorized to view the requested route.
 */
export function isRouteAuthorized(pathname: string, role: string): boolean {
  const category = getRouteCategory(pathname);

  // Public routes are open to all visitors (guest and authenticated)
  if (category === "public") {
    return true;
  }

  // All non-public routes strictly require authentication (not guest)
  if (role === "guest" || !role) {
    return false;
  }

  // Admin has access across all workspaces and customer features
  if (role === "admin") {
    return true;
  }

  // Role-specific workspace boundaries
  if (category === "admin") {
    return role === "admin";
  }

  if (category === "seller") {
    return role === "seller";
  }

  if (category === "tailor") {
    return role === "tailor";
  }

  // Customer category: accessible to all authenticated users (customer, seller, tailor)
  return true;
}

/**
 * Returns true for routes that render inside the authenticated Customer
 * Marketplace shell (persistent left sidebar + marketplace top bar).
 */
export function isCustomerAppRoute(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/shop" || clean.startsWith("/shop/")) {
    return true;
  }
  return getRouteCategory(clean) === "customer";
}

/**
 * Sanitizes open-redirect targets to prevent security vulnerabilities.
 * Only allows internal relative paths starting with a single '/' and not '//' or '/\'.
 */
export function sanitizeRedirectPath(target: string | null | undefined, fallback = "/shop"): string {
  if (!target) return fallback;
  try {
    const decoded = decodeURIComponent(target).trim();
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\") &&
      decoded !== "/login" &&
      decoded !== "/signup" &&
      !decoded.startsWith("/auth/")
    ) {
      return decoded;
    }
  } catch {
    return fallback;
  }
  return fallback;
}
