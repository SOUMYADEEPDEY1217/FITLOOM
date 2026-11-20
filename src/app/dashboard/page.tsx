"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Compass,
  Heart,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Ruler,
  ShoppingBag,
  Sparkles,
  User,
  UserCog,
} from "lucide-react";
import {
  BodyProfileSchema,
  FitPreference,
  MOCK_GARMENTS,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import { summarizeDashboardFitStatus } from "@/lib/fit-intelligence-utils";
import {
  OrderStage,
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getOrderStageVariant(stage: OrderStage): BadgeVariant {
  if (stage === "Delivered") return "success";
  if (stage === "Cancelled" || stage === "Rejected by Tailor") {
    return "destructive";
  }
  if (stage === "Return Requested" || stage === "Pending Tailor Acceptance") {
    return "warning";
  }
  return "default";
}

function getFitEaseLabel(fitPreference: FitPreference): string {
  return `+${getFitPreferenceEaseCm(fitPreference)} cm ease`;
}

export default function CustomerDashboardPage() {
  const {
    user,
    bodyProfile,
    hasBodyProfile,
    measurementHistory,
    savedLooks,
    orders,
    wishlistIds,
    cartCount,
  } = useFitloom();

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-violet-200 bg-white/95 p-6 text-center shadow-xs sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-[#6633EE]">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-950">
          Customer Sign-In Required
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Sign in with a Customer session to view your personalized FITLOOM
          dashboard, Body Profile summary, wishlist, saved looks, and orders.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/account">
            <Button variant="outline">Switch Session Role</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Module A: Personalized identity derived strictly from FitloomProvider
  const trimmedName = user.name?.trim() || "";
  const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : "Member";
  const hasName = Boolean(trimmedName);
  const hasEmail = Boolean(user.email?.trim());
  const isAccountComplete = hasName && hasEmail;
  const monogram = getMonogram(trimmedName || "Member");

  // Module C & G: Validate Body Profile completeness & compute Fit Confidence
  const profileValidation = BodyProfileSchema.safeParse(bodyProfile);
  const isBodyProfileComplete = hasBodyProfile && profileValidation.success;

  const measurementStats = [
    { label: "Height", value: bodyProfile?.heightCm, unit: "cm", required: true },
    { label: "Chest", value: bodyProfile?.chestCm, unit: "cm", required: true },
    { label: "Waist", value: bodyProfile?.waistCm, unit: "cm", required: true },
    { label: "Hips", value: bodyProfile?.hipCm, unit: "cm", required: true },
    { label: "Shoulder", value: bodyProfile?.shoulderCm, unit: "cm", required: true },
    { label: "Sleeve", value: bodyProfile?.sleeveCm, unit: "cm", required: true },
    { label: "Inseam", value: bodyProfile?.inseamCm, unit: "cm", required: true },
    { label: "Weight", value: bodyProfile?.weightKg, unit: "kg", required: false },
  ];

  const requiredMeasurements = measurementStats.filter((item) => item.required);
  const availableMeasurements = requiredMeasurements.filter(
    (item) => typeof item.value === "number" && Number.isFinite(item.value) && item.value > 0
  );

  const fitStatusSummary = summarizeDashboardFitStatus({
    bodyProfile,
    hasBodyProfile: isBodyProfileComplete,
    garments: MOCK_GARMENTS,
  });

  // Module D: Customer-scoped orders only (never falls back to orders[0])
  const customerOrders = getCustomerOrders(orders, user);
  const activeOrderCount = customerOrders.filter(
    (ord) =>
      ord.stage !== "Delivered" &&
      ord.stage !== "Cancelled" &&
      ord.stage !== "Rejected by Tailor"
  ).length;
  const customOrderCount = customerOrders.filter((ord) => ord.isCustomFit).length;

  // Module E: Wishlist items resolved safely against catalog
  const wishlistItems = MOCK_GARMENTS.filter((garment) =>
    wishlistIds.includes(garment.id)
  );
  const invalidWishlistRefs = Math.max(0, wishlistIds.length - wishlistItems.length);

  // Module F: Saved Looks resolved from shared state
  const recentLooks = savedLooks.slice(0, 3);

  return (
    <div className="space-y-8 pb-10">
      {/* Tailor Context Banner if a Partner Tailor opens Customer Dashboard */}
      {user.role === "tailor" && (
        <div
          role="status"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-xs text-slate-800 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]" aria-hidden="true" />
            <p className="leading-relaxed">
              You are viewing the Customer Dashboard while signed in as{" "}
              <strong>Partner Tailor</strong>. Orders below show only your
              personal purchases, separate from the Tailor production queue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/tailor">
              <Button size="sm" variant="secondary">
                Tailor Workspace
              </Button>
            </Link>
            <Link href="/account">
              <Button size="sm" variant="outline">
                Switch Role
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Module A: Personalized Welcome Header */}
      <section
        aria-labelledby="dashboard-welcome-heading"
        className="flex flex-col justify-between gap-5 border-b border-violet-100 pb-6 md:flex-row md:items-end"
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              id="dashboard-welcome-heading"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl break-words"
            >
              Welcome back, {firstName}
            </h1>
            <Badge variant={isBodyProfileComplete ? "success" : "warning"}>
              {isBodyProfileComplete
                ? "Profile Calibrated"
                : "Profile Incomplete"}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Your central FITLOOM overview for Body Profile specs, saved looks,
            wishlist items, and active orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/account">
            <Button variant="outline" size="sm">
              <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
              Edit Account
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="sm">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              Explore Shop
            </Button>
          </Link>
        </div>
      </section>

      {/* Module G: Explainable KPI Overview Strip */}
      <section aria-label="Dashboard Key Metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={fitStatusSummary.isAvailable ? "/fit-check" : "/body-profile"}
            className="group rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-2xs transition-colors hover:border-[#6633EE]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">
                Fit Intelligence Status
              </p>
              <Sparkles className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[#6633EE] sm:text-3xl">
              {fitStatusSummary.headline}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {fitStatusSummary.sublabel}
            </p>
          </Link>

          <Link
            href="/orders"
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs transition-colors hover:border-[#6633EE]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">My Orders</p>
              <Package className="h-4 w-4 text-slate-500 group-hover:text-[#6633EE]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {customerOrders.length}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              {customerOrders.length > 0
                ? `${activeOrderCount} active · ${customOrderCount} custom-fit`
                : "No orders placed yet"}
            </p>
          </Link>

          <Link
            href="/wishlist"
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs transition-colors hover:border-[#6633EE]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">Wishlist</p>
              <Heart className="h-4 w-4 text-slate-500 group-hover:text-[#6633EE]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {wishlistItems.length}
            </p>
            <p className="mt-1.5 text-xs text-[#6633EE]">
              {wishlistItems.length > 0
                ? "View saved garments →"
                : "Save pieces from Shop →"}
            </p>
          </Link>

          <Link
            href="/saved-looks"
            className="group rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs transition-colors hover:border-[#6633EE]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600">Saved Looks</p>
              <Bookmark className="h-4 w-4 text-slate-500 group-hover:text-[#6633EE]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {savedLooks.length}
            </p>
            <p className="mt-1.5 text-xs text-[#6633EE]">
              {savedLooks.length > 0
                ? "Open Virtual Wardrobe →"
                : "Compose in Style Studio →"}
            </p>
          </Link>
        </div>
      </section>

      {/* Main Editorial Grid: Account + Quick Actions (Left) & Body Profile (Right) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          {/* Module B: Compact Account Overview */}
          <section
            aria-labelledby="account-overview-heading"
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2
                id="account-overview-heading"
                className="flex items-center gap-2 text-base font-bold text-slate-950"
              >
                <User className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                Account Overview
              </h2>
              <Badge variant={isAccountComplete ? "success" : "warning"} size="sm">
                {isAccountComplete ? "Account Complete" : "Missing Info"}
              </Badge>
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7E2DF2] to-[#5522DD] text-sm font-black text-white shadow-xs"
              >
                {monogram}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-950">
                  {hasName ? trimmedName : "Customer Name Not Set"}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600 break-all">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{hasEmail ? user.email : "Email address missing"}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  Phone
                </span>
                <span className="font-semibold text-slate-900">
                  {user.phone?.trim() || "Not provided"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  City
                </span>
                <span className="font-semibold text-slate-900">
                  {user.city?.trim() || "Not provided"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-500">Session Tenure</span>
                <span className="font-semibold text-slate-900">
                  {user.memberSince || "Current Session"}
                </span>
              </div>
            </div>

            {!isAccountComplete && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span>
                  Some personal details are missing. Complete your profile in
                  Account Settings.
                </span>
              </div>
            )}

            <div className="mt-4">
              <Link href="/account" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit Account
                </Button>
              </Link>
            </div>
          </section>

          {/* Module H: Quick Actions */}
          <section
            aria-labelledby="quick-actions-heading"
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs"
          >
            <h2
              id="quick-actions-heading"
              className="text-base font-bold text-slate-950"
            >
              Quick Actions
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Jump directly to your active FITLOOM destinations.
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/shop">
                <Button variant="secondary" size="sm">
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  Explore Fashion
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="outline" size="sm">
                  <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit Account
                </Button>
              </Link>
              <Link href="/body-profile">
                <Button variant="outline" size="sm">
                  <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                  Manage Body Profile
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="outline" size="sm">
                  <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                  View Wishlist
                </Button>
              </Link>
              <Link href="/studio">
                <Button variant="outline" size="sm">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Open Virtual Wardrobe
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" size="sm">
                  <Package className="h-3.5 w-3.5" aria-hidden="true" />
                  View Orders
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" size="sm">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  Open Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* Module C: Body Profile Summary */}
        <section
          aria-labelledby="body-profile-heading"
          className="space-y-5 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="body-profile-heading"
                  className="flex items-center gap-2 text-base font-bold text-slate-950"
                >
                  <Ruler className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                  Body Profile &amp; Fit Calibration
                </h2>
                <Badge
                  variant={isBodyProfileComplete ? "success" : "warning"}
                  size="sm"
                >
                  {isBodyProfileComplete
                    ? `Calibrated (${availableMeasurements.length}/${requiredMeasurements.length})`
                    : "Incomplete Profile"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Anatomical measurements used by Fit Intelligence and CUSTOMFIT
                tailoring.
              </p>
            </div>

            <Link href="/body-profile" className="shrink-0">
              <Button variant="outline" size="sm">
                {isBodyProfileComplete
                  ? "Update Body Profile"
                  : "Create Body Profile"}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          {!isBodyProfileComplete ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-6 text-center">
              <AlertTriangle className="mx-auto h-7 w-7 text-amber-600" aria-hidden="true" />
              <p className="mt-2.5 text-sm font-bold text-slate-950">
                Body Profile Calibration Incomplete
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Record your height, weight, and anatomical body measurements to
                unlock personalized garment size recommendations and Fit Confidence
                scoring.
              </p>
              <Link href="/body-profile" className="mt-4 inline-block">
                <Button size="sm">Complete Body Profile</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Measurement Availability */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recorded Measurements
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {measurementStats.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                    >
                      <span className="text-[11px] font-semibold text-slate-500">
                        {metric.label}
                      </span>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                        {typeof metric.value === "number"
                          ? `${metric.value} ${metric.unit}`
                          : "Optional"}
                      </p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Body Type
                    </span>
                    <p className="mt-0.5 text-sm font-extrabold capitalize text-slate-950">
                      {bodyProfile.bodyType
                        ? bodyProfile.bodyType.replace("-", " ")
                        : "Optional"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferred Fit & Digital Avatar Status */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4C1D95]">
                    Preferred Fit
                  </span>
                  <p className="mt-1 text-sm font-extrabold capitalize text-slate-950">
                    {bodyProfile.fitPreference} Fit
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Target chest allowance:{" "}
                    {getFitEaseLabel(bodyProfile.fitPreference)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Digital Avatar Status
                  </span>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-slate-950">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    2D Silhouette Active
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Calibrated preview ready on{" "}
                    <Link
                      href="/body-profile"
                      className="font-semibold text-[#6633EE] hover:underline"
                    >
                      Body Profile
                    </Link>{" "}
                    (3D Avatar pending full module).
                  </p>
                </div>
              </div>

              {/* Measurement History (Mobile Flex-Wrap Fixed) */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Measurement History
                </p>
                {measurementHistory.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                    No measurement revision history recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {measurementHistory.map((entry, idx) => (
                      <div
                        key={`${entry.date}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs"
                      >
                        <span className="font-semibold text-slate-800 break-words">
                          {entry.note}
                        </span>
                        <span className="text-slate-600 shrink-0">
                          Chest {entry.chestCm} cm / Waist {entry.waistCm} cm ·{" "}
                          {entry.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Module D: Recent Customer Orders */}
      <section
        aria-labelledby="recent-orders-heading"
        className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="recent-orders-heading"
              className="flex items-center gap-2 text-base font-bold text-slate-950"
            >
              <Package className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
              Recent Orders
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Showing orders associated with your active customer account.
            </p>
          </div>
          {customerOrders.length > 0 && (
            <Link
              href="/orders"
              className="text-xs font-semibold text-[#6633EE] hover:underline"
            >
              View All Orders →
            </Link>
          )}
        </div>

        {customerOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-violet-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-950">
              No orders found for this account
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Once you place a standard or CUSTOMFIT order, live order tracking
              and tailoring stages will appear here.
            </p>
            <Link href="/shop" className="mt-4 inline-block">
              <Button size="sm">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                Explore Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {customerOrders.slice(0, 3).map((ord) => {
              const hasValidId = Boolean(ord.id?.trim());
              const firstItem = ord.items[0];
              const resolvedGarment = firstItem
                ? MOCK_GARMENTS.find((g) => g.id === firstItem.garmentId)
                : undefined;
              const productSummary =
                ord.items.length > 0
                  ? ord.items.length === 1
                    ? firstItem.name
                    : `${firstItem.name} (+${ord.items.length - 1} more)`
                  : "Order items unavailable";

              return (
                <div
                  key={ord.id || `order-${ord.createdAt}`}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:border-[#6633EE]/40 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    {resolvedGarment?.image ? (
                      <Image
                        src={resolvedGarment.image}
                        alt={resolvedGarment.name}
                        width={48}
                        height={56}
                        className="h-14 w-12 shrink-0 rounded-xl border border-slate-200 object-cover object-top bg-white"
                      />
                    ) : (
                      <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-violet-50 text-[#6633EE]">
                        <Package className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold tracking-wide text-[#4C1D95]">
                          {ord.id || "Unknown ID"}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600">
                          {ord.createdAt}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-950 break-words">
                        {productSummary}
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        ₹{ord.totalInr.toLocaleString("en-IN")} ·{" "}
                        {ord.shippingCity}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {ord.isCustomFit && (
                      <Badge variant="default" size="sm">
                        CUSTOMFIT
                      </Badge>
                    )}
                    <Badge variant={getOrderStageVariant(ord.stage)}>
                      {ord.stage}
                    </Badge>
                    {hasValidId ? (
                      <Link href={`/orders/${ord.id}`}>
                        <Button variant="outline" size="sm">
                          Order Details
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        Details unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Module E (Wishlist Summary) & Module F (Virtual Wardrobe & Saved Looks) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Module E: Wishlist Summary */}
        <section
          aria-labelledby="wishlist-summary-heading"
          className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs lg:col-span-6"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <h2
                  id="wishlist-summary-heading"
                  className="flex items-center gap-2 text-base font-bold text-slate-950"
                >
                  <Heart className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                  Wishlist Summary
                </h2>
                <Badge variant="secondary" size="sm">
                  {wishlistItems.length} saved
                </Badge>
              </div>
              <Link
                href="/wishlist"
                className="text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Open Wishlist →
              </Link>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
                <Heart className="mx-auto h-7 w-7 text-violet-300" aria-hidden="true" />
                <p className="mt-2.5 text-sm font-bold text-slate-950">
                  Your wishlist is empty
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Save garments you love from the Shop to compare fit scores and
                  move them to your cart later.
                </p>
                <Link href="/shop" className="mt-4 inline-block">
                  <Button size="sm" variant="outline">
                    Explore Shop
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.slice(0, 3).map((garment) => (
                  <Link
                    key={garment.id}
                    href={`/shop/${garment.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:border-[#6633EE]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {garment.image ? (
                        <Image
                          src={garment.image}
                          alt={garment.name}
                          width={48}
                          height={56}
                          className="h-14 w-12 shrink-0 rounded-xl border border-slate-200 object-cover object-top bg-white"
                        />
                      ) : (
                        <div
                          className="h-14 w-12 shrink-0 rounded-xl border border-slate-200"
                          style={{ backgroundColor: garment.swatchHex }}
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {garment.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {garment.category} · {garment.fitType} Fit
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-slate-950">
                      ₹{garment.priceInr.toLocaleString("en-IN")}
                    </span>
                  </Link>
                ))}
                {invalidWishlistRefs > 0 && (
                  <p className="text-[11px] text-slate-500">
                    {invalidWishlistRefs} unavailable catalog item(s) omitted.
                  </p>
                )}
              </div>
            )}
          </div>

          {wishlistItems.length > 0 && (
            <Link href="/wishlist" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View All Wishlist Items ({wishlistItems.length})
              </Button>
            </Link>
          )}
        </section>

        {/* Module F: Virtual Wardrobe & Saved Looks */}
        <section
          aria-labelledby="saved-looks-heading"
          className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs lg:col-span-6"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <h2
                  id="saved-looks-heading"
                  className="flex items-center gap-2 text-base font-bold text-slate-950"
                >
                  <Bookmark className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
                  Virtual Wardrobe &amp; Saved Looks
                </h2>
                <Badge variant="secondary" size="sm">
                  {savedLooks.length} looks
                </Badge>
              </div>
              <Link
                href="/saved-looks"
                className="text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Open Gallery →
              </Link>
            </div>

            {recentLooks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-6 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-violet-300" aria-hidden="true" />
                <p className="mt-2.5 text-sm font-bold text-slate-950">
                  No saved looks yet
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Combine tops, trousers, and outerwear in Style Studio to build
                  reusable outfits in your Virtual Wardrobe.
                </p>
                <Link href="/studio" className="mt-4 inline-block">
                  <Button size="sm" variant="outline">
                    Open Style Studio
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLooks.map((look) => {
                  const lookGarments = MOCK_GARMENTS.filter((g) =>
                    look.garmentIds.includes(g.id)
                  );
                  return (
                    <div
                      key={look.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-950 break-words">
                          {look.title || "Untitled Saved Look"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" size="sm">
                            {look.source}
                          </Badge>
                          <span className="text-[11px] text-slate-500">
                            {look.createdAt}
                          </span>
                        </div>
                      </div>

                      {lookGarments.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          {lookGarments.map((g) =>
                            g.image ? (
                              <Link
                                key={g.id}
                                href={`/shop/${g.id}`}
                                title={g.name}
                                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                              >
                                <Image
                                  src={g.image}
                                  alt={g.name}
                                  width={44}
                                  height={52}
                                  className="h-13 w-11 object-cover object-top transition-transform group-hover:scale-105"
                                />
                              </Link>
                            ) : (
                              <div
                                key={g.id}
                                title={g.name}
                                className="h-13 w-11 rounded-lg border border-slate-200"
                                style={{ backgroundColor: g.swatchHex }}
                              />
                            )
                          )}
                          <span className="text-xs text-slate-600 break-words">
                            {lookGarments.map((g) => g.name).join(" + ")}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">
                          Referenced garments unavailable in current catalog.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link href="/studio" className="flex-1 min-w-[140px]">
              <Button variant="outline" size="sm" className="w-full">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Open Style Studio
              </Button>
            </Link>
            <Link href="/saved-looks" className="flex-1 min-w-[140px]">
              <Button variant="secondary" size="sm" className="w-full">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                All Saved Looks ({savedLooks.length})
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
