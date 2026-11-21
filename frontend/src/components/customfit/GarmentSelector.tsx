"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Palette, Shirt } from "lucide-react";
import type { MockGarment } from "@/lib/mock-data";
import { evaluateCustomFitEligibility } from "@/lib/customfit-utils";
import { CUSTOMFIT_SERIF } from "@/components/customfit/CustomFitHero";
import { cn } from "@/lib/utils";

interface GarmentSelectorProps {
  garments: readonly MockGarment[];
  selectedGarmentId: string;
  onSelectGarment: (id: string) => void;
  onClearGarment: () => void;
}

export function GarmentSelector({
  garments,
  selectedGarmentId,
  onSelectGarment,
  onClearGarment,
}: GarmentSelectorProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const selectedGarment =
    garments.find((g) => g.id === selectedGarmentId) ?? null;

  return (
    <section
      aria-labelledby="cf-garment-heading"
      className="space-y-5 border-b border-[#EAE2F8] pb-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6633EE]">
            Step 01 · Base Silhouette
          </p>
          <h2
            id="cf-garment-heading"
            className={cn(
              CUSTOMFIT_SERIF,
              "mt-1 text-2xl font-normal text-[#1D0B24] sm:text-[1.75rem]"
            )}
          >
            Choose Your Garment
          </h2>
          <p className="mt-1 text-xs text-[#4B5563] sm:text-sm">
            Start with a piece you would love to make your own.
          </p>
        </div>

        {selectedGarment && (
          <button
            type="button"
            onClick={onClearGarment}
            className="cursor-pointer text-xs font-semibold text-[#6B7280] underline-offset-4 hover:text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded"
          >
            Clear selection
          </button>
        )}
      </div>

      {!selectedGarment && (
        <div
          role="status"
          className="rounded-2xl border border-[#DDD6FE] bg-[#FAF8FE] px-4 py-3 text-xs text-[#4C1D95]"
        >
          No garment selected yet. Pick an eligible piece below to unlock
          category-tailored adjustments and studio pricing preview.
        </div>
      )}

      {garments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDD6FE] bg-[#FAF8FE] p-8 text-center text-xs text-[#4B5563]">
          <Shirt
            className="mx-auto h-7 w-7 text-[#6633EE]/70"
            aria-hidden="true"
          />
          <p className="mt-2 font-semibold text-[#1D0B24]">
            No garments currently available in catalogue.
          </p>
          <p className="mt-1">
            Browse the Marketplace later or review your session status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {garments.map((item) => {
            const isSelected = item.id === selectedGarmentId;
            const eligibility = evaluateCustomFitEligibility(item);
            const showImage =
              Boolean(item.image) && !failedImages[item.id];

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectGarment(item.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  isSelected
                    ? "border-[#6633EE] bg-[#FAF8FE] ring-2 ring-[#6633EE]/20 shadow-sm"
                    : "border-[#EAE2F8] hover:border-[#C4B5FD] hover:shadow-xs"
                )}
              >
                {/* Product Visual */}
                <div className="relative h-44 w-full overflow-hidden bg-[#F7F5FF]">
                  {showImage && item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [item.id]: true,
                        }))
                      }
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        backgroundColor: item.swatchHex || "#EDE9FE",
                      }}
                    >
                      <Palette
                        className="h-7 w-7 text-[#1D0B24]/60"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* Subtle corner pills */}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/92 px-2.5 py-0.5 text-[10px] font-semibold text-[#4C1D95] shadow-2xs backdrop-blur-xs">
                      {item.category}
                    </span>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#6633EE] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#1D0B24] leading-snug">
                        {item.name}
                      </h3>
                      {typeof item.priceInr === "number" && item.priceInr > 0 && (
                        <span className="shrink-0 text-sm font-bold text-[#1D0B24] tabular-nums">
                          ₹{item.priceInr.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-[#6B7280]">
                      {item.fabric}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#F3EEFE] pt-2.5 text-[11px]">
                    <span
                      className={cn(
                        "font-semibold",
                        eligibility.eligible
                          ? "text-emerald-700"
                          : "text-rose-700"
                      )}
                    >
                      {eligibility.eligible
                        ? "CUSTOMFIT Eligible"
                        : "Customization Unavailable"}
                    </span>
                    <span className="text-[#6B7280]">{item.color}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedGarment && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#EAE2F8] bg-[#FAF8FE] px-4 py-2.5 text-xs">
          <span className="text-[#4B5563]">
            Active piece:{" "}
            <strong className="font-semibold text-[#1D0B24]">
              {selectedGarment.name}
            </strong>{" "}
            — {evaluateCustomFitEligibility(selectedGarment).reason}
          </span>
          <Link
            href={`/shop/${encodeURIComponent(selectedGarment.id)}`}
            className="inline-flex items-center gap-1 font-semibold text-[#6633EE] hover:underline"
          >
            View item specs
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
