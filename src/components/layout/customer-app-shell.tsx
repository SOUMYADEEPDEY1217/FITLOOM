"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Heart,
  Home,
  Layers,
  LogOut,
  MapPin,
  Menu,
  Package,
  Ruler,
  Scissors,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { getValidWishlistCount } from "@/lib/compare-wishlist-utils";
import { cn } from "@/lib/utils";

interface DrawerNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  matchPaths: readonly string[];
  matchHash?: string;
  badgeCount?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CustomerAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/shop";
  const router = useRouter();
  const { user, cartCount, wishlistIds, orders, logoutMock, toast } =
    useFitloom();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [selectedNavId, setSelectedNavId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const shouldRestoreFocusRef = useRef(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const validWishlistCount = getValidWishlistCount(wishlistIds);
  const customerOrders = useMemo(
    () => getCustomerOrders(orders, user),
    [orders, user]
  );

  const closeDrawer = useCallback((restoreFocus = false) => {
    shouldRestoreFocusRef.current = restoreFocus;
    setDrawerOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    shouldRestoreFocusRef.current = false;
    setProfileOpen(false);
    setNotifOpen(false);
    setDrawerOpen(true);
  }, []);

  // Sync top search input & current hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCurrentHash(window.location.hash || "");
    if (pathname === "/shop") {
      const q = new URLSearchParams(window.location.search).get("q") ?? "";
      setSearchValue(q);
    }
  }, [pathname]);

  // Listen to hashchange and popstate so Back/Forward updates active item and closes drawer
  useEffect(() => {
    if (typeof window === "undefined") return;
    function syncUrlState() {
      setCurrentHash(window.location.hash || "");
      setSelectedNavId(null);
      setDrawerOpen(false);
    }
    window.addEventListener("hashchange", syncUrlState);
    window.addEventListener("popstate", syncUrlState);
    return () => {
      window.removeEventListener("hashchange", syncUrlState);
      window.removeEventListener("popstate", syncUrlState);
    };
  }, []);

  // Automatically close drawer and popovers when pathname changes
  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Close popovers on outside click or Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Control native <dialog> modal state, focus management, and background scroll lock
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (drawerOpen) {
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = "";
      if (shouldRestoreFocusRef.current) {
        shouldRestoreFocusRef.current = false;
        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navItems: readonly DrawerNavItem[] = useMemo(
    () => [
      {
        id: "shop",
        label: "Shop / Marketplace",
        href: "/shop",
        icon: ShoppingBag,
        matchPaths: ["/shop"],
      },
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: Home,
        matchPaths: ["/dashboard"],
      },
      {
        id: "orders",
        label: "Orders & Tracking",
        href: "/orders",
        icon: Package,
        matchPaths: ["/orders"],
      },
      {
        id: "customfit",
        label: "CUSTOMFIT",
        href: "/customfit",
        icon: Scissors,
        matchPaths: ["/customfit"],
      },
      {
        id: "fit-check",
        label: "Fit Check & History",
        href: "/fit-check",
        icon: Layers,
        matchPaths: ["/fit-check"],
      },
      {
        id: "body-profile",
        label: "Body Profile",
        href: "/body-profile",
        icon: User,
        matchPaths: ["/body-profile"],
      },
      {
        id: "measurements",
        label: "Measurements",
        href: "/body-profile#saved-profile-heading",
        icon: Ruler,
        matchPaths: ["/body-profile"],
        matchHash: "#saved-profile-heading",
      },
      {
        id: "wardrobe",
        label: "Virtual Wardrobe",
        href: "/saved-looks",
        icon: Shirt,
        matchPaths: ["/saved-looks", "/studio", "/try-on"],
      },
      {
        id: "wishlist",
        label: "Wishlist",
        href: "/wishlist",
        icon: Heart,
        matchPaths: ["/wishlist"],
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/orders",
        icon: Bell,
        matchPaths: ["/orders"],
        badgeCount: customerOrders.length > 0 ? customerOrders.length : undefined,
      },
      {
        id: "addresses",
        label: "Addresses",
        href: "/account#personal-info-heading",
        icon: MapPin,
        matchPaths: ["/account"],
        matchHash: "#personal-info-heading",
      },
      {
        id: "account",
        label: "Account & Security",
        href: "/account",
        icon: Settings,
        matchPaths: ["/account"],
      },
    ],
    [customerOrders.length]
  );

  function isItemActive(item: DrawerNavItem): boolean {
    const clean = pathname.replace(/\/+$/, "") || "/";
    const pathMatches = item.matchPaths.some(
      (base) => clean === base || clean.startsWith(`${base}/`)
    );
    if (!pathMatches) return false;

    // If user explicitly clicked one of the shared-route items (e.g., Measurements vs Body Profile, Notifications vs Orders, Addresses vs Account)
    if (selectedNavId && selectedNavId === item.id) {
      return true;
    }

    if (clean === "/body-profile") {
      if (item.id === "measurements") {
        return (
          selectedNavId === "measurements" ||
          currentHash === "#saved-profile-heading"
        );
      }
      if (item.id === "body-profile") {
        return (
          selectedNavId !== "measurements" &&
          currentHash !== "#saved-profile-heading"
        );
      }
    }

    if (clean === "/account") {
      if (item.id === "addresses") {
        return (
          selectedNavId === "addresses" ||
          currentHash === "#personal-info-heading"
        );
      }
      if (item.id === "account") {
        return (
          selectedNavId !== "addresses" &&
          currentHash !== "#personal-info-heading"
        );
      }
    }

    if (clean === "/orders" || clean.startsWith("/orders/")) {
      if (item.id === "notifications") {
        return selectedNavId === "notifications";
      }
      if (item.id === "orders") {
        return selectedNavId !== "notifications";
      }
    }

    return true;
  }

  function handleNavItemClick(item: DrawerNavItem) {
    setSelectedNavId(item.id);
    if (item.matchHash) {
      setCurrentHash(item.matchHash);
    } else {
      setCurrentHash("");
    }
    closeDrawer(false);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      closeDrawer(true);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    const target = trimmed
      ? `/shop?q=${encodeURIComponent(trimmed)}`
      : "/shop";
    if (pathname === "/shop") {
      router.replace(target);
    } else {
      router.push(target);
    }
  }

  function handleSearchChange(val: string) {
    setSearchValue(val);
    if (pathname === "/shop") {
      const trimmed = val.trim();
      router.replace(
        trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop",
        { scroll: false }
      );
    }
  }

  function handleSignOut() {
    logoutMock();
    setProfileOpen(false);
    closeDrawer(false);
    toast({
      type: "info",
      title: "Signed Out",
      message: "Returned to public guest browsing mode.",
    });
    router.push("/");
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col bg-[#FCFBFF]">
      {/* Single On-Demand Left Navigation Drawer (Desktop, Tablet & Mobile) */}
      <dialog
        ref={dialogRef}
        id="customer-nav-drawer"
        aria-label="Customer navigation drawer"
        onClick={handleBackdropClick}
        onCancel={(e) => {
          e.preventDefault();
          closeDrawer(true);
        }}
        className="fitloom-nav-drawer"
      >
        <div
          ref={sheetRef}
          className="fitloom-nav-sheet-left mr-auto flex h-[100svh] max-h-[100dvh] w-[min(18.5rem,86dvw)] max-w-[calc(100dvw-1.5rem)] flex-col justify-between overflow-y-auto overscroll-contain border-r border-[#EAE2F8] bg-[#FAF8FE] shadow-2xl"
        >
          <div>
            {/* Drawer Header: Brand Logo + Close Button */}
            <div className="flex h-16 items-center justify-between border-b border-[#EAE2F8] px-5">
              <Link
                href="/"
                onClick={() => closeDrawer(false)}
                className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_4px_12px_rgba(126,45,242,0.3)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-lg font-extrabold tracking-[0.12em] text-[#1D0B24]">
                  FITLOOM<sup className="ml-0.5 text-[10px] font-semibold">®</sup>
                </span>
              </Link>

              <button
                ref={closeBtnRef}
                type="button"
                aria-label="Close customer navigation menu"
                onClick={() => closeDrawer(true)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#E5DAF5] bg-white text-[#2A1434] transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
              >
                <X className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </div>

            {/* 12 Customer Navigation Items */}
            <nav
              aria-label="Customer navigation"
              className="mt-2 space-y-0.5 px-3"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => handleNavItemClick(item)}
                    className={cn(
                      "flex min-h-10 items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                      active
                        ? "bg-gradient-to-r from-[#7E2DF2] to-[#6633EE] text-white shadow-[0_6px_16px_rgba(126,45,242,0.26)]"
                        : "text-[#2A1434]/85 hover:bg-[#EFE8FC]/85 hover:text-[#6633EE]"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-white" : "text-[#4E2858]/75"
                        )}
                        aria-hidden={true}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badgeCount !== undefined && (
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          active
                            ? "bg-white/25 text-white"
                            : "bg-[#7E2DF2] text-white"
                        )}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* CUSTOMFIT Drawer Promo Card */}
          <div className="p-3.5 pt-4">
            <div className="relative overflow-hidden rounded-2xl border border-[#DFD2F8] bg-gradient-to-br from-[#F4EEFE] via-[#ECE2FD] to-[#E2D4FA] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-snug text-[#1D0B24]">
                    Need a Custom Fit?
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#4E2858]/85">
                    Get tailored clothing with CUSTOMFIT.
                  </p>
                </div>
                <Image
                  src="/assets/hero/item-jacket.webp"
                  alt=""
                  width={52}
                  height={52}
                  className="h-13 w-13 shrink-0 object-contain drop-shadow-xs"
                />
              </div>
              <Link
                href="/customfit"
                onClick={() => {
                  setSelectedNavId("customfit");
                  closeDrawer(false);
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#6633EE] px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
              >
                <span>Create Request</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </dialog>

      {/* Clean Full-Width Marketplace Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-[#EAE2F8] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2.5 px-3 sm:gap-4 sm:px-6 lg:px-8">
          {/* Left: Hamburger Menu Button + Brand Logo + Search */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3.5">
            <button
              ref={triggerRef}
              type="button"
              aria-label="Open customer navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="customer-nav-drawer"
              onClick={openDrawer}
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5DAF5] bg-white text-[#2A1434] transition-colors hover:border-[#7E2DF2]/50 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_4px_12px_rgba(126,45,242,0.28)]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden text-base font-extrabold tracking-[0.12em] text-[#1D0B24] sm:inline">
                FITLOOM<sup className="ml-0.5 text-[10px] font-semibold">®</sup>
              </span>
            </Link>

            {/* Live Marketplace Search */}
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="relative min-w-0 flex-1 max-w-md"
            >
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search garments"
                placeholder="Search for shirts, trousers, jackets..."
                className="h-10 w-full rounded-full border border-[#E6DCF7] bg-[#F7F4FC] pl-10 pr-4 text-xs text-[#1D0B24] placeholder:text-slate-400 transition-colors focus:border-[#7E2DF2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4B5FD] sm:text-sm"
              />
            </form>
          </div>

          {/* Right: Notifications, Wishlist, Cart, Customer Profile Dropdown */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {/* Notifications Popover */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                aria-label={`Notifications (${customerOrders.length} active order updates)`}
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#EAE2F8] bg-white text-[#2A1434] transition-colors hover:border-[#7E2DF2]/50 hover:bg-violet-50/70 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {customerOrders.length > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#7E2DF2] px-1 text-[10px] font-bold text-white">
                    {customerOrders.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="region"
                  aria-label="Order notifications"
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#EAE2F8] bg-white p-3 shadow-xl sm:w-80"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-[#1D0B24]">
                      Order Activity
                    </span>
                    <Link
                      href="/orders"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-semibold text-[#6633EE] hover:underline"
                    >
                      View Orders
                    </Link>
                  </div>
                  {customerOrders.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">
                      No active notifications right now.
                    </p>
                  ) : (
                    <ul className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
                      {customerOrders.slice(0, 4).map((ord) => (
                        <li key={ord.id}>
                          <Link
                            href={`/orders/${encodeURIComponent(ord.id)}`}
                            onClick={() => setNotifOpen(false)}
                            className="block rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-violet-50/70"
                          >
                            <p className="font-semibold text-[#1D0B24]">
                              Order {ord.id}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600">
                              Status: {ord.stage}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Shortcut */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist with ${validWishlistCount} items`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAE2F8] bg-white text-[#2A1434] transition-colors hover:border-[#7E2DF2]/50 hover:bg-violet-50/70 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {validWishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#7E2DF2] px-1 text-[10px] font-bold text-white">
                  {validWishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Shortcut */}
            <Link
              href="/cart"
              aria-label={`Shopping cart with ${cartCount} items`}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAE2F8] bg-white text-[#2A1434] transition-colors hover:border-[#7E2DF2]/50 hover:bg-violet-50/70 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#7E2DF2] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Customer Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                aria-label="Customer account menu"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-1.5 py-1 transition-colors hover:border-[#EAE2F8] hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7E2DF2] to-[#4E1A6B] text-xs font-bold text-white">
                  {getInitials(user.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[110px] truncate text-xs font-bold leading-tight text-[#1D0B24]">
                    {user.name}
                  </span>
                  <span className="block text-[10px] font-medium capitalize text-slate-500">
                    {user.role}
                  </span>
                </span>
                <ChevronDown
                  className="hidden h-3.5 w-3.5 text-slate-500 sm:block"
                  aria-hidden="true"
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Account navigation"
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#EAE2F8] bg-white p-2 shadow-xl"
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-xs font-bold text-[#1D0B24]">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="truncate text-[11px] text-slate-500">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-[#6633EE]"
                    >
                      <Home className="h-3.5 w-3.5" aria-hidden="true" />
                      Dashboard
                    </Link>
                    <Link
                      href="/body-profile"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-[#6633EE]"
                    >
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      Body Profile
                    </Link>
                    <Link
                      href="/orders"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-[#6633EE]"
                    >
                      <Package className="h-3.5 w-3.5" aria-hidden="true" />
                      Orders & Tracking
                    </Link>
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-[#6633EE]"
                    >
                      <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                      Account & Security
                    </Link>
                  </div>
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Full-Width Main Workspace Content */}
      <main className="mx-auto w-full max-w-[1440px] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
