"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ClipboardList, Info, Scissors, Settings } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  filterTailorOrdersByTab,
  formatTailorStageVariant,
  getTailorOrders,
} from "@/lib/tailor-workspace-utils";

function TailorDashboardContent() {
  const { user, orders, tailorWorkshopProfile } = useFitloom();

  const tailorOrders = useMemo(
    () => getTailorOrders(orders, user, tailorWorkshopProfile),
    [orders, user, tailorWorkshopProfile]
  );

  const newOrders = useMemo(
    () => filterTailorOrdersByTab(tailorOrders, "new"),
    [tailorOrders]
  );
  const inProdOrders = useMemo(
    () => filterTailorOrdersByTab(tailorOrders, "prod"),
    [tailorOrders]
  );
  const completedOrders = useMemo(
    () => filterTailorOrdersByTab(tailorOrders, "done"),
    [tailorOrders]
  );

  const activeWorkloadCount = newOrders.length + inProdOrders.length;

  return (
    <WorkspaceShell
      workspaceId="tailor"
      title={`${tailorWorkshopProfile.workshopName} — Tailor Dashboard`}
      description="Manage assigned CUSTOMFIT orders, inspect submitted customer measurement snapshots, and track sequential stitching milestones."
      actions={
        <>
          <Link href="/tailor/orders">
            <Button size="sm">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              All Tailor Orders
            </Button>
          </Link>
          <Link href="/tailor/profile">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Workshop Profile
            </Button>
          </Link>
        </>
      }
    >
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Awaiting Acceptance
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#6633EE]">
            {newOrders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">In Production</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">
            {inProdOrders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">Delivered</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">
            {completedOrders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-600">
              Weekly Capacity
            </p>
            <Badge
              variant={
                tailorWorkshopProfile.acceptingCustomOrders
                  ? "success"
                  : "amber"
              }
              size="sm"
            >
              {tailorWorkshopProfile.acceptingCustomOrders ? "Open" : "Paused"}
            </Badge>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-slate-950">
            {activeWorkloadCount} / {tailorWorkshopProfile.weeklyCapacityOrders}
            <span className="ml-1.5 text-xs font-semibold text-slate-500">
              orders/wk
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tailorWorkshopProfile.city} ·{" "}
            {tailorWorkshopProfile.turnaroundDays}-day turnaround
          </p>
        </div>
      </div>

      {/* Assigned CUSTOMFIT Queue */}
      <section aria-labelledby="tailor-queue-preview-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="tailor-queue-preview-heading"
            className="text-lg font-bold text-slate-950"
          >
            Assigned CUSTOMFIT Orders
          </h2>
          <Link
            href="/tailor/orders"
            className="text-xs font-semibold text-[#6633EE] hover:underline"
          >
            Open Full Queue ({tailorOrders.length}) →
          </Link>
        </div>

        {tailorOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
            <Scissors
              className="mx-auto h-7 w-7 text-slate-400"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-base font-bold text-slate-950">
              No CUSTOMFIT orders assigned yet
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
              Only CUSTOMFIT orders matching{" "}
              <strong>{tailorWorkshopProfile.workshopName}</strong> appear in
              your workshop queue. Standard retail orders are excluded.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              <Link href="/tailor/profile">
                <Button size="sm" variant="outline">
                  Review Workshop Profile
                </Button>
              </Link>
              <Link href="/tailor/orders">
                <Button size="sm" variant="ghost">
                  View Queue Filters
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (prevents narrow-screen overflow at 375px) */}
            <div className="space-y-3 md:hidden">
              {tailorOrders.map((ord) => (
                <article
                  key={ord.id}
                  className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-500">
                        {ord.id}
                      </p>
                      <h3 className="text-sm font-bold text-slate-950 break-words">
                        {ord.items[0]?.name ?? "Custom Garment"}
                      </h3>
                    </div>
                    <Badge
                      variant={formatTailorStageVariant(ord.stage)}
                      size="sm"
                    >
                      {ord.stage}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Customer: {ord.customerName} · {ord.shippingCity}
                  </p>
                  <Link href={`/tailor/orders/${ord.id}`} className="block">
                    <Button size="sm" variant="outline" className="w-full">
                      <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                      Inspect &amp; Track
                    </Button>
                  </Link>
                </article>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-violet-50/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Garment</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tailorOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="p-4 font-bold text-slate-950">{ord.id}</td>
                      <td className="p-4 text-slate-700">{ord.customerName}</td>
                      <td className="p-4 text-slate-700">
                        {ord.items[0]?.name ?? "Custom Garment"}
                      </td>
                      <td className="p-4">
                        <Badge variant={formatTailorStageVariant(ord.stage)}>
                          {ord.stage}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Link href={`/tailor/orders/${ord.id}`}>
                          <Button size="sm" variant="outline">
                            <Scissors
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Inspect &amp; Track →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]" aria-hidden="true" />
        <p>
          Workshop queue updates sync with customer order tracking inside this
          local browser session.
        </p>
      </div>
    </WorkspaceShell>
  );
}

export default function TailorDashboardPage() {
  return (
    <WorkspaceRoleGuard workspaceId="tailor">
      <TailorDashboardContent />
    </WorkspaceRoleGuard>
  );
}
