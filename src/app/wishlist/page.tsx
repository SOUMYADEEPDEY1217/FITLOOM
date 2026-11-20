"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  GitCompareArrows,
  Heart,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MAX_COMPARE_ITEMS,
  resolveGarmentReferences,
  validateExplicitGarmentSize,
} from "@/lib/compare-wishlist-utils";
import { type MockGarment } from "@/lib/mock-data";
import { type GarmentSize } from "@/lib/shop-utils";

export default function WishlistPage() {
  const {
    wishlistIds,
    toggleWishlist,
    clearWishlist,
    pruneInvalidWishlistRefs,
    compareIds,
    toggleCompare,
    addToCart,
    toast,
  } = useFitloom();

  const [selectedSizes, setSelectedSizes] = useState<
    Partial<Record<string, GarmentSize>>
  >({});
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const clearDialogRef = useRef<HTMLDialogElement | null>(null);

  const resolvedWishlist = useMemo(
    () => resolveGarmentReferences(wishlistIds),
    [wishlistIds]
  );

  const validItems = resolvedWishlist.validItems;
  const invalidIds = resolvedWishlist.invalidIds;

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
      const msg =
        garment.sizes.length > 0
          ? `Select one of the available sizes (${garment.sizes.join(", ")}) for ${garment.name}.`
          : `${garment.name} has no purchasable sizes available right now.`;
      setSizeErrors((prev) => ({ ...prev, [garment.id]: msg }));
      toast({
        type: "error",
        title: "Size Selection Required",
        message: `Please select a size for ${garment.name} before adding to bag.`,
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

  function handleRemoveWishlist(garment: MockGarment) {
    toggleWishlist(garment.id);
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
      title: "Removed from Wishlist",
      message: `${garment.name} removed from your saved wishlist.`,
    });
  }

  function handleToggleCompareItem(garment: MockGarment) {
    const removing = compareIds.includes(garment.id);
    const replacingOldest =
      !removing && compareIds.length >= MAX_COMPARE_ITEMS;
    toggleCompare(garment.id);

    toast({
      type: removing ? "info" : "success",
      title: removing ? "Removed from Compare" : "Added to Compare",
      message: removing
        ? `${garment.name} removed from side-by-side comparison.`
        : replacingOldest
          ? `${garment.name} added (replaced oldest item; max ${MAX_COMPARE_ITEMS} garments).`
          : `${garment.name} added to garment comparison.`,
      action: removing ? undefined : { label: "Open Compare", href: "/compare" },
    });
  }

  function openClearDialog() {
    const dialog = clearDialogRef.current;
    if (!dialog) return;
    dialog.returnValue = "";
    dialog.showModal();
  }

  function closeClearDialog() {
    clearDialogRef.current?.close();
  }

  function handleConfirmClearWishlist() {
    clearWishlist();
    setSelectedSizes({});
    setSizeErrors({});
    closeClearDialog();
    toast({
      type: "info",
      title: "Wishlist Cleared",
      message: "All saved garments have been removed from your wishlist.",
    });
  }

  function handleCleanInvalidRefs() {
    pruneInvalidWishlistRefs();
    toast({
      type: "info",
      title: "Unavailable Items Cleared",
      message: "Removed unavailable product references from your wishlist.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <header className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Your Wishlist
            </h1>
            <span className="text-sm font-medium text-slate-500">
              {validItems.length} {validItems.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Review saved garments, compare silhouettes, and choose an exact size
            before moving pieces into your bag.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/compare">
            <Button variant="outline" size="sm">
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
              Compare ({Math.min(compareIds.length, MAX_COMPARE_ITEMS)}/{MAX_COMPARE_ITEMS})
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="sm">
              Continue Shopping
            </Button>
          </Link>
          {validItems.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-700 hover:bg-red-50 hover:text-red-800"
              onClick={openClearDialog}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear Wishlist
            </Button>
          )}
        </div>
      </header>

      {/* Session storage notice */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
        Wishlist items are stored for this active browser session and stay
        synchronized across Shop, Product Details, Compare, and your Dashboard.
      </div>

      {/* Invalid / deleted reference alert */}
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
              {invalidIds.length} unavailable or removed catalog{" "}
              {invalidIds.length === 1 ? "reference was" : "references were"}{" "}
              safely omitted from your wishlist display.
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

      {/* Main Content */}
      {validItems.length === 0 ? (
        <Card className="border-dashed border-violet-200 bg-violet-50/25">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-[#6633EE]">
              <Heart className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Your wishlist is currently empty
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-600">
              Explore the FITLOOM catalogue and save garments you want to revisit,
              compare side by side, or customize later.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button>
                  Explore Shop Catalogue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {validItems.map((garment) => {
            const selectedSize = selectedSizes[garment.id] ?? null;
            const errorMsg = sizeErrors[garment.id];
            const isCompared = compareIds.includes(garment.id);
            const showFallbackSwatch =
              !garment.image || Boolean(failedImages[garment.id]);

            return (
              <Card
                key={garment.id}
                className="overflow-hidden border-slate-200/80 bg-white/95 shadow-xs"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row">
                    {/* Product Thumbnail with Image Fallback */}
                    <Link
                      href={`/shop/${garment.id}`}
                      className="group relative block h-44 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:h-40 sm:w-32"
                    >
                      {!showFallbackSwatch && garment.image ? (
                        <Image
                          src={garment.image}
                          alt={garment.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 128px"
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
                          className="flex h-full w-full flex-col items-center justify-center p-3 text-center"
                          style={{ backgroundColor: garment.swatchHex }}
                        >
                          <Sparkles
                            className="h-5 w-5 text-white/90 drop-shadow-xs"
                            aria-hidden="true"
                          />
                          <span className="mt-1 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {garment.color}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Garment Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {garment.category} · {garment.fitType} Fit
                          </span>
                          <span className="text-base font-extrabold text-slate-950">
                            ₹{garment.priceInr.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <Link
                          href={`/shop/${garment.id}`}
                          className="block text-lg font-bold text-slate-950 hover:text-[#6633EE] focus-visible:outline-none focus-visible:underline"
                        >
                          {garment.name}
                        </Link>

                        <p className="text-xs text-slate-600">
                          {garment.fabric || "Fabric details not available"}
                          {garment.stretchNote ? ` · ${garment.stretchNote}` : ""}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-600">
                          {garment.rating > 0 ? (
                            <span className="font-medium text-slate-700">
                              ★ {garment.rating.toFixed(1)} ({garment.reviewCount} reviews)
                            </span>
                          ) : (
                            <span>Rating not available</span>
                          )}
                          {garment.occasion && (
                            <Badge variant="outline" size="sm">
                              {garment.occasion}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Explicit Size Selection */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            Select Size{" "}
                            <span className="font-normal text-slate-500">
                              (required before adding to bag)
                            </span>
                          </span>
                          {selectedSize && (
                            <span className="text-xs font-semibold text-[#6633EE]">
                              Selected: {selectedSize}
                            </span>
                          )}
                        </div>

                        {garment.sizes.length > 0 ? (
                          <div
                            className="flex flex-wrap gap-1.5"
                            role="group"
                            aria-label={`Select size for ${garment.name}`}
                          >
                            {garment.sizes.map((size) => {
                              const active = selectedSize === size;
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    handleSelectSize(garment.id, size)
                                  }
                                  className={`min-h-[34px] min-w-[40px] rounded-xl border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] ${
                                    active
                                      ? "border-[#6633EE] bg-[#6633EE] text-white"
                                      : "border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50/40"
                                  }`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-700">
                            No sizes listed for this garment.
                          </p>
                        )}

                        {errorMsg && (
                          <p
                            role="alert"
                            className="text-xs font-medium text-red-700"
                          >
                            {errorMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddToBag(garment)}
                        disabled={garment.sizes.length === 0}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                        Add to Bag
                      </Button>

                      <Link href={`/shop/${garment.id}`}>
                        <Button type="button" variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant={isCompared ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleCompareItem(garment)}
                        aria-pressed={isCompared}
                      >
                        {isCompared ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <GitCompareArrows
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {isCompared ? "In Compare" : "Compare"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWishlist(garment)}
                        className="text-red-700 hover:bg-red-50 hover:text-red-800"
                        aria-label={`Remove ${garment.name} from wishlist`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Native Accessible Clear Wishlist Confirmation Dialog */}
      <dialog
        ref={clearDialogRef}
        aria-labelledby="clear-wishlist-title"
        aria-describedby="clear-wishlist-desc"
        onClick={(e) => {
          if (e.target === clearDialogRef.current) {
            closeClearDialog();
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-[2px]"
      >
        <div className="space-y-3">
          <h2 id="clear-wishlist-title" className="text-lg font-bold text-slate-950">
            Clear your entire wishlist?
          </h2>
          <p id="clear-wishlist-desc" className="text-sm text-slate-600">
            This will remove all {validItems.length} saved{" "}
            {validItems.length === 1 ? "garment" : "garments"} from your active
            session wishlist. You can add items back from the Shop anytime.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            autoFocus
            onClick={closeClearDialog}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmClearWishlist}
          >
            Clear All Items
          </Button>
        </div>
      </dialog>
    </div>
  );
}
