"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Layers,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { MockGarment, computeMockFitPreview } from "@/lib/mock-data";
import {
  INITIAL_SHOP_FILTERS,
  PRICE_RANGE_OPTIONS,
  PriceRangeKey,
  SORT_OPTIONS,
  ShopFilterState,
  ShopSortKey,
  countActiveFilters,
  deriveCategoryDiscovery,
  deriveFilterFacets,
  filterAndSortGarments,
} from "@/lib/shop-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PREFERRED_FIT_ORDER = ["All", "Regular", "Slim", "Relaxed"] as const;

function orderFitTypes(fitTypes: readonly string[]): string[] {
  const rank = new Map<string, number>(
    PREFERRED_FIT_ORDER.map((label, idx) => [label, idx])
  );
  return [...fitTypes].sort((a, b) => {
    const ra = rank.get(a) ?? 99;
    const rb = rank.get(b) ?? 99;
    return ra !== rb ? ra - rb : a.localeCompare(b);
  });
}

function ShopQuerySync({
  validCategories,
  onSyncQuery,
  onSyncCategory,
}: {
  validCategories: readonly string[];
  onSyncQuery: (q: string) => void;
  onSyncCategory: (cat: string) => void;
}) {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category");

  useEffect(() => {
    onSyncQuery(qParam);
  }, [qParam, onSyncQuery]);

  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam)) {
      onSyncCategory(categoryParam);
    }
  }, [categoryParam, validCategories, onSyncCategory]);

  return null;
}

