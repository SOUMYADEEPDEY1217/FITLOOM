"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";

const CUSTOMFIT_JOURNEY = [
  {
    step: "01",
    title: "Select Piece & Adjustments",
    desc: "Pick an eligible garment and adjust sleeve, collar, cuff, or hem specifications.",
  },
  {
    step: "02",
    title: "Pre-Fill Body Profile",
    desc: "Populate saved chest, waist, shoulder, and hip measurements, then verify cut drape.",
  },
  {
    step: "03",
    title: "Confirm Tailor & Quote",
    desc: "Check participating atelier availability and explicitly approve tailoring price before checkout.",
  },
  {
    step: "04",
    title: "Track Workshop Production",
    desc: "Follow milestone updates from pattern cutting through quality check and delivery.",
  },
];

export function CustomFitSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";

  return (
    <section
      id="customfit"
      aria-labelledby="customfit-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="overflow-hidden rounded-3xl border border-violet-200/90 bg-gradient-to-br from-[#FAF7FF] via-white to-[#F3EAFF] p-6 shadow-xs sm:p-10">
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Editorial Tailoring Pitch + Visual Image */}
          <div className="space-y-5 lg:col-span-5">
            <h2
              id="customfit-heading"
              className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
            >
              CUSTOMFIT tailoring when ready-to-wear falls short.
            </h2>

            <p className="fitloom-prose-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
              Standard grading cannot cover every proportion. On eligible
              garments from participating workshops, CUSTOMFIT routes your
              validated Body Profile and tailored adjustments to a partner
              atelier—with explicit quote approval before payment or cutting.
            </p>

            {/* Editorial tailoring garment preview */}
            <div className="overflow-hidden rounded-2xl border border-violet-200/90 bg-white shadow-2xs">
              <div className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-12">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#FAF7FF] sm:col-span-5 sm:aspect-square">
                  <Image
                    src="/assets/products/classic-navy-shirt.png"
                    alt="Tailored Classic Navy Shirt illustrating CUSTOMFIT eligible shirting silhouette"
                    fill
                    sizes="(max-width: 640px) 100vw, 220px"
                    className="object-contain p-2.5"
                  />
                </div>
                <div className="space-y-2.5 sm:col-span-7">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6633EE]">
                    <ClipboardCheck
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Governance &amp; Eligibility Rules
                  </span>
                  <ul className="space-y-1.5 text-xs leading-snug text-slate-700">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                        aria-hidden="true"
                      />
                      <span>
                        Available only on eligible garments &amp; participating
                        tailors
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                        aria-hidden="true"
                      />
                      <span>
                        Serviceability &amp; workshop capacity verified prior to
                        quote
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                        aria-hidden="true"
                      />
                      <span>
                        Customer quote approval mandatory before payment &amp;
                        cutting
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={isGuest ? "/login?next=%2Fcustomfit" : "/customfit"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6633EE] px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5522DD] active:bg-[#4919C9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
              >
                Explore CUSTOMFIT Flow
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={isGuest ? "/login?next=%2Ftailor" : "/tailor"}
                className="inline-flex min-h-10 items-center px-2 text-sm font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded-md"
              >
                Partner Tailor Portal →
              </Link>
            </div>
          </div>

          {/* Right 4-Stage Tailoring Progression */}
          <div className="lg:col-span-7">
            <p className="mb-4 border-b border-violet-200/70 pb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              How CUSTOMFIT Works
            </p>
            <ol className="grid gap-4 sm:grid-cols-2">
              {CUSTOMFIT_JOURNEY.map((item) => (
                <li
                  key={item.step}
                  className="flex flex-col rounded-2xl border border-violet-200/80 bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-extrabold text-[#6633EE]">
                      {item.step}
                    </span>
                    <h3 className="text-sm font-bold text-slate-950">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
