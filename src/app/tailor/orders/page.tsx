"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Scissors } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import {
  type TailorOrderFilterTab,
  filterTailorOrdersByTab,
  formatTailorStageVariant,
  getTailorOrders,
} from "@/lib/tailor-workspace-utils";

function TailorOrdersQueueContent() {
  const { user, orders, tailorWorkshopProfile } = useFitloom();
  const [tab, setTab] = useState<TailorOrderFilterTab>("all");

  const tailorOrders = useMemo(
    () => getTailorOrders(orders, user, tailorWorkshopProfile),
    [orders, user, tailorWorkshopProfile]
  );

  const visible = useMemo(
    () => filterTailorOrdersByTab(tailorOrders, tab),
    [tailorOrders, tab]
  );

  const counts = useMemo(
    () => ({
      all: tailorOrders.length,
      new: filterTailorOrdersByTab(tailorOrders, "new").length,
      prod: filterTailorOrdersByTab(tailorOrders, "prod").length,
      done: filterTailorOrdersByTab(tailorOrders, "done").length,
      closed: filterTailorOrdersByTab(tailorOrders, "closed").length,
    }),
    [tailorOrders]
  );

  return (
    <WorkspaceShell
      workspaceId="tailor"
      title="Incoming CUSTOMFIT Orders"
      description={`Showing made-to-measure CUSTOMFIT orders assigned to ${tailorWorkshopProfile.workshopName}. Standard ready-to-wear orders are excluded.`}
      actions={
        <Link href="/tailor/profile">
          <Button variant="outline" size="sm">
            Workshop Capacity ({tailorWorkshopProfile.weeklyCapacityOrders}/wk)
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          activeId={tab}
          onChange={(id) => setTab(id as TailorOrderFilterTab)}
          tabs={[
            { id: "all", label: `All (${counts.all})` },
            { id: "new", label: `New (${counts.new})` },
            { id: "prod", label: `In Production (${counts.prod})` },
            { id: "done", label: `Completed (${counts.done})` },
            { id: "closed", label: `Closed (${counts.closed})` },
          ]}
        />
        <p className="text-xs text-slate-500">
          Showing {visible.length} of {tailorOrders.length} CUSTOMFIT orders
        </p>
      </div>

      {tailorOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <ClipboardList
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No CUSTOMFIT orders assigned
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
            There are currently no CUSTOMFIT orders routed to{" "}
            <strong>{tailorWorkshopProfile.workshopName}</strong> in this demo
            session.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <Link href="/tailor">
              <Button size="sm" variant="outline">
                Back to Tailor Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Scissors
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No orders match this status filter
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Switch to another tab or reset to all assigned CUSTOMFIT orders.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => setTab("all")}
          >
            Show All Orders ({counts.all})
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((ord) => {
            const primaryName = ord.items[0]?.name ?? "Custom Garment";
            const extraCount = Math.max(0, ord.items.length - 1);

            return (
              <article
                key={ord.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      {ord.id}
                    </span>
                    <Badge variant="default" size="sm">
                      CUSTOMFIT
                    </Badge>
                    {!ord.measurementsSnapshot && (
                      <Badge variant="amber" size="sm">
                        Measurements unavailable
                      </Badge>
                    )}
                  </div>
                  <p className="text-base font-bold text-slate-950 break-words">
                    {primaryName}
                    {extraCount > 0 ? ` +${extraCount} more` : ""}
                  </p>
                  <p className="text-xs text-slate-600">
                    Customer: {ord.customerName} · {ord.shippingCity} ·{" "}
                    {ord.tailorName?.trim() || "Workshop not specified"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <Badge variant={formatTailorStageVariant(ord.stage)}>
                    {ord.stage}
                  </Badge>
                  <Link href={`/tailor/orders/${ord.id}`}>
                    <Button size="sm" variant="outline">
                      Manage Order →
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </WorkspaceShell>
  );
}

export default function TailorOrdersQueuePage() {
  return (
    <WorkspaceRoleGuard workspaceId="tailor">
      <TailorOrdersQueueContent />
    </WorkspaceRoleGuard>
  );
}
