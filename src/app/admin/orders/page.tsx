"use client";

import React, { useMemo, useState } from "react";
import {
  ClipboardList,
  Info,
  MessageSquarePlus,
  Search,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { AdminOversightNoteSchema } from "@/lib/admin-workspace-utils";

function AdminOrdersContent() {
  const { orders, adminAuditLog, logAdminOrderOversightNote, toast } =
    useFitloom();

  const [orderTypeFilter, setOrderTypeFilter] = useState<
    "all" | "standard" | "customfit"
  >("all");
  const [stageFilter, setStageFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id ?? null
  );
  const [oversightNote, setOversightNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const uniqueStages = useMemo(
    () => ["All", ...Array.from(new Set(orders.map((o) => o.stage)))],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderTypeFilter === "standard" && o.isCustomFit) return false;
      if (orderTypeFilter === "customfit" && !o.isCustomFit) return false;
      if (stageFilter !== "All" && o.stage !== stageFilter) return false;
      if (q) {
        const hay = `${o.id} ${o.customerName} ${o.shippingCity} ${
          o.tailorName ?? ""
        } ${o.items.map((i) => i.name).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, orderTypeFilter, stageFilter, query]);

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return filteredOrders[0] ?? null;
    return (
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      orders.find((o) => o.id === selectedOrderId) ??
      null
    );
  }, [filteredOrders, orders, selectedOrderId]);

  const activeOrderAuditNotes = useMemo(() => {
    if (!activeOrder) return [];
    return adminAuditLog.filter(
      (entry) => entry.area === "orders" && entry.targetId === activeOrder.id
    );
  }, [adminAuditLog, activeOrder]);

  function handleAddOversightNote(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrder) return;
    const parsed = AdminOversightNoteSchema.safeParse(oversightNote);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ??
        "Enter an oversight note (min 5 characters).";
      setNoteError(msg);
      toast({
        type: "error",
        title: "Invalid Oversight Note",
        message: msg,
      });
      return;
    }

    const res = logAdminOrderOversightNote(activeOrder.id, parsed.data);
    if (!res.ok) {
      setNoteError(res.error ?? "Could not record note.");
      return;
    }
    setNoteError(null);
    setOversightNote("");
    toast({
      type: "success",
      title: `Governance Note Recorded (${activeOrder.id})`,
      message: "Added to session oversight audit log.",
    });
  }

  return (
    <WorkspaceShell
      workspaceId="admin"
      title="Platform Order Oversight"
      description="Inspect both standard retail orders and CUSTOMFIT tailor orders. Operational stage execution remains isolated to Seller and Tailor roles."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          activeId={orderTypeFilter}
          onChange={(id) =>
            setOrderTypeFilter(id as "all" | "standard" | "customfit")
          }
          tabs={[
            { id: "all", label: `All Orders (${orders.length})` },
            {
              id: "standard",
              label: `Standard (${orders.filter((o) => !o.isCustomFit).length})`,
            },
            {
              id: "customfit",
              label: `CUSTOMFIT (${orders.filter((o) => o.isCustomFit).length})`,
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, customer, partner..."
              aria-label="Search platform orders"
              className="pl-9"
            />
          </div>

          <select
            aria-label="Filter by order stage"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
          >
            {uniqueStages.map((st) => (
              <option key={st} value={st}>
                {st === "All" ? "All Statuses" : st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <ClipboardList
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No matching platform orders
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setOrderTypeFilter("all");
              setStageFilter("All");
              setQuery("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Orders List */}
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
                      ? "border-[#6633EE] bg-violet-50/50 shadow-2xs"
                      : "border-slate-200/80 bg-white/95 hover:border-violet-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-950">
                          {ord.id}
                        </span>
                        <Badge
                          variant={ord.isCustomFit ? "default" : "neutral"}
                          size="sm"
                        >
                          {ord.isCustomFit ? "CUSTOMFIT" : "Standard"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        Customer: {ord.customerName} ·{" "}
                        {ord.isCustomFit
                          ? `Tailor: ${ord.tailorName?.trim() || "Unspecified"}`
                          : "Standard Fulfillment"}
                      </p>
                      <p className="text-xs font-semibold text-slate-800">
                        ₹{ord.totalInr.toLocaleString("en-IN")} · {ord.createdAt}
                      </p>
                    </div>
                    <Badge
                      variant={
                        ord.stage === "Delivered"
                          ? "success"
                          : ord.stage === "Cancelled" ||
                            ord.stage === "Rejected by Tailor" ||
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

          {/* Order Detail & Oversight Audit Log */}
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-6">
            {activeOrder ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge
                      variant={activeOrder.isCustomFit ? "default" : "neutral"}
                      size="sm"
                    >
                      {activeOrder.isCustomFit
                        ? "CUSTOMFIT Order"
                        : "Standard Retail Order"}
                    </Badge>
                    <h2 className="mt-1.5 text-xl font-extrabold text-slate-950">
                      Order {activeOrder.id}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Customer: {activeOrder.customerName} ·{" "}
                      {activeOrder.shippingCity} · {activeOrder.createdAt}
                    </p>
                  </div>
                  <Badge variant="info">{activeOrder.stage}</Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Items
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
                    <span>Total Order Value</span>
                    <span>
                      ₹{activeOrder.totalInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {activeOrder.isCustomFit && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3.5 text-xs">
                    <p className="font-bold text-slate-900">
                      CUSTOMFIT Assignment &amp; Snapshot
                    </p>
                    <p className="mt-1 text-slate-700">
                      Workshop:{" "}
                      {activeOrder.tailorName?.trim() || "Workshop not specified"}
                    </p>
                    <p className="mt-1 text-slate-700">
                      {activeOrder.measurementsSnapshot
                        ? `Chest ${activeOrder.measurementsSnapshot.chestCm} cm · Waist ${activeOrder.measurementsSnapshot.waistCm} cm · Hip ${activeOrder.measurementsSnapshot.hipCm} cm`
                        : "Measurements unavailable"}
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  <p>
                    <strong>Oversight Boundary:</strong> Fulfillment &amp;
                    stitching milestones are controlled strictly by{" "}
                    {activeOrder.isCustomFit ? "Partner Tailors" : "Sellers"}.
                    Admin oversight records audit notes without overriding
                    production stages.
                  </p>
                </div>

                {/* Oversight Audit Note Form */}
                <form
                  onSubmit={handleAddOversightNote}
                  noValidate
                  className="space-y-2 border-t border-slate-100 pt-4"
                >
                  <label
                    htmlFor="admin-oversight-note"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Log Session Governance / Oversight Note
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="admin-oversight-note"
                      value={oversightNote}
                      onChange={(e) => {
                        setOversightNote(e.target.value);
                        setNoteError(null);
                      }}
                      placeholder="e.g., Reviewed SLA timeline with workshop"
                      aria-invalid={Boolean(noteError)}
                    />
                    <Button type="submit" size="sm" className="shrink-0">
                      <MessageSquarePlus
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Log Note
                    </Button>
                  </div>
                  {noteError && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {noteError}
                    </p>
                  )}
                </form>

                {activeOrderAuditNotes.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-700">
                      Recorded Governance Notes
                    </p>
                    {activeOrderAuditNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-violet-50/60 px-3 py-2 text-xs text-slate-700"
                      >
                        <strong>{note.timestamp}:</strong> {note.note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Select an order to inspect platform oversight details.
              </p>
            )}
          </section>
        </div>
      )}
    </WorkspaceShell>
  );
}

export default function AdminOrdersPage() {
  return (
    <WorkspaceRoleGuard workspaceId="admin">
      <AdminOrdersContent />
    </WorkspaceRoleGuard>
  );
}
