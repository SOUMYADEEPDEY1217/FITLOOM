"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Eye, Ruler, Scissors, SlidersHorizontal } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";

const CONNECTED_FLOW = [
  {
    step: "01",
    title: "Create Your Profile",
    summary: "Set up your Body Profile and fit preferences.",
    href: "/body-profile",
    icon: Ruler,
  },
  {
    step: "02",
    title: "Discover Collection",
    summary: "Browse garments with transparent cut dimensions.",
    href: "/shop",
    icon: Compass,
  },
  {
    step: "03",
    title: "Evaluate Size Fit",
    summary: "Check chest and waist ease across standard sizes.",
    href: "/fit-check",
    icon: SlidersHorizontal,
  },
  {
    step: "04",
    title: "Preview Visual Look",
    summary: "Explore eligible garments in Virtual Try-On.",
    href: "/try-on",
    icon: Eye,
  },
  {
    step: "05",
    title: "Choose Standard or CUSTOMFIT",
    summary: "Order a ready size or request custom tailoring.",
    href: "/customfit",
    icon: Scissors,
  },
];

function getStepHref(baseHref: string, isGuest: boolean): string {
  if (!isGuest || baseHref === "/shop" || baseHref === "/how-it-works") {
    return baseHref;
  }
  if (baseHref === "/body-profile") {
    return "/signup?next=%2Fbody-profile";
  }
  return `/login?next=${encodeURIComponent(baseHref)}`;
}

export function HowItWorksSection() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="rounded-3xl border border-violet-200/90 bg-white p-6 shadow-xs sm:p-10">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2
              id="how-it-works-heading"
              className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
            >
              How FITLOOM Works
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex min-h-8 items-center gap-1.5 text-sm font-bold text-[#6633EE] hover:underline"
          >
            Read Full Methodology <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CONNECTED_FLOW.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-violet-200/80 bg-gradient-to-b from-[#FAF7FF] to-white p-4 transition-colors hover:border-[#6633EE]/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black tracking-wider text-[#6633EE]">
                      {item.step}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDE9FE] text-[#4C1D95]">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {item.summary}
                  </p>
                </div>

                <Link
                  href={getStepHref(item.href, isGuest)}
                  className="mt-4 inline-flex min-h-8 items-center gap-1 text-xs font-bold text-[#6633EE] hover:underline"
                >
                  Open Step <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

