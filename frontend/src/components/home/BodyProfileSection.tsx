"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ruler } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { cn } from "@/lib/utils";

const FIT_OPTIONS = [
  {
    id: "slim",
    label: "Slim",
    ease: "+4 to +6 cm ease",
    note: "Closer taper through chest, waist & sleeve line.",
  },
  {
    id: "regular",
    label: "Regular",
    ease: "+7 to +9 cm ease",
    note: "Balanced everyday silhouette with natural movement.",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    ease: "+11 to +14 cm ease",
    note: "Looser drape through torso and shoulder line.",
  },
  {
    id: "oversized",
    label: "Oversized",
    ease: "+15 cm+ ease",
    note: "Intentional dropped-shoulder architectural volume.",
  },
] as const;

const PROFILE_POINTS = [
  { name: "Height", sample: "168 cm", required: true },
  { name: "Weight (Optional)", sample: "58 kg", required: false },
  { name: "Chest", sample: "92 cm", required: true },
  { name: "Waist", sample: "70 cm", required: true },
  { name: "Hip", sample: "98 cm", required: true },
  { name: "Shoulder", sample: "40 cm", required: true },
  { name: "Sleeve", sample: "59 cm", required: true },
  { name: "Inseam", sample: "78 cm", required: true },
];

const JOURNEY_STEPS = [
  "Create or update your Body Profile anytime (optional during sign-up).",
  "Enter available garment-tailoring measurements in cm or inches.",
  "Select your personal preference: Slim, Regular, Relaxed, or Oversized.",
  "Reuse automatically across Fit Intelligence, Virtual Try-On & CUSTOMFIT.",
  "Adjust measurements whenever weight, tailoring needs, or style shifts.",
];

export function BodyProfileSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";
  const [selectedFit, setSelectedFit] =
    useState<(typeof FIT_OPTIONS)[number]["id"]>("regular");
  const activeOption =
    FIT_OPTIONS.find((f) => f.id === selectedFit) ?? FIT_OPTIONS[1];

  return (
    <section
      id="body-profile"
      aria-labelledby="body-profile-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="rounded-3xl border border-violet-200/90 bg-white p-6 shadow-xs sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Fashion-Oriented Digital Avatar & Measurement Visualization */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-b from-[#FAF7FF] to-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Ruler
                    className="h-4 w-4 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Digital Avatar &amp; Sample Measurements
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  Visual Guide Only
                </span>
              </div>

              <div className="mt-5 grid items-center gap-5 sm:grid-cols-12">
                {/* Clean fashion-tailoring vector silhouette with zone guides */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-violet-100 bg-white px-3 py-4 shadow-2xs sm:col-span-5">
                  <svg
                    viewBox="0 0 180 290"
                    className="h-60 w-40 text-[#6633EE]"
                    role="img"
                    aria-label="Stylized fashion tailoring avatar showing shoulder, chest, waist, hip, sleeve and inseam guide lines"
                  >
                    <defs>
                      <linearGradient
                        id="avatarBodyGrad"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#EDE9FE" />
                        <stop offset="100%" stopColor="#DDD6FE" />
                      </linearGradient>
                    </defs>
                    {/* Stylised fashion mannequin figure (non-medical illustration) */}
                    <circle
                      cx="90"
                      cy="28"
                      r="15"
                      fill="url(#avatarBodyGrad)"
                      stroke="#6633EE"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M52 64 C52 54, 128 54, 128 64 L138 148 L124 150 L118 88 L113 134 C112 152, 118 168, 116 186 L112 272 L95 272 L90 192 L85 272 L68 272 L64 186 C62 168, 68 152, 67 134 L62 88 L56 150 L42 148 Z"
                      fill="url(#avatarBodyGrad)"
                      stroke="#6633EE"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {/* Measurement Guide Lines */}
                    <line
                      x1="48"
                      y1="64"
                      x2="132"
                      y2="64"
                      stroke="#4C1D95"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="58"
                      y1="92"
                      x2="122"
                      y2="92"
                      stroke="#6633EE"
                      strokeWidth="1.75"
                    />
                    <line
                      x1="65"
                      y1="126"
                      x2="115"
                      y2="126"
                      stroke="#6633EE"
                      strokeWidth="1.75"
                    />
                    <line
                      x1="60"
                      y1="166"
                      x2="120"
                      y2="166"
                      stroke="#6633EE"
                      strokeWidth="1.75"
                    />
                    <line
                      x1="28"
                      y1="68"
                      x2="28"
                      y2="270"
                      stroke="#9CA3AF"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="90"
                      y1="192"
                      x2="90"
                      y2="272"
                      stroke="#4C1D95"
                      strokeWidth="1.3"
                      strokeDasharray="2 3"
                    />
                  </svg>
                  <p className="mt-2.5 text-center text-xs font-medium text-slate-600">
                    Zones: Shoulder · Chest · Waist · Hip
                  </p>
                </div>

                {/* All 8 measurement fields + 4 fit preference pills */}
                <div className="space-y-3 sm:col-span-7">
                  <div className="grid grid-cols-2 gap-2">
                    {PROFILE_POINTS.map((pt) => (
                      <div
                        key={pt.name}
                        className="rounded-lg border border-violet-100/90 bg-white px-3 py-2 shadow-2xs"
                      >
                        <p className="text-xs font-medium text-slate-600">
                          {pt.name}
                        </p>
                        <p className="text-sm font-bold text-slate-950">
                          {pt.sample}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Fit Preference Selector Preview */}
                  <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#4C1D95]">
                      Preferred Clothing Fit
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {FIT_OPTIONS.map((opt) => {
                        const active = selectedFit === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedFit(opt.id)}
                            aria-pressed={active}
                            className={cn(
                              "min-h-9 cursor-pointer rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                              active
                                ? "border-[#6633EE] bg-[#6633EE] text-white shadow-2xs"
                                : "border-violet-200/80 bg-white text-slate-800 hover:border-[#6633EE]/40 hover:bg-violet-100/70",
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
                      <strong className="text-[#4C1D95]">
                        {activeOption.ease}:
                      </strong>{" "}
                      {activeOption.note}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                Note: The Digital Avatar is a stylized profile companion
                associated with your entered measurements—it does not perform
                automated camera scanning and is not a medical or anatomical
                scan.
              </p>
            </div>
          </div>

          {/* Explanatory Copy & Measurement Journey */}
          <div className="space-y-5 lg:col-span-6">
            <h2
              id="body-profile-heading"
              className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
            >
              One measurement profile across every collection.
            </h2>
            <p className="fitloom-prose-pretty max-w-[60ch] text-sm leading-relaxed text-slate-600 sm:text-base">
              Setting up a Body Profile is completely optional during
              registration. Enter the measurements you have today, preview them
              with the stylized avatar, and update them anytime.
            </p>

            <ol className="space-y-2.5">
              {JOURNEY_STEPS.map((text, idx) => (
                <li
                  key={text}
                  className="flex items-start gap-3 text-sm text-slate-700"
                >
                  <span className="mt-0.5 w-5 shrink-0 font-mono text-xs font-bold text-[#6633EE]">
                    0{idx + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <Link
                href={isGuest ? "/signup?next=%2Fbody-profile" : "/body-profile"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6633EE] px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5522DD] active:bg-[#4919C9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
              >
                Create or Update Body Profile
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
