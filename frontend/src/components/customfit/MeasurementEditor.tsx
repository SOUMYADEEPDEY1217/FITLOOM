"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  Ruler,
} from "lucide-react";
import {
  type BodyProfileDraftState,
  type BodyProfileErrorKey,
  type LengthFieldKey,
  MEASUREMENT_FIELDS,
  type MeasurementUnit,
  cmToInchesNumber,
} from "@/lib/body-profile-utils";
import { CUSTOMFIT_SERIF } from "@/components/customfit/CustomFitHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MeasurementEditorProps {
  unit: MeasurementUnit;
  draft: BodyProfileDraftState;
  hasBodyProfile: boolean;
  hasManualEdits: boolean;
  fieldErrors: Partial<Record<BodyProfileErrorKey, string>>;
  onUnitSwitch: (nextUnit: MeasurementUnit) => void;
  onLengthChange: (key: LengthFieldKey, rawValue: string) => void;
  onConfirmImportProfile: () => void;
}

function displayMeasurementLabel(key: LengthFieldKey, fallback: string): string {
  return key === "hipCm" ? "Hips" : fallback;
}

export function MeasurementEditor({
  unit,
  draft,
  hasBodyProfile,
  hasManualEdits,
  fieldErrors,
  onUnitSwitch,
  onLengthChange,
  onConfirmImportProfile,
}: MeasurementEditorProps) {
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const missingFields = MEASUREMENT_FIELDS.filter(
    (field) => draft.lengths[field.key].trim() === ""
  );
  const enteredCount = MEASUREMENT_FIELDS.length - missingFields.length;

  function handleImportClick() {
    if (!hasBodyProfile) return;
    if (hasManualEdits) {
      setConfirmOverwriteOpen(true);
      return;
    }
    onConfirmImportProfile();
  }

  return (
    <section
      aria-labelledby="cf-measurements-heading"
      className="space-y-5 border-b border-[#EAE2F8] pb-8"
    >
      {/* Header + Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
            Step 02 · Exact Dimensions
          </p>
          <h2
            id="cf-measurements-heading"
            className={cn(
              CUSTOMFIT_SERIF,
              "mt-1 text-2xl font-normal text-[#1D0B24] sm:text-[1.75rem]"
            )}
          >
            Your Measurements
          </h2>
          <p className="mt-1 text-xs text-[#4B5563] sm:text-sm">
            Share your measurements for a more personalized fit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CM / IN Switcher */}
          <div
            role="group"
            aria-label="Measurement unit"
            className="inline-flex h-9 items-center rounded-xl border border-[#DDD6FE] bg-[#FAF8FE] p-1 text-xs font-semibold"
          >
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => onUnitSwitch(u)}
                className={cn(
                  "h-7 cursor-pointer rounded-lg px-3 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  unit === u
                    ? "bg-[#6633EE] text-white shadow-2xs"
                    : "text-[#4C1D95] hover:bg-white"
                )}
              >
                {u}
              </button>
            ))}
          </div>

          {hasBodyProfile && (
            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              <Download className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              Import from Body Profile
            </button>
          )}

          <button
            type="button"
            aria-expanded={showGuide}
            onClick={() => setShowGuide((prev) => !prev)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#EAE2F8] bg-white px-3 text-xs font-semibold text-[#4B5563] transition-colors hover:border-[#DDD6FE] hover:text-[#1D0B24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
            {showGuide ? "Hide Guide" : "How to Measure"}
          </button>
        </div>
      </div>

      {/* Inline Overwrite Confirmation when manual edits would be replaced */}
      {confirmOverwriteOpen && (
        <div
          role="alertdialog"
          aria-labelledby="cf-overwrite-title"
          className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-0.5">
            <p id="cf-overwrite-title" className="font-bold">
              Replace manually edited measurements?
            </p>
            <p className="text-amber-900">
              Importing from your saved Body Profile will overwrite the custom
              values you entered in this form.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onConfirmImportProfile();
                setConfirmOverwriteOpen(false);
              }}
              className="h-8 bg-[#6633EE] px-3 text-xs text-white hover:bg-[#5522D9]"
            >
              Confirm Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmOverwriteOpen(false)}
              className="h-8 bg-white px-3 text-xs text-[#1D0B24]"
            >
              Keep My Edits
            </Button>
          </div>
        </div>
      )}

      {/* Body Profile Empty State OR Completeness Strip */}
      {!hasBodyProfile ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] p-4 text-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <p className="font-semibold text-[#1D0B24]">
              No Saved Body Profile Detected
            </p>
            <p className="text-[#4B5563]">
              Fields start blank so your measurements are always yours. Enter
              all seven measurements manually below, or set up your Body Profile
              for one-click import.
            </p>
          </div>
          <Link
            href="/body-profile"
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3.5 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
          >
            <Ruler className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
            Create Body Profile
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F0EAFA] bg-[#FAF8FE] px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            {missingFields.length === 0 ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
            )}
            <span className="font-medium text-[#1D0B24]">
              {enteredCount} of {MEASUREMENT_FIELDS.length} measurements filled
              {missingFields.length > 0 && (
                <span className="text-[#6B7280]">
                  {" "}
                  · Missing:{" "}
                  {missingFields
                    .map((f) => displayMeasurementLabel(f.key, f.label))
                    .join(", ")}
                </span>
              )}
            </span>
          </div>
          {hasManualEdits && (
            <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[10px] font-semibold text-[#4C1D95]">
              Customized in studio
            </span>
          )}
        </div>
      )}

      {/* Optional On-Demand Measurement Guidance */}
      {showGuide && (
        <div className="rounded-2xl border border-[#EAE2F8] bg-[#FCFBFF] p-4">
          <p className="text-xs font-bold text-[#1D0B24]">
            Tailoring Measurement Reference Guide
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-0.5">
                <dt className="font-semibold text-[#4C1D95]">
                  {displayMeasurementLabel(field.key, field.label)}
                </dt>
                <dd className="leading-relaxed text-[#4B5563]">
                  {field.guidance}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 7 Structured Measurement Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MEASUREMENT_FIELDS.map((field) => {
          const err = fieldErrors[field.key];
          const label = displayMeasurementLabel(field.key, field.label);
          const rangeLabel =
            unit === "in"
              ? `${cmToInchesNumber(field.minCm)}–${cmToInchesNumber(
                  field.maxCm
                )} in`
              : `${field.minCm}–${field.maxCm} cm`;

          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`customfit-${field.key}`}
                  className="text-xs font-semibold text-[#1D0B24]"
                >
                  {label} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#6B7280] tabular-nums">
                  {rangeLabel}
                </span>
              </div>

              <div className="relative">
                <Input
                  id={`customfit-${field.key}`}
                  name={field.key}
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder={
                    unit === "cm" ? field.placeholderCm : field.placeholderIn
                  }
                  value={draft.lengths[field.key]}
                  onChange={(e) => onLengthChange(field.key, e.target.value)}
                  aria-invalid={Boolean(err)}
                  aria-describedby={
                    err ? `customfit-${field.key}-err` : undefined
                  }
                  className={cn(
                    "h-10 rounded-xl border-[#DDD6FE] bg-white pr-11 text-sm text-[#1D0B24] tabular-nums placeholder:text-[#9CA3AF] focus-visible:ring-[#6633EE]",
                    err && "border-rose-400 focus-visible:ring-rose-400"
                  )}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-semibold uppercase text-[#6B7280]">
                  {unit}
                </span>
              </div>

              {err && (
                <p
                  id={`customfit-${field.key}-err`}
                  role="alert"
                  className="text-[11px] font-medium text-rose-600"
                >
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
