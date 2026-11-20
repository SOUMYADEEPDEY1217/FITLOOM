"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { getValidWishlistCount } from "@/lib/compare-wishlist-utils";
import { isCustomerAppRoute } from "@/lib/auth-routes";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { HeroNavbar } from "@/components/hero/HeroNavbar";
import {
  getRoleNavigation,
  getVisiblePrimaryNavLinks,
  isNavLinkActive,
  NAV_LINKS,
} from "@/components/layout/nav-config";
import {
  MobileNavDrawer,
  useMobileDrawerController,
} from "@/components/layout/mobile-nav-drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";

type NavSection = (typeof NAV_LINKS)[number]["href"];

function mapPathnameToNavSection(pathname: string): NavSection | "" {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  
  for (const link of NAV_LINKS) {
    const cleanHref = link.href.replace(/\/+$/, "") || "/";
    if (cleanHref === "/") continue;
    if (cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`)) {
      return link.href as NavSection;
    }
  }
  
  return "";
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { cartCount, wishlistIds, user } = useFitloom();
  const { mobileOpen, triggerRef, closeDrawer, toggleDrawer } =
    useMobileDrawerController(pathname);

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  if (user.role === "customer" && isCustomerAppRoute(pathname)) {
    return null;
  }

  if (pathname === "/") {
    return <HeroNavbar />;
  }

  const roleNav = getRoleNavigation(user.role);
  const visibleNavLinks = getVisiblePrimaryNavLinks(user.role);
  const validWishlistCount = getValidWishlistCount(wishlistIds);

  const navOptions = visibleNavLinks.map((link) => ({
    value: link.href as NavSection,
    label: link.label,
  }));

  const activeSection = mapPathnameToNavSection(pathname);

  const handleNavChange = (value: NavSection | "") => {
    if (value && value !== activeSection) {
      router.push(value);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E9DDF5]/80 bg-[#FCF9FD]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2.5 px-3 sm:gap-3 sm:px-4 xl:gap-4 xl:px-6">
        {/* Brand */}
        <Link
          href="/"
          aria-current={isNavLinkActive(pathname, "/") ? "page" : undefined}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-md text-[#2A1434] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_4px_12px_rgba(126,45,242,0.28)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-[0.12em] text-[#1D0B24]">
            FITLOOM<sup className="ml-0.5 text-[10px] font-semibold">®</sup>
          </span>
        </Link>

        {/* Center Navigation - SegmentedControl */}
        <nav
          aria-label="Primary navigation"
          className="hidden flex-1 lg:flex lg:items-center lg:justify-center px-2"
        >
          <SegmentedControl
            variant="premium"
            options={navOptions}
            value={activeSection}
            onValueChange={handleNavChange}
            aria-label="Main navigation sections"
            className="shrink-0"
          />
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {user.role !== "guest" && (
            <>
              <Link
                href="/wishlist"
                aria-label={`Wishlist with ${validWishlistCount} items`}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4E2858]/25 bg-white/95 text-[#2A1434] transition-colors hover:border-[#873CC1]/50 hover:text-[#873CC1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
              >
                <Heart className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                {validWishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#7C2AE8] px-1 text-[10px] font-bold text-white shadow-xs">
                    {validWishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                aria-label={`Shopping cart with ${cartCount} items`}
                className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-[#4E2858]/25 bg-white/95 px-3 text-xs font-semibold text-[#2A1434] transition-colors hover:border-[#873CC1]/50 hover:text-[#873CC1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                <span className="hidden sm:inline">Cart</span>
                <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#7C2AE8] px-1.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              </Link>
            </>
          )}

          {/* Guest Auth vs Authenticated Actions */}
          {user.role === "guest" ? (
            <div className="hidden items-center gap-2 sm:inline-flex">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#4E2858]/20 bg-white/95 px-3.5 text-xs font-semibold text-[#2A1434] transition-colors hover:border-[#873CC1]/50 hover:text-[#873CC1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-[#5D145E] to-[#4E2858] px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(78,40,88,0.24)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <Link
              href={roleNav.desktopCta.href}
              className="hidden h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5D145E] to-[#4E2858] px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(78,40,88,0.24)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] sm:inline-flex"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/60">
                <User className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span>{roleNav.desktopCta.label}</span>
            </Link>
          )}

          <button
            ref={triggerRef}
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={toggleDrawer}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#4E2858]/25 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <MobileNavDrawer
        id="mobile-nav-drawer"
        open={mobileOpen}
        pathname={pathname}
        onClose={closeDrawer}
        variant="default"
      />
    </header>
  );
}