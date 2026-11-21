"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  RotateCcw,
  Scissors,
  Search,
  SearchX,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import type { MockOrder } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type GarmentLookupEntry,
  ORDER_FILTER_TABS,
  ORDER_SORT_OPTIONS,
  type OrderFilterKey,
  type OrderSortKey,
  computeOrderPricingSummary,
  extractShipmentTrackingInfo,
  formatOrderDate,
  formatOrderInr,
  getOrderStageMeta,
  resolveOrderItem,
} from "@/lib/order-status-utils";

const EDITORIAL_SERIF =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

interface OrdersPageHeaderProps {
  totalOrders: number;
  customerName: string;
}

export function OrdersPageHeader({
  totalOrders,
  customerName,
}: OrdersPageHeaderProps) {
  return (
    <section className="rounded-2xl border border-[#EAE2F8] bg-gradient-to-br from-[#FCFBFF] via-[#F7F5FF] to-[#F3ECFF] p-5 shadow-xs sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wider text-[#6633EE] uppercase">
            <Package className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Orders &amp; Fit Fulfillment</span>
          </div>
          <h1
            className={cn(
              EDITORIAL_SERIF,
              "mt-3 text-2xl font-semibold tracking-tight text-[#1D0B24] sm:text-3xl"
            )}
          >
            Your Orders
          </h1>
          <p className="mt-1.5 text-sm text-[#4B5563]">
            Every order, every update, all in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[#DDD6FE] bg-white/95 px-4 py-2.5 text-left shadow-2xs">
            <p className="text-[11px] font-medium text-[#6B7280]">
              {customerName}
            </p>
            <p className="text-sm font-bold text-[#1D0B24] tabular-nums">
              {totalOrders} {totalOrders === 1 ? "Order" : "Orders"} Recorded
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            Browse Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}

interface OrdersFilterToolbarProps {
  activeFilter: OrderFilterKey;
  onFilterChange: (next: OrderFilterKey) => void;
  counts: Record<OrderFilterKey, number>;
  searchQuery: string;
  onSearchChange: (next: string) => void;
  sortKey: OrderSortKey;
  onSortChange: (next: OrderSortKey) => void;
  hasActiveControls: boolean;
  onClearFilters: () => void;
}

export function OrdersFilterToolbar({
  activeFilter,
  onFilterChange,
  counts,
  searchQuery,
  onSearchChange,
  sortKey,
  onSortChange,
  hasActiveControls,
  onClearFilters,
}: OrdersFilterToolbarProps) {
  return (
    <section
      aria-label="Filter and search orders"
      className="space-y-3 rounded-2xl border border-[#EAE2F8] bg-white p-4 shadow-2xs sm:p-5"
    >
      <div
        role="group"
        aria-label="Filter orders by status"
        className="flex flex-wrap items-center gap-2"
      >
        {ORDER_FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(tab.key)}
              className={cn(
                "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                isActive
                  ? "border-[#6633EE] bg-[#6633EE] text-white shadow-xs"
                  : "border-[#DDD6FE] bg-[#FAF8FE] text-[#4C1D95] hover:border-[#6633EE]/50 hover:bg-[#F3EEFE]"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#EDE9FE] text-[#4C1D95]"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Order ID, garment name, category, or city..."
            aria-label="Search orders"
            className="h-10 rounded-xl border-[#DDD6FE] bg-[#FCFBFF] pr-9 pl-9 text-xs text-[#1D0B24] placeholder:text-[#6B7280] focus-visible:ring-[#6633EE]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search query"
              className="absolute top-1/2 right-2.5 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#1D0B24]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="orders-sort-select" className="sr-only">
            Sort orders
          </label>
          <select
            id="orders-sort-select"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as OrderSortKey)}
            className="h-10 min-w-[165px] cursor-pointer rounded-xl border border-[#DDD6FE] bg-[#FCFBFF] px-3 text-xs font-semibold text-[#1D0B24] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            {ORDER_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          {hasActiveControls && (
            <Button
              type="button"
              variant="outline"
              onClick={onClearFilters}
              className="h-10 shrink-0 rounded-xl border-[#DDD6FE] bg-white px-3 text-xs font-semibold text-[#4C1D95] hover:border-[#6633EE] hover:bg-[#F7F5FF]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

interface OrderCardProps {
  order: MockOrder;
  garmentLookup: ReadonlyMap<string, GarmentLookupEntry>;
}

export function OrderCard({ order, garmentLookup }: OrderCardProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const stageMeta = getOrderStageMeta(order.stage);
  const pricing = computeOrderPricingSummary(order);
  const tracking = extractShipmentTrackingInfo(order);

  const resolvedItems = order.items.map((item) =>
    resolveOrderItem(item, garmentLookup)
  );
  const primary = resolvedItems[0];
  const remainingCount = Math.max(0, resolvedItems.length - 1);
  const remainingNames = resolvedItems
    .slice(1, 3)
    .map((entry) => entry.item.name)
    .join(", ");

  const imageKey = `${order.id}-${primary?.item.garmentId ?? "none"}`;
  const showThumbnailImage =
    Boolean(primary?.image) && !failedImages[imageKey];

  return (
    <article className="rounded-2xl border border-[#EAE2F8] bg-white p-4 shadow-xs transition-all hover:border-[#C4B5FD] hover:shadow-md sm:p-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#F3EEFE] pb-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Link
            href={`/orders/${encodeURIComponent(order.id)}`}
            className="font-mono text-sm font-bold tracking-wide text-[#1D0B24] hover:text-[#6633EE]"
          >
            {order.id}
          </Link>

          <span className="inline-flex items-center gap-1 text-xs text-[#4B5563]">
            <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" aria-hidden="true" />
            {formatOrderDate(order.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-[#4B5563]">
            <MapPin className="h-3.5 w-3.5 text-[#7C3AED]" aria-hidden="true" />
            {order.shippingCity}
          </span>

          {order.isCustomFit && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#DDD6FE] bg-[#F7F5FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6633EE]">
              <Scissors className="h-3 w-3" aria-hidden="true" />
              CUSTOMFIT
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.paymentLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-[11px] font-medium text-[#374151]">
              <CreditCard className="h-3 w-3 text-[#6B7280]" aria-hidden="true" />
              {order.paymentLabel}
            </span>
          )}
          <Badge variant={stageMeta.badgeVariant}>{stageMeta.stage}</Badge>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          {/* Garment Preview Thumbnail */}
          <Link
            href={`/orders/${encodeURIComponent(order.id)}`}
            aria-label={`Inspect order ${order.id}`}
            className="relative flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE2F8] bg-[#F7F5FF]"
          >
            {showThumbnailImage && primary?.image ? (
              <Image
                src={primary.image}
                alt={primary.item.name}
                fill
                sizes="64px"
                className="object-cover"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [imageKey]: true }))
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 p-1 text-center">
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: primary?.swatchHex ?? "#EDE9FE" }}
                  aria-hidden="true"
                />
                <Package className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
              </div>
            )}
            {resolvedItems.length > 1 && (
              <span className="absolute right-1 bottom-1 rounded-md bg-[#1D0B24]/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {resolvedItems.length}
              </span>
            )}
          </Link>

          {/* Product & Fulfillment Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                className="truncate text-sm font-semibold text-[#1D0B24] hover:text-[#6633EE] sm:text-base"
              >
                {primary?.item.name ?? "Order Items"}
              </Link>
              {remainingCount > 0 && (
                <span className="rounded-full bg-[#F3EEFE] px-2 py-0.5 text-[11px] font-semibold text-[#4C1D95]">
                  +{remainingCount} more {remainingCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>

            {remainingNames && (
              <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                Also includes: {remainingNames}
                {resolvedItems.length > 3
                  ? ` +${resolvedItems.length - 3} more`
                  : ""}
              </p>
            )}

            <p className="mt-1.5 text-xs text-[#4B5563]">
              {pricing.totalUnits} {pricing.totalUnits === 1 ? "unit" : "units"}
              {primary?.item.size ? ` • Size ${primary.item.size}` : ""}
              {primary?.color ? ` • ${primary.color}` : ""}
              {order.tailorName ? ` • Tailor: ${order.tailorName}` : ""}
            </p>

            <p className="mt-1.5 text-xs text-[#5B526E]">
              {tracking.estimatedDeliveryDate
                ? `Estimated delivery: ${formatOrderDate(tracking.estimatedDeliveryDate)}`
                : stageMeta.description}
            </p>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-[#F3EEFE] pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-medium text-[#6B7280]">Order Total</p>
            <p className="text-lg font-bold text-[#1D0B24] tabular-nums">
              {formatOrderInr(order.totalInr)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/orders/${encodeURIComponent(order.id)}#shipment-tracking`}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-3 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
            >
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Track Order
            </Link>
            <Link
              href={`/orders/${encodeURIComponent(order.id)}`}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#6633EE] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#5522D9]"
            >
              View Details
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OrdersEmptyState() {
  return (
    <section className="rounded-2xl border border-[#EAE2F8] bg-gradient-to-b from-white to-[#FAF8FE] px-6 py-12 text-center shadow-xs sm:py-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#EDE9FE] text-[#6633EE]">
        <ShoppingBag className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2
        className={cn(
          EDITORIAL_SERIF,
          "mt-5 text-2xl font-semibold text-[#1D0B24]"
        )}
      >
        Your next favourite fit starts here.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4B5563]">
        You have not placed any orders in this session yet. Explore curated
        garments tailored around FITLOOM Fit Intelligence, or submit a CUSTOMFIT
        piece crafted to your measurements.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110"
        >
          Explore Marketplace
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Link
          href="/customfit"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-5 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
        >
          <Scissors className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
          Create a CUSTOMFIT
        </Link>
      </div>
    </section>
  );
}

interface OrdersNoResultsStateProps {
  searchQuery: string;
  onClearFilters: () => void;
}

export function OrdersNoResultsState({
  searchQuery,
  onClearFilters,
}: OrdersNoResultsStateProps) {
  return (
    <section className="rounded-2xl border border-[#EAE2F8] bg-white px-6 py-10 text-center shadow-2xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDD6FE] bg-[#F7F5FF] text-[#6633EE]">
        <SearchX className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-bold text-[#1D0B24]">
        No matching orders found.
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#4B5563]">
        {searchQuery
          ? `No orders matched "${searchQuery.trim()}" with the current status filter.`
          : "None of your recorded orders fall under the currently selected status filter."}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onClearFilters}
        className="mt-5 min-h-10 rounded-xl border-[#DDD6FE] bg-white px-4 text-xs font-semibold text-[#4C1D95] hover:border-[#6633EE] hover:bg-[#F7F5FF]"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Clear Filters
      </Button>
    </section>
  );
}
