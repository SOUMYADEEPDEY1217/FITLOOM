"use client";

import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Ruler,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { OrderStage, useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TAILOR_PRODUCTION_STAGES,
  TailorRejectionReasonSchema,
  formatTailorStageVariant,
  getNextAllowedProductionStage,
  lookupTailorOrderById,
} from "@/lib/tailor-workspace-utils";

function TailorOrderDetailContent({ orderId }: { orderId: string }) {
  const {
    user,
    orders,
    tailorWorkshopProfile,
    tailorAcceptOrder,
    tailorRejectOrder,
    advanceOrderStage,
    toast,
  } = useFitloom();

  const lookup = useMemo(
    () =>
      lookupTailorOrderById({
        orders,
        orderId,
        user,
        workshopProfile: tailorWorkshopProfile,
      }),
    [orders, orderId, user, tailorWorkshopProfile]
  );

  const [rejectReason, setRejectReason] = useState("");
  const [rejectErr, setRejectErr] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmNextStage, setConfirmNextStage] = useState<OrderStage | null>(
    null
  );

  if (lookup.status === "not_found") {
    return (
      <WorkspaceShell
        workspaceId="tailor"
        title="Order Not Found"
        description="The requested order ID could not be located in the Tailor workspace."
      >
        <div
          role="region"
          aria-labelledby="tailor-order-not-found-heading"
          className="mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center"
        >
          <AlertTriangle
            className="mx-auto h-8 w-8 text-amber-500"
            aria-hidden="true"
          />
          <h2
            id="tailor-order-not-found-heading"
            className="mt-3 text-xl font-extrabold text-slate-950"
          >
            Order Not Found
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            No order matching <strong>{orderId}</strong> exists in this demo
            session.
          </p>
          <Link href="/tailor/orders" className="mt-5 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Order Queue
            </Button>
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  if (lookup.status === "not_customfit") {
    return (
      <WorkspaceShell
        workspaceId="tailor"
        title={`Order ${lookup.orderId}`}
        description="Standard ready-to-wear orders are outside the CUSTOMFIT Tailor workspace."
      >
        <div
          role="region"
          aria-labelledby="tailor-order-non-customfit-heading"
          className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white/95 p-8 text-center"
        >
          <ShieldAlert
            className="mx-auto h-8 w-8 text-amber-600"
            aria-hidden="true"
          />
          <h2
            id="tailor-order-non-customfit-heading"
            className="mt-3 text-xl font-extrabold text-slate-950"
          >
            Not a CUSTOMFIT Order
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Order <strong>{lookup.orderId}</strong> is a standard retail order
            rather than a bespoke CUSTOMFIT request, so it is excluded from
            Tailor controls.
          </p>
          <Link href="/tailor/orders" className="mt-5 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Order Queue
            </Button>
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  if (lookup.status === "not_owned") {
    return (
      <WorkspaceShell
        workspaceId="tailor"
        title={`Order ${lookup.orderId}`}
        description="Workshop ownership verification failed for the requested CUSTOMFIT order."
      >
        <div
          role="region"
          aria-labelledby="tailor-order-wrong-workshop-heading"
          className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white/95 p-8 text-center"
        >
          <Lock
            className="mx-auto h-8 w-8 text-amber-600"
            aria-hidden="true"
          />
          <h2
            id="tailor-order-wrong-workshop-heading"
            className="mt-3 text-xl font-extrabold text-slate-950"
          >
            Assigned to Another Workshop
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Order <strong>{lookup.orderId}</strong> belongs to{" "}
            <strong>{lookup.assignedWorkshopName}</strong> and cannot be
            accessed from{" "}
            <strong>{tailorWorkshopProfile.workshopName}</strong>.
          </p>
          <Link href="/tailor/orders" className="mt-5 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Order Queue
            </Button>
          </Link>
        </div>
      </WorkspaceShell>
    );
  }

  const order = lookup.order;
  const nextAllowedStage = getNextAllowedProductionStage(order.stage);
  const currentStageIndex = TAILOR_PRODUCTION_STAGES.indexOf(order.stage);
  const customNotes = order.items
    .map((item) => item.customFitNotes?.trim())
    .filter(Boolean)
    .join(" · ");

  const isTerminalStage =
    order.stage === "Cancelled" ||
    order.stage === "Rejected by Tailor" ||
    order.stage === "Delivered" ||
    order.stage === "Return Requested";

  function handleAcceptOrder() {
    const result = tailorAcceptOrder(order.id);
    if (!result.ok) {
      toast({
        type: "error",
        title: "Cannot Accept Order",
        message: result.error ?? "Order could not be accepted.",
      });
      return;
    }
    setConfirmReject(false);
    setRejectErr(null);
    toast({
      type: "success",
      title: `Order ${order.id} Accepted`,
      message: "Production started — stage updated to Cutting.",
    });
  }

  function handlePrepareReject() {
    const parsed = TailorRejectionReasonSchema.safeParse(rejectReason);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Enter a clear rejection reason.";
      setRejectErr(msg);
      toast({
        type: "error",
        title: "Rejection Reason Required",
        message: msg,
      });
      return;
    }
    setRejectErr(null);
    setConfirmReject(true);
  }

  function handleConfirmReject() {
    const result = tailorRejectOrder(order.id, rejectReason);
    if (!result.ok) {
      setConfirmReject(false);
      setRejectErr(result.error ?? "Unable to reject order.");
      toast({
        type: "error",
        title: "Rejection Failed",
        message: result.error ?? "Unable to reject order.",
      });
      return;
    }
    setConfirmReject(false);
    setRejectErr(null);
    toast({
      type: "info",
      title: `Order ${order.id} Rejected`,
      message: "Customer tracking updated to Rejected by Tailor.",
    });
  }

  function handleConfirmStageAdvance() {
    if (!confirmNextStage) return;
    const target = confirmNextStage;
    const result = advanceOrderStage(order.id, target);
    setConfirmNextStage(null);
    if (!result.ok) {
      toast({
        type: "error",
        title: "Stage Update Blocked",
        message: result.error ?? "Invalid stage transition.",
      });
      return;
    }
    toast({
      type: "success",
      title: `Order ${order.id} Updated`,
      message: `Production stage advanced to ${target}.`,
    });
  }

  return (
    <WorkspaceShell
      workspaceId="tailor"
      title={`Order ${order.id} — ${order.items[0]?.name ?? "Custom Order"}`}
      description="Inspect customer measurements, confirm acceptance, and progress sequential workshop milestones."
      actions={
        <Link href="/tailor/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Tailor Orders
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Measurement Specs & Acceptance */}
        <section className="min-w-0 space-y-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" size="sm">
                  Order {order.id}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {order.tailorName?.trim() || "Workshop not specified"}
                </Badge>
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 break-words sm:text-2xl">
                {order.items[0]?.name ?? "Custom Garment"}
              </h2>
              <p className="text-xs text-slate-600">
                Customer: {order.customerName} · {order.shippingCity} · Placed{" "}
                {order.createdAt}
              </p>
            </div>
            <Badge
              variant={formatTailorStageVariant(order.stage)}
              className="w-fit shrink-0"
            >
              {order.stage}
            </Badge>
          </div>

          {customNotes && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3.5 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Tailoring Notes</p>
              <p className="mt-1">{customNotes}</p>
            </div>
          )}

          {order.stage === "Cancelled" && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">Order Cancelled</p>
                <p className="mt-0.5">
                  This order was cancelled and cannot progress to further
                  production stages.
                  {order.cancelOrReturnReason
                    ? ` Reason: ${order.cancelOrReturnReason}`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {order.stage === "Rejected by Tailor" && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"
            >
              <XCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">Rejected by Workshop</p>
                <p className="mt-0.5">
                  {order.rejectionReason
                    ? `Reason: ${order.rejectionReason}`
                    : "No further production actions are permitted."}
                </p>
              </div>
            </div>
          )}

          {order.stage === "Return Requested" && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <p className="font-bold">Return Requested</p>
                <p className="mt-0.5">
                  Production stage progression is locked while a return request
                  is active.
                  {order.cancelOrReturnReason
                    ? ` Reason: ${order.cancelOrReturnReason}`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {/* Customer Measurements Snapshot (never fabricated if undefined) */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Ruler className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              Customer Measurement Specifications
            </h3>

            {order.measurementsSnapshot ? (
              <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Chest: <strong>{order.measurementsSnapshot.chestCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Waist: <strong>{order.measurementsSnapshot.waistCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Hips: <strong>{order.measurementsSnapshot.hipCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Shoulder:{" "}
                  <strong>{order.measurementsSnapshot.shoulderCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Sleeve:{" "}
                  <strong>{order.measurementsSnapshot.sleeveCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Inseam:{" "}
                  <strong>{order.measurementsSnapshot.inseamCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3">
                  Height:{" "}
                  <strong>{order.measurementsSnapshot.heightCm} cm</strong>
                </div>
                <div className="rounded-xl bg-violet-50/70 p-3 capitalize sm:col-span-2">
                  Fit Preference:{" "}
                  <strong>{order.measurementsSnapshot.fitPreference}</strong>
                </div>
              </div>
            ) : (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950"
              >
                <p className="font-bold">Measurements unavailable</p>
                <p className="mt-1 text-amber-900">
                  No measurement snapshot was submitted with this order.
                  FITLOOM never substitutes default or estimated body dimensions.
                </p>
              </div>
            )}
          </div>

          {order.stage === "Pending Tailor Acceptance" && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleAcceptOrder}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Accept Order &amp; Start Cutting
                </Button>
              </div>

              <div className="space-y-2.5 rounded-xl border border-red-100 bg-red-50/40 p-4">
                <label
                  htmlFor="tailor-reject-reason"
                  className="block text-xs font-bold text-slate-800"
                >
                  Or Reject Order (clear reason required)
                </label>
                <Input
                  id="tailor-reject-reason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setRejectErr(null);
                    setConfirmReject(false);
                  }}
                  placeholder="e.g., Fabric stock unavailable for requested dimensions"
                />
                {rejectErr && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {rejectErr}
                  </p>
                )}

                {!confirmReject ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrepareReject}
                  >
                    <XCircle
                      className="h-4 w-4 text-red-500"
                      aria-hidden="true"
                    />
                    Reject Order
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">
                      Confirm rejecting order {order.id}? This prevents further
                      production updates.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmReject}
                      >
                        Confirm Reject Order
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmReject(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Production Tracking Controls */}
        <section className="min-w-0 space-y-4 rounded-2xl border border-violet-200/80 bg-white/95 p-5 sm:p-6 lg:col-span-5">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Production Tracking Controls
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Advance milestones sequentially. Updates sync immediately to the{" "}
              <Link
                href={`/orders/${order.id}`}
                className="font-semibold text-[#6633EE] underline"
              >
                customer order view
              </Link>
              .
            </p>
          </div>

          {confirmNextStage && (
            <div
              role="region"
              aria-label="Confirm production stage update"
              className="space-y-2.5 rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 text-xs"
            >
              <p className="font-semibold text-slate-900">
                Confirm stage update: <strong>{order.stage}</strong> →{" "}
                <strong>{confirmNextStage}</strong>?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmStageAdvance}
                >
                  Confirm Stage Update
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmNextStage(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {TAILOR_PRODUCTION_STAGES.map((stageItem, idx) => {
              const isCurrent = order.stage === stageItem;
              const isCompleted =
                currentStageIndex !== -1 && idx < currentStageIndex;
              const isNextAllowed =
                !isTerminalStage && nextAllowedStage === stageItem;

              return (
                <button
                  key={stageItem}
                  type="button"
                  disabled={!isNextAllowed}
                  onClick={() => {
                    if (isNextAllowed) {
                      setConfirmNextStage(stageItem);
                    }
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] ${
                    isCurrent
                      ? "border-[#6633EE] bg-violet-50 text-[#6633EE]"
                      : isNextAllowed
                      ? "cursor-pointer border-violet-300 bg-white text-slate-900 hover:border-[#6633EE] hover:bg-violet-50/40"
                      : "cursor-not-allowed border-slate-200 bg-slate-50/70 text-slate-500 opacity-70"
                  }`}
                >
                  <span className="min-w-0 break-words">{stageItem}</span>
                  {isCurrent && (
                    <Badge variant="default" size="sm">
                      Current
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="success" size="sm">
                      Completed
                    </Badge>
                  )}
                  {isNextAllowed && (
                    <Badge variant="info" size="sm">
                      Next Step →
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            {order.stage === "Pending Tailor Acceptance"
              ? "Accept this order first to unlock Cutting."
              : order.stage === "Delivered"
              ? "All production milestones are complete."
              : isTerminalStage
              ? `No stage actions are available while order status is "${order.stage}".`
              : nextAllowedStage
              ? `Next available milestone: ${nextAllowedStage}.`
              : "Stages progress in order."}
          </p>
        </section>
      </div>
    </WorkspaceShell>
  );
}

export default function TailorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <WorkspaceRoleGuard workspaceId="tailor">
      <TailorOrderDetailContent orderId={id} />
    </WorkspaceRoleGuard>
  );
}
