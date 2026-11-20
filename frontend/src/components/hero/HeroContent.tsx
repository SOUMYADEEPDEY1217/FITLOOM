import React from "react";
import { HeroActions } from "./HeroActions";

export function HeroContent() {
  return (
    <div className="relative z-20 flex flex-col justify-center">
      {/* Eyebrow + Trailing Horizontal Rule */}
      <div className="flex items-center gap-3.5 sm:gap-5 lg:gap-[1.2cqi]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4E2858] sm:text-[12px] lg:text-[clamp(0.6875rem,0.81cqi,0.84375rem)]">
          FIT INTELLIGENCE FOR MODERN FASHION
        </p>
        <span
          aria-hidden="true"
          className="hidden h-[1.5px] w-12 shrink-0 bg-[#4E2858]/70 sm:inline-block lg:w-[4.8cqi]"
        />
      </div>

      {/* Main Two-Line Italic Editorial Headline */}
      <h1 className="mt-4 italic font-black tracking-[-0.03em] leading-[0.98] sm:mt-5 lg:mt-[1.2cqi]">
        <span className="block text-[44px] text-[#1D0B24] sm:text-[62px] lg:text-[clamp(3.875rem,6.34cqi,6.625rem)]">
          Find Your
        </span>
        <span className="block bg-gradient-to-r from-[#5A1882] via-[#873CC1] to-[#A64FE2] bg-clip-text text-[44px] text-transparent sm:text-[62px] lg:text-[clamp(3.875rem,6.34cqi,6.625rem)]">
          Perfect Fit
        </span>
      </h1>

      {/* Hero Description */}
      <p className="mt-4 max-w-[390px] text-[15px] font-semibold leading-[1.38] text-[#4E2858] sm:mt-5 sm:text-[18px] lg:mt-[1.2cqi] lg:max-w-[28.4cqi] lg:text-[clamp(0.875rem,1.26cqi,1.3125rem)]">
        Virtually try on, get the right size, and discover styles made for you.
      </p>

      {/* Primary & Secondary CTA Buttons */}
      <HeroActions />
    </div>
  );
}
