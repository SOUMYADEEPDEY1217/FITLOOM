"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Ruler,
  Scissors,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import type { MockOrder } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type GarmentLookupEntry,
  type OrderTimelineResult,
  buildOrderTimeline,
  computeOrderPricingSummary,
  extractShipmentTrackingInfo,
  formatOrderDate,
  formatOrderInr,
  getOrderStageMeta,
  resolveOrderItem,
} from "@/lib/order-status-utils";

const EDITORIAL_SERIF =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const OrderReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Please enter at least 5 characters for your reason.")
    .max(160, "Reason cannot exceed 160 characters."),
});

interface OrderDetailHeaderProps {
  order: MockOrder;
  isNewConfirmation: boolean;
}

export function OrderDetailHeader({
  order,
  isNewConfirmation,
}: OrderDetailHeaderProps) {
  const stageMeta = getOrderStageMeta(order.stage);
  const pricing = computeOrderPricingSummary(order);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/orders"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4C1D95] shadow-2xs transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Orders
        </Link>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#FAF8FE] px-3 py-1 text-[11px] font-medium text-[#4C1D95]">
          <Info className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
          <span>Simulated customer session state (non-persistent demo)</span>
        </div>
      </div>

      {isNewConfirmation && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950 shadow-2xs"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-950">
              Order placed and recorded in your active FITLOOM demo session!
            </p>
            <p className="text-emerald-800">
              No real financial charge or external courier dispatch is triggered in
              this preview environment.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-[#EAE2F8] bg-gradient-to-br from-[#FCFBFF] via-[#F7F5FF] to-[#F3ECFF] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-semibold tracking-wider text-[#6633EE] uppercase">
                Order Reference
              </span>
              {order.isCustomFit && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#6633EE]">
                  <Scissors className="h-3 w-3" aria-hidden="true" />
                  CUSTOMFIT Tailoring
                </span>
              )}
              <Badge variant={stageMeta.badgeVariant}>{stageMeta.stage}</Badge>
            </div>

            <h1
              className={cn(
                EDITORIAL_SERIF,
                "font-mono text-2xl font-bold tracking-tight text-[#1D0B24] sm:text-3xl"
              )}
            >
              {order.id}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#4B5563]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                Placed on {formatOrderDate(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                {pricing.totalUnits} {pricing.totalUnits === 1 ? "unit" : "units"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                {order.shippingCity}
              </span>
              {order.tailorName && (
                <span className="inline-flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                  Tailor: {order.tailorName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-4 border-t border-[#E5DAF8] pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-medium text-[#6B7280]">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-[#1D0B24] tabular-nums">
                {formatOrderInr(order.totalInr)}
              </p>
            </div>
            <a
              href="#shipment-tracking"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#FAF8FE]"
            >
              <Truck className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              Shipment &amp; Tracking
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

interface OrderProgressTimelineProps {
  order: MockOrder;
}

export function OrderProgressTimeline({ order }: OrderProgressTimelineProps) {
  const timeline: OrderTimelineResult = buildOrderTimeline(order);
  const stepCount = timeline.steps.length;

  return (
    <section
      aria-labelledby="order-timeline-heading"
      className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3EEFE] pb-4">
        <div>
          <h2
            id="order-timeline-heading"
            className="text-base font-bold text-[#1D0B24]"
          >
            Fulfillment Progress Timeline
          </h2>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            {order.isCustomFit
              ? "CUSTOMFIT tailored order lifecycle tracking every fitting and finishing milestone."
              : "Standard FITLOOM ready-to-wear fulfillment progression."}
          </p>
        </div>
        <span className="rounded-full border border-[#DDD6FE] bg-[#FAF8FE] px-3 py-1 text-[11px] font-semibold text-[#4C1D95]">
          {stepCount}-Stage Lifecycle
        </span>
      </div>

      {/* Terminal exception notice (Cancelled / Rejected / Return Requested) */}
      {timeline.terminalNotice && (
        <div
          role="status"
          className={cn(
            "mt-4 flex items-start gap-3 rounded-xl border p-4 text-xs",
            timeline.terminalNotice.kind === "return_requested"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-rose-200 bg-rose-50 text-rose-950"
          )}
        >
          {timeline.terminalNotice.kind === "return_requested" ? (
            <RotateCcw
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
              aria-hidden="true"
            />
          ) : (
            <XCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              aria-hidden="true"
            />
          )}
          <div className="space-y-1">
            <p className="font-bold">{timeline.terminalNotice.title}</p>
            <p className="opacity-90">{timeline.terminalNotice.description}</p>
            {timeline.terminalNotice.reason && (
              <p className="font-medium">
                Recorded Reason: &ldquo;{timeline.terminalNotice.reason}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Responsive Stepper: vertical stack on mobile/tablet, clean horizontal grid on xl */}
      <ol className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {timeline.steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isHalted = step.status === "halted";

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
                isCurrent
                  ? "border-[#6633EE] bg-[#F7F5FF]"
                  : isCompleted
                    ? "border-[#DDD6FE] bg-[#FCFBFF]"
                    : isHalted
                      ? "border-slate-200 bg-slate-50/70 opacity-70"
                      : "border-[#F0EAFA] bg-white"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isCompleted && "bg-[#6633EE] text-white",
                  isCurrent &&
                    "border-2 border-[#6633EE] bg-white text-[#6633EE] ring-4 ring-[#EDE9FE]",
                  step.status === "pending" &&
                    "border border-[#DDD6FE] bg-[#FAF8FE] text-[#6B7280]",
                  isHalted &&
                    "border border-rose-200 bg-rose-50 text-rose-500"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : isCurrent ? (
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-xs font-bold",
                      isCurrent
                        ? "text-[#4C1D95]"
                        : isCompleted
                          ? "text-[#1D0B24]"
                          : "text-[#4B5563]"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="rounded-full bg-[#6633EE] px-2 py-0.5 text-[10px] font-semibold text-white">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-semibold text-[#6633EE]">
                      Completed
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">
                  {step.description}
                </p>
                {index === 0 && (
                  <p className="mt-1 text-[10px] font-medium text-[#7C3AED]">
                    Recorded {formatOrderDate(order.createdAt)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

interface ShipmentTrackingCardProps {
  order: MockOrder;
}

export function ShipmentTrackingCard({ order }: ShipmentTrackingCardProps) {
  const [copied, setCopied] = useState(false);
  const tracking = extractShipmentTrackingInfo(order);
  const stageMeta = getOrderStageMeta(order.stage);

  async function handleCopyTracking() {
    if (!tracking.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      id="shipment-tracking"
      aria-labelledby="shipment-tracking-heading"
      className="scroll-mt-24 rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3EEFE] pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6633EE]">
            <Truck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="shipment-tracking-heading"
              className="text-base font-bold text-[#1D0B24]"
            >
              Shipment &amp; Delivery Information
            </h2>
            <p className="text-xs text-[#6B7280]">
              Destination City: {order.shippingCity}
            </p>
          </div>
        </div>
        <Badge variant={stageMeta.badgeVariant}>{stageMeta.stage}</Badge>
      </div>

      {tracking.hasTrackingDetails ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#F0EAFA] bg-[#FCFBFF] p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">Courier</p>
            <p className="mt-1 text-xs font-bold text-[#1D0B24]">
              {tracking.carrier ?? "Unavailable"}
            </p>
          </div>
          <div className="rounded-xl border border-[#F0EAFA] bg-[#FCFBFF] p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">
              Tracking ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate font-mono text-xs font-bold text-[#1D0B24]">
                {tracking.trackingNumber ?? "Pending"}
              </p>
              {tracking.trackingNumber && (
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#DDD6FE] bg-white px-2 py-1 text-[10px] font-semibold text-[#4C1D95] hover:bg-[#F7F5FF]"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-[#F0EAFA] bg-[#FCFBFF] p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">
              Dispatched On
            </p>
            <p className="mt-1 text-xs font-bold text-[#1D0B24]">
              {tracking.shipmentDate
                ? formatOrderDate(tracking.shipmentDate)
                : "Not dispatched"}
            </p>
          </div>
          <div className="rounded-xl border border-[#F0EAFA] bg-[#FCFBFF] p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">
              {tracking.actualDeliveryDate ? "Delivered On" : "Est. Delivery"}
            </p>
            <p className="mt-1 text-xs font-bold text-[#1D0B24]">
              {tracking.actualDeliveryDate
                ? formatOrderDate(tracking.actualDeliveryDate)
                : tracking.estimatedDeliveryDate
                  ? formatOrderDate(tracking.estimatedDeliveryDate)
                  : "Pending"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#E5DAF8] bg-[#FAF8FE] p-4">
          <div className="flex items-start gap-3">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[#1D0B24]">
                Shipment tracking will appear here once your order is dispatched.
              </p>
              <p className="leading-relaxed text-[#4B5563]">
                {order.stage === "Delivered"
                  ? `This order is marked Delivered in your active demo session for ${order.shippingCity}. Courier carrier and external tracking codes are not recorded in simulated order data.`
                  : `Current stage: ${stageMeta.stage}. ${stageMeta.description} Courier partner, tracking ID, and dispatch timestamps are not generated in this simulated preview until an order is linked with carrier data.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface OrderItemsListProps {
  order: MockOrder;
  garmentLookup: ReadonlyMap<string, GarmentLookupEntry>;
}

export function OrderItemsList({
  order,
  garmentLookup,
}: OrderItemsListProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const snapshot = order.measurementsSnapshot;

  return (
    <section
      aria-labelledby="ordered-items-heading"
      className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F3EEFE] pb-3.5">
        <h2
          id="ordered-items-heading"
          className="text-base font-bold text-[#1D0B24]"
        >
          Ordered Items ({order.items.length})
        </h2>
        <span className="text-xs font-medium text-[#6B7280]">
          Pricing snapshot at order placement
        </span>
      </div>

      <div className="mt-4 divide-y divide-[#F3EEFE]">
        {order.items.map((item) => {
          const resolved = resolveOrderItem(item, garmentLookup);
          const imageKey = `${order.id}-${item.id}`;
          const showImg = Boolean(resolved.image) && !failedImages[imageKey];

          return (
            <div
              key={item.id}
              className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3.5">
                <div className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE2F8] bg-[#F7F5FF]">
                  {showImg && resolved.image ? (
                    <Image
                      src={resolved.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [imageKey]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: resolved.swatchHex }}
                        aria-hidden="true"
                      />
                      <Package
                        className="h-4 w-4 text-[#6633EE]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {resolved.productHref ? (
                      <Link
                        href={resolved.productHref}
                        className="text-sm font-bold text-[#1D0B24] hover:text-[#6633EE] hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <h3 className="text-sm font-bold text-[#1D0B24]">
                        {item.name}
                      </h3>
                    )}

                    {resolved.category && (
                      <span className="rounded-full bg-[#F7F5FF] px-2 py-0.5 text-[10px] font-semibold text-[#6633EE]">
                        {resolved.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4B5563]">
                    <span>
                      Size: <strong className="text-[#1D0B24]">{item.size}</strong>
                    </span>
                    <span>
                      Qty:{" "}
                      <strong className="text-[#1D0B24]">{item.quantity}</strong>
                    </span>
                    {resolved.color && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: resolved.swatchHex }}
                          aria-hidden="true"
                        />
                        {resolved.color}
                      </span>
                    )}
                    {resolved.fabric && <span>{resolved.fabric}</span>}
                  </div>

                  {item.tailorName && (
                    <p className="text-xs font-medium text-[#4C1D95]">
                      Assigned Tailor: {item.tailorName}
                    </p>
                  )}

                  {item.customFitNotes && (
                    <p className="rounded-xl border border-[#EAE2F8] bg-[#FAF8FE] px-3 py-2 text-xs text-[#4C1D95]">
                      <span className="font-semibold">Tailoring Note: </span>
                      {item.customFitNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-[#F7F5FF] pt-2 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                <span className="text-xs text-[#6B7280] tabular-nums">
                  {formatOrderInr(item.priceInr)} × {item.quantity}
                </span>
                <span className="text-base font-bold text-[#1D0B24] tabular-nums">
                  {formatOrderInr(resolved.lineTotalInr)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {order.isCustomFit && snapshot && (
        <div className="mt-4 rounded-xl border border-[#E5DAF8] bg-[#FAF8FE] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#4C1D95]">
            <Ruler className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
            <span>CUSTOMFIT Measurement Snapshot</span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-white px-2.5 py-2 border border-[#EAE2F8]">
              <span className="block text-[10px] text-[#6B7280]">Height</span>
              <span className="font-bold text-[#1D0B24] tabular-nums">
                {snapshot.heightCm} cm
              </span>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 border border-[#EAE2F8]">
              <span className="block text-[10px] text-[#6B7280]">Chest</span>
              <span className="font-bold text-[#1D0B24] tabular-nums">
                {snapshot.chestCm} cm
              </span>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 border border-[#EAE2F8]">
              <span className="block text-[10px] text-[#6B7280]">Waist</span>
              <span className="font-bold text-[#1D0B24] tabular-nums">
                {snapshot.waistCm} cm
              </span>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 border border-[#EAE2F8]">
              <span className="block text-[10px] text-[#6B7280]">Preference</span>
              <span className="font-bold text-[#1D0B24]">
                {snapshot.fitPreference}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface OrderFinancialAndAddressSidebarProps {
  order: MockOrder;
  onCancelOrder: (orderId: string, reason: string) => void;
  onRequestReturn: (orderId: string, reason: string) => void;
  onNotify: (payload: {
    type: "success" | "info" | "warning";
    title: string;
    message: string;
  }) => void;
}

export function OrderFinancialAndAddressSidebar({
  order,
  onCancelOrder,
  onRequestReturn,
  onNotify,
}: OrderFinancialAndAddressSidebarProps) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const pricing = computeOrderPricingSummary(order);
  const stageMeta = getOrderStageMeta(order.stage);

  function handleActionSubmit(mode: "cancel" | "return") {
    const parsed = OrderReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Please provide a valid reason."
      );
      return;
    }
    setFormError(null);

    if (mode === "cancel") {
      onCancelOrder(order.id, parsed.data.reason);
      onNotify({
        type: "info",
        title: "Order Cancelled",
        message: `Order ${order.id} marked as Cancelled in this demo session.`,
      });
    } else {
      onRequestReturn(order.id, parsed.data.reason);
      onNotify({
        type: "success",
        title: "Return Request Logged",
        message: `Return request submitted for order ${order.id}.`,
      });
    }
    setReason("");
  }

  return (
    <div className="space-y-4">
      {/* Price Breakdown */}
      <section
        aria-labelledby="price-summary-heading"
        className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs"
      >
        <h2
          id="price-summary-heading"
          className="border-b border-[#F3EEFE] pb-3 text-sm font-bold text-[#1D0B24]"
        >
          Price Breakdown
        </h2>
        <dl className="mt-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-[#4B5563]">
            <dt>
              Items Subtotal ({pricing.totalUnits}{" "}
              {pricing.totalUnits === 1 ? "unit" : "units"})
            </dt>
            <dd className="font-semibold text-[#1D0B24] tabular-nums">
              {formatOrderInr(pricing.itemsSubtotalInr)}
            </dd>
          </div>
          {pricing.adjustmentInr !== 0 && (
            <div className="flex items-center justify-between text-[#4B5563]">
              <dt>Order / Tailoring Adjustment</dt>
              <dd className="font-semibold text-[#1D0B24] tabular-nums">
                {pricing.adjustmentInr > 0 ? "+" : ""}
                {formatOrderInr(pricing.adjustmentInr)}
              </dd>
            </div>
          )}
          <div className="border-t border-[#F3EEFE] pt-2.5">
            <div className="flex items-center justify-between text-sm font-bold text-[#1D0B24]">
              <dt>Total Payable</dt>
              <dd className="tabular-nums">{formatOrderInr(pricing.totalInr)}</dd>
            </div>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-[#6B7280]">
          Shipping fees, taxes, and promo discounts are not itemized separately
          on simulated FITLOOM session orders.
        </p>
      </section>

      {/* Delivery Address */}
      <section
        aria-labelledby="delivery-address-heading"
        className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs"
      >
        <h2
          id="delivery-address-heading"
          className="border-b border-[#F3EEFE] pb-3 text-sm font-bold text-[#1D0B24]"
        >
          Delivery Details
        </h2>
        <div className="mt-3.5 space-y-2 text-xs text-[#4B5563]">
          <p className="font-bold text-[#1D0B24]">{order.customerName}</p>
          {order.shippingAddress ? (
            <p className="leading-relaxed text-[#374151]">
              {order.shippingAddress}
            </p>
          ) : (
            <p className="italic text-[#6B7280]">
              Full street address was not stored on this seed order record.
            </p>
          )}
          <p className="font-medium text-[#1D0B24]">
            {[order.shippingCity, order.shippingState, order.shippingPincode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {order.customerEmail && (
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-[#4B5563]">
              <Mail className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              {order.customerEmail}
            </p>
          )}
          {order.customerPhone && (
            <p className="flex items-center gap-1.5 text-[11px] text-[#4B5563]">
              <Phone className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              {order.customerPhone}
            </p>
          )}
        </div>
      </section>

      {/* Payment Information */}
      <section
        aria-labelledby="payment-info-heading"
        className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs"
      >
        <h2
          id="payment-info-heading"
          className="border-b border-[#F3EEFE] pb-3 text-sm font-bold text-[#1D0B24]"
        >
          Payment Information
        </h2>
        <div className="mt-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#1D0B24]">
            <CreditCard
              className="h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <span>
              {order.paymentLabel || "Simulated Demo Order (No gateway selected)"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#6B7280]">
            Simulated FITLOOM customer session record. No external payment
            gateway charge or transaction receipt ID is created.
          </p>
        </div>
      </section>

      {/* Order Action: Cancel or Request Return */}
      {(stageMeta.canCancel || stageMeta.canRequestReturn) && (
        <section
          aria-labelledby="order-actions-heading"
          className="rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] p-5 shadow-2xs"
        >
          <h2
            id="order-actions-heading"
            className="text-sm font-bold text-[#1D0B24]"
          >
            {stageMeta.canCancel ? "Cancel This Order" : "Request a Return"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
            {stageMeta.canCancel
              ? "Allowed before stitching/quality check begins. Please share a brief reason (min 5 characters)."
              : "Share your fit or quality feedback (min 5 characters) to record a return request."}
          </p>

          <div className="mt-3 space-y-2">
            <label htmlFor="order-action-reason" className="sr-only">
              Reason
            </label>
            <Input
              id="order-action-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder={
                stageMeta.canCancel
                  ? "Reason for cancellation..."
                  : "Reason for return request..."
              }
              aria-invalid={Boolean(formError)}
              className="h-10 rounded-xl border-[#DDD6FE] bg-white text-xs text-[#1D0B24] focus-visible:ring-[#6633EE]"
            />
            {formError && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {formError}
              </p>
            )}
            <Button
              type="button"
              onClick={() =>
                handleActionSubmit(stageMeta.canCancel ? "cancel" : "return")
              }
              variant={stageMeta.canCancel ? "outline" : "default"}
              className={cn(
                "w-full min-h-10 rounded-xl text-xs font-semibold",
                stageMeta.canCancel
                  ? "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                  : "bg-[#6633EE] text-white hover:bg-[#5522D9]"
              )}
            >
              {stageMeta.canCancel ? "Cancel Order (Demo)" : "Request Return (Demo)"}
            </Button>
          </div>
        </section>
      )}

      {/* Support & Navigation Actions */}
      <section
        aria-labelledby="support-actions-heading"
        className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-xs"
      >
        <h2
          id="support-actions-heading"
          className="text-sm font-bold text-[#1D0B24]"
        >
          Need Help With This Order?
        </h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Reach out to FITLOOM support for sizing queries or explore more
          garments.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/contact"
            className="inline-flex min-h-10 w-full items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#FCFBFF] px-3.5 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
          >
            <span className="inline-flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              Contact Support
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/orders"
            className="inline-flex min-h-10 w-full items-center justify-between rounded-xl border border-[#DDD6FE] bg-white px-3.5 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
          >
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-10 w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-3.5 text-xs font-semibold text-white transition-all hover:brightness-110"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              Continue Shopping
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
