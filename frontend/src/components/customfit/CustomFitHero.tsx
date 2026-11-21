"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Palette,
  Ruler,
  Scissors,
} from "lucide-react";
import type { MockGarment } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CUSTOMFIT_SERIF =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

interface CustomFitHeroProps {
  selectedGarment: MockGarment | null;
  activeView: "configure" | "status";
  onChangeView: (view: "configure" | "status") => void;
  totalTrackedCount: number;
}

export function CustomFitHero({
  selectedGarment,
  activeView,
  onChangeView,
  totalTrackedCount,
}: CustomFitHeroProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const previewSrc =
    !heroImgFailed && selectedGarment?.image
      ? selectedGarment.image
      : "/assets/hero-editorial.jpg";

  return (
    <section
      aria-labelledby="customfit-hero-heading"
      className="overflow-hidden rounded-3xl border border-[#EAE2F8] bg-gradient-to-br from-white via-[#F7F5FF] to-[#EDE9FE]/85 shadow-[0_8px_28px_rgba(102,51,238,0.05)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-between px-6 py-7 sm:px-8 sm:py-9 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-0.5 w-6 bg-[#6633EE]" aria-hidden="true" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6633EE]">
                  CUSTOMFIT Studio
                </span>
              </div>

              {totalTrackedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeView(
                      activeView === "configure" ? "status" : "configure"
                    )
                  }
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                    activeView === "status"
                      ? "border-[#6633EE] bg-[#6633EE] text-white"
                      : "border-[#DDD6FE] bg-white text-[#4C1D95] hover:border-[#6633EE] hover:bg-[#FAF8FE]"
                  )}
                >
                  {activeView === "status" ? (
                    <>
                      <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                      Back to Configurator
                    </>
                  ) : (
                    <>
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                      Requests &amp; Tracking ({totalTrackedCount})
                    </>
                  )}
                </button>
              )}
            </div>

            <h1
              id="customfit-hero-heading"
              className={cn(
                CUSTOMFIT_SERIF,
                "mt-4 text-3xl font-normal tracking-[-0.02em] text-[#1D0B24] sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]"
              )}
            >
              Made for You. Tailored to You.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#4B5563] sm:text-[15px]">
              Create garments that reflect your style, your measurements, and
              the fit you prefer.
            </p>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#6B7280]">
              Choose a silhouette, refine all seven anatomical proportions, and
              submit your tailoring brief for workshop review and quote approval
              before purchase.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={
                selectedGarment
                  ? `/fit-check?product=${encodeURIComponent(selectedGarment.id)}`
                  : "/fit-check"
              }
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(126,45,242,0.24)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              Fit Intelligence
            </Link>

            <Link
              href="/shop"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#DDD0F6] bg-white px-4 py-2 text-xs font-semibold text-[#1D0B24] transition-colors hover:border-[#6633EE] hover:bg-[#FAF8FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Shop
            </Link>
          </div>
        </div>

        {/* Editorial Visual Pane */}
        <div className="relative min-h-[220px] border-t border-[#EAE2F8] bg-[#F4EEFE] sm:min-h-[260px] lg:col-span-5 lg:min-h-full lg:border-t-0 lg:border-l">
          <Image
            src={previewSrc}
            alt={
              selectedGarment
                ? `${selectedGarment.name} — FITLOOM atelier garment preview`
                : "FITLOOM bespoke garment tailoring showcase"
            }
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            onError={() => setHeroImgFailed(true)}
            className="object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1D0B24]/75 via-[#1D0B24]/30 to-transparent px-5 pt-10 pb-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EDE9FE]">
              {selectedGarment ? "Selected Canvas" : "Editorial Atelier"}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">
              {selectedGarment
                ? `${selectedGarment.name} · ${selectedGarment.fabric}`
                : "Tailored garments shaped to your measurements"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface CustomFitInvalidProductViewProps {
  invalidProductId: string;
  garments: readonly MockGarment[];
  onSelectGarment: (id: string) => void;
}

export function CustomFitInvalidProductView({
  invalidProductId,
  garments,
  onSelectGarment,
}: CustomFitInvalidProductViewProps) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div
        role="alert"
        className="rounded-3xl border border-dashed border-amber-300 bg-white p-6 text-center shadow-xs sm:p-10"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <Badge variant="amber" className="mt-4">
          Product Not Found
        </Badge>
        <h1
          className={cn(
            CUSTOMFIT_SERIF,
            "mt-3 text-2xl font-normal text-[#1D0B24]"
          )}
        >
          Garment Unavailable for CUSTOMFIT
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
          No garment matching{" "}
          <code className="rounded bg-[#F7F5FF] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#4C1D95]">
            {invalidProductId}
          </code>{" "}
          was found in the eligible FITLOOM catalogue. Choose a garment below or
          return to the Shop.
        </p>

        {garments.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {garments.slice(0, 4).map((g) => (
              <Button
                key={g.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelectGarment(g.id)}
              >
                <Palette className="h-3.5 w-3.5 text-[#6633EE]" aria-hidden="true" />
                {g.name}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-[#EAE2F8] pt-5">
          <Link
            href="/shop"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 text-xs font-semibold text-white hover:brightness-110"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Browse Shop Catalogue
          </Link>
          <Link
            href="/body-profile"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DDD6FE] bg-white px-5 text-xs font-semibold text-[#1D0B24] hover:border-[#6633EE] hover:bg-[#FAF8FE]"
          >
            Manage Body Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
