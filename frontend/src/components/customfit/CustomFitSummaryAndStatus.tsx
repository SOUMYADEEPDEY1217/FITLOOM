"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  Loader2,
  Package,
  Palette,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { MockOrder } from "@/components/providers/fitloom-provider";
import type { MockGarment, MockTailor } from "@/lib/mock-data";
import { getFitPreferenceEaseCm } from "@/lib/mock-data";
import {
  type BodyProfileDraftState,
  MEASUREMENT_FIELDS,
  type MeasurementUnit,
  formatLengthFromCm,
} from "@/lib/body-profile-utils";
import {
  type CustomFitRequest,
  canConfirmCustomFitOrder,
  evaluateCustomFitEligibility,
} from "@/lib/customfit-utils";
import {
  buildOrderTimeline,
  formatOrderDate,
  formatOrderInr,
  getOrderStageMeta,
} from "@/lib/order-status-utils";
import { CUSTOMFIT_SERIF } from "@/components/customfit/CustomFitHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomFitReviewSummaryProps {
  selectedGarment: MockGarment | null;
  selectedTailor: MockTailor | null;
  draft: BodyProfileDraftState;
  unit: MeasurementUnit;
  adjustmentAreas: readonly string[];
  notes: string;
  formError: string | null;
  isSubmitting: boolean;
}

