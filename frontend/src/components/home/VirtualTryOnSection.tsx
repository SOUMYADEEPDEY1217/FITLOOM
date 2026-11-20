"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, Layers } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { MOCK_GARMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COMPATIBLE_GARMENT_IDS = [
  "structured-atelier-bomber",
  "sky-oxford-shirt",
  "classic-navy-shirt",
];

const VTON_STEPS = [
  "Select a Try-On compatible garment from the collection.",
  "Preview it against your digital silhouette or a local uploaded photo.",
  "Pair looks in Style Studio or save favorites before checkout.",
];

export function VirtualTryOnSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";
  const eligibleGarments = MOCK_GARMENTS.filter((g) =>
    COMPATIBLE_GARMENT_IDS.includes(g.id),
  );
  const [activeId, setActiveId] = useState(
    eligibleGarments[0]?.id ?? MOCK_GARMENTS[0].id,
  );
  const activeGarment =
    eligibleGarments.find((g) => g.id === activeId) ?? eligibleGarments[0];

  return (
    <section
      id="style-studio"
      aria-labelledby="virtual-try-on-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div
        className="overflow-hidden rounded-3xl border border-violet-900/20 p-6 text-white shadow-lg ring-1 ring-violet-950/15 sm:p-10"
        style={{
          background:
            "linear-gradient(135deg, #1E1B4B 0%, #312E81 48%, #4C1D95 100%)",
        }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Explanatory Flow */}
          <div className="space-y-5 lg:col-span-6">
            <span className="inline-flex items-center rounded-full border border-amber-300/45 bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
              Visual Simulation · Mock Preview
            </span>

            <h2
              id="virtual-try-on-heading"
              className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
            >
              Preview styling combinations before checkout.
            </h2>

            <p className="fitloom-prose-pretty max-w-[60ch] text-sm leading-relaxed text-violet-100 sm:text-base">
              Explore silhouette pairing and color contrast on eligible pieces.
              Virtual Try-On is strictly visual—dimensional fit is verified
              separately by Fit Intelligence.
            </p>

            {/* Concise 3-step visual workflow */}
            <ol className="space-y-2.5 border-t border-white/15 pt-4">
              {VTON_STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-start gap-3 text-sm leading-snug text-violet-50"
                >
                  <span className="mt-0.5 w-5 shrink-0 font-mono text-xs font-bold text-violet-200">
                    0{i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={isGuest ? "/login?next=%2Ftry-on" : "/try-on"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-[#1E1B4B] shadow-sm transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1B4B]"
              >
                Open Simulated Try-On
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={isGuest ? "/login?next=%2Fstudio" : "/studio"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/35 bg-transparent px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1B4B]"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                Explore Style Studio
              </Link>
              <Link
                href={isGuest ? "/login?next=%2Fsaved-looks" : "/saved-looks"}
                className="inline-flex min-h-10 items-center px-2 text-sm font-semibold text-violet-100 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-md"
              >
                View Saved Looks →
              </Link>
            </div>
          </div>

          {/* Right Large InteractiveGarment & Simulation Preview Panel */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-100">
                  Eligible Garment Look Switcher
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-100">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Sample Simulation Preview
                </span>
              </div>

              {/* Dual Avatar + Selected Garment visual composition using existing assets */}
              <div className="grid gap-3.5 sm:grid-cols-12">
                <div className="relative overflow-hidden rounded-xl bg-white shadow-sm sm:col-span-7">
                  <div className="relative aspect-square w-full overflow-hidden border-b border-slate-200/80 bg-[#FAF7FF]/50">
                    <Image
                      src={
                        activeGarment?.image ??
                        "/assets/products/structured-atelier-bomber.jpg"
                      }
                      alt={`${activeGarment?.name} visual preview garment for FITLOOM Try-On`}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="bg-white px-3.5 py-3 text-slate-900">
                    <p className="text-sm font-bold text-slate-950">
                      {activeGarment?.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {activeGarment?.fabric} · Try-On Eligible
                    </p>
                  </div>
                </div>

                {/* Compatible selector thumbnails */}
                <div className="flex flex-col justify-between gap-2.5 sm:col-span-5">
                  <div className="space-y-2">
                    {eligibleGarments.map((g) => {
                      const active = g.id === activeGarment?.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setActiveId(g.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                            active
                              ? "border-white bg-white/20 text-white ring-1 ring-white/40"
                              : "border-white/20 bg-white/5 text-violet-100 hover:border-white/40 hover:bg-white/15",
                          )}
                        >
                          <Image
                            src={
                              g.image ?? "/assets/products/sky-oxford-shirt.png"
                            }
                            alt=""
                            width={44}
                            height={44}
                            className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">
                              {g.name}
                            </p>
                            <p className="text-xs text-violet-200">
                              {g.category}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-amber-300/35 bg-amber-500/15 p-3 text-xs leading-relaxed text-amber-50">
                    Simulation notice: Preview approximates visual styling only
                    and never guarantees physical fit or fabric appearance.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
