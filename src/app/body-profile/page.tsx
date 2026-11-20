"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  RotateCcw,
  Ruler,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { BodyType, FitPreference, getFitPreferenceEaseCm } from "@/lib/mock-data";
import {
  BODY_TYPE_OPTIONS,
  BodyProfileDraftState,
  BodyProfileErrorKey,
  FIT_PREFERENCE_CARDS,
  LengthFieldKey,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  cmToInchesDisplay,
  createDraftFromProfile,
  formatLengthFromCm,
  inchesToCmNumber,
  resolveLivePreviewMetrics,
  switchDraftUnit,
  validateAndBuildBodyProfile,
} from "@/lib/body-profile-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { DigitalAvatarPreview } from "@/components/body-profile/DigitalAvatarPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function BodyProfilePage() {
  const {
    bodyProfile,
    hasBodyProfile,
    measurementHistory,
    updateBodyProfile,
    clearBodyProfile,
    toast,
  } = useFitloom();

  const [isEditing, setIsEditing] = useState<boolean>(!hasBodyProfile);
  const [modeTab, setModeTab] = useState<string>("manual");
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [draft, setDraft] = useState<BodyProfileDraftState>(() =>
    createDraftFromProfile(bodyProfile, hasBodyProfile, "cm")
  );
  const [errors, setErrors] = useState<
    Partial<Record<BodyProfileErrorKey, string>>
  >({});
  const [activeZone, setActiveZone] = useState<LengthFieldKey>("chestCm");
  const [guideOpen, setGuideOpen] = useState<boolean>(true);

  // Sync saved state changes when not actively editing
  useEffect(() => {
    if (!isEditing) {
      setDraft(createDraftFromProfile(bodyProfile, hasBodyProfile, unit));
      setErrors({});
    }
  }, [bodyProfile, hasBodyProfile, isEditing, unit]);

  function handleUnitSwitch(nextUnit: MeasurementUnit) {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    if (isEditing) {
      setDraft((prev) => switchDraftUnit(prev, nextUnit));
      setErrors({});
    }
  }

  function handleLengthChange(key: LengthFieldKey, rawValue: string) {
    setDraft((prev) => ({
      ...prev,
      lengths: {
        ...prev.lengths,
        [key]: rawValue,
      },
      dirtyFields: prev.dirtyFields.includes(key)
        ? prev.dirtyFields
        : [...prev.dirtyFields, key],
    }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleStartCreateOrEdit(initialTab = "manual") {
    setDraft(createDraftFromProfile(bodyProfile, hasBodyProfile, unit));
    setErrors({});
    setModeTab(initialTab);
    setIsEditing(true);
  }

  function handleCancelEditing() {
    setDraft(createDraftFromProfile(bodyProfile, hasBodyProfile, unit));
    setErrors({});
    setIsEditing(false);
  }

  function handleResetToSaved() {
    setDraft(createDraftFromProfile(bodyProfile, hasBodyProfile, unit));
    setErrors({});
    toast({
      type: "info",
      title: "Form Reset",
      message: hasBodyProfile
        ? "Restored your last saved Body Profile measurements."
        : "Cleared unsaved form entries.",
    });
  }

  function handleClearSavedProfile() {
    clearBodyProfile();
    setDraft(createDraftFromProfile(bodyProfile, false, unit));
    setErrors({});
    setIsEditing(false);
    toast({
      type: "info",
      title: "Profile Cleared",
      message:
        "Saved Body Profile cleared for this session. Create a new profile anytime.",
    });
  }

  function applySmartEstimate() {
    const rawHeight = draft.lengths.heightCm.trim();
    const parsedHeight = Number(rawHeight);
    let heightCm = 168;

    if (rawHeight !== "" && Number.isFinite(parsedHeight) && parsedHeight > 0) {
      heightCm =
        draft.unit === "in"
          ? inchesToCmNumber(parsedHeight)
          : parsedHeight;
    }

    if (heightCm < 130 || heightCm > 220) {
      setErrors((prev) => ({
        ...prev,
        heightCm:
          draft.unit === "in"
            ? "Enter a valid height between 51.2 and 86.6 in before running Smart Estimate."
            : "Enter a valid height between 130 and 220 cm before running Smart Estimate.",
      }));
      toast({
        type: "error",
        title: "Height Needed for Estimate",
        message: "Please enter a valid height before running Smart Estimate.",
      });
      return;
    }

    const rawWeight = draft.weightKg.trim();
    const parsedWeight = Number(rawWeight);
    const weightKg =
      rawWeight !== "" &&
      Number.isFinite(parsedWeight) &&
      parsedWeight >= 35 &&
      parsedWeight <= 180
        ? parsedWeight
        : 60;

    const chestCm = Math.round(72 + (weightKg - 45) * 0.65);
    const waistCm = Math.max(58, Math.round(chestCm - 18));
    const hipCm = Math.round(chestCm + 5);
    const shoulderCm = Math.round(heightCm * 0.24);
    const sleeveCm = Math.round(heightCm * 0.35);
    const inseamCm = Math.round(heightCm * 0.46);

    const estCm: Record<LengthFieldKey, number> = {
      heightCm: Math.round(heightCm * 10) / 10,
      chestCm,
      waistCm,
      hipCm,
      shoulderCm,
      sleeveCm,
      inseamCm,
    };

    setDraft((prev) => ({
      ...prev,
      canonicalCm: {
        heightCm: String(estCm.heightCm),
        chestCm: String(estCm.chestCm),
        waistCm: String(estCm.waistCm),
        hipCm: String(estCm.hipCm),
        shoulderCm: String(estCm.shoulderCm),
        sleeveCm: String(estCm.sleeveCm),
        inseamCm: String(estCm.inseamCm),
      },
      lengths: {
        heightCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.heightCm)
            : String(estCm.heightCm),
        chestCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.chestCm)
            : String(estCm.chestCm),
        waistCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.waistCm)
            : String(estCm.waistCm),
        hipCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.hipCm)
            : String(estCm.hipCm),
        shoulderCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.shoulderCm)
            : String(estCm.shoulderCm),
        sleeveCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.sleeveCm)
            : String(estCm.sleeveCm),
        inseamCm:
          prev.unit === "in"
            ? cmToInchesDisplay(estCm.inseamCm)
            : String(estCm.inseamCm),
      },
      dirtyFields: [],
    }));
    setErrors({});

    toast({
      type: "info",
      title: "Smart Estimate Applied",
      message: `Populated estimated measurements in ${draft.unit}. Review each zone and save when ready.`,
    });
  }

  function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateAndBuildBodyProfile(draft);

    if (!validation.ok) {
      setErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0] as
        | LengthFieldKey
        | undefined;
      if (
        firstErrorField &&
        MEASUREMENT_FIELDS.some((f) => f.key === firstErrorField)
      ) {
        setActiveZone(firstErrorField);
      }
      toast({
        type: "error",
        title: "Check Measurements",
        message:
          "Please resolve the highlighted measurement errors before saving.",
      });
      return;
    }

    const note = hasBodyProfile
      ? "Updated Body Profile measurements"
      : "Created Body Profile";
    const result = updateBodyProfile(validation.data, note);

    if (!result.ok) {
      toast({
        type: "error",
        title: "Save Failed",
        message: result.error ?? "Unable to save Body Profile.",
      });
      return;
    }

    setErrors({});
    setIsEditing(false);
    toast({
      type: "success",
      title: hasBodyProfile ? "Body Profile Updated" : "Body Profile Created",
      message:
        "Measurements and fit preference saved across Fit Intelligence and Dashboard.",
    });
  }

  // Live preview metrics for Digital Avatar
  const previewMetricsCm: Partial<Record<LengthFieldKey, number>> = isEditing
    ? resolveLivePreviewMetrics(draft)
    : hasBodyProfile
    ? {
        heightCm: bodyProfile.heightCm,
        chestCm: bodyProfile.chestCm,
        waistCm: bodyProfile.waistCm,
        hipCm: bodyProfile.hipCm,
        shoulderCm: bodyProfile.shoulderCm,
        sleeveCm: bodyProfile.sleeveCm,
        inseamCm: bodyProfile.inseamCm,
      }
    : {};

  const step1Active = isEditing || !hasBodyProfile;
  const step2Active = hasBodyProfile && !isEditing;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Dynamic 3-Step Indicator */}
      <div className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Body Profile &amp; Digital Avatar
            </h1>
            <Badge variant={hasBodyProfile ? "success" : "warning"}>
              {hasBodyProfile ? "Calibrated" : "Profile Needed"}
            </Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Enter tailoring measurements in cm or inches and set your preferred
            garment ease to drive Fit Intelligence and CUSTOMFIT pre-fill.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ol
            aria-label="Calibration steps"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold"
          >
            <li
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                step1Active
                  ? "bg-[#6633EE] text-white"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200"
              )}
            >
              1. Body Profile
            </li>
            <li
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                step2Active
                  ? "bg-[#6633EE] text-white"
                  : "bg-violet-100 text-[#4C1D95]"
              )}
            >
              2. Confirm &amp; Build
            </li>
            <li>
              {hasBodyProfile ? (
                <Link
                  href="/fit-check"
                  className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition-colors hover:border-[#6633EE]/50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                >
                  3. Fit Check →
                </Link>
              ) : (
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                  3. Fit Check
                </span>
              )}
            </li>
          </ol>

          {/* Global Unit Selector */}
          <div
            role="group"
            aria-label="Measurement unit"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold shadow-2xs"
          >
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => handleUnitSwitch(u)}
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
        </div>
      </div>

      {/* Main Layout: Digital Avatar (Left 5 cols) + Profile Form / View (Right 7 cols) */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <DigitalAvatarPreview
            metricsCm={previewMetricsCm}
            unit={unit}
            fitPreference={
              isEditing ? draft.fitPreference : bodyProfile.fitPreference
            }
            bodyType={isEditing ? draft.bodyType : bodyProfile.bodyType ?? ""}
            weightKg={
              isEditing
                ? draft.weightKg
                : typeof bodyProfile.weightKg === "number"
                ? String(bodyProfile.weightKg)
                : ""
            }
            hasSavedProfile={hasBodyProfile}
            isEditing={isEditing}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
          />

          {/* Measurement History Card */}
          <section
            aria-labelledby="measurement-history-heading"
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <h2
              id="measurement-history-heading"
              className="text-sm font-bold text-slate-950"
            >
              Calibration History
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Recent saved revisions in your active session.
            </p>
            {measurementHistory.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                No calibration revisions saved yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {measurementHistory.map((entry, idx) => (
                  <div
                    key={`${entry.date}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs"
                  >
                    <span className="font-semibold text-slate-800 break-words">
                      {entry.note}
                    </span>
                    <span className="text-slate-600">
                      Chest {formatLengthFromCm(entry.chestCm, unit)} / Waist{" "}
                      {formatLengthFromCm(entry.waistCm, unit)} {unit} ·{" "}
                      {entry.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Panel: Create/Edit Form OR Saved Profile View Mode */}
        <div className="space-y-6 lg:col-span-7">
          {!hasBodyProfile && !isEditing ? (
            /* Empty State when profile was cleared or not yet created */
            <section className="rounded-3xl border border-dashed border-violet-200 bg-white/95 p-8 text-center shadow-xs sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-[#6633EE]">
                <Ruler className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-slate-950">
                Create Your Body Profile
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
                No Body Profile is saved right now. Add your 7 core measurements
                and preferred garment fit to power Fit Intelligence and CUSTOMFIT
                recommendations.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => handleStartCreateOrEdit("manual")}>
                  <Ruler className="h-4 w-4" aria-hidden="true" />
                  Create Body Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStartCreateOrEdit("smart")}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Try Smart Estimate
                </Button>
              </div>
            </section>
          ) : !isEditing ? (
            /* Saved Profile View Mode */
            <section
              aria-labelledby="saved-profile-heading"
              className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="saved-profile-heading"
                      className="text-xl font-extrabold text-slate-950"
                    >
                      Saved Measurements ({unit})
                    </h2>
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Active
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Values automatically convert cleanly between cm and inches
                    without altering saved calibration precision.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleStartCreateOrEdit("manual")}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit Body Profile
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSavedProfile}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    Clear Profile
                  </Button>
                </div>
              </div>

              {/* 7 Required Measurement Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {MEASUREMENT_FIELDS.map((field) => {
                  const valCm = bodyProfile[field.key];
                  const isFocused = activeZone === field.key;
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => setActiveZone(field.key)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        isFocused
                          ? "border-[#6633EE] bg-violet-50/70"
                          : "border-slate-100 bg-slate-50/70 hover:border-violet-200"
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {field.label}
                      </span>
                      <p className="mt-1 text-lg font-extrabold text-slate-950">
                        {formatLengthFromCm(valCm, unit)}{" "}
                        <span className="text-xs font-semibold text-slate-500">
                          {unit}
                        </span>
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Optional Details & Fit Preference Summary */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4C1D95]">
                    Fit Preference
                  </span>
                  <p className="mt-1 text-base font-extrabold capitalize text-slate-950">
                    {bodyProfile.fitPreference} Fit
                  </p>
                  <p className="text-xs text-slate-600">
                    +{getFitPreferenceEaseCm(bodyProfile.fitPreference)} cm chest
                    ease
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Weight (Optional)
                  </span>
                  <p className="mt-1 text-base font-extrabold text-slate-950">
                    {typeof bodyProfile.weightKg === "number"
                      ? `${bodyProfile.weightKg} kg`
                      : "Not specified"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Body Type (Optional)
                  </span>
                  <p className="mt-1 text-base font-extrabold capitalize text-slate-950">
                    {bodyProfile.bodyType
                      ? bodyProfile.bodyType.replace("-", " ")
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <Link href="/fit-check">
                  <Button>
                    Run Fit Intelligence Check
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </section>
          ) : (
            /* Create / Edit Form Mode */
            <form
              onSubmit={handleSaveSubmit}
              noValidate
              className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">
                    {hasBodyProfile
                      ? "Edit Body Measurements"
                      : "Create Body Profile"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Entering measurements in <strong>{unit.toUpperCase()}</strong>
                    . Decimals (e.g. 36.5) are preserved naturally while typing.
                  </p>
                </div>

                <Tabs
                  activeId={modeTab}
                  onChange={setModeTab}
                  tabs={[
                    { id: "manual", label: "Manual Entry" },
                    { id: "smart", label: "Smart Estimate" },
                  ]}
                />
              </div>

              {modeTab === "smart" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-xs">
                  <div className="max-w-md space-y-0.5">
                    <p className="font-bold text-slate-950">
                      Smart Proportion Estimate
                    </p>
                    <p className="text-slate-600">
                      Estimates Chest, Waist, Hip, Shoulder, Sleeve, and Inseam
                      from your Height and optional Weight in {unit}.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={applySmartEstimate}
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Auto-Estimate
                  </Button>
                </div>
              )}

              {/* 7 Required Measurements Grid */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Required Tailoring Measurements ({unit})
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {MEASUREMENT_FIELDS.map((field) => {
                    const errorMsg = errors[field.key];
                    const inputId = `bp-${field.key}`;
                    const errorId = `${inputId}-error`;
                    const guideId = `${inputId}-guide`;

                    return (
                      <div key={field.key} className="space-y-1">
                        <label
                          htmlFor={inputId}
                          className="flex items-center justify-between text-xs font-semibold text-slate-800"
                        >
                          <span>
                            {field.label} ({unit}){" "}
                            <span className="text-red-500">*</span>
                          </span>
                          <span className="text-[11px] font-normal text-slate-500">
                            {unit === "cm"
                              ? `${field.minCm}–${field.maxCm} cm`
                              : `${formatLengthFromCm(field.minCm, "in")}–${formatLengthFromCm(field.maxCm, "in")} in`}
                          </span>
                        </label>
                        <Input
                          id={inputId}
                          type="text"
                          inputMode="decimal"
                          value={draft.lengths[field.key]}
                          onFocus={() => setActiveZone(field.key)}
                          onChange={(e) =>
                            handleLengthChange(field.key, e.target.value)
                          }
                          placeholder={
                            unit === "cm"
                              ? field.placeholderCm
                              : field.placeholderIn
                          }
                          aria-invalid={Boolean(errorMsg)}
                          aria-describedby={errorMsg ? errorId : guideId}
                          className={cn(
                            errorMsg && "border-red-400 focus:ring-red-400/20"
                          )}
                        />
                        {errorMsg ? (
                          <p
                            id={errorId}
                            role="alert"
                            className="text-xs font-medium text-red-600"
                          >
                            {errorMsg}
                          </p>
                        ) : (
                          <p
                            id={guideId}
                            className="text-[11px] leading-snug text-slate-500"
                          >
                            {field.guidance}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Fields: Weight & Body Type */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Optional Reference Details
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="bp-weightKg"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Weight (kg, optional)
                    </label>
                    <Input
                      id="bp-weightKg"
                      type="text"
                      inputMode="decimal"
                      value={draft.weightKg}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          weightKg: e.target.value,
                        }));
                        if (errors.weightKg) {
                          setErrors((prev) => ({
                            ...prev,
                            weightKg: undefined,
                          }));
                        }
                      }}
                      placeholder="e.g. 58 (optional)"
                      aria-invalid={Boolean(errors.weightKg)}
                      aria-describedby={
                        errors.weightKg ? "bp-weightKg-error" : "bp-weightKg-help"
                      }
                      className={cn(
                        errors.weightKg &&
                          "border-red-400 focus:ring-red-400/20"
                      )}
                    />
                    {errors.weightKg ? (
                      <p
                        id="bp-weightKg-error"
                        role="alert"
                        className="text-xs font-medium text-red-600"
                      >
                        {errors.weightKg}
                      </p>
                    ) : (
                      <p
                        id="bp-weightKg-help"
                        className="text-[11px] text-slate-500"
                      >
                        Optional (35–180 kg); improves Smart Estimate defaults.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="bp-bodyType"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Body Type (optional)
                    </label>
                    <select
                      id="bp-bodyType"
                      value={draft.bodyType}
                      onChange={(e) => {
                        setDraft((prev) => ({
                          ...prev,
                          bodyType: e.target.value as BodyType | "",
                        }));
                        if (errors.bodyType) {
                          setErrors((prev) => ({
                            ...prev,
                            bodyType: undefined,
                          }));
                        }
                      }}
                      className="flex min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                    >
                      <option value="">Not specified</option>
                      {BODY_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Optional silhouette note for garment drape context.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fit Preference Selection */}
              <div className="border-t border-slate-100 pt-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Preferred Garment Fit
                </span>
                <p className="mt-0.5 text-xs text-slate-600">
                  Controls chest and torso ease targets across all size checks.
                </p>
                <div
                  role="radiogroup"
                  aria-label="Preferred garment fit"
                  className="mt-3 grid gap-2.5 sm:grid-cols-2"
                >
                  {FIT_PREFERENCE_CARDS.map((card) => {
                    const selected = draft.fitPreference === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            fitPreference: card.id as FitPreference,
                          }))
                        }
                        className={cn(
                          "cursor-pointer rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                          selected
                            ? "border-[#6633EE] bg-violet-50/80 shadow-2xs"
                            : "border-slate-200 bg-white hover:border-violet-300"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-950">
                            {card.label}
                          </span>
                          <Badge
                            variant={selected ? "default" : "secondary"}
                            size="sm"
                          >
                            {card.easeNote}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-600">
                          {card.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Management Actions */}
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <Button type="submit" size="lg">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {hasBodyProfile ? "Save Changes" : "Create Body Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToSaved}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset Form
                </Button>
                {hasBodyProfile && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEditing}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}

          {/* Complete 7-Point Measurement Guide Panel */}
          <section
            aria-labelledby="measurement-guide-heading"
            className="rounded-3xl border border-violet-100 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <button
              type="button"
              onClick={() => setGuideOpen((prev) => !prev)}
              aria-expanded={guideOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              <div className="flex items-center gap-2">
                <BookOpen
                  className="h-4 w-4 text-[#6633EE]"
                  aria-hidden="true"
                />
                <h2
                  id="measurement-guide-heading"
                  className="text-sm font-bold text-slate-950"
                >
                  How to Take Accurate Measurements (7 Zones)
                </h2>
              </div>
              {guideOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
              )}
            </button>

            {guideOpen && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MEASUREMENT_FIELDS.map((field) => {
                  const active = activeZone === field.key;
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => setActiveZone(field.key)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        active
                          ? "border-[#6633EE] bg-violet-50/70"
                          : "border-slate-100 bg-slate-50/60 hover:border-violet-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-950">
                          {field.label}
                        </span>
                        <span className="text-[11px] font-semibold text-[#6633EE]">
                          Highlight Zone
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {field.guidance}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
