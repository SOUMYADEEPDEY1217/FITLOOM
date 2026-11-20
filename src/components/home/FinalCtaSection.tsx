"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Ruler, ShoppingBag } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";

export function FinalCtaSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";

  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-[#FAF7FF] via-white to-[#EDE9FE] px-6 py-12 text-center shadow-sm sm:px-12 sm:py-14">
        <h2
          id="final-cta-heading"
          className="fitloom-heading-balance mx-auto max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl"
        >
          Find Your Fit. Discover Your Style.
        </h2>
        <p className="fitloom-prose-pretty mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Explore garment compatibility across the collection, save your Body
          Profile, or request CUSTOMFIT tailoring where eligible.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6633EE] px-6 py-2.5 text-center text-base font-medium text-white shadow-sm transition-colors hover:bg-[#5522DD] active:bg-[#4919C9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Explore Shop &amp; Collections
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={isGuest ? "/signup?next=%2Fbody-profile" : "/body-profile"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-center text-base font-medium text-slate-900 shadow-2xs transition-colors hover:border-[#6633EE]/50 hover:bg-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] focus-visible:ring-offset-2"
          >
            <Ruler className="h-4 w-4" aria-hidden="true" />
            Set Up Body Profile
          </Link>
        </div>
      </div>
    </section>
  );
}
