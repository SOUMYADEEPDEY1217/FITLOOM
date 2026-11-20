"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";

export function HeroActions() {
  const { user } = useFitloom();
  const isGuest = user.role === "guest";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 lg:mt-[1.9cqi] lg:gap-[0.96cqi]">
      <Link
        href={isGuest ? "/signup?next=%2Fbody-profile" : "/body-profile"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5E0E53] to-[#4E1049] px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(78,40,88,0.28)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] focus-visible:ring-offset-2 lg:h-[clamp(2.625rem,3.59cqi,3.75rem)] lg:gap-[0.48cqi] lg:px-[1.85cqi] lg:text-[clamp(0.75rem,0.96cqi,1rem)]"
      >
        <span className="whitespace-nowrap">Create Your Fit Profile</span>
        <ArrowUpRight className="h-[18px] w-[18px] shrink-0 lg:h-[1.08cqi] lg:w-[1.08cqi]" strokeWidth={2.2} aria-hidden="true" />
      </Link>

      <Link
        href={isGuest ? "/login?next=%2Fstudio" : "/studio"}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-[#4E2858]/40 bg-[#FCF9FD]/85 px-5 text-[14px] font-semibold text-[#230E2C] backdrop-blur-xs transition-all hover:border-[#873CC1]/60 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] focus-visible:ring-offset-2 lg:h-[clamp(2.625rem,3.59cqi,3.75rem)] lg:gap-[0.6cqi] lg:px-[1.65cqi] lg:text-[clamp(0.75rem,0.96cqi,1rem)]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#4E2858] lg:h-[1.45cqi] lg:w-[1.45cqi]">
          <svg
            viewBox="0 0 12 12"
            className="ml-0.5 h-2.5 w-2.5 fill-[#4E2858] lg:h-[0.6cqi] lg:w-[0.6cqi]"
            aria-hidden="true"
          >
            <path d="M3 2 L10 6 L3 10 Z" />
          </svg>
        </span>
        <span className="whitespace-nowrap">Explore Style Studio</span>
      </Link>
    </div>
  );
}

