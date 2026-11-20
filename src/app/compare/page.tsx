"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  Heart,
  Ruler,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  COMPARE_ATTRIBUTE_ROWS,
  type CompareMeasurementUnit,
  MAX_COMPARE_ITEMS,
  getValidWishlistCount,
  resolveGarmentReferences,
  validateExplicitGarmentSize,
} from "@/lib/compare-wishlist-utils";
import { type MockGarment } from "@/lib/mock-data";
import { type GarmentSize } from "@/lib/shop-utils";

export default function ComparePage() {
  const {
    compareIds,
    toggleCompare,
    clearCompare,
    pruneInvalidCompareRefs,
    wishlistIds,
    toggleWishlist,
    addToCart,
    toast,
  } = useFitloom();

  const [unit, setUnit] = useState<CompareMeasurementUnit>("cm");
  const [selectedSizes, setSelectedSizes] = useState<
    Partial<Record<string, GarmentSize>>
  >({});
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const scrollRegionRef = useRef<HTMLDivElement | null>(null);

  const resolvedCompare = useMemo(
    () => resolveGarmentReferences(compareIds),
    [compareIds]
  );

  // Enforce max 3 items in comparison display
  const validItems = resolvedCompare.validItems.slice(0, MAX_COMPARE_ITEMS);
  const invalidIds = resolvedCompare.invalidIds;
  const atLimit = validItems.length >= MAX_COMPARE_ITEMS;
  const validWishlistCount = useMemo(
    () => getValidWishlistCount(wishlistIds),
    [wishlistIds]
  );

  function handleScrollHorizontal(direction: -1 | 1) {
    scrollRegionRef.current?.scrollBy({
      left: direction * 260,
      behavior: "smooth",
    });
  }

  function handleSelectSize(garmentId: string, size: GarmentSize) {
    setSelectedSizes((prev) => ({ ...prev, [garmentId]: size }));
    setSizeErrors((prev) => {
      if (!prev[garmentId]) return prev;
      const next = { ...prev };
      delete next[garmentId];
      return next;
    });
  }

  function handleAddToBag(garment: MockGarment) {
    const validSize = validateExplicitGarmentSize(
      garment,
      selectedSizes[garment.id]
    );
    if (!validSize) {
      setSizeErrors((prev) => ({
        ...prev,
        [garment.id]: "Select a size first.",
      }));
      toast({
        type: "error",
        title: "Size Selection Required",
        message: `Select an available size for ${garment.name} before adding to bag.`,
      });
      return;
    }

    addToCart({
      garmentId: garment.id,
      name: garment.name,
      size: validSize,
      priceInr: garment.priceInr,
    });
    toast({
      type: "success",
      title: "Added to Bag",
      message: `${garment.name} (Size ${validSize}) added to your shopping bag.`,
      action: { label: "View Bag", href: "/cart" },
    });
  }

  function handleRemoveCompare(garment: MockGarment) {
    toggleCompare(garment.id);
    setSelectedSizes((prev) => {
      const next = { ...prev };
      delete next[garment.id];
      return next;
    });
    setSizeErrors((prev) => {
      const next = { ...prev };
      delete next[garment.id];
      return next;
    });
    toast({
      type: "info",
      title: "Removed from Compare",
      message: `${garment.name} removed from side-by-side comparison.`,
    });
  }

  function handleClearAllCompare() {
    clearCompare();
    setSelectedSizes({});
    setSizeErrors({});
    toast({
      type: "info",
      title: "Comparison Cleared",
      message: "All garments removed from comparison.",
    });
  }

  function handleToggleWishlistItem(garment: MockGarment) {
    const removing = wishlistIds.includes(garment.id);
    toggleWishlist(garment.id);
    toast({
      type: removing ? "info" : "success",
      title: removing ? "Removed from Wishlist" : "Saved to Wishlist",
      message: `${garment.name} ${removing ? "removed from" : "saved to"} your wishlist.`,
      action: removing ? undefined : { label: "View Wishlist", href: "/wishlist" },
    });
  }

  function handleCleanInvalidRefs() {
    pruneInvalidCompareRefs();
    toast({
      type: "info",
      title: "Unavailable Items Cleared",
      message: "Removed unavailable product references from comparison.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1
              id="compare-table-heading"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl"
            >
              Compare Garments
            </h1>
            <span className="text-sm font-medium text-slate-500">
              {validItems.length} of {MAX_COMPARE_ITEMS} selected
            </span>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Compare up to {MAX_COMPARE_ITEMS} garments side by side across fabric,
            fit silhouette, available sizes, garment measurement ranges, and rating.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unit Switcher */}
          <div
            role="group"
            aria-label="Measurement unit preference"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5"
          >
            <button
              type="button"
              onClick={() => setUnit("cm")}
              aria-pressed={unit === "cm"}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                unit === "cm"
                  ? "bg-[#6633EE] text-white"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              CM
            </button>
            <button
              type="button"
              onClick={() => setUnit("in")}
              aria-pressed={unit === "in"}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                unit === "in"
                  ? "bg-[#6633EE] text-white"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              IN
            </button>
          </div>

          <Link href="/wishlist">
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4" aria-hidden="true" />
              Wishlist ({validWishlistCount})
            </Button>
          </Link>

          <Link href="/shop">
            <Button variant="outline" size="sm">
              {atLimit ? "Browse Shop" : "+ Add Garment"}
            </Button>
          </Link>

          {validItems.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={handleClearAllCompare}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear All
            </Button>
          )}
        </div>
      </header>

      {/* Session & Limit Banners */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
          <span>
            Comparison selections remain active for your current browser session
            (maximum {MAX_COMPARE_ITEMS} unique garments at a time).
          </span>
          {atLimit && (
            <Badge variant="secondary" size="sm">
              Maximum {MAX_COMPARE_ITEMS} reached — remove a garment to swap
            </Badge>
          )}
        </div>

        {invalidIds.length > 0 && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <p className="text-xs sm:text-sm">
                {invalidIds.length} unavailable catalog{" "}
                {invalidIds.length === 1 ? "reference was" : "references were"}{" "}
                omitted from comparison.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCleanInvalidRefs}
              className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
            >
              Clean Unavailable References
            </Button>
          </div>
        )}

        {validItems.length === 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-xs text-slate-700">
            <span>
              1 garment selected. Add 1 or 2 more garments from Shop or Wishlist to
              compare specifications side by side.
            </span>
            <Link
              href="/shop"
              className="font-semibold text-[#6633EE] hover:underline"
            >
              Add from Shop →
            </Link>
          </div>
        )}
      </div>

      {/* Empty State vs Comparison Table */}
      {validItems.length === 0 ? (
        <Card className="border-dashed border-violet-200 bg-violet-50/25">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-[#6633EE]">
              <GitCompareArrows className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              No garments selected for comparison
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-600">
              Use the Compare toggle on any garment in the Shop catalogue, Product
              Details, or your Wishlist to inspect up to {MAX_COMPARE_ITEMS}{" "}
              garments side by side.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button>
                  Browse Shop to Compare
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="outline">View Wishlist</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Swipe Cue + Desktop Scroll Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <ArrowLeftRight
                className="h-3.5 w-3.5 text-[#6633EE]"
                aria-hidden="true"
              />
              <span>
                Swipe or scroll horizontally across garment columns
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleScrollHorizontal(-1)}
                aria-label="Scroll comparison table left"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleScrollHorizontal(1)}
                aria-label="Scroll comparison table right"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Responsive Accessible Table Region */}
          <div
            ref={scrollRegionRef}
            tabIndex={0}
            role="region"
            aria-labelledby="compare-table-heading"
            className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white/95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Side-by-side comparison of {validItems.length} selected FITLOOM
                garments
              </caption>
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/70 align-top">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 w-44 min-w-[165px] border-r border-slate-200/80 bg-slate-50 p-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Garment &amp; Spec
                  </th>
                  {validItems.map((garment) => {
                    const isWished = wishlistIds.includes(garment.id);
                    const showSwatchFallback =
                      !garment.image || Boolean(failedImages[garment.id]);

                    return (
                      <th
                        key={garment.id}
                        scope="col"
                        className="min-w-[210px] border-r border-slate-100 p-4 align-top font-normal last:border-r-0"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/shop/${garment.id}`}
                              className="group relative block h-24 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                            >
                              {!showSwatchFallback && garment.image ? (
                                <Image
                                  src={garment.image}
                                  alt={garment.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                                  onError={() =>
                                    setFailedImages((prev) => ({
                                      ...prev,
                                      [garment.id]: true,
                                    }))
                                  }
                                />
                              ) : (
                                <div
                                  className="flex h-full w-full items-center justify-center"
                                  style={{ backgroundColor: garment.swatchHex }}
                                >
                                  <Sparkles
                                    className="h-4 w-4 text-white/90"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </Link>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleWishlistItem(garment)}
                                aria-label={
                                  isWished
                                    ? `Remove ${garment.name} from wishlist`
                                    : `Save ${garment.name} to wishlist`
                                }
                                aria-pressed={isWished}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] ${
                                  isWished
                                    ? "border-violet-200 bg-violet-100 text-[#6633EE]"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-[#6633EE]"
                                }`}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${isWished ? "fill-current" : ""}`}
                                  aria-hidden="true"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveCompare(garment)}
                                aria-label={`Remove ${garment.name} from comparison`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <Link
                              href={`/shop/${garment.id}`}
                              className="text-base font-bold text-slate-950 hover:text-[#6633EE] focus-visible:outline-none focus-visible:underline"
                            >
                              {garment.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {garment.color || "Not available"}
                            </p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {COMPARE_ATTRIBUTE_ROWS.map((row) => (
                  <tr
                    key={row.key}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-slate-200/80 bg-white p-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      {row.label}
                    </th>
                    {validItems.map((garment) => (
                      <td
                        key={`${row.key}-${garment.id}`}
                        className="border-r border-slate-100 p-4 text-sm text-slate-800 last:border-r-0"
                      >
                        {row.getValue(garment, unit)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Actions & Explicit Bag Selection Row */}
                <tr className="bg-slate-50/40 align-top">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-slate-200/80 bg-slate-50 p-4 text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Select Size &amp; Actions
                  </th>
                  {validItems.map((garment) => {
                    const chosenSize = selectedSizes[garment.id] ?? null;
                    const errMsg = sizeErrors[garment.id];

                    return (
                      <td
                        key={`actions-${garment.id}`}
                        className="border-r border-slate-100 p-4 align-top last:border-r-0"
                      >
                        <div className="space-y-3">
                          {garment.sizes.length > 0 ? (
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-semibold text-slate-700">
                                Size (required for bag)
                              </span>
                              <div
                                className="flex flex-wrap gap-1.5"
                                role="group"
                                aria-label={`Select size for ${garment.name}`}
                              >
                                {garment.sizes.map((size) => {
                                  const active = chosenSize === size;
                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      aria-pressed={active}
                                      onClick={() =>
                                        handleSelectSize(garment.id, size)
                                      }
                                      className={`min-h-[30px] min-w-[34px] rounded-lg border px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] ${
                                        active
                                          ? "border-[#6633EE] bg-[#6633EE] text-white"
                                          : "border-slate-200 bg-white text-slate-800 hover:border-violet-300"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                              {errMsg && (
                                <p
                                  role="alert"
                                  className="text-xs font-medium text-red-700"
                                >
                                  {errMsg}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">
                              No sizes available
                            </p>
                          )}

                          <div className="flex flex-col gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddToBag(garment)}
                              disabled={garment.sizes.length === 0}
                            >
                              <ShoppingBag
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Add to Bag
                            </Button>

                            <Link href={`/fit-check?product=${garment.id}`}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Ruler
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                Check Fit
                              </Button>
                            </Link>

                            <Link href={`/shop/${garment.id}`}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                              >
                                Product Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
