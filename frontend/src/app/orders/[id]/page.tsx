"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import {
  OrderDetailHeader,
  OrderFinancialAndAddressSidebar,
  OrderItemsList,
  OrderProgressTimeline,
  ShipmentTrackingCard,
} from "@/components/orders/OrderDetailSections";
import { buildGarmentLookup } from "@/lib/order-status-utils";

function OrderDetailsContent() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const {
    user,
    orders,
    eligibleCustomerGarments,
    cancelMockOrder,
    requestReturnMockOrder,
    toast,
  } = useFitloom();

  const rawId = params?.id ?? "";
  const decodedId = useMemo(() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  }, [rawId]);

  const isNewConfirmation = searchParams.get("new") === "1";

  const customerOrders = useMemo(
    () => getCustomerOrders(orders, user),
    [orders, user]
  );

  const garmentLookup = useMemo(
    () => buildGarmentLookup(eligibleCustomerGarments),
    [eligibleCustomerGarments]
  );

  const order = useMemo(
    () => customerOrders.find((entry) => entry.id === decodedId) ?? null,
    [customerOrders, decodedId]
  );

  if (user.role === "guest") {
    const nextHref = `/login?next=${encodeURIComponent(`/orders/${rawId}`)}`;
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#EAE2F8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#DDD6FE] bg-[#F7F5FF] text-[#6633EE]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl font-semibold text-[#1D0B24]">
          Customer Sign-In Required
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
          Sign in with a Customer session to view order tracking details,
          garment items, and delivery updates.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={nextHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-110"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#EAE2F8] bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl font-semibold text-[#1D0B24]">
          Order Unavailable
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
          Order{" "}
          <span className="font-mono font-bold text-[#1D0B24]">
            {decodedId || "Unknown"}
          </span>{" "}
          could not be found under your active customer session. It may belong
          to a different customer account, reference an invalid ID, or have
          cleared after a full reload.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/orders"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#DDD6FE] bg-white px-4 text-xs font-semibold text-[#4C1D95] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Orders
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <OrderDetailHeader
        order={order}
        isNewConfirmation={isNewConfirmation}
      />

      <OrderProgressTimeline order={order} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <ShipmentTrackingCard order={order} />
          <OrderItemsList order={order} garmentLookup={garmentLookup} />
        </div>

        <aside className="lg:col-span-4">
          <OrderFinancialAndAddressSidebar
            order={order}
            onCancelOrder={cancelMockOrder}
            onRequestReturn={requestReturnMockOrder}
            onNotify={toast}
          />
        </aside>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#EAE2F8] bg-white p-8 text-center text-xs text-[#6B7280]">
          Loading order details...
        </div>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  );
}
