"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Info, Lock, Package, ShoppingBag } from "lucide-react";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function OrdersPage() {
  const { user, orders } = useFitloom();

  const customerOrders = useMemo(
    () => getCustomerOrders(orders, user),
    [orders, user]
  );

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-violet-200 bg-white/95 p-8 text-center shadow-xs">
        <Lock
          className="mx-auto h-8 w-8 text-[#6633EE]"
          aria-hidden="true"
        />
        <h1 className="mt-3 text-xl font-extrabold text-slate-950">
          Sign In to View Orders
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          Sign in to view your customer order history, track production stages,
          and manage demo orders.
        </p>
        <Link href="/auth/login" className="mt-5 inline-block">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Your Orders ({customerOrders.length})
            </h1>
            <Badge variant="amber">Session Demo</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Showing orders for <strong>{user.name}</strong>. Open any order to
            inspect items, sizing, and stage progress.
          </p>
        </div>

        <Link href="/shop" className="shrink-0">
          <Button variant="outline" size="sm">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Browse Shop
          </Button>
        </Link>
      </header>

      <aside
        aria-label="Session demo disclosure"
        className="flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-xs text-slate-700"
      >
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong>Demo Order Notice:</strong> Orders shown here exist in local
          browser session state only. Other customers&apos; orders are never
          accessible from this view.
        </p>
      </aside>

      {customerOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-white/90 p-10 text-center shadow-2xs sm:p-12">
          <Package
            className="mx-auto h-10 w-10 text-violet-300"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-extrabold text-slate-950">
            No orders placed under this account yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Browse ready-to-wear garments or configure a CUSTOMFIT piece in the
            Shop to test the checkout and order tracking flow.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/shop">
              <Button>
                Browse Shop
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline">Open Shopping Bag</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((ord) => {
            const totalUnits = ord.items.reduce(
              (sum, i) => sum + i.quantity,
              0
            );
            const itemSummary = ord.items
              .map((i) => `${i.name} (${i.size} × ${i.quantity})`)
              .join(", ");

            return (
              <Link
                key={ord.id}
                href={`/orders/${encodeURIComponent(ord.id)}`}
                className="group flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs transition-all hover:border-[#6633EE]/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-[#6633EE]">
                    <Package className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#6633EE]">
                        {ord.id}
                      </span>
                      {ord.createdAt && (
                        <span className="text-xs text-slate-500">
                          Placed {ord.createdAt}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-extrabold text-slate-950 break-words group-hover:text-[#6633EE]">
                      {itemSummary}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {totalUnits} unit{totalUnits === 1 ? "" : "s"} ·{" "}
                      {ord.shippingCity} ·{" "}
                      <strong className="text-slate-900">
                        ₹{ord.totalInr.toLocaleString("en-IN")}
                      </strong>
                      {ord.paymentLabel ? ` · ${ord.paymentLabel}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {ord.isCustomFit && (
                    <Badge variant="default" size="sm">
                      CUSTOMFIT
                    </Badge>
                  )}
                  <Badge variant={getStageBadgeVariant(ord.stage)}>
                    {ord.stage}
                  </Badge>
                  <ArrowRight
                    className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#6633EE]"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
