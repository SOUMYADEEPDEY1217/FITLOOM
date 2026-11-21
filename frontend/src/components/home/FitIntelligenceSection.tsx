"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import {
  FitPreference,
  MOCK_GARMENTS,
  computeMockFitPreview,
} from "@/lib/mock-data";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getQualitativeAssessment(
  verdictTag: "Buy" | "Consider" | "Skip",
  fitPref: FitPreference,
): { label: string; detail: string } {
  if (verdictTag === "Buy") {
    return {
      label: "Balanced Compatibility",
      detail: `Aligns cleanly with your ${fitPref} ease target across core torso specs.`,
    };
  }
  if (verdictTag === "Consider") {
    return {
      label: "Moderate Variance — Compare Zones",
      detail:
        "Standard ready-to-wear size sits close; review chest/waist deltas below.",
    };
  }
  return {
    label: "Split Fit — Consider CUSTOMFIT",
    detail:
      "Standard size ease deviates meaningfully from your selected preference.",
  };
}

export function FitIntelligenceSection() {
  const { bodyProfile, updateBodyProfile, toast } = useFitloom();
  const [selectedGarmentId, setSelectedGarmentId] = useState(
    MOCK_GARMENTS[0].id,
  );
  const [chestInput, setChestInput] = useState(String(bodyProfile.chestCm));
  const [fitPref, setFitPref] = useState<FitPreference>(
    bodyProfile.fitPreference,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [calibrationNote, setCalibrationNote] = useState<string | null>(null);

  const selectedGarment =
    MOCK_GARMENTS.find((g) => g.id === selectedGarmentId) ?? MOCK_GARMENTS[0];
  const fitPreview = computeMockFitPreview(bodyProfile, selectedGarment);

  // Derive deterministic alternative size from mock garment chest table
  const targetEase = fitPref === "slim" ? 5 : fitPref === "regular" ? 8 : 12;
  const desiredChest = bodyProfile.chestCm + targetEase;
  const rankedSizes = [...selectedGarment.sizes].sort(
    (a, b) =>
      Math.abs(selectedGarment.chestMapCm[a] - desiredChest) -
      Math.abs(selectedGarment.chestMapCm[b] - desiredChest),
  );
  const alternativeSize =
    rankedSizes.find((s) => s !== fitPreview.recommendedSize) ?? rankedSizes[0];

  const recChestCm = selectedGarment.chestMapCm[fitPreview.recommendedSize];
  const recWaistCm = selectedGarment.waistMapCm[fitPreview.recommendedSize];
  const chestDelta = recChestCm - bodyProfile.chestCm;
  const waistDelta = recWaistCm - bodyProfile.waistCm;

  const zoneCards = [
    {
      zone: "Chest",
      comparison: `Garment ${recChestCm} cm vs. Profile ${bodyProfile.chestCm} cm`,
      deltaLabel: `${chestDelta >= 0 ? "+" : ""}${chestDelta} cm ease`,
      status:
        chestDelta < 4
          ? "Snug"
          : chestDelta <= 12
            ? "Balanced Ease"
            : "Relaxed Room",
      note:
        chestDelta < 4
          ? "Close fit around chest; structured non-stretch fabric may feel tight."
          : "Allows comfortable breathing room under selected fit preference.",
    },
    {
      zone: "Waist",
      comparison: `Garment ${recWaistCm} cm vs. Profile ${bodyProfile.waistCm} cm`,
      deltaLabel: `${waistDelta >= 0 ? "+" : ""}${waistDelta} cm ease`,
      status:
        waistDelta < 4
          ? "Tapered"
          : waistDelta <= 14
            ? "Balanced Ease"
            : "Relaxed Room",
      note:
        waistDelta < 4
          ? "Contoured waistline; check fastening pull when seated."
          : "Clean mid-torso drape matching garment cut.",
    },
    {
      zone: "Hip",
      comparison: `Profile ${bodyProfile.hipCm} cm · Cut: ${selectedGarment.fitType}`,
      deltaLabel:
        selectedGarment.category === "Trousers"
          ? "Pleated Rise"
          : "Hem Clearance",
      status:
        bodyProfile.hipCm > recWaistCm + 12 ? "Check Hem" : "Proportionate",
      note:
        bodyProfile.hipCm > recWaistCm + 12
          ? "Hip fullness sits wider than waist cut—consider sizing up or CUSTOMFIT."
          : "Hem width accommodates hip curve naturally.",
    },
    {
      zone: "Shoulder",
      comparison: `Profile ${bodyProfile.shoulderCm} cm · ${selectedGarment.fitType} Seam`,
      deltaLabel:
        selectedGarment.fitType === "Relaxed"
          ? "Dropped Seam"
          : "Structured Seam",
      status: "Cut-Guided",
      note: `${selectedGarment.stretchNote}`,
    },
  ];

  const assessment = getQualitativeAssessment(fitPreview.verdictTag, fitPref);
  const hasFitWarning =
    chestDelta < 4 || waistDelta < 4 || bodyProfile.hipCm > recWaistCm + 12;

  async function handleApplyCalibration(e: React.FormEvent) {
    e.preventDefault();
    const chestNum = Number(chestInput);
    if (Number.isNaN(chestNum) || !chestInput.trim()) {
      const errorMsg =
        "Please enter a valid chest measurement between 70 and 150 cm.";
      setValidationError(errorMsg);
      setCalibrationNote(null);
      toast({
        type: "error",
        title: "Invalid Measurement",
        message: errorMsg,
      });
      return;
    }
    const res = await updateBodyProfile(
      { ...bodyProfile, chestCm: chestNum, fitPreference: fitPref },
      "Homepage fit intelligence demo",
    );
    if (!res.ok) {
      const errorMsg = res.error ?? "Measurement must stay within 70–150 cm.";
      setValidationError(errorMsg);
      setCalibrationNote(null);
      toast({
        type: "error",
        title: "Calibration Out of Range",
        message: errorMsg,
      });
      return;
    }
    const successMsg = `Sample preview calibrated to ${chestNum} cm chest (${fitPref} fit).`;
    setValidationError(null);
    setCalibrationNote(successMsg);
    toast({
      type: "success",
      title: "Sample Fit Updated",
      message: successMsg,
    });
  }

  return (
    <section
      id="fit-check"
      aria-labelledby="fit-intelligence-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="fit-intelligence-heading"
              className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
            >
              See why a size fits before adding to cart.
            </h2>
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              Sample Data · Deterministic Math
            </span>
          </div>
          <p className="fitloom-prose-pretty max-w-[62ch] text-sm leading-relaxed text-slate-600 sm:text-base">
            Separate from visual Try-On, FITLOOM compares your chest and waist
            dimensions against per-size garment cut tables and fabric ease.
          </p>
        </div>

        <Link
          href={`/fit-check?product=${selectedGarment.id}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 shadow-2xs transition-colors hover:border-[#6633EE]/50 hover:bg-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
        >
          Open Full Fit Intelligence
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Calibration Controls */}
        <div className="rounded-2xl border border-violet-200/90 bg-white p-6 shadow-xs lg:col-span-5">
          <div className="border-b border-slate-200/80 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6633EE]">
              Sample Calibration Input
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-950">
              {selectedGarment.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {selectedGarment.fabric} · {selectedGarment.fitType} Construction
            </p>
          </div>

          <form onSubmit={handleApplyCalibration} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="garment-select"
                className="block text-xs font-semibold text-slate-700"
              >
                Sample Garment
              </label>
              <select
                id="garment-select"
                value={selectedGarmentId}
                onChange={(e) => setSelectedGarmentId(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
              >
                {MOCK_GARMENTS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="chest-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Chest (cm)
                </label>
                <input
                  id="chest-input"
                  type="number"
                  min={70}
                  max={150}
                  value={chestInput}
                  onChange={(e) => setChestInput(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="fit-pref-select"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Fit Preference
                </label>
                <select
                  id="fit-pref-select"
                  value={fitPref}
                  onChange={(e) => setFitPref(e.target.value as FitPreference)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                >
                  <option value="slim">Slim (+5 cm)</option>
                  <option value="regular">Regular (+8 cm)</option>
                  <option value="relaxed">Relaxed (+12 cm)</option>
                </select>
              </div>
            </div>

            {validationError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                {validationError}
              </p>
            )}
            {calibrationNote && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
              >
                {calibrationNote}
              </p>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full whitespace-normal text-center"
            >
              <SlidersHorizontal
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              Recalculate Sample Fit Preview
            </Button>
          </form>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <span>
              <strong className="text-slate-900">Mock Explanation:</strong>{" "}
              {fitPreview.reasoning}
            </span>
          </div>
        </div>

        {/* Right Structured Fit-Analysis Panel (no invented %) */}
        <div className="flex flex-col justify-between rounded-2xl border border-violet-200/90 bg-white p-6 shadow-xs lg:col-span-7">
          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-stretch gap-3">
                <div className="rounded-xl border border-violet-200 bg-[#FAF7FF] px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Recommended Size
                  </span>
                  <p className="mt-0.5 text-2xl font-black text-[#6633EE] sm:text-3xl">
                    Size {fitPreview.recommendedSize}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-600">
                    Alternative Size
                  </span>
                  <p className="mt-0.5 text-xl font-bold text-slate-900 sm:mt-1.5">
                    Size {alternativeSize}
                  </p>
                </div>
              </div>

              <div className="text-left sm:max-w-[16.5rem] sm:text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-[#EDE9FE] px-3 py-1 text-xs font-bold text-[#4C1D95]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {assessment.label}
                </span>
                <p className="mt-1.5 text-xs leading-snug text-slate-600">
                  {assessment.detail}
                </p>
              </div>
            </div>

            {/* Body-zone breakdown: Chest, Waist, Hip, Shoulder */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {zoneCards.map((item) => (
                <div
                  key={item.zone}
                  className="rounded-xl border border-violet-200/80 bg-[#FAF7FF]/80 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-950">
                      {item.zone}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        item.status === "Snug" || item.status === "Check Hem"
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {item.deltaLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-[#4C1D95]">
                    {item.comparison}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-slate-600">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Fit Warning or Clean Confirmation */}
          <div
            className={cn(
              "mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs leading-relaxed",
              hasFitWarning
                ? "border-amber-300 bg-amber-50/85 text-amber-900"
                : "border-emerald-200 bg-emerald-50/80 text-emerald-900",
            )}
          >
            <div className="flex items-start gap-2">
              {hasFitWarning ? (
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
              )}
              <span>
                {hasFitWarning
                  ? `Fit Warning: One or more zones sit tighter than standard ${fitPref} ease. Compare Size ${alternativeSize} or explore CUSTOMFIT.`
                  : `All primary garment zones align within healthy ease boundaries for your sample profile.`}
              </span>
            </div>
            <Link
              href={`/shop/${selectedGarment.id}`}
              className="inline-flex shrink-0 items-center whitespace-nowrap font-bold text-[#6633EE] hover:underline"
            >
              Inspect Size Chart →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
