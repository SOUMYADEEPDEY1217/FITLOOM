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
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  Lock,
  Palette,
  RotateCcw,
  Ruler,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  api,
  ApiError,
  type FitCheckResponse,
} from "@/lib/api";
import {
  FitPreference,
  MOCK_GARMENTS,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import {
  FIT_PREFERENCE_CARDS,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  formatLengthFromCm,
} from "@/lib/body-profile-utils";
import {
  formatCmDelta,
  formatEaseThresholdCm,
  formatMeasureValue,
} from "@/lib/fit-intelligence-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectableGarment {
  id: string;
  name: string;
  category: string;
  garmentType?: string | null;
  fitType: string;
  fabric: string;
  stretchNote: string;
  priceInr: number;
  image?: string;
  swatchHex?: string;
  sizes: string[];
}

const FALLBACK_GARMENTS: SelectableGarment[] = MOCK_GARMENTS.map((g) => ({
  id: g.id,
  name: g.name,
  category: g.category,
  garmentType: g.garmentType,
  fitType: g.fitType,
  fabric: g.fabric,
  stretchNote: g.stretchNote,
  priceInr: g.priceInr,
  image: g.image,
  swatchHex: g.swatchHex,
  sizes: [...g.sizes],
}));

function FitCheckProductQuerySync({
  availableGarments,
  onResolveProduct,
}: {
  availableGarments: SelectableGarment[];
  onResolveProduct: (result: {
    selectedId: string;
    invalidProductId: string | null;
  }) => void;
}) {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");

  useEffect(() => {
    if (productParam === null || productParam.trim() === "") {
      onResolveProduct({
        selectedId: availableGarments[0]?.id ?? FALLBACK_GARMENTS[0]?.id ?? "",
        invalidProductId: null,
      });
      return;
    }

    const trimmed = productParam.trim();
    const matched = availableGarments.find((g) => g.id === trimmed);
    if (matched) {
      onResolveProduct({
        selectedId: matched.id,
        invalidProductId: null,
      });
    } else {
      onResolveProduct({
        selectedId: "",
        invalidProductId: trimmed,
      });
    }
  }, [productParam, onResolveProduct, availableGarments]);

  return null;
}

