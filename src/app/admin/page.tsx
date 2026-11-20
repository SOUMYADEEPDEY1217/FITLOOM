"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Info,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  computeAdminDashboardMetrics,
  formatVerificationLabel,
} from "@/lib/admin-workspace-utils";
import { formatModerationStatusLabel } from "@/lib/seller-workspace-utils";

function AdminOverviewContent() {
  const { user, partners, sellerProducts, orders, adminAuditLog } = useFitloom();

  const metrics = useMemo(
    () =>
      computeAdminDashboardMetrics({
        user,
        partners,
        products: sellerProducts,
        orders,
      }),
    [user, partners, sellerProducts, orders]
  );

  const pendingPartners = useMemo(
    () =>
      partners.filter(
        (p) =>
          p.verificationStatus === "pending_demo" ||
          p.operationalStatus === "suspended"
      ),
    [partners]
  );

  const moderationAttention = useMemo(
    () => sellerProducts.filter((p) => p.moderationStatus !== "approved"),
    [sellerProducts]
  );

  return (
    <WorkspaceShell
      workspaceId="admin"
      title="Admin Platform Oversight"
      description="Read & moderate demo platform partners, catalogue listings, and standard/CUSTOMFIT orders in local session state."
      actions={
        <>
          <Link href="/admin/partners">
            <Button size="sm">
              <Users className="h-4 w-4" aria-hidden="true" />
              Partners
            </Button>
          </Link>
          <Link href="/admin/catalogue">
            <Button size="sm" variant="outline">
              <Package className="h-4 w-4" aria-hidden="true" />
              Catalogue
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button size="sm" variant="outline">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Orders
            </Button>
          </Link>
        </>
      }
    >
      {/* Platform Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Session Customers
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">
            {metrics.totalCustomers}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Derived from session orders &amp; active customer profile
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Sellers &amp; Tailor Partners
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#6633EE]">
            {metrics.totalSellers + metrics.totalTailorPartners}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.totalSellers} Sellers · {metrics.totalTailorPartners} Tailors
            ({metrics.pendingPartnerVerifications} pending demo review)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Platform Catalogue
          </p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">
            {metrics.activeCatalogueProducts}
            <span className="ml-1.5 text-sm font-semibold text-slate-500">
              / {metrics.totalListedProducts}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active &amp; customer-eligible vs total listings
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Platform Orders
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">
            {metrics.totalStandardOrders + metrics.totalCustomFitOrders}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.totalStandardOrders} Standard ·{" "}
            {metrics.totalCustomFitOrders} CUSTOMFIT
          </p>
        </div>
      </div>

      {/* Operational Alerts when actually present */}
      {(metrics.pendingPartnerVerifications > 0 ||
        metrics.suspendedPartners > 0 ||
        metrics.flaggedOrPendingProducts > 0) && (
        <section
          aria-label="Operational oversight summary"
          className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950"
        >
          <p className="font-bold">Attention Required in Demo Session</p>
          <p className="mt-1">
            {metrics.pendingPartnerVerifications} partner verification
            request(s) awaiting demo review, {metrics.suspendedPartners} suspended
            partner(s), and {metrics.flaggedOrPendingProducts} non-approved
            catalogue listing(s).
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Partner Verification Queue */}
        <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-950">
              Partner Verification &amp; Status Queue
            </h2>
            <Link
              href="/admin/partners"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Manage Partners{" "}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {pendingPartners.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-600">
              All registered demo partners are currently active and verified.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingPartners.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">{p.name}</p>
                    <p className="text-xs text-slate-600">
                      {p.type === "seller" ? "Seller" : "Partner Tailor"} ·{" "}
                      {p.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        p.operationalStatus === "suspended" ? "amber" : "info"
                      }
                      size="sm"
                    >
                      {p.operationalStatus === "suspended"
                        ? "Suspended"
                        : formatVerificationLabel(p.verificationStatus)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Catalogue Moderation Summary */}
        <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-950">
              Catalogue Moderation Summary
            </h2>
            <Link
              href="/admin/catalogue"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Moderate Listings{" "}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {moderationAttention.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-600">
              All {metrics.totalListedProducts} catalogue listings are currently
              approved.{" "}
              {metrics.totalListedProducts - metrics.activeCatalogueProducts > 0
                ? `${
                    metrics.totalListedProducts - metrics.activeCatalogueProducts
                  } listing(s) remain inactive or out of stock.`
                : ""}
            </div>
          ) : (
            <div className="space-y-2.5">
              {moderationAttention.slice(0, 4).map((prod) => (
                <div
                  key={prod.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">
                      {prod.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      Seller: {prod.sellerName} · {prod.category}
                    </p>
                  </div>
                  <Badge variant="amber" size="sm" className="w-fit shrink-0">
                    {formatModerationStatusLabel(prod.moderationStatus)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Platform Orders */}
        <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-950">
              Recent Platform Orders
            </h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Inspect All Orders{" "}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-600">
              No orders recorded in this session yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-950">
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
                      {ord.customerName} · ₹
                      {ord.totalInr.toLocaleString("en-IN")} · {ord.createdAt}
                    </p>
                  </div>
                  <Badge
                    variant={ord.stage === "Delivered" ? "success" : "info"}
                    size="sm"
                    className="w-fit shrink-0"
                  >
                    {ord.stage}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Governance Session Log */}
        <section className="min-w-0 space-y-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-950">
            <ShieldCheck
              className="h-4 w-4 text-[#6633EE]"
              aria-hidden="true"
            />
            Session Governance Log
          </h2>

          {adminAuditLog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-600">
              No administrative governance actions logged in this session yet.
            </div>
          ) : (
            <div className="space-y-2">
              {adminAuditLog.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {entry.action} ({entry.targetId})
                    </span>
                    <span className="text-slate-500">{entry.timestamp}</span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 text-slate-600">{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs text-slate-600">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <p>
              Demo Oversight Notice: All counts and governance logs come from
              active frontend state with zero fabricated analytics.
            </p>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}

export default function AdminOverviewPage() {
  return (
    <WorkspaceRoleGuard workspaceId="admin">
      <AdminOverviewContent />
    </WorkspaceRoleGuard>
  );
}
