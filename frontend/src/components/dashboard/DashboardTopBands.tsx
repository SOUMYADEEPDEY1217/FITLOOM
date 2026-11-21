"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Ruler,
  ScanLine,
  Scissors,
  Shirt,
  ShoppingBag,
} from "lucide-react";
import {
  BodyProfile,
  FitPreference,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import { LengthFieldKey } from "@/lib/body-profile-utils";
import { Badge } from "@/components/ui/badge";
import { EditorialAvatarFigure } from "@/components/dashboard/EditorialAvatarFigure";

const SERIF_FONT =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

/* ── Section 03 — Editorial Asymmetric Hero ───────────────────────── */

export function DashboardHero({
  firstName,
  isBodyProfileComplete,
}: {
  firstName: string;
  isBodyProfileComplete: boolean;
}) {
  return (
    <section
      data-dashboard-section="03"
      data-dashboard-animate=""
      aria-labelledby="dashboard-welcome-heading"
      className="relative overflow-hidden rounded-3xl border border-[#EAE2F8] bg-gradient-to-br from-white via-[#F7F5FF] to-[#EDE9FE]/90 shadow-[0_8px_28px_rgba(102,51,238,0.06)]"
    >
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:col-span-5 lg:py-12">
          <div className="flex items-center gap-3">
            <span className="h-0.5 w-7 bg-[#6633EE]" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6633EE]">
              YOUR PERSONAL STYLE SPACE · {firstName.toUpperCase()}
            </p>
          </div>

          <h1
            id="dashboard-welcome-heading"
            className={`mt-4 ${SERIF_FONT} text-[2.35rem] leading-[1.06] font-normal tracking-[-0.02em] text-[#1D0B24] sm:text-[3.05rem] xl:text-[3.45rem]`}
          >
            Style begins
            <br />
            with <span className="italic text-[#6633EE]">you.</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4B5563] sm:text-[15px]">
            Your body, your preferences, your wardrobe. A more personal way to
            discover the right fit.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/fit-check"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2.5 text-xs font-semibold tracking-wide text-white shadow-[0_8px_20px_rgba(126,45,242,0.28)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2 sm:text-sm"
            >
              <span>Explore Your Fit</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href="/body-profile"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#DDD0F6] bg-white px-5 py-2.5 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:bg-[#F7F5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2 sm:text-sm"
            >
              Edit Body Profile
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-1 items-stretch border-t border-[#EAE2F8] bg-gradient-to-br from-[#F4EEFE]/70 via-[#EDE9FE]/80 to-[#E5DDFD]/85 sm:grid-cols-12 lg:col-span-7 lg:border-l lg:border-t-0">
          <div className="relative min-h-[220px] overflow-hidden sm:col-span-7 sm:min-h-[280px] lg:min-h-full">
            <Image
              src="/assets/hero-editorial.jpg"
              alt="FITLOOM editorial models showcasing tailored outerwear proportions"
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 58vw, 35vw"
              className="object-cover object-[42%_12%] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_20%,black_84%,transparent_100%)]"
            />
          </div>

          <div className="flex flex-col justify-center gap-3.5 px-6 py-7 sm:col-span-5 sm:px-5 sm:py-8 lg:pr-7">
            <span className="h-0.5 w-6 bg-[#6633EE]" aria-hidden="true" />
            <div>
              <h2
                className={`${SERIF_FONT} text-xl leading-snug font-semibold text-[#1D0B24]`}
              >
                Model Avatar
                <br />
                Space
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
                {isBodyProfileComplete
                  ? "View your illustrative 2D silhouette calibrated to your saved measurements."
                  : "Calibrate your 7 body zones to generate your illustrative 2D proportion reference."}
              </p>
            </div>
            <div>
              <Link
                href="/body-profile#saved-profile-heading"
                aria-label="Open Model Avatar Space on Body Profile"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_6px_18px_rgba(126,45,242,0.3)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
              >
                <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Section 04 — Your Fit Profile ────────────────────────────────── */

function formatFitPreference(pref: FitPreference): string {
  return `${pref.charAt(0).toUpperCase()}${pref.slice(1)}`;
}

export function FitProfileSummary({
  bodyProfile,
  hasBodyProfile,
  isBodyProfileComplete,
  availableZonesCount,
  requiredZonesCount,
  lastUpdatedDate,
}: {
  bodyProfile: BodyProfile;
  hasBodyProfile: boolean;
  isBodyProfileComplete: boolean;
  availableZonesCount: number;
  requiredZonesCount: number;
  lastUpdatedDate: string | null;
}) {
  const metricsCm: Partial<Record<LengthFieldKey, number>> = {
    heightCm: bodyProfile.heightCm,
    chestCm: bodyProfile.chestCm,
    waistCm: bodyProfile.waistCm,
    hipCm: bodyProfile.hipCm,
    shoulderCm: bodyProfile.shoulderCm,
    sleeveCm: bodyProfile.sleeveCm,
    inseamCm: bodyProfile.inseamCm,
  };

  return (
    <section
      data-dashboard-section="04"
      data-dashboard-animate=""
      aria-labelledby="fit-profile-heading"
      className="flex flex-col gap-5 rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:flex-row sm:items-center sm:p-6"
    >
      <div className="mx-auto h-44 w-32 shrink-0 overflow-hidden rounded-xl border border-[#EAE2F8] sm:mx-0 sm:h-48 sm:w-36">
        <EditorialAvatarFigure
          metricsCm={metricsCm}
          isCalibrated={isBodyProfileComplete}
          variant="compact"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="fit-profile-heading"
            className={`${SERIF_FONT} text-xl font-semibold text-[#1D0B24] sm:text-2xl`}
          >
            Your Fit Profile
          </h2>
          {!hasBodyProfile ? (
            <Badge variant="neutral" size="sm">
              No Profile
            </Badge>
          ) : isBodyProfileComplete ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Complete
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              Incomplete
            </Badge>
          )}
        </div>

        <div className="my-4 grid grid-cols-1 gap-4 border-y border-[#EAE2F8]/80 py-3.5 sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F5FF] text-[#6633EE]">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#4B5563]">
                Measurements
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#1D0B24]">
                {isBodyProfileComplete ? availableZonesCount : 0} of{" "}
                {requiredZonesCount}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F5FF] text-[#6633EE]">
              <Shirt className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#4B5563]">
                Fit Preference
              </p>
              <p
                className="mt-0.5 text-sm font-bold text-[#1D0B24]"
                title={
                  isBodyProfileComplete
                    ? `${formatFitPreference(bodyProfile.fitPreference)} (+${getFitPreferenceEaseCm(
                        bodyProfile.fitPreference
                      )} cm ease)`
                    : undefined
                }
              >
                {isBodyProfileComplete
                  ? formatFitPreference(bodyProfile.fitPreference)
                  : "Not set"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7F5FF] text-[#6633EE]">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#4B5563]">
                Last Updated
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#1D0B24]">
                {lastUpdatedDate ?? "Not recorded"}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/body-profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6633EE] transition-colors hover:text-[#4C1D95] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
        >
          <span>
            {isBodyProfileComplete
              ? "View & Edit Profile"
              : "Complete Body Profile"}
          </span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ── Section 05 — Quick Actions ───────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: "Virtual Try-On", href: "/try-on", icon: Shirt },
  { label: "Fit Check", href: "/fit-check", icon: ScanLine },
  { label: "CUSTOMFIT", href: "/customfit", icon: Scissors },
  { label: "Explore Marketplace", href: "/shop", icon: ShoppingBag },
] as const;

export function DashboardQuickActions() {
  return (
    <section
      data-dashboard-section="05"
      data-dashboard-animate=""
      aria-labelledby="quick-actions-heading"
      className="flex h-full flex-col justify-between rounded-2xl border border-[#EAE2F8] bg-white p-5 shadow-[0_2px_12px_rgba(102,51,238,0.04)] sm:p-6"
    >
      <h2
        id="quick-actions-heading"
        className={`${SERIF_FONT} text-xl font-semibold text-[#1D0B24] sm:text-2xl`}
      >
        Quick Actions
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-[#EAE2F8] bg-[#FAF8FE] px-2.5 py-4 text-center transition-all hover:border-[#6633EE] hover:bg-[#F4EEFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#6633EE] shadow-2xs transition-colors group-hover:bg-[#6633EE] group-hover:text-white">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-[11px] leading-snug font-semibold text-[#1D0B24]">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
