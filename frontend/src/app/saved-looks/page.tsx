"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  Info,
  Layers,
  Lock,
  Palette,
  Pencil,
  Ruler,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MOCK_GARMENTS, MockGarment } from "@/lib/mock-data";
import { GarmentSize } from "@/lib/shop-utils";
import {
  MockSavedLook,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WardrobePieceEntry {
  garment: MockGarment;
  lookTitles: string[];
}

export default function SavedLooksPage() {
  const { user, savedLooks, deleteSavedLook, addToCart, toast } = useFitloom();

  const [pendingDeleteLook, setPendingDeleteLook] =
    useState<MockSavedLook | null>(null);
  const [selectedSizesByLook, setSelectedSizesByLook] = useState<
    Record<string, Record<string, GarmentSize>>
  >({});
  const [bagValidationByLook, setBagValidationByLook] = useState<
    Record<string, string>
  >({});
  const [addedLookId, setAddedLookId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const addTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addTimerRef.current) clearTimeout(addTimerRef.current);
    };
  }, []);

  // Derive Virtual Wardrobe strictly from garments referenced in savedLooks
  const wardrobeEntries = useMemo<WardrobePieceEntry[]>(() => {
    const byGarmentId = new Map<string, WardrobePieceEntry>();

    for (const look of savedLooks) {
      const lookName = look.title?.trim() || "Untitled Look";
      for (const gid of look.garmentIds) {
        const garment = MOCK_GARMENTS.find((g) => g.id === gid);
        if (!garment) continue;
        const existing = byGarmentId.get(garment.id);
        if (existing) {
          if (!existing.lookTitles.includes(lookName)) {
            existing.lookTitles.push(lookName);
          }
        } else {
          byGarmentId.set(garment.id, {
            garment,
            lookTitles: [lookName],
          });
        }
      }
    }

    return Array.from(byGarmentId.values());
  }, [savedLooks]);

  function openDeleteConfirmation(look: MockSavedLook) {
    setPendingDeleteLook(look);
    const dialog = deleteDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.returnValue = "";
      dialog.showModal();
    }
  }

  function handleDialogClose() {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;

    const action = dialog.returnValue;
    dialog.returnValue = "";

    if (action === "confirm" && pendingDeleteLook) {
      const target = pendingDeleteLook;
      deleteSavedLook(target.id);
      toast({
        type: "info",
        title: "Saved Look Deleted",
        message: `"${
          target.title || "Untitled Look"
        }" removed from your active session lookbook.`,
      });
    }
    setPendingDeleteLook(null);
  }

  function handleSelectGarmentSize(
    lookId: string,
    garmentId: string,
    size: GarmentSize
  ) {
    setSelectedSizesByLook((prev) => ({
      ...prev,
      [lookId]: {
        ...(prev[lookId] ?? {}),
        [garmentId]: size,
      },
    }));
    setBagValidationByLook((prev) => {
      if (!prev[lookId]) return prev;
      const next = { ...prev };
      delete next[lookId];
      return next;
    });
  }

  function handleAddLookToBag(
    look: MockSavedLook,
    matchedGarments: MockGarment[]
  ) {
    if (matchedGarments.length === 0) {
      toast({
        type: "warning",
        title: "No Valid Garments",
        message:
          "None of the garments referenced by this saved look are available in the catalogue.",
      });
      return;
    }

    const lookSizeMap = selectedSizesByLook[look.id] ?? {};
    const missingGarments = matchedGarments.filter((g) => {
      const chosen = lookSizeMap[g.id];
      return !chosen || !g.sizes.includes(chosen);
    });

    if (missingGarments.length > 0) {
      const missingNames = missingGarments.map((g) => g.name).join(", ");
      const validationMsg = `Please select a size for every garment before adding to bag (missing: ${missingNames}).`;
      setBagValidationByLook((prev) => ({
        ...prev,
        [look.id]: validationMsg,
      }));
      toast({
        type: "warning",
        title: "Size Selection Required",
        message: validationMsg,
      });
      return;
    }

    setBagValidationByLook((prev) => {
      if (!prev[look.id]) return prev;
      const next = { ...prev };
      delete next[look.id];
      return next;
    });

    const sizeSummaries: string[] = [];
    for (const g of matchedGarments) {
      const chosenSize = lookSizeMap[g.id];
      addToCart({
        garmentId: g.id,
        name: g.name,
        size: chosenSize,
        priceInr: g.priceInr,
      });
      sizeSummaries.push(`${g.name} (${chosenSize})`);
    }

    setAddedLookId(look.id);
    if (addTimerRef.current) clearTimeout(addTimerRef.current);
    addTimerRef.current = setTimeout(() => setAddedLookId(null), 1800);

    toast({
      type: "success",
      title: "Outfit Pieces Added to Bag",
      message: `Added ${matchedGarments.length} item${
        matchedGarments.length === 1 ? "" : "s"
      } with your selected sizes: ${sizeSummaries.join(", ")}.`,
      action: { label: "View Cart", href: "/cart" },
    });
  }

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-violet-200 bg-white/95 p-8 text-center shadow-xs">
        <Lock
          className="mx-auto h-8 w-8 text-[#6633EE]"
          aria-hidden="true"
        />
        <h1 className="mt-3 text-xl font-extrabold text-slate-950">
          Sign In to View Saved Looks
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Switch to a customer or tailor demo account to curate outfits in Style
          Studio and manage your session lookbook.
        </p>
        <Link href="/auth/login" className="mt-5 inline-block">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 break-words">
              Saved Looks &amp; Wardrobe
            </h1>
            <Badge variant="amber">Session Storage</Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Reopen saved outfits in Style Studio to swap layers or review
            individual garments in your lookbook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/shop">
            <Button variant="outline" size="sm">
              Browse Shop
            </Button>
          </Link>
          <Link href="/studio">
            <Button size="sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Compose New Look
            </Button>
          </Link>
        </div>
      </header>

      {/* Honest Session Persistence Disclosure */}
      <aside
        aria-label="Session persistence disclosure"
        className="flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-xs text-slate-700"
      >
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong>Session Demo Notice:</strong> Saved outfits and virtual
          wardrobe references are stored in active browser session state only
          (no remote database or cloud sync) and reflect garments paired in
          Style Studio or Virtual Try-On.
        </p>
      </aside>

      {/* SECTION 1: SAVED LOOKS GALLERY */}
      <section aria-labelledby="saved-looks-heading" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2
              id="saved-looks-heading"
              className="flex items-center gap-2 text-xl font-extrabold text-slate-950"
            >
              <Bookmark
                className="h-4 w-4 text-[#6633EE]"
                aria-hidden="true"
              />
              Saved Outfits ({savedLooks.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Select &ldquo;Edit in Studio&rdquo; to reload a look&apos;s exact
              garment layers without creating duplicates.
            </p>
          </div>
        </div>

        {savedLooks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-violet-200 bg-white/90 p-10 text-center shadow-2xs sm:p-12">
            <Bookmark
              className="mx-auto h-9 w-9 text-violet-300"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-extrabold text-slate-950">
              No saved looks in this session yet
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              Pair tops, trousers, and outerwear inside Style Studio or save a
              look from the Virtual Try-On preview workspace.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/studio">
                <Button>
                  Open Style Studio
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/try-on">
                <Button variant="outline">Open Virtual Try-On</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedLooks.map((look) => {
              const matchedGarments = look.garmentIds
                .map((gid) => MOCK_GARMENTS.find((g) => g.id === gid))
                .filter((g): g is MockGarment => Boolean(g));
              const missingGarmentIds = look.garmentIds.filter(
                (gid) => !MOCK_GARMENTS.some((g) => g.id === gid)
              );
              const outfitSubtotalInr = matchedGarments.reduce(
                (sum, g) => sum + g.priceInr,
                0
              );
              const lookSizeMap = selectedSizesByLook[look.id] ?? {};
              const selectedCount = matchedGarments.filter((g) => {
                const chosen = lookSizeMap[g.id];
                return Boolean(chosen && g.sizes.includes(chosen));
              }).length;
              const allSizesSelected =
                matchedGarments.length > 0 &&
                selectedCount === matchedGarments.length;
              const validationError = bagValidationByLook[look.id];
              const isAdded = addedLookId === look.id;

              return (
                <article
                  key={look.id}
                  className="flex min-w-0 flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="space-y-4">
                    {/* Metadata Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="neutral" size="sm">
                        {look.source}
                      </Badge>
                      {look.createdAt && (
                        <span className="text-xs font-medium text-slate-500">
                          {look.createdAt}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-950 break-words">
                        {look.title || "Untitled Look"}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {matchedGarments.length} piece
                        {matchedGarments.length === 1 ? "" : "s"}
                        {matchedGarments.length > 0
                          ? ` · ₹${outfitSubtotalInr.toLocaleString("en-IN")}`
                          : ""}
                      </p>
                    </div>

                    {/* Visual Garment Thumbnails */}
                    {matchedGarments.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {matchedGarments.map((g) => {
                          const hasPhoto =
                            Boolean(g.image) && !failedImages[g.id];
                          return (
                            <Link
                              key={`${look.id}-thumb-${g.id}`}
                              href={`/shop/${encodeURIComponent(g.id)}`}
                              title={`View ${g.name}`}
                              className="group relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                            >
                              {hasPhoto ? (
                                <Image
                                  src={g.image!}
                                  alt={`${g.name} garment preview`}
                                  fill
                                  sizes="56px"
                                  onError={() =>
                                    setFailedImages((prev) => ({
                                      ...prev,
                                      [g.id]: true,
                                    }))
                                  }
                                  className="object-cover object-top transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div
                                  className="flex h-full w-full items-center justify-center"
                                  style={{
                                    backgroundColor: g.swatchHex || "#EDE9FE",
                                  }}
                                >
                                  <Palette
                                    className="h-4 w-4 text-slate-700/70"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          No valid catalogue garments remain in this look.
                        </span>
                      </div>
                    )}

                    {/* Garment Details & Per-Garment Size Selection */}
                    {matchedGarments.length > 0 && (
                      <div className="space-y-2.5 border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                          <span className="font-bold uppercase tracking-wider text-slate-600">
                            Select Size Per Garment
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              allSizesSelected
                                ? "text-emerald-700"
                                : "text-slate-500"
                            )}
                          >
                            {selectedCount}/{matchedGarments.length} selected
                          </span>
                        </div>

                        <ul className="space-y-2.5 text-xs">
                          {matchedGarments.map((g) => {
                            const chosenSize = lookSizeMap[g.id];
                            return (
                              <li
                                key={`${look.id}-item-${g.id}`}
                                className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <Link
                                    href={`/shop/${encodeURIComponent(g.id)}`}
                                    className="min-w-0 truncate font-semibold text-slate-800 hover:text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                                  >
                                    {g.name}
                                  </Link>
                                  <span className="shrink-0 text-slate-500">
                                    {g.category} · ₹
                                    {g.priceInr.toLocaleString("en-IN")}
                                  </span>
                                </div>

                                {g.sizes.length === 0 ? (
                                  <p className="text-[11px] font-medium text-amber-800">
                                    Sizes unavailable for this garment.
                                  </p>
                                ) : (
                                  <div
                                    role="radiogroup"
                                    aria-label={`Select size for ${g.name}`}
                                    className="flex flex-wrap items-center gap-1.5"
                                  >
                                    {g.sizes.map((sz) => {
                                      const isSelected = chosenSize === sz;
                                      return (
                                        <button
                                          key={`${look.id}-${g.id}-${sz}`}
                                          type="button"
                                          role="radio"
                                          aria-checked={isSelected}
                                          onClick={() =>
                                            handleSelectGarmentSize(
                                              look.id,
                                              g.id,
                                              sz
                                            )
                                          }
                                          className={cn(
                                            "min-w-[2.125rem] cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                                            isSelected
                                              ? "border-[#6633EE] bg-[#6633EE] text-white"
                                              : "border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50/60"
                                          )}
                                        >
                                          {sz}
                                        </button>
                                      );
                                    })}
                                    {!chosenSize && (
                                      <span className="text-[11px] text-slate-500">
                                        Choose size
                                      </span>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {missingGarmentIds.length > 0 && (
                      <p className="text-[11px] text-amber-800">
                        Unavailable IDs omitted:{" "}
                        {missingGarmentIds.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/studio?look=${encodeURIComponent(look.id)}`}
                        className="flex-1 min-w-[140px]"
                      >
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit in Studio
                        </Button>
                      </Link>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${look.title || "saved look"}`}
                        onClick={() => openDeleteConfirmation(look)}
                      >
                        <Trash2
                          className="h-4 w-4 text-red-600"
                          aria-hidden="true"
                        />
                      </Button>
                    </div>

                    {validationError && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold leading-snug text-red-700"
                      >
                        {validationError}
                      </p>
                    )}

                    {matchedGarments.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          handleAddLookToBag(look, matchedGarments)
                        }
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Added Items to Bag
                          </>
                        ) : (
                          <>
                            <ShoppingBag
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {allSizesSelected
                              ? "Add Outfit Pieces to Bag"
                              : `Add Outfit Pieces to Bag (${selectedCount}/${matchedGarments.length} sized)`}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: VIRTUAL WARDROBE (DERIVED FROM SAVED LOOKS) */}
      <section
        aria-labelledby="virtual-wardrobe-heading"
        className="space-y-5 border-t border-violet-100 pt-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="virtual-wardrobe-heading"
              className="flex items-center gap-2 text-xl font-extrabold text-slate-950"
            >
              <Layers
                className="h-4 w-4 text-[#6633EE]"
                aria-hidden="true"
              />
              Virtual Wardrobe ({wardrobeEntries.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Individual garments appearing across your saved looks (derived
              from your active lookbook — does not represent purchase history).
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#6633EE] hover:underline"
          >
            Explore All Catalogue Pieces →
          </Link>
        </div>

        {wardrobeEntries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/85 p-8 text-center">
            <Layers
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <h3 className="mt-2.5 text-sm font-extrabold text-slate-900">
              No wardrobe pieces in your lookbook
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
              Save at least one outfit in Style Studio or Virtual Try-On to see
              all its individual garments organized here.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Link href="/studio">
                <Button size="sm">Open Style Studio</Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" size="sm">
                  Browse Shop
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wardrobeEntries.map(({ garment, lookTitles }) => {
              const hasPhoto =
                Boolean(garment.image) && !failedImages[garment.id];
              return (
                <article
                  key={`wardrobe-${garment.id}`}
                  className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs"
                >
                  <div className="flex items-start gap-3.5">
                    <Link
                      href={`/shop/${encodeURIComponent(garment.id)}`}
                      className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                    >
                      {hasPhoto ? (
                        <Image
                          src={garment.image!}
                          alt={`${garment.name} wardrobe item`}
                          fill
                          sizes="64px"
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [garment.id]: true,
                            }))
                          }
                          className="object-cover object-top"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{
                            backgroundColor: garment.swatchHex || "#EDE9FE",
                          }}
                        >
                          <Palette
                            className="h-5 w-5 text-slate-700/70"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" size="sm">
                          {garment.category}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {garment.fitType}
                        </Badge>
                      </div>
                      <h3 className="truncate text-sm font-extrabold text-slate-950">
                        <Link
                          href={`/shop/${encodeURIComponent(garment.id)}`}
                          className="hover:text-[#6633EE] hover:underline"
                        >
                          {garment.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-600">
                        {garment.color} · ₹
                        {garment.priceInr.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] leading-snug text-slate-500 break-words">
                        In looks:{" "}
                        <span className="font-semibold text-slate-700">
                          {lookTitles.join(", ")}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href={`/shop/${encodeURIComponent(garment.id)}`}
                      className="flex-1 min-w-[110px]"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Product Details
                      </Button>
                    </Link>
                    <Link
                      href={`/fit-check?product=${encodeURIComponent(
                        garment.id
                      )}`}
                    >
                      <Button variant="ghost" size="sm">
                        <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                        Fit Check
                      </Button>
                    </Link>
                    <Link
                      href={`/try-on?product=${encodeURIComponent(garment.id)}`}
                    >
                      <Button variant="ghost" size="sm">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Try-On (Coming Soon)
                      </Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Native Accessible Delete Confirmation Modal */}
      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-look-dialog-title"
        onClose={handleDialogClose}
        className="m-auto w-[min(26rem,calc(100dvw-2rem))] rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-xl overscroll-contain [&::backdrop]:overflow-hidden [&::backdrop]:overscroll-contain [&::backdrop]:bg-slate-900/45 [&::backdrop]:backdrop-blur-[2px]"
      >
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2
            id="delete-look-dialog-title"
            className="text-lg font-extrabold text-slate-950"
          >
            Delete Saved Look?
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Are you sure you want to remove{" "}
            <strong className="text-slate-950">
              &ldquo;{pendingDeleteLook?.title || "this look"}&rdquo;
            </strong>{" "}
            from your session lookbook? This cannot be undone.
          </p>
        </div>

        <form
          method="dialog"
          className="mt-6 flex flex-wrap justify-end gap-2.5"
        >
          <Button type="submit" value="cancel" variant="outline" autoFocus>
            Keep Look
          </Button>
          <Button type="submit" value="confirm" variant="destructive">
            Delete Look
          </Button>
        </form>
      </dialog>
    </div>
  );
}
