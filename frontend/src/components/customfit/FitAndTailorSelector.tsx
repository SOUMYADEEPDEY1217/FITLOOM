"use client";

import React from "react";
import { Check, MapPin, Star } from "lucide-react";
import {
  type FitPreference,
  type MockGarment,
  type MockTailor,
} from "@/lib/mock-data";
import { FIT_PREFERENCE_CARDS } from "@/lib/body-profile-utils";
import { getAdjustmentOptionsForCategory } from "@/lib/customfit-utils";
import { CUSTOMFIT_SERIF } from "@/components/customfit/CustomFitHero";
import { cn } from "@/lib/utils";

interface FitPreferenceSelectorProps {
  fitPreference: FitPreference;
  onSelectFitPreference: (next: FitPreference) => void;
  selectedGarment: MockGarment | null;
  adjustmentAreas: readonly string[];
  onToggleAdjustment: (label: string) => void;
  notes: string;
  onNotesChange: (next: string) => void;
}

export function FitPreferenceSelector({
  fitPreference,
  onSelectFitPreference,
  selectedGarment,
  adjustmentAreas,
  onToggleAdjustment,
  notes,
  onNotesChange,
}: FitPreferenceSelectorProps) {
  const categoryAdjustments = selectedGarment
    ? getAdjustmentOptionsForCategory(selectedGarment.category)
    : [];

  return (
    <section
      aria-labelledby="cf-preferences-heading"
      className="space-y-6 border-b border-[#EAE2F8] pb-8"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
          Step 03 · Silhouette &amp; Proportion
        </p>
        <h2
          id="cf-preferences-heading"
          className={cn(
            CUSTOMFIT_SERIF,
            "mt-1 text-2xl font-normal text-[#1D0B24] sm:text-[1.75rem]"
          )}
        >
          Define Your Fit
        </h2>
        <p className="mt-1 text-xs text-[#4B5563] sm:text-sm">
          Choose how close or relaxed you want this garment cut, along with any
          focus adjustments.
        </p>
      </div>

      {/* Fit Preference Cards */}
      <fieldset className="space-y-2.5">
        <legend className="text-xs font-semibold text-[#1D0B24]">
          Fit Ease Preference
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FIT_PREFERENCE_CARDS.map((card) => {
            const selected = fitPreference === card.id;
            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectFitPreference(card.id)}
                className={cn(
                  "flex cursor-pointer flex-col justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  selected
                    ? "border-[#6633EE] bg-[#FAF8FE] ring-2 ring-[#6633EE]/15"
                    : "border-[#EAE2F8] bg-white hover:border-[#C4B5FD]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="block text-sm font-bold text-[#1D0B24]">
                      {card.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-[#6633EE]">
                      {card.easeNote}
                    </span>
                  </div>
                  {selected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6633EE] text-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[#4B5563]">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Category-aware Fit Adjustment Focus Chips */}
      <fieldset className="space-y-2.5">
        <legend className="text-xs font-semibold text-[#1D0B24]">
          Fit Adjustments
          {selectedGarment ? ` (${selectedGarment.category})` : ""}
        </legend>

        {categoryAdjustments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categoryAdjustments.map((opt) => {
              const checked = adjustmentAreas.includes(opt.label);
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => onToggleAdjustment(opt.label)}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                    checked
                      ? "border-[#6633EE] bg-[#6633EE] text-white"
                      : "border-[#DDD6FE] bg-white text-[#4C1D95] hover:border-[#6633EE] hover:bg-[#FAF8FE]"
                  )}
                >
                  {checked && <Check className="h-3 w-3" aria-hidden="true" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">
            Select a garment above to choose category-specific adjustment areas.
          </p>
        )}
      </fieldset>

      {/* Additional Tailoring Notes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="customfit-notes"
            className="font-semibold text-[#1D0B24]"
          >
            Additional Tailoring Notes (Optional)
          </label>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              notes.trim().length > 300
                ? "font-semibold text-rose-600"
                : "text-[#6B7280]"
            )}
          >
            {notes.trim().length}/300
          </span>
        </div>
        <textarea
          id="customfit-notes"
          rows={3}
          maxLength={300}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="e.g., Taper waist slightly (-2 cm), leave 1 cm cuff ease for wristwatch"
          className="w-full rounded-2xl border border-[#DDD6FE] bg-white px-4 py-3 text-sm text-[#1D0B24] placeholder:text-[#9CA3AF] focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
        />
      </div>
    </section>
  );
}

interface TailorWorkshopSelectorProps {
  tailors: readonly MockTailor[];
  selectedTailorId: string;
  onSelectTailor: (id: string) => void;
}

export function TailorWorkshopSelector({
  tailors,
  selectedTailorId,
  onSelectTailor,
}: TailorWorkshopSelectorProps) {
  return (
    <section aria-labelledby="cf-tailor-heading" className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
          Step 04 · Partner Atelier
        </p>
        <h2
          id="cf-tailor-heading"
          className={cn(
            CUSTOMFIT_SERIF,
            "mt-1 text-2xl font-normal text-[#1D0B24] sm:text-[1.75rem]"
          )}
        >
          Choose Your Tailor
        </h2>
        <p className="mt-1 text-xs text-[#4B5563] sm:text-sm">
          Find a workshop that can bring your garment to life.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="cf-tailor-heading"
        className="grid grid-cols-1 gap-3.5"
      >
        {tailors.map((t) => {
          const selected = t.id === selectedTailorId;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectTailor(t.id)}
              className={cn(
                "flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:flex-row sm:items-center sm:p-5",
                selected
                  ? "border-[#6633EE] bg-[#FAF8FE] ring-2 ring-[#6633EE]/15"
                  : "border-[#EAE2F8] bg-white hover:border-[#C4B5FD]"
              )}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#1D0B24] sm:text-base">
                    {t.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                    <MapPin className="h-3 w-3 text-[#6633EE]" aria-hidden="true" />
                    {t.city}
                  </span>
                  {selected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6633EE] px-2 py-0.5 text-[10px] font-semibold text-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Selected
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#4B5563]">
                  {t.specialty}
                </p>

                <p className="text-[11px] text-[#6B7280]">
                  Workshop availability &amp; turnaround dates confirmed upon
                  quote review
                </p>
              </div>

              <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-[#F3EEFE] pt-2.5 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <p className="text-sm font-bold text-[#6633EE] tabular-nums">
                  Ref. fee: +₹{t.feeInr.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#4B5563]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1D0B24]">
                    <Star
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    {t.rating}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Ref. ~{t.turnaroundDays} days</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
