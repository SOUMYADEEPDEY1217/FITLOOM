"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GitCompare,
  Heart,
  Ruler,
  Scissors,
  Star,
} from "lucide-react";
import { MockGarment } from "@/lib/mock-data";
import { getGarmentMeasurementSummary } from "@/lib/shop-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  garment: MockGarment;
  isWished: boolean;
  isCompared: boolean;
  onToggleWishlist: (garment: MockGarment) => void;
  onToggleCompare: (garment: MockGarment) => void;
}

export function ProductCard({
  garment,
  isWished,
  isCompared,
  onToggleWishlist,
  onToggleCompare,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const specSummary = getGarmentMeasurementSummary(garment);
  const hasImage = Boolean(garment.image) && !imgError;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs transition-all hover:border-[#6633EE]/45 hover:shadow-sm">
      <div>
        {/* Product Image / Swatch Fallback */}
        <Link
          href={`/shop/${garment.id}`}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
        >
          {hasImage ? (
            <Image
              src={garment.image!}
              alt={garment.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              onError={() => setImgError(true)}
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
              <div
                className="h-20 w-16 rounded-xl border border-black/10 shadow-sm transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: garment.swatchHex || "#E2E8F0" }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold text-slate-600">
                {garment.color || garment.category} Preview
              </span>
            </div>
          )}

          <span className="absolute left-2.5 top-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-2xs">
            {garment.fitType} Fit · {garment.category}
          </span>
        </Link>

        {/* Title & Wishlist */}
        <div className="mt-3.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/shop/${garment.id}`}
              className="block rounded text-base font-extrabold text-slate-950 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] break-words"
            >
              {garment.name}
            </Link>
            <p className="mt-0.5 text-xs text-slate-600 break-words">
              {garment.color || "Standard Color"} ·{" "}
              {garment.fabric || "Fabric details unavailable"}
            </p>
          </div>

          <button
            type="button"
            aria-label={
              isWished
                ? `Remove ${garment.name} from wishlist`
                : `Save ${garment.name} to wishlist`
            }
            aria-pressed={isWished}
            onClick={() => onToggleWishlist(garment)}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
              isWished
                ? "border-violet-200 bg-violet-50 text-[#6633EE]"
                : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-[#6633EE]"
            )}
          >
            <Heart
              className={cn("h-4 w-4", isWished && "fill-current")}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Price & Verified Catalog Rating */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-extrabold text-slate-950">
            ₹{garment.priceInr.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {garment.rating}
            <span className="font-normal text-slate-500">
              ({garment.reviewCount.toLocaleString("en-IN")})
            </span>
          </span>
        </div>

        {/* Occasion & Available Sizes */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>{garment.occasion}</span>
          <span className="font-semibold text-slate-800">
            Sizes:{" "}
            {garment.sizes.length > 0
              ? garment.sizes.join(" · ")
              : "Unavailable"}
          </span>
        </div>

        {/* Garment Spec Metadata (replaces repetitive card pill soup) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <Ruler className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
            {specSummary.hasSpecs
              ? specSummary.chestRangeText
              : "Measurements unavailable"}
          </span>
          <span className="inline-flex items-center gap-1 text-[#4C1D95] font-medium">
            <Scissors className="h-3 w-3" aria-hidden="true" />
            CUSTOMFIT Eligible
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
        <Link
          href={`/shop/${garment.id}`}
          className="flex-1 min-w-[115px]"
          aria-label={
            garment.sizes.length > 0
              ? `View details and select size for ${garment.name}`
              : `View details for ${garment.name}`
          }
        >
          <Button type="button" size="sm" className="w-full">
            {garment.sizes.length > 0 ? "Select Size" : "View Details"}
          </Button>
        </Link>

        <Button
          type="button"
          size="sm"
          variant={isCompared ? "secondary" : "outline"}
          aria-pressed={isCompared}
          aria-label={
            isCompared
              ? `Remove ${garment.name} from compare`
              : `Add ${garment.name} to compare`
          }
          onClick={() => onToggleCompare(garment)}
        >
          <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">
            {isCompared ? "Comparing" : "Compare"}
          </span>
        </Button>
      </div>
    </article>
  );
}
