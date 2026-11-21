"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Heart,
  Layers,
  Package,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserCog,
} from "lucide-react";
import { BodyProfile, MockGarment } from "@/lib/mock-data";
import {
  LengthFieldKey,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  formatLengthFromCm,
} from "@/lib/body-profile-utils";
import { DashboardFitSummary } from "@/lib/fit-intelligence-utils";
import {
  MockOrder,
  MockSavedLook,
  MockUser,
  OrderStage,
} from "@/components/providers/fitloom-provider";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { EditorialAvatarFigure } from "@/components/dashboard/EditorialAvatarFigure";
import { cn } from "@/lib/utils";

const SERIF_FONT =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

/* ── Section 06 — Activity Overview ───────────────────────────────── */

export function DashboardActivityOverview({
  activeOrderCount,
  wishlistCount,
  savedLooksCount,
}: {
  activeOrderCount: number;
  wishlistCount: number;
  savedLooksCount: number;
}) {
  const items = [
    {
      label: "Active Orders",
      count: activeOrderCount,
      cta: "View Orders",
      href: "/orders",
      icon: Package,
    },
    {
      label: "Wishlist",
      count: wishlistCount,
      cta: "View Wishlist",
      href: "/wishlist",
      icon: Heart,
    },
    {
      label: "Saved Looks",
      count: savedLooksCount,
      cta: "View Looks",
      href: "/saved-looks",
      icon: Layers,
    },
  ] as const;

  return (
    <section
      data-dashboard-section="06"
      data-dashboard-animate=""
      aria-label="Customer Activity Overview"
      className="h-full rounded-2xl border border-[#EAE2F8] bg-white px-5 py-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:px-6"
    >
      <div className="grid grid-cols-1 divide-y divide-[#EAE2F8] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={
                idx === 0
                  ? "pb-4 sm:pb-0 sm:pr-5"
                  : idx === 1
                  ? "py-4 sm:px-5 sm:py-0"
                  : "pt-4 sm:pl-5 sm:pt-0"
              }
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F7F5FF] text-[#6633EE]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#4B5563]">
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 ${SERIF_FONT} text-3xl leading-none font-normal text-[#1D0B24]`}
                  >
                    {item.count}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:text-[#4C1D95] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Section 07 — Recent Order ────────────────────────────────────── */

function getStageBadgeVariant(stage: OrderStage): BadgeVariant {
  if (stage === "Delivered") return "success";
  if (stage === "Cancelled" || stage === "Rejected by Tailor") {
    return "destructive";
  }
  if (stage === "Return Requested" || stage === "Pending Tailor Acceptance") {
    return "warning";
  }
  return "default";
}

export function RecentOrderCard({
  recentOrder,
  catalogGarments,
}: {
  recentOrder?: MockOrder;
  catalogGarments: readonly MockGarment[];
}) {
  const firstItem = recentOrder?.items[0];
  const resolvedGarment = firstItem
    ? catalogGarments.find((g) => g.id === firstItem.garmentId)
    : undefined;
  const itemSummary =
    recentOrder && recentOrder.items.length > 0
      ? recentOrder.items.length === 1
        ? firstItem?.name
        : `${firstItem?.name} + ${recentOrder.items.length - 1} more`
      : "Order items";

  return (
    <section
      data-dashboard-section="07"
      data-dashboard-animate=""
      aria-labelledby="recent-order-heading"
      className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="recent-order-heading"
          className={`${SERIF_FONT} text-lg font-semibold text-[#1D0B24]`}
        >
          Recent Order
        </h2>
        {recentOrder && (
          <Link
            href="/orders"
            className="text-xs font-semibold text-[#6633EE] hover:underline"
          >
            All Orders
          </Link>
        )}
      </div>

      {!recentOrder ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#6633EE]">
              <Package className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#1D0B24]">
                No orders yet
              </p>
              <p className="text-[11px] text-[#4B5563]">
                Orders placed in your session appear here.
              </p>
            </div>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 rounded-lg bg-[#6633EE] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4C1D95]"
          >
            <span>Shop Now</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE2F8] bg-[#FAF8FE]/70 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {resolvedGarment?.image ? (
              <Image
                src={resolvedGarment.image}
                alt={resolvedGarment.name}
                width={44}
                height={54}
                className="h-13 w-11 shrink-0 rounded-lg border border-[#EAE2F8] bg-white object-cover object-top"
              />
            ) : (
              <div className="flex h-13 w-11 shrink-0 items-center justify-center rounded-lg border border-[#EAE2F8] bg-white text-[#6633EE]">
                <Package className="h-4 w-4" aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1D0B24]">
                {itemSummary}
              </p>
              <p className="mt-0.5 text-xs text-[#4B5563]">
                Order #{recentOrder.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant={getStageBadgeVariant(recentOrder.stage)} size="sm">
              {recentOrder.stage}
            </Badge>
            <Link
              href={`/orders/${encodeURIComponent(recentOrder.id)}`}
              aria-label={`View order ${recentOrder.id}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DDD0F6] bg-white text-[#6633EE] transition-colors hover:border-[#6633EE] hover:bg-[#6633EE] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Shared Collection Card (Sections 08 Wardrobe & 09 Wishlist) ──── */

export function GarmentCollectionCard({
  sectionId,
  headingId,
  title,
  href,
  ctaLabel,
  emptyTitle,
  emptyCopy,
  emptyIcon,
  garments,
  omittedCount = 0,
}: {
  sectionId: string;
  headingId: string;
  title: string;
  href: string;
  ctaLabel: string;
  emptyTitle: string;
  emptyCopy: string;
  emptyIcon: "shirt" | "heart";
  garments: readonly MockGarment[];
  omittedCount?: number;
}) {
  const EmptyIcon = emptyIcon === "shirt" ? Shirt : Heart;

  return (
    <section
      data-dashboard-section={sectionId}
      data-dashboard-animate=""
      aria-labelledby={headingId}
      className="flex flex-col justify-between rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2
            id={headingId}
            className={`${SERIF_FONT} text-lg font-semibold text-[#1D0B24]`}
          >
            {title}
          </h2>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
          >
            <span>
              {garments.length} {garments.length === 1 ? "Item" : "Items"}
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {garments.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] px-4 py-6 text-center">
            <EmptyIcon
              className="mx-auto h-5 w-5 text-[#6633EE]"
              aria-hidden="true"
            />
            <p className="mt-2 text-xs font-semibold text-[#1D0B24]">
              {emptyTitle}
            </p>
            <p className="mt-1 text-[11px] text-[#4B5563]">{emptyCopy}</p>
            <Link
              href="/shop"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {garments.slice(0, 4).map((garment) => (
                <Link
                  key={garment.id}
                  href={`/shop/${garment.id}`}
                  title={garment.name}
                  className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-[#EAE2F8] bg-[#F7F5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
                >
                  {garment.image ? (
                    <Image
                      src={garment.image}
                      alt={garment.name}
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 22vw, 8vw"
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ backgroundColor: garment.swatchHex }}
                    />
                  )}
                </Link>
              ))}
            </div>
            {omittedCount > 0 && (
              <p className="text-[11px] text-slate-500">
                {omittedCount} unavailable reference(s) hidden.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#EAE2F8]/80 pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4E2858] hover:text-[#6633EE] hover:underline"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ── Section 10 — Saved Looks ─────────────────────────────────────── */

export function SavedLooksPreview({
  savedLooks,
  catalogGarments,
}: {
  savedLooks: readonly MockSavedLook[];
  catalogGarments: readonly MockGarment[];
}) {
  return (
    <section
      data-dashboard-section="10"
      data-dashboard-animate=""
      aria-labelledby="saved-looks-heading"
      className="flex flex-col justify-between rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2
            id="saved-looks-heading"
            className={`${SERIF_FONT} text-lg font-semibold text-[#1D0B24]`}
          >
            Saved Looks
          </h2>
          <Link
            href="/saved-looks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
          >
            <span>
              {savedLooks.length} {savedLooks.length === 1 ? "Look" : "Looks"}
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {savedLooks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] px-4 py-6 text-center">
            <Bookmark
              className="mx-auto h-5 w-5 text-[#6633EE]"
              aria-hidden="true"
            />
            <p className="mt-2 text-xs font-semibold text-[#1D0B24]">
              No saved looks yet
            </p>
            <p className="mt-1 text-[11px] text-[#4B5563]">
              Compose outfits in Style Studio to save curated pairings.
            </p>
            <Link
              href="/studio"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
            >
              <span>Open Style Studio</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {savedLooks.slice(0, 2).map((look) => {
              const lookGarments = catalogGarments.filter((g) =>
                look.garmentIds.includes(g.id)
              );
              return (
                <Link
                  key={look.id}
                  href={`/studio?look=${look.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-[#EAE2F8] bg-[#FAF8FE]/75 p-2.5 transition-colors hover:border-[#6633EE] hover:bg-[#F4EEFE]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
                >
                  <div className="flex shrink-0 -space-x-2">
                    {lookGarments.slice(0, 2).map((g) => (
                      <div
                        key={g.id}
                        className="relative h-14 w-11 overflow-hidden rounded-lg border border-white bg-[#F7F5FF] shadow-2xs"
                      >
                        {g.image ? (
                          <Image
                            src={g.image}
                            alt={g.name}
                            fill
                            sizes="44px"
                            className="object-cover object-top"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ backgroundColor: g.swatchHex }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#1D0B24] group-hover:text-[#6633EE]">
                      {look.title || "Untitled Saved Look"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#4B5563]">
                      {look.source} · {look.createdAt}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#EAE2F8]/80 pt-3">
        <Link
          href="/saved-looks"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4E2858] hover:text-[#6633EE] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ── Dedicated Secondary Space — Model Avatar Space ───────────────── */

export function ModelAvatarSpace({
  bodyProfile,
  isBodyProfileComplete,
  availableZonesCount,
  requiredZonesCount,
  fitStatusSummary,
  compareCount,
  cartCount,
}: {
  bodyProfile: BodyProfile;
  isBodyProfileComplete: boolean;
  availableZonesCount: number;
  requiredZonesCount: number;
  fitStatusSummary: DashboardFitSummary;
  compareCount: number;
  cartCount: number;
}) {
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [activeZone, setActiveZone] = useState<LengthFieldKey>("chestCm");

  const metricsCm: Partial<Record<LengthFieldKey, number>> = {
    heightCm: bodyProfile.heightCm,
    chestCm: bodyProfile.chestCm,
    waistCm: bodyProfile.waistCm,
    hipCm: bodyProfile.hipCm,
    shoulderCm: bodyProfile.shoulderCm,
    sleeveCm: bodyProfile.sleeveCm,
    inseamCm: bodyProfile.inseamCm,
  };

  const activeMeta =
    MEASUREMENT_FIELDS.find((f) => f.key === activeZone) ??
    MEASUREMENT_FIELDS[1];
  const activeCm = isBodyProfileComplete ? metricsCm[activeMeta.key] : undefined;
  const activeDisplay =
    typeof activeCm === "number" && activeCm > 0
      ? `${formatLengthFromCm(activeCm, unit)} ${unit}`
      : "Not calibrated";

  return (
    <section
      id="model-avatar-space"
      data-dashboard-section="model-avatar"
      data-dashboard-animate=""
      aria-labelledby="model-avatar-space-heading"
      className="rounded-3xl border border-[#EAE2F8] bg-gradient-to-br from-white via-[#FAF8FE] to-[#F4EEFE]/80 p-5 shadow-[0_4px_18px_rgba(102,51,238,0.05)] sm:p-7"
    >
      <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-[#EAE2F8] bg-white">
            <EditorialAvatarFigure
              metricsCm={metricsCm}
              isCalibrated={isBodyProfileComplete}
              variant="workspace"
              activeZone={activeZone}
            />

            <div className="border-t border-[#EAE2F8] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6633EE]">
                    Highlighted Zone
                  </span>
                  <p className="text-xs font-bold text-[#1D0B24]">
                    {activeMeta.label}: {activeDisplay}
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Measurement unit toggle"
                  className="inline-flex overflow-hidden rounded-lg border border-[#DDD0F6] bg-[#FAF8FE]"
                >
                  {(["cm", "in"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      aria-pressed={unit === u}
                      className={cn(
                        "cursor-pointer px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
                        unit === u
                          ? "bg-[#6633EE] text-white"
                          : "text-[#4E2858] hover:text-[#6633EE]"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {MEASUREMENT_FIELDS.map((field) => {
                  const selected = activeZone === field.key;
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => setActiveZone(field.key)}
                      aria-pressed={selected}
                      className={cn(
                        "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]",
                        selected
                          ? "border-[#6633EE] bg-[#6633EE] text-white"
                          : "border-[#EAE2F8] bg-[#FAF8FE] text-[#2A1434] hover:border-[#6633EE]"
                      )}
                    >
                      {field.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-7">
          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6633EE]">
                MODEL AVATAR SPACE
              </p>
            </div>
            <h2
              id="model-avatar-space-heading"
              className={`mt-2 ${SERIF_FONT} text-2xl leading-tight font-semibold text-[#1D0B24] sm:text-3xl`}
            >
              Your digital proportion reference.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#4B5563]">
              Maps your Body Profile measurements onto an illustrative 2D
              tailoring silhouette for visual zone review. Rotatable 3D
              SMPL/PARE body-twin generation is scheduled for a future platform
              phase and is not simulated here.
            </p>
          </div>

          <dl className="divide-y divide-[#EAE2F8] rounded-2xl border border-[#EAE2F8] bg-white px-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-[#4B5563]">Profile Calibration</dt>
              <dd className="font-bold text-[#1D0B24]">
                {isBodyProfileComplete
                  ? `Connected (${availableZonesCount} of ${requiredZonesCount} zones)`
                  : "Not calibrated yet"}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-[#4B5563]">Fit Intelligence (Deterministic)</dt>
              <dd className="font-bold text-[#6633EE]">
                {fitStatusSummary.headline} · {fitStatusSummary.sublabel}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="text-[#4B5563]">Avatar Representation</dt>
              <dd className="font-semibold text-[#1D0B24]">
                Illustrative 2D Silhouette (3D Mesh Planned)
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/body-profile"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(126,45,242,0.24)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <span>
                {isBodyProfileComplete
                  ? "Configure Avatar & Profile"
                  : "Create Body Profile"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <Link
              href="/try-on"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DDD0F6] bg-white px-4 py-2 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:text-[#6633EE]"
            >
              Try-On Preview (Demo)
            </Link>

            {compareCount > 0 && (
              <Link
                href="/compare"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#DDD0F6] bg-white px-4 py-2 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:text-[#6633EE]"
              >
                <Layers className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                Compare Queue ({compareCount})
              </Link>
            )}

            {cartCount > 0 && (
              <Link
                href="/cart"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#DDD0F6] bg-white px-4 py-2 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:text-[#6633EE]"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                Bag ({cartCount})
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Section 11 — Style Inspiration ──────────────────────────────── */

const CURATED_EDITORIAL_ITEMS = [
  {
    title: "Atelier Layering",
    subtitle: "Coordinated technical shells & structured proportions",
    image: "/assets/hero-editorial.jpg",
    href: "/shop",
  },
  {
    title: "Crisp Shirting",
    subtitle: "Combed cotton Oxford & breathable weaves",
    image: "/assets/products/sky-oxford-shirt.png",
    href: "/shop?category=Shirts",
  },
  {
    title: "Structured Outerwear",
    subtitle: "Relaxed outer silhouettes over fitted layers",
    image: "/assets/products/structured-atelier-bomber.jpg",
    href: "/shop?category=Outerwear",
  },
  {
    title: "Tailored Trousers",
    subtitle: "Precision waist & inseam calibration via CUSTOMFIT",
    image: "/assets/products/architectural-pleated-trouser.png",
    href: "/shop?category=Trousers",
  },
] as const;

export function StyleInspiration() {
  return (
    <section
      data-dashboard-section="11"
      data-dashboard-animate=""
      aria-labelledby="style-inspiration-heading"
      className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6633EE]">
            EDITORIAL LOOKBOOK · CURATED STATIC DIRECTIONS
          </p>
          <h2
            id="style-inspiration-heading"
            className={`mt-1.5 ${SERIF_FONT} text-xl font-semibold text-[#1D0B24] sm:text-2xl`}
          >
            Style Inspiration
          </h2>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6633EE] hover:underline"
        >
          <span>Browse Full Catalog</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CURATED_EDITORIAL_ITEMS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#EAE2F8] bg-[#F7F5FF]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-2.5 text-sm font-bold text-[#1D0B24] group-hover:text-[#6633EE]">
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-[#4B5563]">{item.subtitle}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Continue Your Experience ─────────────────────────────────────── */

export function ContinueExperienceSection({
  savedLooks,
  compareItems,
  cartCount,
}: {
  savedLooks: readonly MockSavedLook[];
  compareItems: readonly MockGarment[];
  cartCount: number;
}) {
  const tryOnSessions = savedLooks.filter(
    (look) => look.source === "Virtual Try-On (Mock)"
  );

  return (
    <section
      data-dashboard-section="continue-experience"
      data-dashboard-animate=""
      aria-labelledby="continue-experience-heading"
      className="rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6633EE]">
            CONTINUE YOUR EXPERIENCE
          </p>
          <h2
            id="continue-experience-heading"
            className={`mt-1 ${SERIF_FONT} text-xl font-semibold text-[#1D0B24]`}
          >
            Active sessions &amp; tools
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          In-memory session records only
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 divide-y divide-[#EAE2F8] rounded-xl border border-[#EAE2F8] bg-[#FAF8FE]/65 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4E2858]">
            Virtual Try-On (Demo Preview)
          </p>
          {tryOnSessions.length > 0 ? (
            <div className="mt-1.5 space-y-1.5">
              <p className="text-sm font-bold text-[#1D0B24]">
                {tryOnSessions.length} saved preview
                {tryOnSessions.length === 1 ? "" : "s"}
              </p>
              <p className="truncate text-xs text-[#4B5563]">
                Latest: {tryOnSessions[0].title}
              </p>
              <Link
                href="/try-on"
                className="inline-block text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Open Try-On Studio →
              </Link>
            </div>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              <p className="text-sm font-bold text-[#1D0B24]">
                No Try-On previews saved yet
              </p>
              <p className="text-xs text-[#4B5563]">
                Test a garment pairing using local photo or 2D avatar reference.
              </p>
              <Link
                href="/try-on"
                className="inline-block text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Launch Try-On Preview →
              </Link>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4E2858]">
            Comparison &amp; Fit Queue
          </p>
          {compareItems.length > 0 ? (
            <div className="mt-1.5 space-y-1.5">
              <p className="text-sm font-bold text-[#1D0B24]">
                {compareItems.length} garment
                {compareItems.length === 1 ? "" : "s"} queued to compare
              </p>
              <p className="truncate text-xs text-[#4B5563]">
                {compareItems.map((g) => g.name).join(" · ")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/compare"
                  className="text-xs font-semibold text-[#6633EE] hover:underline"
                >
                  Compare specs →
                </Link>
                <Link
                  href={`/fit-check?product=${compareItems[0].id}`}
                  className="text-xs font-semibold text-[#1D0B24] hover:text-[#6633EE] hover:underline"
                >
                  Fit check first item →
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              <p className="text-sm font-bold text-[#1D0B24]">
                Comparison queue empty
              </p>
              <p className="text-xs text-[#4B5563]">
                Queue garments in Marketplace to compare chest and waist ease.
              </p>
              <Link
                href="/fit-check"
                className="inline-block text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Open Fit Intelligence →
              </Link>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4E2858]">
            Shopping Bag &amp; History
          </p>
          <div className="mt-1.5 space-y-1.5">
            <p className="text-sm font-bold text-[#1D0B24]">
              {cartCount > 0
                ? `${cartCount} item${cartCount === 1 ? "" : "s"} ready in your bag`
                : "Shopping bag is empty"}
            </p>
            <p className="text-xs text-[#4B5563]">
              Viewed product history is not persisted across sessions yet.
            </p>
            <Link
              href={cartCount > 0 ? "/cart" : "/shop"}
              className="inline-block text-xs font-semibold text-[#6633EE] hover:underline"
            >
              {cartCount > 0 ? "Review bag →" : "Browse catalog →"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Account Overview ─────────────────────────────────────────────── */

function getUserMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AccountOverviewSection({ user }: { user: MockUser }) {
  const trimmedName = user.name?.trim() || "";
  const hasName = Boolean(trimmedName);
  const hasEmail = Boolean(user.email?.trim());

  return (
    <section
      data-dashboard-section="account-overview"
      data-dashboard-animate=""
      aria-labelledby="account-overview-heading"
      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:flex-row sm:items-center sm:p-6"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7E2DF2] to-[#5B21B6] text-sm font-bold text-white shadow-xs"
        >
          {getUserMonogram(trimmedName || "Member")}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
            ACCOUNT OVERVIEW
          </p>
          <h2
            id="account-overview-heading"
            className="truncate text-base font-bold text-[#1D0B24]"
          >
            {hasName ? trimmedName : "Customer Name Not Set"}
          </h2>
          <p className="truncate text-xs text-[#4B5563]">
            {hasEmail ? user.email : "Email address not recorded"} · Role:{" "}
            <span className="capitalize">{user.role}</span>
            {user.city?.trim() ? ` · ${user.city.trim()}` : ""}
          </p>
        </div>
      </div>

      <Link
        href="/account"
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#DDD0F6] bg-[#FAF8FE] px-4 py-2 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:bg-[#F4EEFE] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
      >
        <UserCog className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
        <span>Account &amp; Security</span>
      </Link>
    </section>
  );
}
