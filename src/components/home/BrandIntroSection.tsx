"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";

const FIT_EQUATION = [
  {
    label: "Your Measurements",
    detail: "Height, chest, waist, hip & ease preference",
  },
  {
    label: "Garment Specs",
    detail: "Per-size chest, waist & construction cut",
  },
  {
    label: "Fabric Behavior",
    detail: "Weave density, stretch recovery & drape",
  },
];

export function BrandIntroSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";

  return (
    <section
      id="about"
      aria-labelledby="brand-intro-heading"
      className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 scroll-mt-24"
    >
      {/* SECTION 01 — Asymmetric Editorial Brand Introduction */}
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 lg:col-span-6">
          <h2
            id="brand-intro-heading"
            className="fitloom-heading-balance text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:leading-[1.12]"
          >
            Standard size labels guess. FITLOOM decodes how clothing actually
            fits.
          </h2>
          <p className="fitloom-prose-pretty max-w-[60ch] text-base leading-relaxed text-slate-600">
            A tagged “Medium” shifts across brands, weaves, and cuts. FITLOOM
            pairs your body measurements with garment dimensions, fabric
            properties, and ease preference before you buy or request CUSTOMFIT
            tailoring.
          </p>

          {/* Editorial fit inputs strip without boxy KPI chrome */}
          <dl className="grid gap-4 border-y border-slate-200/80 py-4 sm:grid-cols-3">
            {FIT_EQUATION.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-sm font-bold text-slate-900">
                  {item.label}
                </dt>
                <dd className="text-xs leading-snug text-slate-600">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={isGuest ? "/login?next=%2Ffit-check" : "/fit-check"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#6633EE] px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5522DD] active:bg-[#4919C9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
            >
              Open Fit Intelligence
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-center text-sm font-medium text-slate-900 transition-colors hover:border-[#6633EE]/40 hover:bg-violet-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
            >
              About FITLOOM
            </Link>
          </div>
        </div>

        {/* Editorial visual pairing */}
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-violet-200/70 bg-[#F7F5FF] shadow-sm">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src="/assets/hero-editorial.jpg"
                alt="Editorial outerwear styled in ivory and soft lavender demonstrating tailored drape and fit"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
            <div className="border-t border-violet-100 bg-white px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-900">
                Measurements + Garment Spec + Fit Ease = Informed Choice
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
