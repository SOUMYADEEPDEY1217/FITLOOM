"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Info,
  Search,
  XCircle,
} from "lucide-react";
import {
  type MockOrder,
  type OrderStage,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { WorkspaceConfirmDialog } from "@/components/workspace/WorkspaceConfirmDialog";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  getNextStandardOrderStage,
  getSellerStandardOrders,
} from "@/lib/seller-workspace-utils";

type SellerOrderTab = "all" | "placed" | "progress" | "delivered" | "closed";

function SellerOrdersContent() {
  const {
    user,
    orders,
    advanceSellerOrderStage,
    cancelSellerStandardOrder,
    toast,
  } = useFitloom();

  const standardOrders = useMemo(
    () => getSellerStandardOrders(orders, user),
    [orders, user]
  );

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SellerOrderTab>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    standardOrders[0]?.id ?? null
  );
  const [confirmStageAction, setConfirmStageAction] = useState<{
    order: MockOrder;
    nextStage: OrderStage;
  } | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<MockOrder | null>(
    null
  );

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return standardOrders.filter((o) => {
      if (tab === "placed" && o.stage !== "Placed") return false;
      if (
        tab === "progress" &&
        !["Cutting", "Quality Check", "Out for Delivery"].includes(o.stage)
      ) {
        return false;
      }
      if (tab === "delivered" && o.stage !== "Delivered") return false;
      if (
        tab === "closed" &&
        !["Cancelled", "Return Requested"].includes(o.stage)
      ) {
        return false;
      }
      if (q) {
        const hay = `${o.id} ${o.customerName} ${o.shippingCity} ${o.items
          .map((i) => i.name)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [standardOrders, tab, query]);

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return filteredOrders[0] ?? null;
    return (
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      standardOrders.find((o) => o.id === selectedOrderId) ??
      null
    );
  }, [filteredOrders, standardOrders, selectedOrderId]);

  function handleConfirmStageUpdate() {
    if (!confirmStageAction) return;
    const { order, nextStage } = confirmStageAction;
    setConfirmStageAction(null);
    const res = advanceSellerOrderStage(order.id, nextStage);
    if (!res.ok) {
      toast({
        type: "error",
        title: "Fulfillment Update Blocked",
        message: res.error ?? "Invalid stage update.",
      });
      return;
    }
    toast({
      type: "success",
      title: `Order ${order.id} Updated`,
      message: `Standard fulfillment progressed to "${nextStage}".`,
    });
  }

  function handleConfirmCancelOrder(reason?: string) {
    if (!cancelOrderTarget) return;
    const target = cancelOrderTarget;
    setCancelOrderTarget(null);
    const res = cancelSellerStandardOrder(target.id, reason ?? "");
    if (!res.ok) {
      toast({
        type: "error",
        title: "Cannot Cancel Order",
        message: res.error ?? "Unable to cancel order.",
      });
      return;
    }
    toast({
      type: "info",
      title: `Order ${target.id} Cancelled`,
      message: "Customer order status updated to Cancelled.",
    });
  }

  return (
    <WorkspaceShell
      workspaceId="seller"
      title="Standard Retail Orders"
      description="Manage standard ready-to-wear fulfillment only. Made-to-measure CUSTOMFIT orders are isolated to Partner Tailors."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          activeId={tab}
          onChange={(id) => setTab(id as SellerOrderTab)}
          tabs={[
            { id: "all", label: `All (${standardOrders.length})` },
            {
              id: "placed",
              label: `Pending (${
                standardOrders.filter((o) => o.stage === "Placed").length
              })`,
            },
            {
              id: "progress",
              label: `In Progress (${
                standardOrders.filter((o) =>
                  ["Cutting", "Quality Check", "Out for Delivery"].includes(
                    o.stage
                  )
                ).length
              })`,
            },
            {
              id: "delivered",
              label: `Delivered (${
                standardOrders.filter((o) => o.stage === "Delivered").length
              })`,
            },
            {
              id: "closed",
              label: `Closed (${
                standardOrders.filter((o) =>
                  ["Cancelled", "Return Requested"].includes(o.stage)
                ).length
              })`,
            },
          ]}
        />

        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID or customer..."
            aria-label="Search standard orders"
            className="pl-9"
          />
        </div>
      </div>

      {standardOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <ClipboardList
            className="mx-auto h-8 w-8 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No standard orders in queue
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Standard retail customer orders will appear here once placed.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Search
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No standard orders match your filter
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setTab("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Standard Orders List */}
          <div className="space-y-3 lg:col-span-6">
            {filteredOrders.map((ord) => {
              const selected = activeOrder?.id === ord.id;
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] ${
                    selected
                      ? "border-[#6633EE] bg-violet-50/60 shadow-2xs"
                      : "border-slate-200/80 bg-white/95 hover:border-violet-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-950">
                        {ord.id} · ₹{ord.totalInr.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {ord.customerName} · {ord.shippingCity} ·{" "}
                        {ord.createdAt}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-800 break-words">
                        {ord.items
                          .map((i) => `${i.name} (${i.size} × ${i.quantity})`)
                          .join(", ")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        ord.stage === "Delivered"
                          ? "success"
                          : ord.stage === "Cancelled" ||
                            ord.stage === "Return Requested"
                          ? "amber"
                          : "info"
                      }
                      size="sm"
                    >
                      {ord.stage}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Standard Order Detail & Fulfillment Actions */}
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-6">
            {activeOrder ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge variant="neutral" size="sm">
                      Standard Retail Order
                    </Badge>
                    <h2 className="mt-1.5 text-xl font-extrabold text-slate-950">
                      Order {activeOrder.id}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Placed {activeOrder.createdAt} · Customer:{" "}
                      {activeOrder.customerName}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activeOrder.stage === "Delivered"
                        ? "success"
                        : activeOrder.stage === "Cancelled" ||
                          activeOrder.stage === "Return Requested"
                        ? "amber"
                        : "info"
                    }
                  >
                    {activeOrder.stage}
                  </Badge>
                </div>

                {/* Items & Pricing */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Line Items
                  </h3>
                  {activeOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-slate-900">
                        {item.name} · Size {item.size} × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-950">
                        ₹
                        {(item.priceInr * item.quantity).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-950">
                    <span>Order Total</span>
                    <span>₹{activeOrder.totalInr.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Delivery & Demo Payment Details */}
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-bold text-slate-800">Delivery City</p>
                    <p className="mt-0.5 text-slate-600">
                      {activeOrder.shippingAddress
                        ? `${activeOrder.shippingAddress}, ${activeOrder.shippingCity}`
                        : activeOrder.shippingCity}
                      {activeOrder.shippingPincode
                        ? ` - ${activeOrder.shippingPincode}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      Payment Reference
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      {activeOrder.paymentLabel ??
                        "Demo session seed (no live settlement)"}
                    </p>
                  </div>
                </div>

                {activeOrder.cancelOrReturnReason && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <strong>Note:</strong> {activeOrder.cancelOrReturnReason}
                  </p>
                )}

                {/* Validated Fulfillment Actions */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  {(() => {
                    const nextStage = getNextStandardOrderStage(
                      activeOrder.stage
                    );
                    if (!nextStage) {
                      return (
                        <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                          <p>
                            Fulfillment status is{" "}
                            <strong>{activeOrder.stage}</strong>. No further
                            stage transitions apply.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-wrap gap-2.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setConfirmStageAction({
                              order: activeOrder,
                              nextStage,
                            })
                          }
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          Advance to {nextStage}
                        </Button>

                        {activeOrder.stage === "Placed" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelOrderTarget(activeOrder)}
                          >
                            <XCircle
                              className="h-4 w-4 text-red-500"
                              aria-hidden="true"
                            />
                            Cancel Placed Order
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  <p>
                    Status updates reflect demo session fulfillment and sync to
                    customer order tracking.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Select a standard order to inspect details.
              </p>
            )}
          </section>
        </div>
      )}

      <WorkspaceConfirmDialog
        open={Boolean(confirmStageAction)}
        title={`Advance Order ${confirmStageAction?.order.id ?? ""}?`}
        description={`Confirm advancing standard fulfillment from "${confirmStageAction?.order.stage ?? ""}" to "${confirmStageAction?.nextStage ?? ""}".`}
        confirmLabel={`Confirm: ${confirmStageAction?.nextStage ?? "Advance"}`}
        onConfirm={handleConfirmStageUpdate}
        onCancel={() => setConfirmStageAction(null)}
      />

      <WorkspaceConfirmDialog
        open={Boolean(cancelOrderTarget)}
        title={`Cancel Standard Order ${cancelOrderTarget?.id ?? ""}?`}
        description="This marks the newly placed standard order as Cancelled and notifies the customer tracking timeline."
        confirmLabel="Confirm Cancel Order"
        requireReason
        reasonLabel="Cancellation Reason (minimum 5 characters)"
        reasonPlaceholder="e.g., Inventory mismatch on requested size"
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => setCancelOrderTarget(null)}
      />
    </WorkspaceShell>
  );
}

export default function SellerOrdersPage() {
  return (
    <WorkspaceRoleGuard workspaceId="seller">
      <SellerOrdersContent />
    </WorkspaceRoleGuard>
  );
}
