"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Eye,
  Package,
  PauseCircle,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceConfirmDialog } from "@/components/workspace/WorkspaceConfirmDialog";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CatalogModerationAction } from "@/lib/admin-workspace-utils";
import {
  GARMENT_CATEGORIES,
  type SellerCatalogProduct,
  formatModerationStatusLabel,
  formatProductStatusLabel,
  hasCompleteFitDimensions,
  isProductEligibleForCustomerCatalog,
} from "@/lib/seller-workspace-utils";

function AdminCatalogueContent() {
  const { sellerProducts, partners, moderateCatalogProduct, toast } =
    useFitloom();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sellerFilter, setSellerFilter] = useState("All");
  const [moderationFilter, setModerationFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">(
    "name"
  );
  const [inspectedProductId, setInspectedProductId] = useState<string | null>(
    sellerProducts[0]?.id ?? null
  );
  const [pendingModeration, setPendingModeration] = useState<{
    product: SellerCatalogProduct;
    action: CatalogModerationAction;
  } | null>(null);

  const suspendedSellerIds = useMemo(
    () =>
      new Set(
        partners
          .filter((p) => p.type === "seller" && p.operationalStatus === "suspended")
          .map((p) => p.id)
      ),
    [partners]
  );

  const sellerNames = useMemo(
    () => Array.from(new Set(sellerProducts.map((p) => p.sellerName))),
    [sellerProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sellerProducts.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) {
        return false;
      }
      if (sellerFilter !== "All" && p.sellerName !== sellerFilter) {
        return false;
      }
      if (
        moderationFilter !== "All" &&
        p.moderationStatus !== moderationFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${p.id} ${p.name} ${p.sellerName} ${p.category} ${p.fabric}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.priceInr - b.priceInr);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.priceInr - a.priceInr);
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [
    sellerProducts,
    query,
    categoryFilter,
    sellerFilter,
    moderationFilter,
    sortBy,
  ]);

  const inspectedProduct = useMemo(() => {
    if (!inspectedProductId) return filteredProducts[0] ?? null;
    return (
      sellerProducts.find((p) => p.id === inspectedProductId) ??
      filteredProducts[0] ??
      null
    );
  }, [sellerProducts, filteredProducts, inspectedProductId]);

  function handleConfirmModeration(reason?: string) {
    if (!pendingModeration) return;
    const { product, action } = pendingModeration;
    setPendingModeration(null);

    const res = moderateCatalogProduct(product.id, action, reason);
    if (!res.ok) {
      toast({
        type: "error",
        title: "Moderation Action Blocked",
        message: res.error ?? "Unable to moderate listing.",
      });
      return;
    }

    toast({
      type: action === "approve" || action === "restore" ? "success" : "info",
      title: `Listing Updated (${action})`,
      message: `"${product.name}" moderation status updated without modifying seller pricing or dimensions.`,
    });
  }

  return (
    <WorkspaceShell
      workspaceId="admin"
      title="Admin Catalogue Moderation"
      description="Review platform garment listings across all sellers. Moderating a listing preserves seller ownership, pricing, and dimensions while controlling customer eligibility."
    >
      {/* Search, Filters & Sort */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listing or seller..."
            aria-label="Search platform catalogue"
            className="pl-9"
          />
        </div>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="All">All Categories</option>
          {GARMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by seller"
          value={sellerFilter}
          onChange={(e) => setSellerFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="All">All Sellers</option>
          {sellerNames.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by moderation status"
          value={moderationFilter}
          onChange={(e) => setModerationFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="All">All Moderation States</option>
          <option value="approved">Approved</option>
          <option value="pending_review">Pending Review</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          aria-label="Sort catalogue"
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "name" | "price-asc" | "price-desc")
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="name">Sort: Name A–Z</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Package
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No matching listings found
          </h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setCategoryFilter("All");
              setSellerFilter("All");
              setModerationFilter("All");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Listings Column */}
          <div className="space-y-3 lg:col-span-7">
            {filteredProducts.map((prod) => {
              const selected = inspectedProduct?.id === prod.id;
              const eligibleForCustomer = isProductEligibleForCustomerCatalog(
                prod,
                suspendedSellerIds
              );

              return (
                <article
                  key={prod.id}
                  className={`space-y-3 rounded-2xl border p-4 transition-colors sm:p-5 ${
                    selected
                      ? "border-[#6633EE] bg-violet-50/45 shadow-2xs"
                      : "border-slate-200/80 bg-white/95"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      style={
                        !prod.image
                          ? { backgroundColor: prod.swatchHex }
                          : undefined
                      }
                    >
                      {prod.image && (
                        <Image
                          src={prod.image}
                          alt={prod.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            prod.moderationStatus === "approved"
                              ? "success"
                              : prod.moderationStatus === "pending_review"
                              ? "info"
                              : "amber"
                          }
                          size="sm"
                        >
                          {formatModerationStatusLabel(prod.moderationStatus)}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {formatProductStatusLabel(prod.status)}
                        </Badge>
                        <Badge
                          variant={prod.customFitEligible ? "default" : "outline"}
                          size="sm"
                        >
                          {prod.customFitEligible
                            ? "CUSTOMFIT Eligible"
                            : "Standard Only"}
                        </Badge>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-950 break-words">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Seller: <strong>{prod.sellerName}</strong> ·{" "}
                        {prod.category} · ₹
                        {prod.priceInr.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-500">
                        Customer Eligibility:{" "}
                        <strong>
                          {eligibleForCustomer ? "Purchasable" : "Hidden / Ineligible"}
                        </strong>
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setInspectedProductId(prod.id)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Details
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {prod.moderationStatus === "pending_review" && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setPendingModeration({
                            product: prod,
                            action: "approve",
                          })
                        }
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Approve Listing
                      </Button>
                    )}

                    {(prod.moderationStatus === "rejected" ||
                      prod.moderationStatus === "suspended") && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPendingModeration({
                            product: prod,
                            action: "restore",
                          })
                        }
                      >
                        <RotateCcw
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Restore Listing
                      </Button>
                    )}

                    {prod.moderationStatus !== "rejected" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPendingModeration({
                            product: prod,
                            action: "reject",
                          })
                        }
                      >
                        <XCircle
                          className="h-3.5 w-3.5 text-red-500"
                          aria-hidden="true"
                        />
                        Reject
                      </Button>
                    )}

                    {prod.moderationStatus !== "suspended" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setPendingModeration({
                            product: prod,
                            action: "suspend",
                          })
                        }
                      >
                        <PauseCircle
                          className="h-3.5 w-3.5 text-amber-600"
                          aria-hidden="true"
                        />
                        Suspend / Hide
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Product Details Inspector */}
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-5">
            {inspectedProduct ? (
              <div className="space-y-4">
                <div>
                  <Badge variant="neutral" size="sm">
                    Listing Oversight Detail
                  </Badge>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-950">
                    {inspectedProduct.name}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Owner: {inspectedProduct.sellerName} ({inspectedProduct.sellerId})
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-slate-700">
                  {inspectedProduct.description}
                </p>

                <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                  <div>
                    <dt className="font-bold text-slate-700">Price</dt>
                    <dd className="text-slate-600">
                      ₹{inspectedProduct.priceInr.toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">Availability</dt>
                    <dd className="text-slate-600">
                      {formatProductStatusLabel(inspectedProduct.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">Fabric</dt>
                    <dd className="text-slate-600">{inspectedProduct.fabric}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">
                      Fit Intelligence Specs
                    </dt>
                    <dd className="text-slate-600">
                      {hasCompleteFitDimensions(inspectedProduct)
                        ? `Complete (${inspectedProduct.sizes.join(", ")})`
                        : "Incomplete dimensions"}
                    </dd>
                  </div>
                </dl>

                {inspectedProduct.moderationReason && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <strong>Moderation Note:</strong>{" "}
                    {inspectedProduct.moderationReason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Select a listing to inspect specifications.
              </p>
            )}
          </section>
        </div>
      )}

      <WorkspaceConfirmDialog
        open={Boolean(pendingModeration)}
        title={
          pendingModeration?.action === "approve"
            ? `Approve "${pendingModeration.product.name}"?`
            : pendingModeration?.action === "restore"
            ? `Restore "${pendingModeration.product.name}"?`
            : pendingModeration?.action === "reject"
            ? `Reject "${pendingModeration.product.name}"?`
            : `Suspend / Hide "${pendingModeration?.product.name ?? ""}"?`
        }
        description="Updates demo moderation status while preserving original seller ownership, pricing, and garment measurements."
        confirmLabel={
          pendingModeration?.action === "approve"
            ? "Approve Listing"
            : pendingModeration?.action === "restore"
            ? "Restore Listing"
            : pendingModeration?.action === "reject"
            ? "Confirm Reject"
            : "Confirm Suspend"
        }
        requireReason={
          pendingModeration?.action === "reject" ||
          pendingModeration?.action === "suspend"
        }
        reasonLabel="Moderation Reason (minimum 5 characters)"
        reasonPlaceholder="e.g., Unverified fabric claims or seasonal catalogue pause"
        onConfirm={handleConfirmModeration}
        onCancel={() => setPendingModeration(null)}
      />
    </WorkspaceShell>
  );
}

export default function AdminCataloguePage() {
  return (
    <WorkspaceRoleGuard workspaceId="admin">
      <AdminCatalogueContent />
    </WorkspaceRoleGuard>
  );
}
