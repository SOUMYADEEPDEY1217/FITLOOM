"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  findMatchingPartnerForUser,
  formatVerificationLabel,
} from "@/lib/admin-workspace-utils";
import {
  computeSellerDashboardMetrics,
  formatModerationStatusLabel,
  formatProductStatusLabel,
  getSellerOwnedProducts,
  getSellerStandardOrders,
} from "@/lib/seller-workspace-utils";

function SellerDashboardContent() {
  const { user, sellerProducts, orders, partners } = useFitloom();

  const ownedProducts = useMemo(
    () => getSellerOwnedProducts(sellerProducts, user),
    [sellerProducts, user]
  );

  const standardOrders = useMemo(
    () => getSellerStandardOrders(orders, user),
    [orders, user]
  );

  const metrics = useMemo(
    () => computeSellerDashboardMetrics(ownedProducts, standardOrders),
    [ownedProducts, standardOrders]
  );

  const partnerRecord = useMemo(
    () => findMatchingPartnerForUser(user, partners),
    [user, partners]
  );

  const recentProducts = useMemo(
    () =>
      [...ownedProducts]
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
        .slice(0, 4),
    [ownedProducts]
  );

  return (
    <WorkspaceShell
      workspaceId="seller"
      title={`${user.name} — Seller Overview`}
      description="Manage your merchant catalogue, inventory availability, and standard retail order fulfillment in isolation from CUSTOMFIT tailoring."
      actions={
        <>
          <Link href="/seller/products?create=1">
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Product
            </Button>
          </Link>
          <Link href="/seller/products">
            <Button size="sm" variant="outline">
              <Package className="h-4 w-4" aria-hidden="true" />
              Manage Products
            </Button>
          </Link>
          <Link href="/seller/orders">
            <Button size="sm" variant="outline">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              View Orders
            </Button>
          </Link>
        </>
      }
    >
      {/* Seller Business Identity Summary */}
      <section
        aria-label="Seller business summary"
        className="flex flex-col justify-between gap-4 rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-2xs sm:flex-row sm:items-center"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Store className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
            <span className="text-sm font-bold text-slate-950">{user.name}</span>
            <Badge
              variant={
                partnerRecord?.verificationStatus === "verified_demo"
                  ? "success"
                  : partnerRecord?.verificationStatus === "rejected_demo"
                  ? "amber"
                  : "info"
              }
              size="sm"
            >
              {partnerRecord
                ? formatVerificationLabel(partnerRecord.verificationStatus)
                : "Session Seller"}
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Location: {user.city || partnerRecord?.city || "Not specified"} ·
            Contact: {user.email || "Not provided"}
          </p>
        </div>

        <p className="text-xs font-medium text-slate-500">
          Scope: Standard retail orders only (CUSTOMFIT orders route to
          Tailors)
        </p>
      </section>

      {/* Truthful Session Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Total Listed Products
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-950">
            {metrics.totalProducts}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.activeProducts} Active · {metrics.draftProducts} Draft ·{" "}
            {metrics.outOfStockProducts} Out of Stock
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Standard Orders
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[#6633EE]">
            {metrics.totalStandardOrders}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.pendingOrders} Pending · {metrics.inProgressOrders} In
            Progress
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Completed Orders
          </p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-700">
            {metrics.completedOrders}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Delivered standard retail orders
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-600">
            Delivered Order Value (Demo)
          </p>
          {metrics.deliveredRevenueInr !== null ? (
            <>
              <p className="mt-1 text-3xl font-extrabold text-slate-950">
                ₹{metrics.deliveredRevenueInr.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sum of {metrics.completedOrders} delivered demo order(s)
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-bold text-slate-500">
                No delivered revenue yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Appears when standard orders reach Delivered
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Standard Orders */}
        <section
          aria-labelledby="seller-recent-orders-heading"
          className="min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="seller-recent-orders-heading"
              className="text-base font-bold text-slate-950"
            >
              Recent Standard Orders
            </h2>
            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Manage Orders <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {standardOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-600">
              <ShoppingBag
                className="mx-auto h-6 w-6 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 font-semibold text-slate-900">
                No standard retail orders yet
              </p>
              <p className="mt-1">
                Standard non-CUSTOMFIT customer orders placed in this session
                will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {standardOrders.slice(0, 5).map((ord) => (
                <div
                  key={ord.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">
                      {ord.id} · ₹{ord.totalInr.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-600 break-words">
                      {ord.customerName} ·{" "}
                      {ord.items.map((i) => `${i.name} (${i.size})`).join(", ")}
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

        {/* Inventory & Product Activity */}
        <section
          aria-labelledby="seller-inventory-heading"
          className="min-w-0 space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:col-span-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="seller-inventory-heading"
              className="text-base font-bold text-slate-950"
            >
              Catalogue &amp; Inventory Overview
            </h2>
            <Link
              href="/seller/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              All Products <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-600">
              <Package
                className="mx-auto h-6 w-6 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 font-semibold text-slate-900">
                No seller products listed yet
              </p>
              <Link href="/seller/products?create=1" className="mt-3 inline-block">
                <Button size="sm">Add First Product</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950 break-words">
                      {prod.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {prod.category} · ₹{prod.priceInr.toLocaleString("en-IN")}{" "}
                      ·{" "}
                      {prod.inventoryQty !== null
                        ? `${prod.inventoryQty} units`
                        : "Stock qty not specified"}
                      {prod.updatedAt ? ` · Updated ${prod.updatedAt}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        prod.status === "active"
                          ? "success"
                          : prod.status === "out_of_stock"
                          ? "amber"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {formatProductStatusLabel(prod.status)}
                    </Badge>
                    <Badge
                      variant={
                        prod.moderationStatus === "approved"
                          ? "default"
                          : prod.moderationStatus === "pending_review"
                          ? "info"
                          : "amber"
                      }
                      size="sm"
                    >
                      {formatModerationStatusLabel(prod.moderationStatus)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs text-slate-600">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <p>
              Metrics reflect live FitloomProvider session state only. Seeded
              items without explicit inventory show &ldquo;Stock qty not
              specified&rdquo; rather than fabricated counts.
            </p>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}

export default function SellerOverviewPage() {
  return (
    <WorkspaceRoleGuard workspaceId="seller">
      <SellerDashboardContent />
    </WorkspaceRoleGuard>
  );
}
