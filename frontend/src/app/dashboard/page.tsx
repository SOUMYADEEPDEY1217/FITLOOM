"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Lock } from "lucide-react";
import { BodyProfileSchema } from "@/lib/mock-data";
import { MEASUREMENT_FIELDS } from "@/lib/body-profile-utils";
import { summarizeDashboardFitStatus } from "@/lib/fit-intelligence-utils";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import {
  DashboardHero,
  DashboardQuickActions,
  FitProfileSummary,
} from "@/components/dashboard/DashboardTopBands";
import {
  AccountOverviewSection,
  ContinueExperienceSection,
  DashboardActivityOverview,
  GarmentCollectionCard,
  ModelAvatarSpace,
  RecentOrderCard,
  SavedLooksPreview,
  StyleInspiration,
} from "@/components/dashboard/DashboardCollectionsAndAvatar";

export default function CustomerDashboardPage() {
  const {
    user,
    bodyProfile,
    hasBodyProfile,
    measurementHistory,
    savedLooks,
    orders,
    wishlistIds,
    compareIds,
    cartCount,
    eligibleCustomerGarments,
  } = useFitloom();

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || user.role === "guest") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-dashboard-animate]", {
        y: 8,
        opacity: 0,
        duration: 0.45,
        stagger: 0.035,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [user.role]);

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
          Sign in with a Customer session to access your personal style space,
          Body Profile calibration, wishlist, saved looks, and orders.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-110"
          >
            Sign In
          </Link>
          <Link
            href="/account"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DDD0F6] bg-white px-5 py-2 text-xs font-semibold text-[#1D0B24] hover:border-[#6633EE]"
          >
            Switch Session Role
          </Link>
        </div>
      </div>
    );
  }

  const trimmedName = user.name?.trim() || "";
  const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : "Member";

  const profileValidation = BodyProfileSchema.safeParse(bodyProfile);
  const isBodyProfileComplete = hasBodyProfile && profileValidation.success;

  const availableZonesCount = MEASUREMENT_FIELDS.filter((field) => {
    const val = bodyProfile?.[field.key];
    return typeof val === "number" && Number.isFinite(val) && val > 0;
  }).length;

  const lastUpdatedDate =
    isBodyProfileComplete && measurementHistory.length > 0
      ? measurementHistory[0].date
      : null;

  const fitStatusSummary = summarizeDashboardFitStatus({
    bodyProfile,
    hasBodyProfile: isBodyProfileComplete,
    garments: eligibleCustomerGarments,
  });

  const customerOrders = getCustomerOrders(orders, user);
  const activeOrderCount = customerOrders.filter(
    (ord) =>
      ord.stage !== "Delivered" &&
      ord.stage !== "Cancelled" &&
      ord.stage !== "Rejected by Tailor"
  ).length;
  const recentOrder = customerOrders[0];

  const wishlistItems = eligibleCustomerGarments.filter((garment) =>
    wishlistIds.includes(garment.id)
  );
  const invalidWishlistRefs = Math.max(
    0,
    wishlistIds.length - wishlistItems.length
  );

  // Derive Virtual Wardrobe strictly from saved looks (consistent with /saved-looks)
  const wardrobeIds = new Set<string>();
  for (const look of savedLooks) {
    for (const gid of look.garmentIds) wardrobeIds.add(gid);
  }
  const wardrobePieces = eligibleCustomerGarments.filter((garment) =>
    wardrobeIds.has(garment.id)
  );

  const compareItems = eligibleCustomerGarments.filter((garment) =>
    compareIds.includes(garment.id)
  );

  return (
    <div ref={containerRef} className="w-full space-y-6 text-[#1D0B24]">
      {/* Partner Tailor Context Notice (preserved role behavior) */}
      {user.role === "tailor" && (
        <div
          role="status"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-[#DDD6FE] bg-[#F7F5FF] px-5 py-4 text-xs text-[#1D0B24] sm:flex-row sm:items-center"
        >
          <p className="leading-relaxed">
            You are viewing the Customer Dashboard while signed in as{" "}
            <strong>Partner Tailor</strong>. Orders shown below reflect personal
            purchases only.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/tailor"
              className="inline-flex min-h-8 items-center justify-center rounded-xl bg-[#6633EE] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#4C1D95]"
            >
              Tailor Workspace
            </Link>
            <Link
              href="/account"
              className="inline-flex min-h-8 items-center justify-center rounded-xl border border-[#DDD0F6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D0B24] hover:border-[#6633EE]"
            >
              Switch Role
            </Link>
          </div>
        </div>
      )}

      {/* Editorial Welcome Hero */}
      <DashboardHero
        firstName={firstName}
        isBodyProfileComplete={isBodyProfileComplete}
      />

      {/* Fit Profile + Quick Actions */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <FitProfileSummary
            bodyProfile={bodyProfile}
            hasBodyProfile={hasBodyProfile}
            isBodyProfileComplete={isBodyProfileComplete}
            availableZonesCount={availableZonesCount}
            requiredZonesCount={MEASUREMENT_FIELDS.length}
            lastUpdatedDate={lastUpdatedDate}
          />
        </div>
        <div className="xl:col-span-5">
          <DashboardQuickActions />
        </div>
      </div>

      {/* Activity Overview + Recent Order */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <DashboardActivityOverview
            activeOrderCount={activeOrderCount}
            wishlistCount={wishlistItems.length}
            savedLooksCount={savedLooks.length}
          />
        </div>
        <div className="xl:col-span-5">
          <RecentOrderCard
            recentOrder={recentOrder}
            catalogGarments={eligibleCustomerGarments}
          />
        </div>
      </div>

      {/* Model Avatar Space */}
      <ModelAvatarSpace
        bodyProfile={bodyProfile}
        isBodyProfileComplete={isBodyProfileComplete}
        availableZonesCount={availableZonesCount}
        requiredZonesCount={MEASUREMENT_FIELDS.length}
        fitStatusSummary={fitStatusSummary}
        compareCount={compareItems.length}
        cartCount={cartCount}
      />

      {/* Continue Your Experience */}
      <ContinueExperienceSection
        savedLooks={savedLooks}
        compareItems={compareItems}
        cartCount={cartCount}
      />

      {/* Virtual Wardrobe + Wishlist + Saved Looks */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GarmentCollectionCard
          sectionId="08"
          headingId="virtual-wardrobe-heading"
          title="Virtual Wardrobe"
          href="/saved-looks"
          ctaLabel="View Wardrobe"
          emptyTitle="Your Virtual Wardrobe is empty"
          emptyCopy="Garments from your saved outfits build your rotation."
          emptyIcon="shirt"
          garments={wardrobePieces}
        />
        <GarmentCollectionCard
          sectionId="09"
          headingId="wishlist-heading"
          title="Wishlist"
          href="/wishlist"
          ctaLabel="View Wishlist"
          emptyTitle="Your wishlist is empty"
          emptyCopy="Save garments in Marketplace to revisit fit notes anytime."
          emptyIcon="heart"
          garments={wishlistItems}
          omittedCount={invalidWishlistRefs}
        />
        <SavedLooksPreview
          savedLooks={savedLooks}
          catalogGarments={eligibleCustomerGarments}
        />
      </div>

      {/* Style Inspiration */}
      <StyleInspiration />

      {/* Account Overview */}
      <AccountOverviewSection user={user} />
    </div>
  );
}
