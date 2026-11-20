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
  Ruler,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
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
    <div className="space-y-8 pb-8">
      <Suspense fallback={null}>
        <ShopQuerySync
          validCategories={facets.categories}
          onSyncQuery={handleSyncQuery}
          onSyncCategory={handleSyncCategory}
        />
      </Suspense>

      {/* 1. Marketplace Editorial Hero Banner */}
      <section
        aria-labelledby="marketplace-hero-heading"
        className="relative overflow-hidden rounded-3xl border border-[#E6DCF8] bg-gradient-to-r from-[#F7F3FE] via-[#F2EBFC] to-[#E6D8FA]"
      >
        <div className="grid grid-cols-1 items-center lg:grid-cols-12">
          {/* Left Copy & Actions */}
          <div className="relative z-10 p-6 sm:p-8 lg:col-span-7 lg:p-10">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#4E2858] uppercase">
              FITLOOM
            </p>
            <h1
              id="marketplace-hero-heading"
              className="mt-2 text-3xl font-extrabold tracking-tight text-[#1D0B24] sm:text-4xl xl:text-[2.65rem] xl:leading-[1.12]"
            >
              Fit. Style.{" "}
              <span className="italic text-[#7E2DF2]">Your Way.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4E2858]/85 sm:text-base">
              Discover fashion, understand your fit, and explore custom
              tailoring in one place.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#marketplace-collection"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#6633EE] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(126,45,242,0.28)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>Shop Collection</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <Link
                href="/customfit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D8C8F5] bg-white/95 px-5 text-sm font-semibold text-[#2A1434] transition-colors hover:border-[#7E2DF2]/60 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
              >
                <Scissors className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                <span>Try CUSTOMFIT</span>
              </Link>
            </div>

            {/* Honest Capability Highlights (no fake claims) */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#DFD2F8]/80 pt-4 text-xs font-medium text-[#4E2858]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#7E2DF2]" aria-hidden="true" />
                Body Profile Sizing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-[#7E2DF2]" aria-hidden="true" />
                Transparent Garment Specs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#7E2DF2]" aria-hidden="true" />
                Optional CUSTOMFIT
              </span>
            </div>
          </div>

          {/* Right Fashion Editorial Image (existing FITLOOM asset) */}
          <div className="relative h-60 w-full sm:h-72 lg:col-span-5 lg:h-full lg:min-h-[340px]">
            <Image
              src="/assets/hero-editorial.jpg"
              alt="FITLOOM curated fashion showcase"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (backed strictly by actual available categories & routes) */}
      <section aria-labelledby="shop-by-category-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="shop-by-category-heading"
            className="text-xl font-extrabold tracking-tight text-[#1D0B24]"
          >
            Shop by Category
          </h2>
          {filters.category !== "All" ? (
            <button
              type="button"
              onClick={() => updateFilters({ category: "All" })}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Show All Categories
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <a
              href="#marketplace-collection"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Browse All Pieces
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {/* All Category Tile */}
          <button
            type="button"
            aria-pressed={filters.category === "All"}
            onClick={() => updateFilters({ category: "All" })}
            className={cn(
              "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
              filters.category === "All"
                ? "border-[#7E2DF2] bg-[#FAF7FF] ring-1 ring-[#7E2DF2]/30"
                : "border-[#EAE2F8] hover:border-[#C4B5FD] hover:bg-[#FCF9FF]"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2EBFC] text-[#6633EE]">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-[#1D0B24]">
              All Pieces
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
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
                  "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border bg-white p-3.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                  active
                    ? "border-[#7E2DF2] bg-[#FAF7FF] ring-1 ring-[#7E2DF2]/30"
                    : "border-[#EAE2F8] hover:border-[#C4B5FD] hover:bg-[#FCF9FF]"
                )}
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#F7F4FC]">
                  {cat.previewImage ? (
                    <Image
                      src={cat.previewImage}
                      alt=""
                      fill
                      sizes="48px"
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
                <span className="mt-2.5 text-xs font-bold text-[#1D0B24]">
                  {cat.name}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  {cat.count} {cat.count === 1 ? "item" : "items"}
                </span>
              </button>
            );
          })}

          {/* CUSTOMFIT Category Shortcut */}
          <Link
            href="/customfit"
            className="group flex flex-col items-center justify-center rounded-2xl border border-[#EAE2F8] bg-white p-3.5 text-center transition-all hover:border-[#C4B5FD] hover:bg-[#FCF9FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2EBFC] text-[#6633EE] transition-transform duration-300 group-hover:scale-105">
              <Scissors className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="mt-2.5 text-xs font-bold text-[#1D0B24]">
              CUSTOMFIT
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
              Tailored
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Trending Now / Collection Showcase */}
      <section
        id="marketplace-collection"
        aria-labelledby="trending-now-heading"
        className="space-y-5 scroll-mt-24"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="trending-now-heading"
              className="text-xl font-extrabold tracking-tight text-[#1D0B24]"
            >
              Trending Now
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Curated pieces from the FITLOOM collection, sized against your
              Body Profile.
            </p>
          </div>

          {/* Fit-Type Tabs (real values from MOCK_GARMENTS) + Refine Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter by garment fit type"
              className="inline-flex items-center rounded-xl border border-[#EAE2F8] bg-white p-1"
            >
              {facets.fitTypes.map((fit) => {
                const active = filters.fitType === fit;
                return (
                  <button
                    key={fit}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateFilters({ fitType: fit })}
                    className={cn(
                      "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                      active
                        ? "bg-[#6633EE] text-white"
                        : "text-slate-600 hover:bg-violet-50 hover:text-[#6633EE]"
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
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                showRefineBar || activeFilterCount > 0
                  ? "border-[#7E2DF2] bg-[#FAF7FF] text-[#6633EE]"
                  : "border-[#EAE2F8] bg-white text-slate-700 hover:border-[#C4B5FD]"
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

        {/* Collapsible Refine Filters Bar (Price, Size, Sort, Search Clear) */}
        {showRefineBar && (
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#EAE2F8] bg-white p-4 sm:grid-cols-3 lg:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredGarments.map((garment) => {
              const isWished = wishlistIds.includes(garment.id);
              const rec = computeMockFitPreview(bodyProfile, garment);
              const added = justAddedId === garment.id;

              return (
                <article
                  key={garment.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#EAE2F8] bg-white transition-all duration-200 hover:border-[#C4B5FD] hover:shadow-md"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F7F4FC]">
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
                                backgroundColor: garment.swatchHex || "#E2E8F0",
                              }}
                            />
                          </div>
                        )}
                      </Link>

                      {/* Floating Wishlist Button */}
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
                          "absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all hover:scale-105 hover:border-[#7E2DF2] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                          isWished &&
                            "border-rose-200 bg-rose-50/95 text-rose-600 hover:text-rose-700"
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

                    {/* Product Info (real data only — no fabricated ratings/reviews) */}
                    <div className="p-4">
                      <Link
                        href={`/shop/${garment.id}`}
                        className="block truncate text-sm font-bold text-[#1D0B24] transition-colors hover:text-[#6633EE]"
                      >
                        {garment.name}
                      </Link>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-[#1D0B24]">
                          ₹{garment.priceInr.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {garment.category} · {garment.fitType}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">
                        {garment.fabric}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddToCart(garment)}
                      className={cn(
                        "h-9 flex-1 cursor-pointer rounded-xl text-xs font-semibold transition-colors",
                        added
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-[#6633EE] text-white hover:bg-[#5525D0]"
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
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-[#7E2DF2]/60 hover:bg-violet-50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
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
  );
}
