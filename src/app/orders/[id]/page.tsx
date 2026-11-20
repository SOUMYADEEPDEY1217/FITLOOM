"use client";

import React, { Suspense, use, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  MapPin,
  Package,
  RotateCcw,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { MOCK_GARMENTS } from "@/lib/mock-data";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ReasonSchema = z
  .string()
  .trim()
  .min(5, "Please enter a reason of at least 5 characters.");

const STANDARD_TIMELINE = [
  "Placed",
  "Cutting",
  "Quality Check",
  "Out for Delivery",
  "Delivered",
];

const CUSTOM_TIMELINE = [
  "Pending Tailor Acceptance",
  "Cutting",
  "Stitching in Progress",
  "Quality Check",
  "Out for Delivery",
  "Delivered",
];

function getStageBadgeVariant(stage: string): BadgeVariant {
  if (stage === "Delivered") return "success";
  if (
    stage === "Cancelled" ||
    stage === "Rejected by Tailor" ||
    stage === "Return Requested"
  ) {
    return "amber";
  }
  if (stage === "Placed" || stage === "Pending Tailor Acceptance") {
    return "info";
  }
  return "neutral";
}

function NewOrderConfirmationBanner({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  if (!isNew) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/90 p-5 text-emerald-950 shadow-2xs"
    >
      <CheckCircle2
        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
        aria-hidden="true"
      />
      <div className="space-y-1 text-xs leading-relaxed">
        <p className="text-sm font-extrabold text-emerald-950">
          Demo Order Confirmed ({orderId})
        </p>
        <p>
          Your frontend demo order has been recorded in this session&apos;s
          Order History and your shopping bag has been cleared. No actual
          payment was charged and no physical dispatch is triggered.
        </p>
      </div>
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    user,
    orders,
    cancelMockOrder,
    requestReturnMockOrder,
    toast,
  } = useFitloom();

  const [reason, setReason] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  const customerOrders = useMemo(
    () => getCustomerOrders(orders, user),
    [orders, user]
  );

  // Strict customer-scoped exact ID lookup — never fall back to orders[0]
  const order = useMemo(
    () => customerOrders.find((o) => o.id === id) ?? null,
    [customerOrders, id]
  );

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-violet-200 bg-white/95 p-8 text-center shadow-xs">
        <Lock
          className="mx-auto h-8 w-8 text-[#6633EE]"
          aria-hidden="true"
        />
        <h1 className="mt-3 text-xl font-extrabold text-slate-950">
          Sign In to View Order Details
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Order records are protected per customer account. Sign in to view your
          order status.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline">Browse Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div
          role="alert"
          className="rounded-3xl border border-dashed border-amber-300 bg-white/95 p-8 text-center shadow-xs sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <Badge variant="amber" className="mt-4">
            Order Not Found
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
            Order Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            No order matching{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
              {id || "unknown"}
            </code>{" "}
            was found under your customer account in this browser session.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/orders">
              <Button>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Order History
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                Browse Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeline = order.isCustomFit ? CUSTOM_TIMELINE : STANDARD_TIMELINE;
  const activeIdx = timeline.indexOf(order.stage);
  const canCancel =
    order.stage === "Placed" || order.stage === "Pending Tailor Acceptance";
  const canReturn = order.stage === "Delivered";

  function handleCancel() {
    if (!order) return;
    const p = ReasonSchema.safeParse(reason);
    if (!p.success) {
      setFormErr(p.error.issues[0]?.message ?? "Enter cancellation reason.");
      return;
    }
    setFormErr(null);
    cancelMockOrder(order.id, p.data);
    setReason("");
    toast({
      type: "info",
      title: "Demo Order Cancelled",
      message: `Order ${order.id} marked as Cancelled.`,
    });
  }

  function handleReturn() {
    if (!order) return;
    const p = ReasonSchema.safeParse(reason);
    if (!p.success) {
      setFormErr(
        p.error.issues[0]?.message ?? "Enter return or exchange reason."
      );
      return;
    }
    setFormErr(null);
    requestReturnMockOrder(order.id, p.data);
    setReason("");
    toast({
      type: "info",
      title: "Return / Exchange Requested",
      message: `Return request logged for demo order ${order.id}.`,
    });
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb / Top Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Order History
        </Link>
        <Link
          href="/shop"
          className="text-xs font-bold text-[#6633EE] hover:underline"
        >
          Continue Shopping →
        </Link>
      </div>

      {/* ?new=1 Confirmation Banner */}
      <Suspense fallback={null}>
        <NewOrderConfirmationBanner orderId={order.id} />
      </Suspense>

      {/* Main Order Card */}
      <section className="space-y-6 rounded-3xl border border-violet-200/80 bg-white/95 p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">Demo Order {order.id}</Badge>
              {order.isCustomFit && (
                <Badge variant="secondary">CUSTOMFIT</Badge>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 break-words">
              {order.items.map((i) => i.name).join(", ")}
            </h1>
            <p className="text-xs text-slate-600">
              {order.createdAt ? `Placed on ${order.createdAt} · ` : ""}City:{" "}
              {order.shippingCity} · Total:{" "}
              <strong className="text-slate-950">
                ₹{order.totalInr.toLocaleString("en-IN")}
              </strong>
            </p>
          </div>

          <Badge variant={getStageBadgeVariant(order.stage)}>
            {order.stage}
          </Badge>
        </div>

        {/* Responsive Stage Timeline */}
        {activeIdx >= 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Order Progress
            </h2>
            <ol
              className={cn(
                "grid gap-2.5 sm:grid-cols-2 md:grid-cols-3",
                order.isCustomFit ? "lg:grid-cols-6" : "lg:grid-cols-5"
              )}
            >
              {timeline.map((stepName, i) => {
                const done = i <= activeIdx;
                return (
                  <li
                    key={stepName}
                    className={cn(
                      "rounded-2xl border p-3 text-xs font-semibold",
                      done
                        ? "border-[#6633EE]/40 bg-violet-50 text-[#4C1D95]"
                        : "border-slate-100 bg-slate-50 text-slate-400"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "mb-1 h-4 w-4",
                        done ? "text-[#6633EE]" : "text-slate-300"
                      )}
                      aria-hidden="true"
                    />
                    {stepName}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Itemized Products */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950">
            <Package className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
            Order Items ({order.items.length})
          </h2>

          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4">
            {order.items.map((item) => {
              const existsInCatalogue = MOCK_GARMENTS.some(
                (g) => g.id === item.garmentId
              );
              const lineTotal = item.priceInr * item.quantity;

              return (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-2 py-3.5 text-xs sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {existsInCatalogue ? (
                        <Link
                          href={`/shop/${encodeURIComponent(item.garmentId)}`}
                          className="text-sm font-extrabold text-slate-950 hover:text-[#6633EE] hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-extrabold text-slate-950">
                          {item.name}
                        </span>
                      )}
                      <Badge
                        variant={
                          item.size === "CUSTOMFIT" ? "default" : "neutral"
                        }
                        size="sm"
                      >
                        Size: {item.size}
                      </Badge>
                    </div>
                    <p className="text-slate-600">
                      Unit Price: ₹{item.priceInr.toLocaleString("en-IN")} ×{" "}
                      {item.quantity}
                    </p>
                    {item.tailorName && (
                      <p className="text-[#4C1D95]">
                        Tailor: {item.tailorName}
                        {item.customFitNotes
                          ? ` · ${item.customFitNotes}`
                          : ""}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-sm font-extrabold text-slate-950">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Delivery & Payment Metadata */}
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <h2 className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-slate-700">
              <MapPin
                className="h-3.5 w-3.5 text-[#6633EE]"
                aria-hidden="true"
              />
              Delivery Details
            </h2>
            <p className="pt-1 font-bold text-slate-950">
              {order.customerName}
            </p>
            {order.shippingAddress && (
              <p className="text-slate-700 break-words">
                {order.shippingAddress}
              </p>
            )}
            <p className="text-slate-700">
              {order.shippingCity}
              {order.shippingState ? `, ${order.shippingState}` : ""}
              {order.shippingPincode ? ` – ${order.shippingPincode}` : ""}
            </p>
            {(order.customerPhone || order.customerEmail) && (
              <p className="text-slate-500">
                {[order.customerPhone, order.customerEmail]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <h2 className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-slate-700">
              <CreditCard
                className="h-3.5 w-3.5 text-[#6633EE]"
                aria-hidden="true"
              />
              Pricing &amp; Demo Payment
            </h2>
            <p className="pt-1 text-slate-700">
              Order Total:{" "}
              <strong className="text-slate-950">
                ₹{order.totalInr.toLocaleString("en-IN")}
              </strong>
            </p>
            <p className="text-slate-700">
              Method:{" "}
              <strong>
                {order.paymentLabel ?? "Demo Session Record (Not recorded)"}
              </strong>
            </p>
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Frontend simulation only — no financial charge occurred.
            </p>
          </div>
        </div>

        {order.rejectionReason && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
            <strong>Tailor Rejection Note:</strong> {order.rejectionReason}
          </p>
        )}

        {order.cancelOrReturnReason && (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
            <strong>Customer Note:</strong> {order.cancelOrReturnReason}
          </p>
        )}

        {/* Cancel / Return Actions */}
        {(canCancel || canReturn) && (
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <label
              htmlFor="order-action-reason"
              className="block text-xs font-extrabold text-slate-800"
            >
              {canCancel
                ? "Cancel Demo Order (Reason required)"
                : "Request Return / Fit Exchange (Reason required)"}
            </label>
            <Input
              id="order-action-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (formErr) setFormErr(null);
              }}
              placeholder="e.g., Need a different sleeve adjustment or ordered wrong size"
              aria-invalid={Boolean(formErr)}
              aria-describedby={formErr ? "order-action-err" : undefined}
            />
            {formErr && (
              <p
                id="order-action-err"
                role="alert"
                className="text-xs font-medium text-red-600"
              >
                {formErr}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {canCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <XCircle
                    className="h-4 w-4 text-red-600"
                    aria-hidden="true"
                  />
                  Cancel Demo Order
                </Button>
              )}
              {canReturn && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReturn}
                >
                  <RotateCcw
                    className="h-4 w-4 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  Request Return / Fit Exchange
                </Button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
