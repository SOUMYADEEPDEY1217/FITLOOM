"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, LogOut, ShoppingBag, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getValidWishlistCount } from "@/lib/compare-wishlist-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import {
  getRoleNavigation,
  getVisiblePrimaryNavLinks,
  isNavLinkActive,
} from "@/components/layout/nav-config";

export function useMobileDrawerController(pathname: string) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const prevOpenRef = useRef(false);

  const openDrawer = useCallback(() => {
    shouldRestoreFocusRef.current = false;
    setMobileOpen(true);
  }, []);

  const closeDrawer = useCallback(
    (options?: { restoreFocus?: boolean }) => {
      shouldRestoreFocusRef.current = Boolean(options?.restoreFocus);
      setMobileOpen(false);
    },
    []
  );

  const toggleDrawer = useCallback(() => {
    setMobileOpen((prev) => {
      if (prev) {
        shouldRestoreFocusRef.current = true;
        return false;
      }
      shouldRestoreFocusRef.current = false;
      return true;
    });
  }, []);

  useEffect(() => {
    shouldRestoreFocusRef.current = false;
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePopState() {
      shouldRestoreFocusRef.current = false;
      setMobileOpen(false);
    }

    const mq = window.matchMedia("(min-width: 1024px)");
    function handleMediaChange(e: MediaQueryListEvent) {
      if (e.matches) {
        shouldRestoreFocusRef.current = false;
        setMobileOpen(false);
      }
    }

    window.addEventListener("popstate", handlePopState);
    mq.addEventListener("change", handleMediaChange);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      mq.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (prevOpenRef.current && !mobileOpen && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
    prevOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  return {
    mobileOpen,
    triggerRef,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}

export function MobileNavDrawer({
  id,
  open,
  pathname,
  onClose,
  variant = "default",
}: {
  id: string;
  open: boolean;
  pathname: string;
  onClose: (options?: { restoreFocus?: boolean }) => void;
  variant?: "default" | "hero";
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const { user, cartCount, wishlistIds, logoutMock, toast } = useFitloom();
  const roleNav = getRoleNavigation(user.role);
  const visibleNavLinks = getVisiblePrimaryNavLinks(user.role);
  const validWishlistCount = getValidWishlistCount(wishlistIds);
  const isHero = variant === "hero";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose({ restoreFocus: true });
    }
  }

  function handleSignOut() {
    logoutMock();
    onClose({ restoreFocus: false });
    toast({
      type: "info",
      title: "Signed Out",
      message: "Switched back to Guest browsing mode.",
    });
  }

  const baseStyles = {
    drawer: isHero
      ? "border-[#E9DDF5] bg-[#FCF9FD] text-[#2A1434]"
      : "border-violet-100 bg-white text-slate-950",
    headerBorder: isHero ? "border-[#E9DDF5]" : "border-slate-200/80",
    headerText: isHero
      ? "text-[#1D0B24] focus-visible:ring-[#873CC1]"
      : "text-slate-950 focus-visible:ring-[#6633EE]",
    headerIconBg: isHero
      ? "bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF]"
      : "bg-[#6633EE]",
    closeBtn: isHero
      ? "border-[#4E2858]/25 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/60 focus-visible:ring-[#873CC1]"
      : "border-slate-300 bg-white text-slate-800 hover:bg-violet-50 focus-visible:ring-[#6633EE]",
    statusBorder: isHero ? "border-[#E9DDF5]/70 bg-white/70" : "border-slate-100 bg-[#FAF7FF]",
    statusText: isHero ? "text-[#2A1434]" : "text-slate-950",
    statusLabel: isHero ? "text-[#4E2858]" : "text-slate-600",
    navLinkActive: isHero
      ? "border-[#873CC1] bg-[#E9DDF5]/75 font-bold text-[#4E2858]"
      : "border-[#6633EE] bg-[#EDE9FE]/80 font-bold text-[#4C1D95]",
    navLinkInactive: isHero
      ? "border-transparent font-medium text-[#2A1434] hover:bg-[#E9DDF5]/50 hover:text-[#873CC1]"
      : "border-transparent font-medium text-slate-700 hover:bg-violet-50 hover:text-[#6633EE]",
    navLinkFocus: isHero
      ? "focus-visible:ring-[#873CC1]"
      : "focus-visible:ring-[#6633EE]",
    utilityLink: isHero
      ? "border-[#4E2858]/20 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/50 focus-visible:ring-[#873CC1]"
      : "border-slate-300 bg-white text-slate-800 hover:bg-violet-50 focus-visible:ring-[#6633EE]",
    footerBorder: isHero ? "border-[#E9DDF5] bg-white/80" : "border-slate-200/80 bg-[#FAF7FF]",
    primaryCta: isHero
      ? "bg-gradient-to-r from-[#5D145E] to-[#4E2858] hover:brightness-110 focus-visible:ring-[#873CC1]"
      : "bg-[#6633EE] hover:bg-[#5522DD] focus-visible:ring-[#6633EE]",
    secondaryCta: isHero
      ? "border-[#4E2858]/30 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/40 focus-visible:ring-[#873CC1]"
      : "border-slate-300 bg-white text-slate-800 hover:bg-violet-50 focus-visible:ring-[#6633EE]",
    accountLink: isHero
      ? "text-[#4E2858] focus-visible:ring-[#873CC1]"
      : "text-[#6633EE] focus-visible:ring-[#6633EE]",
    signOutBtn: isHero
      ? "text-[#4E2858] hover:bg-[#E9DDF5]/50 focus-visible:ring-[#873CC1]"
      : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-950 focus-visible:ring-[#6633EE]",
  };

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Mobile site menu"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose({ restoreFocus: true });
      }}
      onClose={() => {
        if (open) onClose({ restoreFocus: true });
      }}
      className="fitloom-nav-drawer"
    >
      <div
        ref={sheetRef}
        className={cn(
          "fitloom-nav-sheet ml-auto flex h-[100svh] max-h-[100dvh] w-[min(22rem,88dvw)] max-w-[calc(100dvw-1.5rem)] flex-col overflow-y-auto overscroll-contain border-l shadow-2xl",
          baseStyles.drawer
        )}
      >
        {/* Drawer Header */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b px-5 py-4",
            baseStyles.headerBorder
          )}
        >
          <Link
            href="/"
            onClick={() => onClose({ restoreFocus: false })}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2",
              baseStyles.headerText
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                baseStyles.headerIconBg
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-black tracking-[0.08em]">
              FITLOOM<sup className="ml-0.5 text-[10px] font-bold">®</sup>
            </span>
          </Link>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => onClose({ restoreFocus: true })}
            aria-label="Close navigation menu"
            className={cn(
              "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2",
              baseStyles.closeBtn
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Role & Session Status */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3",
            baseStyles.statusBorder
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-xs font-medium", baseStyles.statusLabel)}>Active Mode</p>
            <p className={cn("truncate text-sm font-bold", baseStyles.statusText)}>
              {user.role === "guest" ? "Browsing as Guest" : user.name}
            </p>
          </div>
          <Badge variant={roleNav.badgeVariant}>{roleNav.roleBadge}</Badge>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Mobile" className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {visibleNavLinks.map((link) => {
              const active = isNavLinkActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onClose({ restoreFocus: false })}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-2 rounded-xl border-l-4 px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                      baseStyles.navLinkFocus,
                      active ? baseStyles.navLinkActive : baseStyles.navLinkInactive
                    )}
                  >
                    <span className="break-words">{link.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          isHero ? "bg-[#873CC1]" : "bg-[#6633EE]"
                        )}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Utility quick links for authenticated mobile users */}
          {user.role !== "guest" && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-4">
              <Link
                href="/wishlist"
                onClick={() => onClose({ restoreFocus: false })}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                  baseStyles.utilityLink
                )}
              >
                <Heart className="h-3.5 w-3.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                <span>Wishlist ({validWishlistCount})</span>
              </Link>
              <Link
                href="/cart"
                onClick={() => onClose({ restoreFocus: false })}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                  baseStyles.utilityLink
                )}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Cart ({cartCount})</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Role-Aware Footer CTAs */}
        <div
          className={cn(
            "space-y-2.5 border-t px-5 py-4",
            baseStyles.footerBorder
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={roleNav.drawerPrimary.href}
              onClick={() => onClose({ restoreFocus: false })}
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-3.5 py-2 text-center text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2",
                baseStyles.primaryCta
              )}
            >
              {roleNav.drawerPrimary.label}
            </Link>
            <Link
              href={roleNav.drawerSecondary.href}
              onClick={() => onClose({ restoreFocus: false })}
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border px-3.5 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                baseStyles.secondaryCta
              )}
            >
              {roleNav.drawerSecondary.label}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {roleNav.accountUtilityLink && (
              <Link
                href={roleNav.accountUtilityLink.href}
                onClick={() => onClose({ restoreFocus: false })}
                className={cn(
                  "inline-flex min-h-8 items-center text-xs font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 rounded",
                  baseStyles.accountLink
                )}
              >
                {roleNav.accountUtilityLink.label} →
              </Link>
            )}
            {user.role !== "guest" && (
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  "inline-flex min-h-8 cursor-pointer items-center gap-1 rounded px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2",
                  baseStyles.signOutBtn
                )}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}