export function CustomFitReviewSummary({
  selectedGarment,
  selectedTailor,
  draft,
  unit,
  adjustmentAreas,
  notes,
  formError,
  isSubmitting,
}: CustomFitReviewSummaryProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const eligibility = evaluateCustomFitEligibility(selectedGarment);
  const enteredCount = MEASUREMENT_FIELDS.filter(
    (f) => draft.lengths[f.key].trim() !== ""
  ).length;
  const totalRequired = MEASUREMENT_FIELDS.length;

  const hasStoredBasePrice =
    typeof selectedGarment?.priceInr === "number" &&
    selectedGarment.priceInr > 0;
  const hasStoredTailorFee =
    typeof selectedTailor?.feeInr === "number" && selectedTailor.feeInr >= 0;
  const referenceEstimate =
    hasStoredBasePrice && hasStoredTailorFee && selectedGarment && selectedTailor
      ? selectedGarment.priceInr + selectedTailor.feeInr
      : null;

  const keyMeasurementsSummary = [
    draft.lengths.chestCm ? `Chest ${draft.lengths.chestCm} ${unit}` : null,
    draft.lengths.waistCm ? `Waist ${draft.lengths.waistCm} ${unit}` : null,
    draft.lengths.hipCm ? `Hips ${draft.lengths.hipCm} ${unit}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <aside aria-labelledby="cf-review-heading" className="space-y-4">
      {/* Mobile Collapsible Quick Review Accordion */}
      <div className="rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] lg:hidden">
        <button
          type="button"
          aria-expanded={mobileExpanded}
          onClick={() => setMobileExpanded((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6633EE]">
              Selection Summary
            </p>
            <p className="truncate text-xs font-bold text-[#1D0B24]">
              {selectedGarment ? selectedGarment.name : "Select a garment"} ·{" "}
              {enteredCount}/{totalRequired} measurements ·{" "}
              {referenceEstimate !== null
                ? `Ref. ₹${referenceEstimate.toLocaleString("en-IN")}`
                : "Quote pending"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#4C1D95] transition-transform",
              mobileExpanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {mobileExpanded && (
          <div className="space-y-2.5 border-t border-[#EAE2F8] px-4 py-3 text-xs text-[#4B5563]">
            <div className="flex justify-between gap-2">
              <span>Fit Preference</span>
              <strong className="capitalize text-[#1D0B24]">
                {draft.fitPreference} (+{getFitPreferenceEaseCm(draft.fitPreference)}{" "}
                cm ease)
              </strong>
            </div>
            <div className="flex justify-between gap-2">
              <span>Adjustments</span>
              <strong className="text-right text-[#1D0B24]">
                {adjustmentAreas.length > 0
                  ? adjustmentAreas.join(", ")
                  : "None selected"}
              </strong>
            </div>
            <div className="flex justify-between gap-2">
              <span>Atelier</span>
              <strong className="text-[#1D0B24]">
                {selectedTailor ? selectedTailor.name : "None selected"}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Unified Review Summary & Final Submit Panel */}
      <div className="rounded-3xl border border-[#DDD6FE] bg-white p-5 shadow-xs sm:p-6">
        <div className="border-b border-[#F3EEFE] pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
            Studio Brief
          </p>
          <h2
            id="cf-review-heading"
            className={cn(
              CUSTOMFIT_SERIF,
              "mt-1 text-xl font-normal text-[#1D0B24]"
            )}
          >
            Your CUSTOMFIT Summary
          </h2>
        </div>

        {/* Selected Garment Row */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-[#F0EAFA] bg-[#FAF8FE] p-3">
          {selectedGarment ? (
            <>
              <div className="relative flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE2F8] bg-white">
                {selectedGarment.image && !thumbFailed ? (
                  <Image
                    src={selectedGarment.image}
                    alt={selectedGarment.name}
                    fill
                    sizes="56px"
                    onError={() => setThumbFailed(true)}
                    className="object-cover object-top"
                  />
                ) : (
                  <Palette
                    className="h-5 w-5 text-[#6633EE]"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-bold text-[#1D0B24]">
                  {selectedGarment.name}
                </p>
                <p className="text-[#6B7280]">{selectedGarment.category}</p>
                {hasStoredBasePrice && (
                  <p className="mt-0.5 font-semibold text-[#4C1D95] tabular-nums">
                    Base: ₹{selectedGarment.priceInr.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="py-1 text-xs text-[#6B7280]">
              No garment selected yet. Choose a piece in Step 01.
            </p>
          )}
        </div>

        {/* Spec Checklist */}
        <dl className="mt-4 space-y-3 text-xs">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[#6B7280]">Measurements</dt>
            <dd className="text-right font-semibold text-[#1D0B24]">
              <span
                className={cn(
                  enteredCount === totalRequired
                    ? "text-emerald-700"
                    : "text-amber-700"
                )}
              >
                {enteredCount}/{totalRequired} completed
              </span>
              {keyMeasurementsSummary && (
                <span className="mt-0.5 block text-[11px] font-normal text-[#6B7280]">
                  {keyMeasurementsSummary}
                </span>
              )}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#6B7280]">Fit Preference</dt>
            <dd className="font-semibold text-[#1D0B24]">
              <span className="capitalize">{draft.fitPreference}</span> (+
              {getFitPreferenceEaseCm(draft.fitPreference)} cm ease)
            </dd>
          </div>

          <div className="flex items-start justify-between gap-3">
            <dt className="text-[#6B7280]">Adjustments</dt>
            <dd className="max-w-[62%] text-right font-medium text-[#1D0B24]">
              {adjustmentAreas.length > 0
                ? adjustmentAreas.join(", ")
                : "Standard proportions"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-3">
            <dt className="text-[#6B7280]">Workshop</dt>
            <dd className="text-right font-semibold text-[#1D0B24]">
              {selectedTailor ? (
                <>
                  {selectedTailor.name}
                  <span className="block text-[11px] font-normal text-[#6B7280]">
                    {selectedTailor.city} · Ref. +₹
                    {selectedTailor.feeInr.toLocaleString("en-IN")}
                  </span>
                </>
              ) : (
                "Select tailor workshop"
              )}
            </dd>
          </div>

          {notes.trim() && (
            <div className="rounded-xl border border-[#F0EAFA] bg-[#FCFBFF] p-3">
              <dt className="text-[11px] font-semibold text-[#4C1D95]">
                Tailoring Notes
              </dt>
              <dd className="mt-1 break-words text-xs leading-relaxed text-[#4B5563]">
                {notes.trim()}
              </dd>
            </div>
          )}
        </dl>

        {/* Reference Pricing Row */}
        <div className="mt-4 border-t border-[#F3EEFE] pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-[#4B5563]">
              Reference Estimate
            </span>
            <span className="text-lg font-bold text-[#1D0B24] tabular-nums">
              {referenceEstimate !== null
                ? `₹${referenceEstimate.toLocaleString("en-IN")}`
                : "Pending Workshop Quote"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
            Reference combination of base garment price + listed tailoring fee
            only. Final pricing requires workshop quote approval.
          </p>
        </div>

        {/* Validation Alert & Submission CTA */}
        <div className="mt-5 space-y-3 border-t border-[#F3EEFE] pt-4">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={!eligibility.eligible || isSubmitting}
            className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-4 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(126,45,242,0.24)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" aria-hidden="true" />
                <span>Submit CustomFit Request</span>
              </>
            )}
          </Button>

          <p className="text-[11px] leading-relaxed text-[#6B7280]">
            Your request will be reviewed by the selected workshop. Final pricing
            and production details will be shared through the existing quote
            workflow.
          </p>
        </div>
      </div>
    </aside>
  );
}

interface CustomFitRequestStatusProps {
  requests: readonly CustomFitRequest[];
  activeRequest: CustomFitRequest | null;
  justSubmittedId: string | null;
  unit: MeasurementUnit;
  customerCustomOrders: readonly MockOrder[];
  onSelectRequest: (id: string) => void;
  onSimulateQuote: (req: CustomFitRequest) => void;
  onApproveQuote: (req: CustomFitRequest) => void;
  onAddToBag: (req: CustomFitRequest) => void;
  onBackToConfigurator: () => void;
}

export function CustomFitRequestStatus({
  requests,
  activeRequest,
  justSubmittedId,
  unit,
  customerCustomOrders,
  onSelectRequest,
  onSimulateQuote,
  onApproveQuote,
  onAddToBag,
  onBackToConfigurator,
}: CustomFitRequestStatusProps) {
  const quoteGate = activeRequest
    ? canConfirmCustomFitOrder(activeRequest)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToConfigurator}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#FAF8FE]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Configure New CUSTOMFIT
        </button>

        <Link
          href="/orders"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#6633EE] hover:underline"
        >
          View All Customer Orders
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {justSubmittedId && activeRequest?.id === justSubmittedId && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="font-bold">
              CUSTOMFIT Request {activeRequest.id} Logged (Pending Workshop
              Quote)
            </p>
            <p className="text-emerald-900">
              Your measurements and tailoring notes are ready for review by{" "}
              <strong>{activeRequest.tailorName}</strong>. Quote approval and bag
              checkout remain locked until a quote is issued and approved.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Active Session Request & Quote Approval Workflow */}
        <section
          aria-labelledby="cf-active-request-heading"
          className="space-y-5 rounded-3xl border border-[#EAE2F8] bg-white p-5 shadow-xs sm:p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3EEFE] pb-3.5">
            <div>
              <h2
                id="cf-active-request-heading"
                className={cn(
                  CUSTOMFIT_SERIF,
                  "text-xl font-normal text-[#1D0B24]"
                )}
              >
                Customization Request &amp; Quote Workflow
              </h2>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                Workshop review, quote issuance, and explicit customer approval
                gate.
              </p>
            </div>
            {activeRequest && (
              <Badge
                variant={
                  activeRequest.stage === "added_to_bag" ||
                  activeRequest.quoteApproved
                    ? "success"
                    : activeRequest.quoteStatus === "issued_demo"
                      ? "info"
                      : "amber"
                }
              >
                {activeRequest.stage === "pending_quote"
                  ? "Pending Quote"
                  : activeRequest.stage === "quote_ready"
                    ? "Awaiting Approval"
                    : activeRequest.stage === "quote_approved"
                      ? "Quote Approved"
                      : "Added to Bag"}
              </Badge>
            )}
          </div>

          {!activeRequest ? (
            <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] p-6 text-center text-xs text-[#4B5563]">
              <p className="font-semibold text-[#1D0B24]">
                No new customization request submitted in this view yet.
              </p>
              <p className="mt-1">
                Return to the configurator to submit a garment request, or
                inspect your existing tailored orders on the right.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Session request switcher when multiple requests exist */}
              {requests.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {requests.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => onSelectRequest(req.id)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                        req.id === activeRequest.id
                          ? "border-[#6633EE] bg-[#6633EE] text-white"
                          : "border-[#DDD6FE] bg-[#FAF8FE] text-[#4C1D95] hover:border-[#6633EE]"
                      )}
                    >
                      {req.id} · {req.garmentName}
                    </button>
                  ))}
                </div>
              )}

              {/* Request Details Box */}
              <div className="space-y-2 rounded-2xl border border-[#F0EAFA] bg-[#FAF8FE] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#6633EE]">
                    {activeRequest.id}
                  </span>
                  <span className="text-[#6B7280]">
                    Submitted {formatOrderDate(activeRequest.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#1D0B24]">
                  {activeRequest.garmentName}
                </p>
                <p className="text-[#4B5563]">
                  Workshop: <strong>{activeRequest.tailorName}</strong> (
                  {activeRequest.tailorCity})
                </p>
                <p className="text-[#4B5563]">
                  Specs:{" "}
                  {formatLengthFromCm(activeRequest.measurements.chestCm, unit)}{" "}
                  {unit} chest ·{" "}
                  {formatLengthFromCm(activeRequest.measurements.waistCm, unit)}{" "}
                  {unit} waist ·{" "}
                  {formatLengthFromCm(activeRequest.measurements.hipCm, unit)}{" "}
                  {unit} hips ·{" "}
                  <span className="capitalize">
                    {activeRequest.fitPreference} fit
                  </span>
                </p>
                {activeRequest.adjustmentAreas.length > 0 && (
                  <p className="text-[#4B5563]">
                    Adjustments: {activeRequest.adjustmentAreas.join(", ")}
                  </p>
                )}
                {activeRequest.notes && (
                  <p className="text-[#4C1D95]">Notes: {activeRequest.notes}</p>
                )}
              </div>

              {/* Explicit Quote & Acceptance Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#EAE2F8] bg-white p-3.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Quote Status
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 font-bold text-[#1D0B24]">
                    <Clock
                      className="h-3.5 w-3.5 text-[#6633EE]"
                      aria-hidden="true"
                    />
                    {activeRequest.quoteStatus === "issued_demo"
                      ? "Demo Quote Issued"
                      : "Pending Tailor Quote"}
                  </span>
                </div>
                <div className="rounded-xl border border-[#EAE2F8] bg-white p-3.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Tailor Acceptance
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 font-bold text-[#1D0B24]">
                    <ShieldCheck
                      className="h-3.5 w-3.5 text-[#6633EE]"
                      aria-hidden="true"
                    />
                    {activeRequest.tailorAcceptanceStatus === "accepted_demo"
                      ? "Demo Accepted (Simulated)"
                      : "Pending Tailor Acceptance"}
                  </span>
                </div>
              </div>

              {/* Pending Quote Simulation vs Issued Quote Breakdown */}
              {activeRequest.quote === null ? (
                <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950">
                  <p className="font-bold">
                    Awaiting Workshop Quote Before Approval
                  </p>
                  <p className="leading-relaxed text-amber-900">
                    The selected workshop reviews your proportions and confirms
                    final cost. You can simulate the workshop quote step below
                    to test the approval and checkout gate in this demo.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSimulateQuote(activeRequest)}
                    className="w-full whitespace-normal bg-white text-center"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Simulate Workshop Quote Response (Frontend Demo)</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#1D0B24]">
                      Reference Quote Breakdown
                    </span>
                    <Badge variant="amber" size="sm">
                      Demo Simulation
                    </Badge>
                  </div>
                  <div className="space-y-1.5 border-b border-[#EAE2F8] pb-2.5 text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Base Garment Price</span>
                      <span className="font-semibold text-[#1D0B24] tabular-nums">
                        {formatOrderInr(activeRequest.quote.garmentBasePriceInr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tailoring Reference Fee</span>
                      <span className="font-semibold text-[#1D0B24] tabular-nums">
                        +{formatOrderInr(activeRequest.quote.tailoringFeeInr)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Reference Turnaround (Dates pending)</span>
                      <span>
                        ~{activeRequest.quote.referenceTurnaroundDays} days
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#1D0B24]">
                    <span>Quoted Total</span>
                    <span className="tabular-nums">
                      {formatOrderInr(activeRequest.quote.totalPriceInr)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    {activeRequest.quote.issuedNotice}
                  </p>
                </div>
              )}

              {/* Gate Buttons */}
              <div className="space-y-2.5 border-t border-[#F3EEFE] pt-3.5">
                <Button
                  type="button"
                  variant={
                    activeRequest.quoteApproved ? "secondary" : "default"
                  }
                  disabled={
                    activeRequest.quote === null || activeRequest.quoteApproved
                  }
                  onClick={() => onApproveQuote(activeRequest)}
                  className="min-h-10 w-full whitespace-normal text-center"
                >
                  {activeRequest.quoteApproved ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Quote Approved by Customer</span>
                    </>
                  ) : (
                    <span>
                      {activeRequest.quote === null
                        ? "Approve Quote (Locked Until Quote Exists)"
                        : "Approve Tailoring Quote"}
                    </span>
                  )}
                </Button>

                {activeRequest.stage === "added_to_bag" ? (
                  <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    <p className="font-bold">
                      Approved CUSTOMFIT Item Added to Shopping Bag
                    </p>
                    <p className="text-emerald-900">
                      Proceed to your Shopping Bag or Demo Checkout to log a
                      tracked CUSTOMFIT order.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/cart"
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#6633EE] px-4 text-xs font-semibold text-white hover:bg-[#5522D9]"
                      >
                        Open Shopping Bag
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      <Link
                        href="/checkout"
                        className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-xs font-semibold text-emerald-950 hover:bg-emerald-100"
                      >
                        Checkout
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      disabled={!quoteGate?.allowed}
                      onClick={() => onAddToBag(activeRequest)}
                      className="min-h-10 w-full whitespace-normal text-center"
                    >
                      <ShoppingBag
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Add Approved CUSTOMFIT to Bag</span>
                    </Button>
                    {quoteGate && !quoteGate.allowed && (
                      <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                        <Info
                          className="h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                          aria-hidden="true"
                        />
                        <span>{quoteGate.reason}</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right: Existing CUSTOMFIT Orders & Stage Progress */}
        <section
          aria-labelledby="cf-orders-tracking-heading"
          className="space-y-4 rounded-3xl border border-[#EAE2F8] bg-white p-5 shadow-xs sm:p-6 lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#F3EEFE] pb-3.5">
            <div>
              <h2
                id="cf-orders-tracking-heading"
                className={cn(
                  CUSTOMFIT_SERIF,
                  "text-xl font-normal text-[#1D0B24]"
                )}
              >
                Tracked CUSTOMFIT Orders
              </h2>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                Live status across your custom orders in this session.
              </p>
            </div>
            <Package className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
          </div>

          {customerCustomOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] p-6 text-center text-xs text-[#4B5563]">
              No tracked CUSTOMFIT orders have been placed in this session yet.
            </div>
          ) : (
            <div className="space-y-4">
              {customerCustomOrders.map((ord) => {
                const stageMeta = getOrderStageMeta(ord.stage);
                const timeline = buildOrderTimeline(ord);

                return (
                  <div
                    key={ord.id}
                    className="space-y-3 rounded-2xl border border-[#EAE2F8] bg-[#FCFBFF] p-4 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/orders/${encodeURIComponent(ord.id)}`}
                        className="font-mono text-sm font-bold text-[#1D0B24] hover:text-[#6633EE] hover:underline"
                      >
                        {ord.id}
                      </Link>
                      <Badge variant={stageMeta.badgeVariant}>
                        {stageMeta.stage}
                      </Badge>
                    </div>

                    <p className="font-semibold text-[#1D0B24]">
                      {ord.items.map((i) => i.name).join(", ")}
                    </p>
                    <p className="text-[#4B5563]">
                      {ord.tailorName ? `${ord.tailorName} · ` : ""}
                      {formatOrderInr(ord.totalInr)} · Placed{" "}
                      {formatOrderDate(ord.createdAt)}
                    </p>

                    {/* Concise Stage Stepper preserving accurate completion state */}
                    <ol className="space-y-1.5 border-t border-[#F0EAFA] pt-2.5">
                      {timeline.steps.map((step) => (
                        <li
                          key={step.key}
                          className={cn(
                            "flex items-center gap-2 text-[11px]",
                            step.status === "current"
                              ? "font-bold text-[#4C1D95]"
                              : step.status === "completed"
                                ? "font-medium text-[#1D0B24]"
                                : "text-[#9CA3AF]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                              step.status === "completed" &&
                                "bg-[#6633EE] text-white",
                              step.status === "current" &&
                                "border border-[#6633EE] bg-[#EDE9FE] text-[#6633EE]",
                              (step.status === "pending" ||
                                step.status === "halted") &&
                                "border border-[#DDD6FE] bg-white text-[#9CA3AF]"
                            )}
                          >
                            {step.status === "completed" ? (
                              <Check className="h-2.5 w-2.5" aria-hidden="true" />
                            ) : step.status === "current" ? (
                              "•"
                            ) : (
                              ""
                            )}
                          </span>
                          <span>{step.label}</span>
                        </li>
                      ))}
                    </ol>

                    {timeline.terminalNotice && (
                      <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900">
                        {timeline.terminalNotice.title}
                        {timeline.terminalNotice.reason
                          ? `: ${timeline.terminalNotice.reason}`
                          : ""}
                      </p>
                    )}

                    <div className="pt-1">
                      <Link
                        href={`/orders/${encodeURIComponent(ord.id)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
                      >
                        Inspect full order details
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
