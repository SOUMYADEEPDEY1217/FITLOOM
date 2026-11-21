"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, Sparkles, Trash2, User } from "lucide-react";
import { BodyType, FitPreference, GarmentType, getFitPreferenceEaseCm } from "@/lib/mock-data";
import {
  LengthFieldKey,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  formatLengthFromCm,
} from "@/lib/body-profile-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Avatar3DViewer } from "@/components/avatar/Avatar3DViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import {
  ProductsQuery,
  ProductItem,
  AvatarDressInput,
  AvatarDressResponse,
  GarmentTypeOption,
  FitPreferenceAvatarOption,
} from "@/lib/api/types";
import {
  GARMENT_TYPE_OPTIONS,
  SIZE_OPTIONS,
  FIT_PREFERENCE_OPTIONS,
  type AvatarGarmentSize,
} from "@/lib/garments";

interface DigitalAvatarPreviewProps {
  metricsCm: Partial<Record<LengthFieldKey, number>>;
  unit: MeasurementUnit;
  fitPreference: FitPreference;
  bodyType?: BodyType | "";
  weightKg?: string;
  hasSavedProfile: boolean;
  isEditing: boolean;
  activeZone: LengthFieldKey;
  onSelectZone: (zone: LengthFieldKey) => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function DigitalAvatarPreview({
  metricsCm,
  unit,
  fitPreference,
  bodyType,
  weightKg,
  hasSavedProfile,
  isEditing,
  activeZone,
  onSelectZone,
}: DigitalAvatarPreviewProps) {
  const completedKeys = MEASUREMENT_FIELDS.filter(
    (f) => typeof metricsCm[f.key] === "number" && (metricsCm[f.key] ?? 0) > 0
  );
  const missingFields = MEASUREMENT_FIELDS.filter(
    (f) => !(typeof metricsCm[f.key] === "number" && (metricsCm[f.key] ?? 0) > 0)
  );
  const completedCount = completedKeys.length;
  const totalCount = MEASUREMENT_FIELDS.length;
  const isComplete = completedCount === totalCount;
  const isEmpty = !hasSavedProfile && completedCount === 0;

  // Bounded proportional offsets for illustrative 2D silhouette only
  const shoulderHalf = clamp(
    36 + ((metricsCm.shoulderCm ?? 40) - 40) * 0.7,
    30,
    46
  );
  const chestHalf = clamp(
    28 + ((metricsCm.chestCm ?? 92) - 92) * 0.35,
    22,
    38
  );
  const waistHalf = clamp(
    20 + ((metricsCm.waistCm ?? 70) - 70) * 0.35,
    16,
    34
  );
  const hipHalf = clamp(
    28 + ((metricsCm.hipCm ?? 98) - 98) * 0.35,
    22,
    40
  );

  const cx = 110;
  const sL = cx - shoulderHalf;
  const sR = cx + shoulderHalf;
  const cL = cx - chestHalf;
  const cR = cx + chestHalf;
  const wL = cx - waistHalf;
  const wR = cx + waistHalf;
  const hL = cx - hipHalf;
  const hR = cx + hipHalf;

  const activeMeta =
    MEASUREMENT_FIELDS.find((f) => f.key === activeZone) ??
    MEASUREMENT_FIELDS[1];
  const activeValueCm = metricsCm[activeMeta.key];
  const activeDisplayValue = activeValueCm
    ? `${formatLengthFromCm(activeValueCm, unit)} ${unit}`
    : "Not entered";

  const easeCm = getFitPreferenceEaseCm(fitPreference);

  const {
    avatarId,
    avatarServiceOffline,
    isGeneratingAvatar,
    generateAvatarPreset,
    checkAvatarStatus,
    toast,
  } = useFitloom();

  const [viewMode, setViewMode] = useState<"3d" | "2d">("2d");

  // Garment Panel State
  const [garmentPanelGarmentType, setGarmentPanelGarmentType] = useState<GarmentTypeOption>("shirt");
  const [garmentPanelCatalogue, setGarmentPanelCatalogue] = useState<ProductItem[]>([]);
  const [garmentPanelSelectedProductId, setGarmentPanelSelectedProductId] = useState<string | null>(null);
  const [garmentPanelSelectedSize, setGarmentPanelSelectedSize] = useState<AvatarGarmentSize>("M");
  const [garmentPanelFitPreference, setGarmentPanelFitPreference] = useState<FitPreferenceAvatarOption>("regular");
  const [garmentPanelRecommendedSize, setGarmentPanelRecommendedSize] = useState<AvatarGarmentSize | null>(null);
  const [garmentPanelLoading, setGarmentPanelLoading] = useState(false);
  const [garmentPanelError, setGarmentPanelError] = useState<string | null>(null);
  const [garmentPanelDressedUrl, setGarmentPanelDressedUrl] = useState<string | null>(null);
  const [garmentPanelCatalogueLoading, setGarmentPanelCatalogueLoading] = useState(false);

  const selectedGarmentPanelProduct = useMemo(
    () => garmentPanelCatalogue.find((g) => g.id === garmentPanelSelectedProductId) ?? null,
    [garmentPanelCatalogue, garmentPanelSelectedProductId]
  );

  // Garment Panel: Fetch catalogue when garment type changes
  useEffect(() => {
    let cancelled = false;
    setGarmentPanelCatalogueLoading(true);
    setGarmentPanelCatalogue([]);
    setGarmentPanelSelectedProductId(null);

    const query: ProductsQuery = {
      garmentType: garmentPanelGarmentType,
      limit: 50,
    };

    api.getProducts(query)
      .then((res) => {
        if (!cancelled) {
          setGarmentPanelCatalogue(res.products);
          if (res.products.length > 0) {
            setGarmentPanelSelectedProductId(res.products[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGarmentPanelCatalogue([]);
        }
      })
      .finally(() => {
        if (!cancelled) setGarmentPanelCatalogueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [garmentPanelGarmentType]);

  // Garment Panel: Fetch fit check recommendation when product/size/preference changes
  useEffect(() => {
    if (!garmentPanelSelectedProductId) {
      setGarmentPanelRecommendedSize(null);
      return;
    }

    let cancelled = false;

    api.fitCheck({
      productId: garmentPanelSelectedProductId,
      fitPreference: garmentPanelFitPreference,
    })
      .then((res) => {
        if (!cancelled && res.recommendedSize) {
          // Map S/M/L/XL to XS/S/M/L/XL/XXL
          const sizeMap: Record<string, AvatarGarmentSize> = {
            XS: "XS",
            S: "S",
            M: "M",
            L: "L",
            XL: "XL",
            XXL: "XXL",
          };
          setGarmentPanelRecommendedSize(sizeMap[res.recommendedSize] ?? "M");
        } else if (!cancelled) {
          setGarmentPanelRecommendedSize("M");
        }
      })
      .catch(() => {
        if (!cancelled) setGarmentPanelRecommendedSize("M");
      });

    return () => {
      cancelled = true;
    };
  }, [garmentPanelSelectedProductId, garmentPanelFitPreference]);

  // Garment Panel: Dress avatar
  const handleDressAvatar = useCallback(async () => {
    if (!avatarId) {
      toast({
        type: "warning",
        title: "Create your avatar first",
        message: "Generate a 3D avatar from your Body Profile before dressing it.",
      });
      return;
    }
    if (avatarServiceOffline) {
      toast({
        type: "error",
        title: "Avatar service offline",
        message: "The 3D avatar engine is temporarily unavailable. Please try again later.",
      });
      return;
    }
    if (!garmentPanelSelectedProductId) {
      toast({
        type: "warning",
        title: "Select a Garment",
        message: "Choose a garment from the catalogue before dressing your avatar.",
      });
      return;
    }

    setGarmentPanelLoading(true);
    setGarmentPanelError(null);

    const input: AvatarDressInput = {
      avatarId,
      garmentType: garmentPanelGarmentType,
      size: garmentPanelSelectedSize,
      fitPreference: garmentPanelFitPreference,
    };

    try {
      const res: AvatarDressResponse = await api.dressAvatar(input);
      const cacheBuster = Date.now();
      const dressedUrl = res.garment.url.includes("?")
        ? `${res.garment.url}&v=${cacheBuster}`
        : `${res.garment.url}?v=${cacheBuster}`;
      setGarmentPanelDressedUrl(dressedUrl);
      toast({
        type: "success",
        title: "Avatar Dressed",
        message: `Garment applied in ${res.mode === "live_avatar_engine" ? "live avatar engine" : "fallback demo"} mode.`,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGarmentPanelError("Please sign in to use the avatar dressing feature.");
        } else if (err.status === 404) {
          setGarmentPanelError("Avatar not found. Please regenerate your avatar.");
        } else if (err.status === 422) {
          setGarmentPanelError(err.message || "Invalid garment selection.");
        } else if (err.status === 503) {
          setGarmentPanelError("Avatar engine temporarily unavailable. Please try again later.");
        } else {
          setGarmentPanelError(err.message || "Failed to dress avatar.");
        }
      } else {
        setGarmentPanelError("An unexpected error occurred.");
      }
    } finally {
      setGarmentPanelLoading(false);
    }
  }, [avatarId, avatarServiceOffline, garmentPanelGarmentType, garmentPanelSelectedProductId, garmentPanelSelectedSize, garmentPanelFitPreference, toast]);

  // Garment Panel: Remove garment
  const handleRemoveGarment = useCallback(() => {
    setGarmentPanelDressedUrl(null);
    toast({
      type: "info",
      title: "Garment Removed",
      message: "The garment has been removed from your avatar.",
    });
  }, [toast]);

  useEffect(() => {
    checkAvatarStatus();
  }, [checkAvatarStatus]);

  useEffect(() => {
    if (avatarId && !avatarServiceOffline) {
      setViewMode("3d");
    } else {
      setViewMode("2d");
    }
  }, [avatarId, avatarServiceOffline]);

  async function handleGenerateAvatar() {
    const res = await generateAvatarPreset();
    if (res.ok) {
      setViewMode("3d");
      toast({
        type: "success",
        title: "3D Avatar Calibrated",
        message: "Your SMPL 3D mesh was generated from your body profile measurements.",
      });
    } else {
      toast({
        type: "error",
        title: "Avatar Engine Offline",
        message: res.error ?? "Avatar engine is temporarily offline. Using deterministic fit preview.",
      });
    }
  }

  const is3DActive = Boolean(avatarId) && !avatarServiceOffline && viewMode === "3d";

  return (
    <div className="flex flex-col rounded-3xl border border-violet-200/80 bg-gradient-to-b from-white via-[#FAF7FF] to-violet-50/70 p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 pb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-950">
            {is3DActive
              ? "3D Digital Avatar (SMPL)"
              : "Illustrative 2D Digital Avatar"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {avatarId && !avatarServiceOffline && (
            <div className="flex items-center rounded-lg border border-violet-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-0.5 text-xs font-semibold transition-colors",
                  viewMode === "3d"
                    ? "bg-[#6633EE] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                3D Avatar
              </button>
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-0.5 text-xs font-semibold transition-colors",
                  viewMode === "2d"
                    ? "bg-[#6633EE] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                2D Zones
              </button>
            </div>
          )}

          {isEmpty ? (
            <Badge variant="neutral" size="sm">
              No Profile Yet
            </Badge>
          ) : isComplete ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {completedCount}/{totalCount} Zones Active
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Incomplete ({completedCount}/{totalCount})
            </Badge>
          )}
        </div>
      </div>

      {/* Honest 503 / Offline Banner (DEC-005) */}
      {avatarServiceOffline && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/95 p-3.5 text-xs text-amber-950 shadow-2xs"
        >
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Avatar service offline — Using deterministic fit preview</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
            The 3D avatar engine is temporarily unavailable (DEC-005: Never present
            fallback output as a real avatar). The silhouette below is an
            illustrative 2D proportional guide based on your entered measurements,
            not an anatomical 3D scan.
          </p>
        </div>
      )}

      {/* Generate 3D Avatar Prompt when profile exists */}
      {hasSavedProfile && !avatarId && !avatarServiceOffline && !isEditing && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-3.5">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Generate 3D Avatar (SMPL Mesh)
            </p>
            <p className="text-[11px] text-slate-600">
              Calibrate an interactive 3D avatar with A-Pose and T-Pose from your measurements.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAvatar}
            disabled={isGeneratingAvatar}
            className="cursor-pointer"
          >
            {isGeneratingAvatar ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating 3D Avatar...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Generate 3D Avatar
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State when no profile exists & nothing typed */}
      {isEmpty ? (
        <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white/85 px-5 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-[#6633EE]">
            <User className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-extrabold text-slate-950">
            No Body Profile Saved Yet
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-600">
            {isEditing
              ? "Enter your measurements in the form or apply Smart Estimate to preview your illustrative fit zones here."
              : "Create your Body Profile to unlock personalized Fit Intelligence scores, Digital Avatar zone mapping, and CUSTOMFIT sizing."}
          </p>
        </div>
      ) : is3DActive && avatarId ? (
        <>
          <Avatar3DViewer avatarId={avatarId} garmentUrl={garmentPanelDressedUrl} className="mt-4" />
          {/* Garment Panel */}
          <section
            aria-labelledby="garment-panel-heading"
            className="mt-4 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <h3
                id="garment-panel-heading"
                className="flex items-center gap-2 text-sm font-extrabold text-slate-950"
              >
                <Sparkles className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                Dress Your Avatar
              </h3>
              <Badge variant="neutral" size="sm">
                Beta
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Select a garment from the live catalogue, pick your size and fit
              preference, and see it on your 3D avatar.
            </p>

            {/* Garment Type Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="garment-panel-type-bp"
                className="block text-xs font-bold text-slate-800"
              >
                Garment Type
              </label>
              <select
                id="garment-panel-type-bp"
                value={garmentPanelGarmentType}
                onChange={(e) =>
                  setGarmentPanelGarmentType(e.target.value as GarmentType)
                }
                className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                disabled={garmentPanelCatalogueLoading}
              >
                {GARMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Catalogue Garment Picker */}
            <div className="space-y-1.5">
              <label
                htmlFor="garment-panel-catalogue-bp"
                className="block text-xs font-bold text-slate-800"
              >
                Catalogue Garment
              </label>
              {garmentPanelCatalogueLoading ? (
                <div className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-[#6633EE]" />
                  <span className="ml-2 text-xs text-slate-500">Loading catalogue...</span>
                </div>
              ) : garmentPanelCatalogue.length === 0 ? (
                <div className="min-h-10 w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                  No garments available for this type.
                </div>
              ) : (
                <select
                  id="garment-panel-catalogue-bp"
                  value={garmentPanelSelectedProductId ?? ""}
                  onChange={(e) =>
                    setGarmentPanelSelectedProductId(e.target.value || null)
                  }
                  className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                >
                  <option value="">Select a garment...</option>
                  {garmentPanelCatalogue.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — ₹{g.priceInr.toLocaleString("en-IN")} ({g.color})
                    </option>
                  ))}
                </select>
              )}
              {selectedGarmentPanelProduct ? (
                <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black/15"
                    style={{ backgroundColor: selectedGarmentPanelProduct.swatchHex }}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {selectedGarmentPanelProduct.fitType} Fit · {selectedGarmentPanelProduct.fabric}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">No garment selected.</p>
              )}
            </div>

            {/* Size Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Size
              </label>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Garment size">
                {SIZE_OPTIONS.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    role="radio"
                    aria-checked={garmentPanelSelectedSize === sz}
                    onClick={() => setGarmentPanelSelectedSize(sz)}
                    className={cn(
                      "cursor-pointer min-h-10 min-w-[44px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                      garmentPanelSelectedSize === sz
                        ? "bg-[#6633EE] border-[#6633EE] text-white"
                        : garmentPanelRecommendedSize === sz
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-slate-300 bg-white text-slate-900 hover:border-violet-400 hover:bg-violet-50"
                    )}
                  >
                    {sz}
                    {garmentPanelRecommendedSize === sz && (
                      <span
                        className={cn(
                          "ml-1 text-[10px] font-normal",
                          garmentPanelSelectedSize === sz ? "text-violet-200" : "text-emerald-700 font-semibold"
                        )}
                      >
                        Best
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {garmentPanelRecommendedSize && (
                <p className="text-[11px] text-emerald-700">
                  <span className="font-semibold">Best fit:</span>{" "}
                  {garmentPanelRecommendedSize} (from Fit Check for your
                  {garmentPanelFitPreference} preference)
                </p>
              )}
            </div>

            {/* Fit Preference Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Fit Preference
              </label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fit preference">
                {FIT_PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={garmentPanelFitPreference === opt.value}
                    onClick={() => setGarmentPanelFitPreference(opt.value)}
                    className={cn(
                      "cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                      garmentPanelFitPreference === opt.value
                        ? "bg-[#6633EE] border-[#6633EE] text-white"
                        : "border-slate-300 bg-white text-slate-900 hover:border-violet-400 hover:bg-violet-50"
                    )}
                  >
                    {opt.label} (+{opt.easeCm} cm)
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={handleDressAvatar}
                disabled={garmentPanelLoading || !avatarId || avatarServiceOffline || !garmentPanelSelectedProductId}
                className="flex-1 min-w-[140px]"
              >
                {garmentPanelLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Dressing Avatar...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Dress Avatar
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRemoveGarment}
                disabled={!garmentPanelDressedUrl}
                className="flex-1 min-w-[140px]"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove Garment
              </Button>
            </div>

            {/* Error / Status Messages */}
            {garmentPanelError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{garmentPanelError}</span>
              </div>
            )}
            {!avatarId && !garmentPanelError && !garmentPanelLoading && (
              <div
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Create your avatar first to use the dressing feature.</span>
              </div>
            )}
            {avatarServiceOffline && !garmentPanelError && !garmentPanelLoading && (
              <div
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>Avatar service offline — dressing unavailable.</span>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* 2D SVG Mannequin + Zone Guides */}
          <div className="relative mt-4 flex flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white/90 px-4 py-5 shadow-2xs">
            <svg
              viewBox="0 0 220 330"
              className="h-64 w-auto sm:h-72"
              role="img"
              aria-label="Illustrative 2D fashion tailoring silhouette showing height, shoulder, chest, waist, hip, sleeve, and inseam measurement zones"
            >
              <defs>
                <linearGradient
                  id="ph5dAvatarGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Height vertical axis (left) */}
              <line
                x1="20"
                y1="22"
                x2="20"
                y2="308"
                stroke={activeZone === "heightCm" ? "#6633EE" : "#CBD5E1"}
                strokeWidth={activeZone === "heightCm" ? 2.5 : 1.5}
                strokeDasharray="4 3"
              />
              <line
                x1="15"
                y1="22"
                x2="25"
                y2="22"
                stroke={activeZone === "heightCm" ? "#6633EE" : "#CBD5E1"}
                strokeWidth={2}
              />
              <line
                x1="15"
                y1="308"
                x2="25"
                y2="308"
                stroke={activeZone === "heightCm" ? "#6633EE" : "#CBD5E1"}
                strokeWidth={2}
              />

              {/* Head */}
              <circle
                cx={cx}
                cy="38"
                r="16"
                fill="url(#ph5dAvatarGrad)"
                stroke="#7C3AED"
                strokeWidth="1.5"
              />

              {/* Proportional Body Silhouette */}
              <path
                d={`
                  M ${sL} 74
                  C ${sL} 64, ${sR} 64, ${sR} 74
                  L ${sR + 12} 166
                  L ${sR - 2} 168
                  L ${cR + 4} 102
                  L ${cR} 112
                  Q ${wR + 2} 142, ${wR} 150
                  Q ${hR} 174, ${hR - 2} 194
                  L ${cx + 22} 304
                  L ${cx + 6} 304
                  L ${cx} 214
                  L ${cx - 6} 304
                  L ${cx - 22} 304
                  L ${hL + 2} 194
                  Q ${hL} 174, ${wL} 150
                  Q ${wL - 2} 142, ${cL} 112
                  L ${cL - 4} 102
                  L ${sL + 2} 168
                  L ${sL - 12} 166
                  Z
                `}
                fill="url(#ph5dAvatarGrad)"
                stroke="#7C3AED"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Shoulder Zone */}
              <line
                x1={sL}
                y1="72"
                x2={sR}
                y2="72"
                stroke={activeZone === "shoulderCm" ? "#6633EE" : "#4C1D95"}
                strokeWidth={activeZone === "shoulderCm" ? 3 : 1.5}
                strokeDasharray={activeZone === "shoulderCm" ? undefined : "3 3"}
              />

              {/* Chest Zone */}
              <ellipse
                cx={cx}
                cy="108"
                rx={chestHalf + 3}
                ry="7"
                fill="none"
                stroke={activeZone === "chestCm" ? "#6633EE" : "#7C3AED"}
                strokeWidth={activeZone === "chestCm" ? 2.75 : 1.3}
                strokeDasharray={activeZone === "chestCm" ? undefined : "4 3"}
              />

              {/* Waist Zone */}
              <ellipse
                cx={cx}
                cy="148"
                rx={waistHalf + 2}
                ry="6"
                fill="none"
                stroke={activeZone === "waistCm" ? "#6633EE" : "#7C3AED"}
                strokeWidth={activeZone === "waistCm" ? 2.75 : 1.3}
                strokeDasharray={activeZone === "waistCm" ? undefined : "4 3"}
              />

              {/* Hip Zone */}
              <ellipse
                cx={cx}
                cy="184"
                rx={hipHalf + 3}
                ry="7"
                fill="none"
                stroke={activeZone === "hipCm" ? "#6633EE" : "#7C3AED"}
                strokeWidth={activeZone === "hipCm" ? 2.75 : 1.3}
                strokeDasharray={activeZone === "hipCm" ? undefined : "4 3"}
              />

              {/* Sleeve Line (Right arm outer line) */}
              <line
                x1={sR + 4}
                y1="74"
                x2={sR + 16}
                y2="166"
                stroke={activeZone === "sleeveCm" ? "#6633EE" : "#94A3B8"}
                strokeWidth={activeZone === "sleeveCm" ? 3 : 1.5}
                strokeDasharray={activeZone === "sleeveCm" ? undefined : "3 3"}
              />

              {/* Inseam Line (Inner leg) */}
              <line
                x1={cx + 3}
                y1="214"
                x2={cx + 8}
                y2="304"
                stroke={activeZone === "inseamCm" ? "#6633EE" : "#64748B"}
                strokeWidth={activeZone === "inseamCm" ? 3 : 1.5}
                strokeDasharray={activeZone === "inseamCm" ? undefined : "3 3"}
              />
            </svg>

            {/* Active Zone Callout */}
            <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2.5 text-xs">
              <div>
                <span className="font-bold text-[#4C1D95]">
                  {activeMeta.label} Zone
                </span>
                <p className="text-[11px] text-slate-600">
                  {activeMeta.guidance}
                </p>
              </div>
              <Badge variant={activeValueCm ? "default" : "warning"} size="sm">
                {activeDisplayValue}
              </Badge>
            </div>
          </div>

          {/* Interactive Zone Chips */}
          <div className="mt-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Select Zone to Highlight
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MEASUREMENT_FIELDS.map((field) => {
                const val = metricsCm[field.key];
                const isSelected = activeZone === field.key;
                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => onSelectZone(field.key)}
                    aria-pressed={isSelected}
                    className={cn(
                      "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                      isSelected
                        ? "border-[#6633EE] bg-[#6633EE] text-white shadow-2xs"
                        : val
                        ? "border-violet-200 bg-white text-slate-800 hover:border-[#6633EE]/50"
                        : "border-amber-200 bg-amber-50/80 text-amber-900 hover:border-amber-400"
                    )}
                  >
                    {field.shortLabel}:{" "}
                    {val ? `${formatLengthFromCm(val, unit)} ${unit}` : "Missing"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Missing Zones Notice if Incomplete */}
          {!isComplete && (
            <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
              <p className="font-bold">Incomplete Measurements</p>
              <p className="mt-0.5 text-[11px]">
                Missing: {missingFields.map((f) => f.label).join(", ")}. Complete
                all 7 required zones for accurate Fit Intelligence scoring.
              </p>
            </div>
          )}
        </>
      )}

      {/* Available Profile Summary Tags */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-violet-100 bg-white/85 p-3.5 text-xs sm:grid-cols-3">
        <div>
          <span className="text-[11px] font-medium text-slate-500">
            Preferred Fit
          </span>
          <p className="font-bold capitalize text-slate-950">
            {fitPreference} (+{easeCm} cm)
          </p>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500">
            Body Type
          </span>
          <p className="font-bold capitalize text-slate-950">
            {bodyType ? bodyType.replace("-", " ") : "Not specified"}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-500">
            Weight (Optional)
          </span>
          <p className="font-bold text-slate-950">
            {weightKg?.trim() ? `${weightKg} kg` : "Optional"}
          </p>
        </div>
      </div>

      {/* Honest Disclaimer */}
      <div className="mt-3.5 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]" aria-hidden="true" />
        <p>
          Illustrative 2D proportion guide only — not a 3D body scan or exact
          anatomical reconstruction.
        </p>
      </div>
    </div>
  );
}