export default function ShopPage() {
  const router = useRouter();
  const {
    user,
    bodyProfile,
    eligibleCustomerGarments,
    addToCart,
    wishlistIds,
    toggleWishlist,
    toast,
  } = useFitloom();

  const [filters, setFilters] = useState<ShopFilterState>(INITIAL_SHOP_FILTERS);
  const [showRefineBar, setShowRefineBar] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addTimerRef.current) clearTimeout(addTimerRef.current);
    };
  }, []);

  const categoryCards = useMemo(
    () => deriveCategoryDiscovery(eligibleCustomerGarments),
    [eligibleCustomerGarments]
  );
  const facets = useMemo(
    () => deriveFilterFacets(eligibleCustomerGarments),
    [eligibleCustomerGarments]
  );
  const orderedFitTypes = useMemo(
    () => orderFitTypes(facets.fitTypes),
    [facets.fitTypes]
  );
  const filteredGarments = useMemo(
    () => filterAndSortGarments(eligibleCustomerGarments, filters),
    [eligibleCustomerGarments, filters]
  );

  const activeFilterCount = countActiveFilters(filters);

  const handleSyncQuery = useCallback((q: string) => {
    setFilters((prev) => (prev.query === q ? prev : { ...prev, query: q }));
  }, []);

  const handleSyncCategory = useCallback((cat: string) => {
    setFilters((prev) =>
      prev.category === cat ? prev : { ...prev, category: cat }
    );
  }, []);

  function updateFilters(patch: Partial<ShopFilterState>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function resetAllFilters() {
    setFilters(INITIAL_SHOP_FILTERS);
  }

  function handleAddToCart(garment: MockGarment) {
    if (user.role === "guest") {
      toast({
        type: "info",
        title: "Sign-In Required",
        message: "Please sign in to add garments to your shopping bag.",
      });
      router.push("/login?next=%2Fcart");
      return;
    }
    const rec = computeMockFitPreview(bodyProfile, garment);
    addToCart({
      garmentId: garment.id,
      name: garment.name,
      size: rec.recommendedSize,
      priceInr: garment.priceInr,
    });
    setJustAddedId(garment.id);
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(() => setJustAddedId(null), 1600);
    toast({
      type: "success",
      title: "Added to Cart",
      message: `${garment.name} (Size ${rec.recommendedSize}) added to your shopping bag.`,
      action: { label: "View Cart", href: "/cart" },
    });
  }

  function handleToggleWishlist(garment: MockGarment) {
    if (user.role === "guest") {
      toast({
        type: "info",
        title: "Sign-In Required",
        message: "Please sign in to save garments to your wishlist.",
      });
      router.push("/login?next=%2Fwishlist");
      return;
    }
    const removing = wishlistIds.includes(garment.id);
    toggleWishlist(garment.id);
    toast({
      type: removing ? "info" : "success",
      title: removing ? "Removed from Wishlist" : "Saved to Wishlist",
      message: `${garment.name} ${removing ? "removed from" : "saved to"} your wishlist.`,
      action: removing ? undefined : { label: "View Wishlist", href: "/wishlist" },
    });
  }

  return (
    <div className="w-full pb-10">
      <Suspense fallback={null}>
        <ShopQuerySync
          validCategories={facets.categories}
          onSyncQuery={handleSyncQuery}
          onSyncCategory={handleSyncCategory}
        />
      </Suspense>

      {/* 1. Full-Bleed Soft Lavender Marketplace Hero Banner */}
      <section
        aria-labelledby="marketplace-hero-heading"
        className="relative w-full overflow-hidden border-b border-[#EAE2F8]/80 bg-gradient-to-r from-[#FAF7FF] via-[#F2EBFC] to-[#DFCEFA]"
      >
        {/* Subtle decorative ambient glow & white editorial arc */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full bg-[#B794F6]/30 blur-2xl lg:block"
        />

        <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center lg:grid-cols-12">
          {/* Left Copy, Actions & Capability Indicators */}
          <div className="relative z-20 px-4 py-8 sm:px-6 sm:py-10 lg:col-span-6 lg:px-8 lg:py-12">
            {/* FITLOOM MARKETPLACE Pill Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DFD2F8] bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-[#5B21B6] shadow-2xs">
              <ShoppingBag className="h-3.5 w-3.5 text-[#7E2DF2]" aria-hidden="true" />
              <span>FITLOOM MARKETPLACE</span>
            </div>

            <h1
              id="marketplace-hero-heading"
              className="mt-4 text-3xl font-extrabold tracking-tight text-[#1A0E24] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]"
            >
              Fit. Style.{" "}
              <span className="italic text-[#7E2DF2]">Your Way.</span>
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4A3A59] sm:text-[15px]">
              Discover fashion, understand your fit, and explore custom
              tailoring in one place.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#marketplace-collection"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(126,45,242,0.28)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>Shop Collection</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <Link
                href="/customfit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DDD0F6] bg-white/95 px-6 text-sm font-semibold text-[#1D0B24] shadow-2xs transition-colors hover:border-[#7E2DF2]/60 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
              >
                <Scissors className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                <span>Try CUSTOMFIT</span>
              </Link>
            </div>

            {/* Feature Indicators */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-[#E1D4F7]/80 pt-4 text-xs font-medium text-[#3B2A4D]">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E6DCF8] bg-white/90 text-[#7E2DF2] shadow-2xs">
                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Body Profile Sizing
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E6DCF8] bg-white/90 text-[#7E2DF2] shadow-2xs">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Transparent Garment Specs
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E6DCF8] bg-white/90 text-[#7E2DF2] shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                Optional CUSTOMFIT
              </span>
            </div>
          </div>

          {/* Right Fashion-Model Showcase + Floating Capability Callouts */}
          <div className="relative h-72 w-full sm:h-80 lg:col-span-6 lg:h-[380px]">
            {/* Seamless Dual-Edge Blend Mask over Existing FITLOOM Editorial Asset */}
            <div className="relative h-full w-full overflow-hidden lg:[mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_86%,transparent_100%)]">
              <Image
                src="/assets/hero-editorial.jpg"
                alt="FITLOOM fashion models showcasing coordinated technical outerwear"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-[48%_12%]"
              />
            </div>

            {/* Subtle Orbital Accent Curve (Desktop/Tablet) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 600 120"
              className="pointer-events-none absolute bottom-3 left-0 z-10 hidden w-full opacity-75 sm:block"
            >
              <path
                d="M 20 85 Q 300 125 580 55"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Floating Size Intelligence Badge */}
            <Link
              href="/fit-check"
              className="absolute left-4 top-8 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/85 bg-white/92 px-3.5 py-2.5 shadow-[0_10px_28px_rgba(91,33,182,0.12)] backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:flex lg:left-2 lg:top-16"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3ECFE] text-[#7E2DF2]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold leading-tight text-[#1D0B24]">
                  Size Intelligence
                </span>
                <span className="block text-[11px] leading-tight text-slate-500">
                  Find your perfect fit
                </span>
              </span>
            </Link>

            {/* Floating Custom Tailoring Badge */}
            <Link
              href="/customfit"
              className="absolute bottom-8 right-4 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/85 bg-white/92 px-3.5 py-2.5 shadow-[0_10px_28px_rgba(91,33,182,0.12)] backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:flex lg:bottom-12 lg:right-6"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3ECFE] text-[#7E2DF2]">
                <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-left">
                <span className="block text-xs font-bold leading-tight text-[#1D0B24]">
                  Custom Tailoring
                </span>
                <span className="block text-[11px] leading-tight text-slate-500">
                  Made for your style
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Contained Marketplace Sections */}
      <div className="mx-auto w-full max-w-[1440px] space-y-10 px-4 pt-6 sm:px-6 lg:px-8">
        {/* 2. Shop by Category */}
        <section aria-labelledby="shop-by-category-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="shop-by-category-heading"
              className="text-xl font-extrabold tracking-tight text-[#1A0E24]"
            >
              Shop by Category
            </h2>
            {filters.category !== "All" ? (
              <button
                type="button"
                onClick={() => updateFilters({ category: "All" })}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline sm:text-sm"
              >
                Browse All Pieces
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : (
              <a
                href="#marketplace-collection"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline sm:text-sm"
              >
                Browse All Pieces
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {/* All Pieces Card */}
            <button
              type="button"
              aria-pressed={filters.category === "All"}
              onClick={() => updateFilters({ category: "All" })}
              className={cn(
                "group flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-white px-3 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                filters.category === "All"
                  ? "border-2 border-[#7E2DF2] shadow-[0_8px_22px_rgba(126,45,242,0.14)]"
                  : "border border-[#EAE2F8] hover:border-[#C4B5FD] hover:shadow-xs"
              )}
            >
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#F5F1FC] p-2">
                <Image
                  src="/assets/footer/jacket.webp"
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="mt-2.5 text-xs font-bold text-[#1A0E24] sm:text-[13px]">
                All Pieces
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">
                {eligibleCustomerGarments.length} items
              </span>
            </button>

            {/* Dynamic Categories from Actual Catalogue */}
            {categoryCards.map((cat) => {
              const active = filters.category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateFilters({ category: cat.name })}
                  className={cn(
                    "group flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-white px-3 py-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                    active
                      ? "border-2 border-[#7E2DF2] shadow-[0_8px_22px_rgba(126,45,242,0.14)]"
                      : "border border-[#EAE2F8] hover:border-[#C4B5FD] hover:shadow-xs"
                  )}
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-[#F7F4FC]">
                    {cat.previewImage ? (
                      <Image
                        src={cat.previewImage}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundColor: cat.previewSwatchHex || "#EDE9FE",
                        }}
                      />
                    )}
                  </div>
                  <span className="mt-2.5 text-xs font-bold text-[#1A0E24] sm:text-[13px]">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {cat.count} {cat.count === 1 ? "item" : "items"}
                  </span>
                </button>
              );
            })}

            {/* CUSTOMFIT Category Shortcut */}
            <Link
              href="/customfit"
              className="group flex flex-col items-center justify-center rounded-2xl border border-[#EAE2F8] bg-white px-3 py-4 text-center transition-all hover:border-[#C4B5FD] hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3ECFE] text-[#6633EE] transition-transform duration-300 group-hover:scale-105">
                <Scissors className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="mt-2.5 text-xs font-bold text-[#1A0E24] sm:text-[13px]">
                CUSTOMFIT
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">
                Tailored
              </span>
            </Link>
          </div>
        </section>

        {/* 3. Trending Now / Product Grid */}
        <section
          id="marketplace-collection"
          aria-labelledby="trending-now-heading"
          className="space-y-5 scroll-mt-24"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2
                id="trending-now-heading"
                className="text-xl font-extrabold tracking-tight text-[#1A0E24]"
              >
                Trending Now
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Curated pieces from the FITLOOM collection, sized against your
                Body Profile.
              </p>
            </div>

            {/* Fit Filter Tabs + Refine Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="group"
                aria-label="Filter by garment fit type"
                className="inline-flex flex-wrap items-center rounded-full border border-[#E6DCF8] bg-white p-1 shadow-2xs"
              >
                {orderedFitTypes.map((fit) => {
                  const active = filters.fitType === fit;
                  return (
                    <button
                      key={fit}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateFilters({ fitType: fit })}
                      className={cn(
                        "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                        active
                          ? "bg-gradient-to-r from-[#7E2DF2] to-[#6633EE] text-white shadow-[0_4px_12px_rgba(126,45,242,0.28)]"
                          : "text-slate-600 hover:text-[#6633EE]"
                      )}
                    >
                      {fit}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-expanded={showRefineBar}
                onClick={() => setShowRefineBar((prev) => !prev)}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                  showRefineBar || activeFilterCount > 0
                    ? "border-[#7E2DF2] bg-[#FAF7FF] text-[#6633EE]"
                    : "border-[#E6DCF8] bg-white text-[#1A0E24] hover:border-[#C4B5FD]"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Refine</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6633EE] px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Refine Filters Bar */}
          {showRefineBar && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EAE2F8] bg-white p-4 shadow-2xs sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="shop-price-filter"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Price Range
                </label>
                <select
                  id="shop-price-filter"
                  value={filters.priceRange}
                  onChange={(e) =>
                    updateFilters({ priceRange: e.target.value as PriceRangeKey })
                  }
                  className="mt-1.5 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-[#1D0B24] focus:border-[#7E2DF2] focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]"
                >
                  {PRICE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="shop-size-filter"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Available Size
                </label>
                <select
                  id="shop-size-filter"
                  value={filters.size}
                  onChange={(e) => updateFilters({ size: e.target.value })}
                  className="mt-1.5 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-[#1D0B24] focus:border-[#7E2DF2] focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]"
                >
                  {facets.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s === "All" ? "All Sizes" : `Size ${s}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="shop-sort-filter"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  Sort By
                </label>
                <select
                  id="shop-sort-filter"
                  value={filters.sortBy}
                  onChange={(e) =>
                    updateFilters({ sortBy: e.target.value as ShopSortKey })
                  }
                  className="mt-1.5 h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-[#1D0B24] focus:border-[#7E2DF2] focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]"
                >
                  {SORT_OPTIONS.filter((o) => o.key !== "rating-desc").map(
                    (opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-9 w-full rounded-xl border-slate-200 text-xs"
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}

          {/* Active Search Indicator */}
          {filters.query.trim() && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EAE2F8] bg-[#FAF7FF] px-3.5 py-2 text-xs text-[#2A1434]">
              <span>
                Showing <strong>{filteredGarments.length}</strong> result
                {filteredGarments.length === 1 ? "" : "s"} for{" "}
                <strong>&ldquo;{filters.query.trim()}&rdquo;</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  updateFilters({ query: "" });
                  router.replace("/shop", { scroll: false });
                }}
                className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#6633EE] hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear search
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredGarments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DFD2F8] bg-white p-10 text-center">
              <p className="text-base font-bold text-[#1D0B24]">
                No matching garments found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search or selecting another category.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={resetAllFilters}
                className="mt-4 rounded-xl bg-[#6633EE] text-white hover:bg-[#5525D0]"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredGarments.map((garment) => {
                const isWished = wishlistIds.includes(garment.id);
                const rec = computeMockFitPreview(bodyProfile, garment);
                const added = justAddedId === garment.id;

                return (
                  <article
                    key={garment.id}
                    className="group flex flex-col justify-between rounded-2xl border border-[#EAE2F8] bg-white p-3 shadow-[0_2px_12px_rgba(29,11,36,0.03)] transition-all duration-200 hover:border-[#C4B5FD] hover:shadow-[0_10px_28px_rgba(102,51,238,0.1)]"
                  >
                    <div>
                      {/* Product Image with Crisp Inset Card Framing */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#F7F4FC]">
                        <Link
                          href={`/shop/${garment.id}`}
                          className="block h-full w-full"
                        >
                          {garment.image ? (
                            <Image
                              src={garment.image}
                              alt={`${garment.name} in ${garment.color}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-6">
                              <div
                                className="h-24 w-20 rounded-xl border border-black/10"
                                style={{
                                  backgroundColor:
                                    garment.swatchHex || "#E2E8F0",
                                }}
                              />
                            </div>
                          )}
                        </Link>

                        {/* Floating Wishlist Heart Button */}
                        <button
                          type="button"
                          aria-label={
                            isWished
                              ? `Remove ${garment.name} from wishlist`
                              : `Save ${garment.name} to wishlist`
                          }
                          aria-pressed={isWished}
                          onClick={() => handleToggleWishlist(garment)}
                          className={cn(
                            "absolute right-2.5 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm backdrop-blur-xs transition-all hover:scale-105 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                            isWished && "text-rose-500 hover:text-rose-600"
                          )}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              isWished && "fill-rose-500 text-rose-500"
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="px-1 pt-3.5">
                        <Link
                          href={`/shop/${garment.id}`}
                          className="block truncate text-[15px] font-bold text-[#1A0E24] transition-colors hover:text-[#6633EE]"
                        >
                          {garment.name}
                        </Link>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="text-[15px] font-extrabold text-[#1A0E24]">
                            ₹{garment.priceInr.toLocaleString("en-IN")}
                          </span>
                          <span className="shrink-0 text-[11px] font-medium text-slate-500">
                            {garment.category} · {garment.fitType}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {garment.fabric}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3.5 flex items-center gap-2 px-1 pb-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddToCart(garment)}
                        className={cn(
                          "h-9 flex-1 cursor-pointer rounded-xl text-xs font-semibold transition-all",
                          added
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gradient-to-r from-[#7E2DF2] to-[#6633EE] text-white shadow-[0_4px_12px_rgba(126,45,242,0.22)] hover:brightness-110"
                        )}
                      >
                        {added ? (
                          <>
                            <CheckCircle2
                              className="mr-1.5 h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Added ({rec.recommendedSize})
                          </>
                        ) : (
                          <>
                            <ShoppingBag
                              className="mr-1.5 h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Add Size {rec.recommendedSize}
                          </>
                        )}
                      </Button>
                      <Link
                        href={`/shop/${garment.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#E2D9F3] bg-white px-3.5 text-xs font-semibold text-[#1A0E24] transition-colors hover:border-[#7E2DF2]/60 hover:bg-violet-50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
                      >
                        Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
