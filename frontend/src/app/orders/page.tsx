"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Info, Lock } from "lucide-react";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import {
  OrdersEmptyState,
  OrdersFilterToolbar,
  OrdersNoResultsState,
  OrdersPageHeader,
  OrderCard,
} from "@/components/orders/OrdersListSections";
import {
  type OrderFilterKey,
  type OrderSortKey,
  buildGarmentLookup,
  computeOrderFilterCounts,
  filterAndSortOrders,
} from "@/lib/order-status-utils";

export default function OrdersPage() {
  const { user, orders, eligibleCustomerGarments } = useFitloom();
  const [activeFilter, setActiveFilter] = useState<OrderFilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<OrderSortKey>("newest");

  const customerOrders = useMemo(
    () => getCustomerOrders(orders, user),
    [orders, user]
  );

  const garmentLookup = useMemo(
    () => buildGarmentLookup(eligibleCustomerGarments),
    [eligibleCustomerGarments]
  );

  const filterCounts = useMemo(
    () => computeOrderFilterCounts(customerOrders),
    [customerOrders]
  );

  const visibleOrders = useMemo(
    () =>
      filterAndSortOrders(
        customerOrders,
        {
          filter: activeFilter,
          searchQuery,
          sort: sortKey,
        },
        garmentLookup
      ),
    [customerOrders, activeFilter, searchQuery, sortKey, garmentLookup]
  );

  const hasActiveControls =
    activeFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    sortKey !== "newest";

  function handleClearFilters() {
    setActiveFilter("all");
    setSearchQuery("");
    setSortKey("newest");
  }

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#EAE2F8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#DDD6FE] bg-[#F7F5FF] text-[#6633EE]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl font-semibold text-[#1D0B24]">
          Customer Sign-In Required
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
          Sign in with a Customer session to view your recorded orders, track
          CUSTOMFIT tailoring progress, and inspect order details.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?next=%2Forders"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-110"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <OrdersPageHeader
        totalOrders={customerOrders.length}
        customerName={user.name || "FITLOOM Member"}
      />

      {customerOrders.length === 0 ? (
        <OrdersEmptyState />
      ) : (
        <>
          <OrdersFilterToolbar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={filterCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortKey={sortKey}
            onSortChange={setSortKey}
            hasActiveControls={hasActiveControls}
            onClearFilters={handleClearFilters}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6B7280]">
            <p>
              Showing{" "}
              <strong className="font-semibold text-[#1D0B24] tabular-nums">
                {visibleOrders.length}
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-[#1D0B24] tabular-nums">
                {customerOrders.length}
              </strong>{" "}
              {customerOrders.length === 1 ? "order" : "orders"}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5B526E]">
              <Info className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
              Active customer session only (simulated memory)
            </span>
          </div>

          {visibleOrders.length === 0 ? (
            <OrdersNoResultsState
              searchQuery={searchQuery}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  garmentLookup={garmentLookup}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