export default function FitCheckPage() {
  const router = useRouter();
  const { user, bodyProfile, hasBodyProfile, addToCart, toast, isLoadingAuth } =
    useFitloom();

  const [catalogGarments, setCatalogGarments] =
    useState<SelectableGarment[]>(FALLBACK_GARMENTS);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(
    FALLBACK_GARMENTS[0]?.id ?? ""
  );
  const [invalidProductId, setInvalidProductId] = useState<string | null>(null);
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [fitPreferenceOverride, setFitPreferenceOverride] = useState<
    FitPreference | undefined
  >(undefined);
  const [justAddedSize, setJustAddedSize] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Real Fit Check API States
  const [fitCheckResult, setFitCheckResult] = useState<FitCheckResponse | null>(
    null
  );
  const [isLoadingFitCheck, setIsLoadingFitCheck] = useState<boolean>(false);
  const [fitCheckError, setFitCheckError] = useState<{
    status: number;
    code: string;
    message: string;
  } | null>(null);

  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  // Fetch real catalogue products from API
  useEffect(() => {
    let isMounted = true;
    api
      .getProducts({ limit: 50 })
      .then((res) => {
        if (!isMounted || !res.products?.length) return;
        const mapped: SelectableGarment[] = res.products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          garmentType: p.garmentType,
          fitType: p.fitType,
          fabric: p.fabric,
          stretchNote: p.stretchNote,
          priceInr: p.priceInr,
          image: p.imageUrl ?? undefined,
          swatchHex: p.swatchHex,
          sizes: p.sizes,
        }));
        setCatalogGarments(mapped);
      })
      .catch(() => {
        // Keep fallback garments
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResolveProduct = useCallback(
    (result: { selectedId: string; invalidProductId: string | null }) => {
      setInvalidProductId(result.invalidProductId);
      if (result.selectedId) {
        setSelectedGarmentId(result.selectedId);
      } else if (result.invalidProductId) {
        setSelectedGarmentId("");
      }
      setImgError(false);
      setJustAddedSize(null);
    },
    []
  );

  const garment = useMemo(
    () =>
      selectedGarmentId
        ? catalogGarments.find((g) => g.id === selectedGarmentId) ?? null
        : null,
    [selectedGarmentId, catalogGarments]
  );

  const activeFitPreference: FitPreference =
    fitPreferenceOverride ?? bodyProfile?.fitPreference ?? "regular";
  const isOverridden =
    fitPreferenceOverride !== undefined &&
    fitPreferenceOverride !== (bodyProfile?.fitPreference ?? "regular");

  // Call POST /api/fit-check
  const runFitCheck = useCallback(
    async (productId: string, pref: FitPreference) => {
      if (!productId) return;
      if (isLoadingAuth) return;

      if (user.role === "guest") {
        setFitCheckResult(null);
        setFitCheckError({
          status: 401,
          code: "UNAUTHORIZED",
          message: "Authentication required to run fit intelligence.",
        });
        setIsLoadingFitCheck(false);
        return;
      }

      if (!hasBodyProfile) {
        setFitCheckResult(null);
        setFitCheckError({
          status: 422,
          code: "MISSING_BODY_PROFILE",
          message: "Body profile required for fit check.",
        });
        setIsLoadingFitCheck(false);
        return;
      }

      setIsLoadingFitCheck(true);
      setFitCheckError(null);

      try {
        const res = await api.fitCheck({
          productId,
          fitPreference: pref,
        });
        setFitCheckResult(res);
        setFitCheckError(null);
      } catch (err) {
        setFitCheckResult(null);
        if (err instanceof ApiError) {
          setFitCheckError({
            status: err.status,
            code: err.code,
            message: err.message,
          });
        } else {
          setFitCheckError({
            status: 500,
            code: "INTERNAL_ERROR",
            message:
              err instanceof Error ? err.message : "Failed to check fit",
          });
        }
      } finally {
        setIsLoadingFitCheck(false);
      }
    },
    [isLoadingAuth, user.role, hasBodyProfile]
  );

  useEffect(() => {
    if (selectedGarmentId && !invalidProductId && !isLoadingAuth) {
      void runFitCheck(selectedGarmentId, activeFitPreference);
    }
  }, [
    selectedGarmentId,
    activeFitPreference,
    isLoadingAuth,
    invalidProductId,
    runFitCheck,
  ]);

  function handleSelectGarment(nextId: string) {
    setInvalidProductId(null);
    setSelectedGarmentId(nextId);
    setImgError(false);
    setJustAddedSize(null);
    router.replace(`/fit-check?product=${encodeURIComponent(nextId)}`, {
      scroll: false,
    });
  }

  function handleAddRecommendedToCart() {
    if (!garment || !fitCheckResult?.recommendedSize) return;
    const recSize = fitCheckResult.recommendedSize as "S" | "M" | "L" | "XL";

    addToCart({
      garmentId: garment.id,
      name: garment.name,
      size: recSize,
      priceInr: garment.priceInr,
    });

    setJustAddedSize(recSize);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setJustAddedSize(null), 1800);

    toast({
      type: "success",
      title: "Added Recommended Size",
      message: `${garment.name} (Size ${recSize}) added to your shopping bag.`,
      action: { label: "View Cart", href: "/cart" },
    });
  }

  function handleResetPreferenceOverride() {
    setFitPreferenceOverride(undefined);
    toast({
      type: "info",
      title: "Fit Preference Synced",
      message: `Restored your saved ${bodyProfile?.fitPreference ?? "regular"} fit preference.`,
    });
  }

  // Dedicated Invalid-Product Error State (no silent fallback)
  if (invalidProductId) {
    return (
      <>
        <Suspense fallback={null}>
          <FitCheckProductQuerySync
            availableGarments={catalogGarments}
            onResolveProduct={handleResolveProduct}
          />
        </Suspense>
        <div className="mx-auto max-w-2xl space-y-6 py-8">
          <div
            role="alert"
            className="rounded-3xl border border-dashed border-amber-300 bg-white/95 p-6 text-center shadow-xs sm:p-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <Badge variant="amber" className="mt-4">
              Product Not Found
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
              Garment Unavailable for Fit Check
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              No product matching{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
                {invalidProductId}
              </code>{" "}
              exists in the FITLOOM catalogue. Choose a valid garment below or
              browse the shop.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {catalogGarments.slice(0, 4).map((g) => (
                <Button
                  key={g.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectGarment(g.id)}
                >
                  {g.name}
                </Button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-slate-100 pt-5">
              <Link href="/shop">
                <Button>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Browse Shop Catalogue
                </Button>
              </Link>
              <Link href="/body-profile">
                <Button variant="outline">Manage Body Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isTrouser =
    fitCheckResult?.category === "Trousers" ||
    fitCheckResult?.garmentType === "trousers" ||
    garment?.category === "Trousers" ||
    garment?.garmentType === "trousers";

  const primaryAnchor = isTrouser ? "waist" : "chest";

  const unavailableDimensions =
    fitCheckResult?.comparisons
      .filter((c) => c.compatibility === "missing_garment_spec")
      .map((c) => c.label) ?? [];

  const notApplicableDimensions =
    fitCheckResult?.comparisons
      .filter((c) => c.compatibility === "not_applicable")
      .map((c) => c.label) ?? [];

  return (
    <div className="space-y-8 pb-12">
      <Suspense fallback={null}>
        <FitCheckProductQuerySync
          availableGarments={catalogGarments}
          onResolveProduct={handleResolveProduct}
        />
      </Suspense>

      {/* Page Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Fit Intelligence
            </h1>
            <Badge variant="outline">Live Fit Intelligence API</Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Compares your saved Body Profile measurements against available
            garment cut dimensions without guessing missing specs or fabricated
            percentages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* CM / IN Toggle */}
          <div
            role="group"
            aria-label="Measurement unit"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-bold shadow-2xs"
          >
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  unit === u
                    ? "bg-[#6633EE] text-white"
                    : "text-slate-600 hover:text-slate-950"
                )}
              >
                {u}
              </button>
            ))}
          </div>

          <Link href="/body-profile">
            <Button variant="outline" size="sm">
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              {hasBodyProfile ? "Edit Body Profile" : "Create Body Profile"}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Garment Selection, Profile Context, Preferences & Actions */}
        <div className="min-w-0 space-y-6 lg:col-span-5">
          {/* 1. Garment Selector */}
          <section
            aria-labelledby="garment-selector-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div>
              <label
                id="garment-selector-heading"
                htmlFor="fit-garment-select"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                Select Garment to Calibrate
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Size rules adapt automatically by garment category.
              </p>
            </div>

            <select
              id="fit-garment-select"
              value={garment?.id ?? ""}
              onChange={(e) => handleSelectGarment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
            >
              {catalogGarments.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category} · {g.fitType} Cut)
                </option>
              ))}
            </select>

            {garment && (
              <div className="space-y-4 pt-1">
                <div className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {garment.image && !imgError ? (
                      <Image
                        src={garment.image}
                        alt={`${garment.name} product thumbnail`}
                        fill
                        sizes="64px"
                        className="object-cover"
                        onError={() => setImgError(true)}
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
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" size="sm">
                        {garment.category}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {garment.fitType} Cut
                      </Badge>
                    </div>
                    <h2 className="mt-1 truncate text-sm font-extrabold text-slate-950">
                      {garment.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      ₹{garment.priceInr.toLocaleString("en-IN")} · Sizes{" "}
                      {garment.sizes.join(", ") || "Unavailable"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-violet-50/60 p-4 text-xs leading-relaxed text-slate-700">
                  <p className="font-bold text-slate-950">
                    Fabric &amp; Semantic Compatibility
                  </p>
                  <p className="mt-1">
                    <strong>Fabric:</strong> {garment.fabric}
                  </p>
                  <p className="mt-1 text-slate-600">{garment.stretchNote}</p>
                  <p className="mt-2 border-t border-violet-200/70 pt-2 text-[11px] text-[#4C1D95]">
                    {garment.category === "Trousers"
                      ? "Compatibility Rule: Evaluated on Waist dimensions. Upper-body Chest, Shoulder, and Sleeve measurements are excluded."
                      : "Compatibility Rule: Evaluated on Chest (primary) and Waist (secondary). Lower-body Inseam is excluded."}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 2. Body Profile Snapshot & Fit Preference Calibration */}
          <section
            aria-labelledby="calibration-context-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="calibration-context-heading"
                className="flex items-center gap-2 text-sm font-extrabold text-slate-950"
              >
                <SlidersHorizontal
                  className="h-4 w-4 text-[#6633EE]"
                  aria-hidden="true"
                />
                Fit Preference &amp; Profile
              </h2>
              {isOverridden && (
                <button
                  type="button"
                  onClick={handleResetPreferenceOverride}
                  className="inline-flex cursor-pointer items-center gap-1 rounded text-xs font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Reset to saved ({bodyProfile?.fitPreference})
                </button>
              )}
            </div>

            {/* Body Profile Status Banner */}
            {!hasBodyProfile ? (
              <div
                role="status"
                className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950"
              >
                <p className="font-bold">No Saved Body Profile Found</p>
                <p className="mt-1 leading-relaxed text-amber-900">
                  Save your height, chest, waist, and tailoring dimensions first
                  so FITLOOM can match compatible garment sizes accurately.
                </p>
                <Link href="/body-profile" className="mt-3 inline-block">
                  <Button size="sm">
                    Create Body Profile
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Active Body Profile ({unit.toUpperCase()})
                  </span>
                  <Link
                    href="/body-profile"
                    className="font-bold text-[#6633EE] hover:underline"
                  >
                    Update Measurements →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MEASUREMENT_FIELDS.map((field) => {
                    const val = bodyProfile?.[field.key];
                    const formatted =
                      typeof val === "number" && Number.isFinite(val) && val > 0
                        ? `${formatLengthFromCm(val, unit)} ${unit}`
                        : "Missing";
                    return (
                      <div
                        key={field.key}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                      >
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {field.shortLabel}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fit Preference Selector */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  id="fit-pref-group-label"
                  className="text-xs font-bold text-slate-800"
                >
                  Target Ease Preference
                </span>
                <Badge variant={isOverridden ? "amber" : "default"} size="sm">
                  {isOverridden
                    ? "Preview Override"
                    : hasBodyProfile
                    ? "Saved Profile Preference"
                    : "Default Preference"}
                </Badge>
              </div>

              <div
                role="radiogroup"
                aria-labelledby="fit-pref-group-label"
                className="grid grid-cols-2 gap-2"
              >
                {FIT_PREFERENCE_CARDS.map((card) => {
                  const isSelected = activeFitPreference === card.id;
                  const easeCm = getFitPreferenceEaseCm(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setFitPreferenceOverride(card.id)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        isSelected
                          ? "border-[#6633EE] bg-violet-50/90 ring-1 ring-[#6633EE]"
                          : "border-slate-200 bg-white hover:border-violet-300"
                      )}
                    >
                      <span className="block text-xs font-extrabold text-slate-950">
                        {card.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-[#6633EE]">
                        {formatEaseThresholdCm(easeCm, unit)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Switching preference here previews how tighter or roomier ease
                targets affect size matching without overwriting your saved Body
                Profile.
              </p>
            </div>
          </section>

          {/* 3. Integrated Actions & Cross-Route Navigation */}
          {garment && (
            <section
              aria-label="Garment actions and route links"
              className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
            >
              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!fitCheckResult?.recommendedSize || isLoadingFitCheck}
                onClick={handleAddRecommendedToCart}
              >
                {justAddedSize ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Added Size {justAddedSize} to Bag
                  </>
                ) : fitCheckResult?.recommendedSize ? (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    Add Recommended Size {fitCheckResult.recommendedSize}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    No Standard Size Recommended
                  </>
                )}
              </Button>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/shop/${encodeURIComponent(garment.id)}`}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Product Details
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </Link>
                <Link
                  href={`/try-on?product=${encodeURIComponent(garment.id)}`}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Try-On (Coming Soon)
                  </Button>
                </Link>
                <Link
                  href={`/studio?product=${encodeURIComponent(garment.id)}`}
                  className="block"
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    Style Studio
                  </Button>
                </Link>
                <Link
                  href={`/customfit?product=${encodeURIComponent(garment.id)}`}
                  className="block"
                >
                  <Button
                    variant={
                      fitCheckResult?.escalateToCustomFit
                        ? "secondary"
                        : "ghost"
                    }
                    size="sm"
                    className="w-full text-[#4C1D95]"
                  >
                    <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                    CUSTOMFIT
                  </Button>
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Fit Recommendation, Explainable Breakdown & Tables */}
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* STATE 1: 401 UNAUTHORIZED / GUEST */}
          {fitCheckError?.status === 401 || (!isLoadingAuth && user.role === "guest") ? (
            <div
              role="alert"
              className="rounded-3xl border border-dashed border-violet-200 bg-white/95 p-6 text-center shadow-xs sm:p-10"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-[#6633EE]">
                <Lock className="h-7 w-7" aria-hidden="true" />
              </div>
              <Badge variant="outline" className="mt-4">
                Authentication Required
              </Badge>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-950">
                Sign in to run Fit Intelligence
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                FITLOOM compares your saved body profile measurements against
                garment cut specs. Sign in to your account to view your
                personalized size recommendation.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/login?next=${encodeURIComponent(
                    `/fit-check?product=${selectedGarmentId}`
                  )}`}
                >
                  <Button>Sign In to Continue</Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="outline">Create Account</Button>
                </Link>
              </div>
            </div>
          ) : fitCheckError?.status === 422 ||
            fitCheckError?.code === "MISSING_BODY_PROFILE" ||
            (!isLoadingAuth && !hasBodyProfile) ? (
            /* STATE 2: 422 MISSING_BODY_PROFILE */
            <div
              role="alert"
              className="rounded-3xl border border-dashed border-amber-300 bg-white/95 p-6 text-center shadow-xs sm:p-10"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Ruler className="h-7 w-7" aria-hidden="true" />
              </div>
              <Badge variant="amber" className="mt-4">
                Body Profile Required
              </Badge>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-950">
                No Saved Body Profile Found
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Save your height, chest, waist, and tailoring dimensions in your
                body profile first so FITLOOM can calculate your exact size match.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/body-profile">
                  <Button>Go to Body Profile →</Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline">Browse Shop</Button>
                </Link>
              </div>
            </div>
          ) : isLoadingFitCheck ? (
            /* STATE 3: LOADING */
            <div className="space-y-4 rounded-3xl border border-violet-100 bg-white/95 p-12 text-center shadow-xs">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-[#6633EE]" />
              <h3 className="text-base font-bold text-slate-950">
                Calculating Fit Recommendation...
              </h3>
              <p className="text-xs text-slate-500">
                Comparing your body profile against garment dimensions and ease
                targets.
              </p>
            </div>
          ) : fitCheckError ? (
            /* STATE 4: GENERIC ERROR WITH RETRY */
            <div
              role="alert"
              className="rounded-3xl border border-red-200 bg-red-50/60 p-8 text-center shadow-xs"
            >
              <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />
              <h3 className="mt-3 text-base font-bold text-slate-950">
                Unable to Check Fit
              </h3>
              <p className="mt-1.5 text-xs text-slate-600">
                {fitCheckError.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() =>
                  void runFitCheck(selectedGarmentId, activeFitPreference)
                }
              >
                Retry Fit Check
              </Button>
            </div>
          ) : fitCheckResult ? (
            /* STATE 5: SUCCESSFUL FIT CHECK RESULT */
            <>
              {/* A. Fit Summary & Recommendation Card */}
              <section
                aria-labelledby="fit-summary-heading"
                className={cn(
                  "space-y-5 rounded-3xl border bg-white/95 p-5 shadow-xs sm:p-6",
                  fitCheckResult.status === "ready"
                    ? "border-violet-200/90"
                    : "border-amber-200"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6633EE]">
                      Fit Recommendation
                    </span>
                    <h2
                      id="fit-summary-heading"
                      className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl"
                    >
                      {fitCheckResult.recommendedSize
                        ? `Size ${fitCheckResult.recommendedSize}`
                        : fitCheckResult.summaryHeadline}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        fitCheckResult.status === "ready"
                          ? "success"
                          : fitCheckResult.status === "missing_body_profile" ||
                            fitCheckResult.status ===
                              "incomplete_body_measurements"
                          ? "warning"
                          : "amber"
                      }
                    >
                      {fitCheckResult.status === "ready" ? (
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      )}
                      {fitCheckResult.evidenceSummary}
                    </Badge>
                  </div>
                </div>

                {/* Explainable Reasoning Bullets */}
                <div className="space-y-2.5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#4C1D95]">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    Why this outcome was calculated
                  </p>
                  <ul className="space-y-1.5 text-sm leading-relaxed text-slate-700">
                    {fitCheckResult.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6633EE]"
                          aria-hidden="true"
                        />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CUSTOMFIT Escalation Callout */}
                {fitCheckResult.escalateToCustomFit &&
                  fitCheckResult.escalationReason &&
                  garment && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-violet-300 bg-violet-50/30 p-4 text-xs text-slate-800">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-extrabold text-slate-950">
                          Tailoring Guidance (CUSTOMFIT)
                        </p>
                        <p className="leading-relaxed text-slate-600">
                          {fitCheckResult.escalationReason}
                        </p>
                      </div>
                      <Link
                        href={`/customfit?product=${encodeURIComponent(
                          garment.id
                        )}`}
                      >
                        <Button size="sm" variant="secondary">
                          <Scissors
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Explore CUSTOMFIT
                        </Button>
                      </Link>
                    </div>
                  )}

                {/* Alternative Size Options */}
                {fitCheckResult.alternativeSizes &&
                  fitCheckResult.alternativeSizes.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Alternative Standard Sizes
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {fitCheckResult.alternativeSizes.map((alt) => (
                          <div
                            key={alt.size}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-slate-950">
                                Size {alt.size}
                              </span>
                              <Badge variant="outline" size="sm">
                                {alt.relationship === "size_down"
                                  ? "Size Down"
                                  : alt.relationship === "size_up"
                                  ? "Size Up"
                                  : "Alternative"}
                              </Badge>
                            </div>
                            <p className="mt-1.5 leading-relaxed text-slate-600">
                              {alt.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </section>

              {/* B. Dimension-by-Dimension Semantic Comparison Table */}
              {fitCheckResult.comparisons &&
                fitCheckResult.comparisons.length > 0 && (
                  <section
                    aria-labelledby="dimension-comparison-heading"
                    className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2
                          id="dimension-comparison-heading"
                          className="flex items-center gap-2 text-lg font-extrabold text-slate-950"
                        >
                          <Ruler
                            className="h-4 w-4 text-[#6633EE]"
                            aria-hidden="true"
                          />
                          Dimension Comparison ({unit.toUpperCase()})
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {fitCheckResult.recommendedSize
                            ? `Comparing your Body Profile against Size ${fitCheckResult.recommendedSize} garment specs.`
                            : "Showing body dimensions and compatibility status for this garment."}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm">
                        Target:{" "}
                        {formatEaseThresholdCm(
                          fitCheckResult.targetEaseCm,
                          unit
                        )}
                      </Badge>
                    </div>

                    <div
                      tabIndex={0}
                      role="region"
                      aria-labelledby="dimension-comparison-heading"
                      className="overflow-x-auto rounded-2xl border border-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                    >
                      <table className="w-full min-w-[540px] border-separate border-spacing-0 text-left text-xs">
                        <caption className="sr-only">
                          Dimension-by-dimension comparison between saved body
                          profile and selected garment specs
                        </caption>
                        <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600">
                          <tr>
                            <th
                              scope="col"
                              className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-3.5 py-3 font-bold uppercase tracking-wider"
                            >
                              Dimension
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-3 font-bold uppercase tracking-wider"
                            >
                              Your Body
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-3 font-bold uppercase tracking-wider"
                            >
                              Garment Spec
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-3 font-bold uppercase tracking-wider"
                            >
                              Measured Ease
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-3 font-bold uppercase tracking-wider"
                            >
                              Assessment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fitCheckResult.comparisons.map((row) => (
                            <tr
                              key={row.fieldKey}
                              className="hover:bg-slate-50/70"
                            >
                              <th
                                scope="row"
                                className="sticky left-0 z-10 bg-white px-3.5 py-3 font-extrabold text-slate-950"
                              >
                                <span className="block">{row.label}</span>
                                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                                  {row.compatibility === "primary_anchor"
                                    ? "Primary Anchor"
                                    : row.compatibility ===
                                      "secondary_compatible"
                                    ? "Secondary Check"
                                    : row.compatibility === "not_applicable"
                                    ? "Excluded"
                                    : "Spec Missing"}
                                </span>
                              </th>
                              <td className="px-3.5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                {row.bodyValueCm !== null
                                  ? formatMeasureValue(row.bodyValueCm, unit)
                                  : "Missing"}
                              </td>
                              <td className="px-3.5 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                {row.garmentValueCm !== null
                                  ? formatMeasureValue(row.garmentValueCm, unit)
                                  : row.compatibility === "not_applicable"
                                  ? "N/A"
                                  : "Unavailable"}
                              </td>
                              <td className="px-3.5 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                                {row.easeCm !== null
                                  ? formatCmDelta(row.easeCm, unit)
                                  : "—"}
                              </td>
                              <td className="px-3.5 py-3">
                                <Badge
                                  variant={
                                    row.badgeVariant === "danger"
                                      ? "destructive"
                                      : (row.badgeVariant as BadgeVariant)
                                  }
                                  size="sm"
                                >
                                  {row.verdictLabel}
                                </Badge>
                                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                                  {row.explanation}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Explicit Missing & Not-Applicable Summary */}
                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                        <p className="font-bold text-slate-900">
                          Unavailable Garment Dimensions
                        </p>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          {unavailableDimensions.length > 0
                            ? `${unavailableDimensions.join(
                                ", "
                              )} specs are not published in this garment's dataset.`
                            : "All relevant dimensions are listed."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                        <p className="font-bold text-slate-900">
                          Excluded (Incompatible) Dimensions
                        </p>
                        <p className="mt-1 leading-relaxed text-slate-600">
                          {notApplicableDimensions.length > 0
                            ? `${notApplicableDimensions.join(", ")} excluded for ${
                                fitCheckResult.category || "this garment"
                              } to avoid invalid cross-category matching.`
                            : "None excluded."}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

              {/* C. Available Sizes Matrix */}
              {fitCheckResult.sizeBreakdown &&
                fitCheckResult.sizeBreakdown.length > 0 && (
                  <section
                    aria-labelledby="size-matrix-heading"
                    className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
                  >
                    <div className="border-b border-slate-100 pb-3">
                      <h2
                        id="size-matrix-heading"
                        className="text-base font-extrabold text-slate-950"
                      >
                        All Available Sizes Side-by-Side ({unit.toUpperCase()})
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Inspect how each available garment size compares to your{" "}
                        {primaryAnchor}
                        {!isTrouser ? " and waist" : ""}.
                      </p>
                    </div>

                    <div
                      tabIndex={0}
                      role="region"
                      aria-labelledby="size-matrix-heading"
                      className="overflow-x-auto rounded-2xl border border-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                    >
                      <table className="w-full min-w-[460px] border-separate border-spacing-0 text-left text-xs">
                        <caption className="sr-only">
                          Comparison across all available standard garment sizes
                        </caption>
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider"
                            >
                              Size
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider"
                            >
                              Garment{" "}
                              {primaryAnchor === "waist" ? "Waist" : "Chest"}
                            </th>
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider"
                            >
                              Ease
                            </th>
                            {!isTrouser && (
                              <th
                                scope="col"
                                className="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider"
                              >
                                Waist Spec / Ease
                              </th>
                            )}
                            <th
                              scope="col"
                              className="border-b border-slate-200 px-3.5 py-2.5 font-bold uppercase tracking-wider"
                            >
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fitCheckResult.sizeBreakdown.map((row) => (
                            <tr
                              key={row.size}
                              className={cn(
                                row.isRecommended
                                  ? "bg-violet-50/70"
                                  : "hover:bg-slate-50/70"
                              )}
                            >
                              <th
                                scope="row"
                                className="px-3.5 py-2.5 font-extrabold text-slate-950"
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {row.size}
                                  {row.isRecommended && (
                                    <Badge variant="default" size="sm">
                                      Recommended
                                    </Badge>
                                  )}
                                </span>
                              </th>
                              <td className="px-3.5 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                                {row.primaryGarmentCm !== null
                                  ? formatMeasureValue(
                                      row.primaryGarmentCm,
                                      unit
                                    )
                                  : "Unavailable"}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                                {row.primaryEaseCm !== null
                                  ? formatCmDelta(row.primaryEaseCm, unit)
                                  : "—"}
                              </td>
                              {!isTrouser && (
                                <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap">
                                  {row.secondaryGarmentCm !== null
                                    ? `${formatMeasureValue(
                                        row.secondaryGarmentCm,
                                        unit
                                      )} (${
                                        row.secondaryEaseCm !== null
                                          ? formatCmDelta(
                                              row.secondaryEaseCm,
                                              unit
                                            )
                                          : "—"
                                      })`
                                    : "Unavailable"}
                                </td>
                              )}
                              <td className="px-3.5 py-2.5 text-slate-600">
                                {row.statusNote}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
