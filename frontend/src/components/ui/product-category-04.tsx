"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
} from "lucide-react";
import {
  MOCK_GARMENTS,
  INITIAL_MOCK_BODY_PROFILE,
  computeMockFitPreview,
  type MockGarment,
  type BodyProfile,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
  "All",
  "Shirts",
  "Outerwear",
  "Trousers",
  "T-Shirts",
] as const;

export interface ProductCategoryProps {
  id?: string;
  title?: string;
  subtitle?: string;
  browseShopHref?: string;
  browseShopLabel?: string;
  categories?: readonly string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  garments?: MockGarment[];
  bodyProfile?: BodyProfile | null;
  wishlistIds?: string[];
  justAddedId?: string | null;
  onAddToCart?: (garmentId: string) => void;
  onToggleWishlist?: (garmentId: string) => void;
  onProductClick?: (garmentId: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

export function ProductCategory({
  id = "featured-collection",
  title = "Featured Collection",
  subtitle = "Explore pieces across shirts, outerwear, trousers, and knit tees, sized against your active Body Profile.",
  browseShopHref = "/shop",
  browseShopLabel = "Browse Full Shop",
  categories = DEFAULT_CATEGORIES,
  selectedCategory: propCategory,
  onSelectCategory: propOnSelectCategory,
  garments = MOCK_GARMENTS,
  bodyProfile = INITIAL_MOCK_BODY_PROFILE,
  wishlistIds: propWishlistIds,
  justAddedId: propJustAddedId,
  onAddToCart,
  onToggleWishlist,
  onProductClick,
  className,
}: ProductCategoryProps) {
  const [internalCategory, setInternalCategory] = useState<string>("All");
  const [internalWishlist, setInternalWishlist] = useState<string[]>([]);
  const [internalJustAdded, setInternalJustAdded] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const trackRef = useRef<HTMLDivElement | null>(null);

  const activeCategory = propCategory ?? internalCategory;
  const activeWishlist = propWishlistIds ?? internalWishlist;
  const activeJustAdded = propJustAddedId !== undefined ? propJustAddedId : internalJustAdded;

  function handleSelectCategory(cat: string) {
    if (propOnSelectCategory) {
      propOnSelectCategory(cat);
    } else {
      setInternalCategory(cat);
    }
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  function handleAddToCart(garmentId: string) {
    if (onAddToCart) {
      onAddToCart(garmentId);
    } else {
      setInternalJustAdded(garmentId);
      setTimeout(() => setInternalJustAdded(null), 1600);
    }
  }

  function handleToggleWishlist(garmentId: string) {
    if (onToggleWishlist) {
      onToggleWishlist(garmentId);
    } else {
      setInternalWishlist((prev) =>
        prev.includes(garmentId)
          ? prev.filter((id) => id !== garmentId)
          : [...prev, garmentId]
      );
    }
  }

  const filteredGarments =
    activeCategory === "All"
      ? garments
      : garments.filter((g) => g.category.toLowerCase() === activeCategory.toLowerCase());

  function scrollCarousel(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const step = Math.max(280, Math.round(track.clientWidth * 0.75));
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * step,
      behavior: prefersReduced ? "auto" : "smooth",
    });
    setStatusMessage(
      direction > 0
        ? "Scrolled forward in featured collection."
        : "Scrolled backward in featured collection."
    );
  }

  const effectiveProfile = bodyProfile ?? INITIAL_MOCK_BODY_PROFILE;

  return (
    <section
      id={id}
      aria-labelledby="featured-collection-heading"
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24",
        className
      )}
    >
      {/* Editorial Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <h2
            id="featured-collection-heading"
            className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            {title}
          </h2>
          <p className="fitloom-prose-pretty max-w-[60ch] text-sm leading-relaxed text-slate-600 sm:text-base">
            {subtitle}
          </p>
        </div>

        <Link
          href={browseShopHref}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 shadow-2xs transition-colors hover:border-[#6633EE]/60 hover:bg-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
        >
          {browseShopLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Category Filter Pills & Carousel Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter featured collection by category"
        >
          {categories.map((cat) => {
            const active = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                aria-pressed={active}
                className={cn(
                  "min-h-9 cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  active
                    ? "border-[#6633EE] bg-[#6633EE] text-white shadow-2xs shadow-purple-500/20"
                    : "border-slate-300 bg-white text-slate-700 hover:border-[#6633EE]/50 hover:bg-violet-50/60"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            aria-label="Previous garments"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-2xs transition-colors hover:border-[#6633EE] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Next garments"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-2xs transition-colors hover:border-[#6633EE] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Featured Collection Showcase / Carousel */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured fashion garments"
        className="mt-6 min-w-0"
      >
        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label="Featured garment items"
          className="fitloom-carousel-track pb-4 pt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded-2xl"
        >
          {filteredGarments.map((garment, idx) => {
            const isWished = activeWishlist.includes(garment.id);
            const rec = computeMockFitPreview(effectiveProfile, garment);
            const added = activeJustAdded === garment.id;

            return (
              <article
                key={garment.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} of ${filteredGarments.length}: ${garment.name}`}
                className="group flex w-[280px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:border-violet-300/80 hover:shadow-md sm:w-[310px]"
              >
                <div className="flex flex-1 flex-col">
                  {/* Image showcase area */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-violet-100/70 bg-[#FAF7FC]">
                    <Link
                      href={`/shop/${garment.id}`}
                      onClick={(e) => onProductClick?.(garment.id, e)}
                      className="block h-full w-full"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <Image
                        src={
                          garment.image ??
                          "/assets/products/sky-oxford-shirt.png"
                        }
                        alt={`${garment.name} in ${garment.color}`}
                        fill
                        sizes="(max-width: 640px) 280px, 310px"
                        className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </Link>

                    {/* Category pill on image */}
                    <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-full border border-violet-200/70 bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#4C1D95] shadow-2xs backdrop-blur-xs">
                      {garment.category}
                    </span>

                    {/* Wishlist toggle floating button */}
                    <button
                      type="button"
                      aria-label={
                        isWished
                          ? `Remove ${garment.name} from wishlist`
                          : `Save ${garment.name} to wishlist`
                      }
                      aria-pressed={isWished}
                      onClick={() => handleToggleWishlist(garment.id)}
                      className={cn(
                        "absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:scale-110 hover:border-[#6633EE] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        isWished &&
                          "border-rose-200 bg-rose-50/95 text-rose-600 hover:text-rose-700"
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isWished ? "fill-rose-500 text-rose-500" : ""
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={`/shop/${garment.id}`}
                        onClick={(e) => onProductClick?.(garment.id, e)}
                        className="truncate text-base font-bold text-slate-950 transition-colors hover:text-[#6633EE]"
                      >
                        {garment.name}
                      </Link>
                      <span className="shrink-0 text-base font-extrabold text-slate-950">
                        ₹{garment.priceInr.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {garment.fabric} · {garment.fitType} Fit
                    </p>

                    {/* Sample Size Guide (genuine data from profile calculation) */}
                    <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/70 px-2.5 py-1.5 text-xs text-slate-700">
                      <span className="font-medium text-slate-600">
                        Sample Size Guide:{" "}
                      </span>
                      <strong className="font-semibold text-[#6633EE]">
                        Size {rec.recommendedSize}
                      </strong>{" "}
                      <span className="text-slate-500">({garment.color})</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 p-4 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "flex-1 cursor-pointer rounded-xl font-medium transition-all duration-200",
                      added
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-[#6633EE] text-white hover:bg-[#5525D0] active:scale-[0.98]"
                    )}
                    onClick={() => handleAddToCart(garment.id)}
                  >
                    {added ? (
                      <>
                        <CheckCircle2
                          className="mr-1.5 h-4 w-4"
                          aria-hidden="true"
                        />
                        Added ({rec.recommendedSize})
                      </>
                    ) : (
                      <>
                        <ShoppingBag
                          className="mr-1.5 h-4 w-4"
                          aria-hidden="true"
                        />
                        Add Size {rec.recommendedSize}
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/shop/${garment.id}`}
                    onClick={(e) => onProductClick?.(garment.id, e)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-[#6633EE]/60 hover:bg-violet-50/70 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                  >
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </section>
  );
}

export default ProductCategory;
