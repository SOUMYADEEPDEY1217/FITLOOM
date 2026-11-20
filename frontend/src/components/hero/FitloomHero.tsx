import React from "react";
import { BrandBackdrop } from "./BrandBackdrop";
import { HeroContent } from "./HeroContent";
import { HeroFeatureStrip } from "./HeroFeatureStrip";
import { HeroModels } from "./HeroModels";
import { OutfitSelector } from "./OutfitSelector";

export function FitloomHero() {
  return (
    <section
      aria-label="FITLOOM Style Studio Hero"
      className="relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(85% 95% at 15% 15%, #FCF9FD 0%, #F7ECFC 45%, #E9DDF5 80%, #DEC6EE 100%)",
      }}
    >
      {/* Desktop: Shared 1672x868 proportional composition stage (@container) below 72px navbar
          Tablet / Mobile: Clean responsive flow rearranging elements with readable type */}
      <div className="relative mx-auto w-full max-w-[1672px] lg:@container lg:aspect-[1024/532]">
        <BrandBackdrop />

        {/* Desktop Left Content Column positioned to normalized reference coords */}
        <div className="relative z-20 px-5 pt-10 sm:px-8 sm:pt-12 lg:absolute lg:left-[4.59%] lg:top-[7.8%] lg:w-[39.5%] lg:px-0 lg:pt-0">
          <HeroContent />
        </div>

        {/* Central Couple + Floating Outfit Selector */}
        <div className="relative z-10 mt-6 px-4 sm:px-8 lg:static lg:mt-0 lg:px-0">
          <HeroModels />
          <div className="-mt-8 pb-5 sm:-mt-12 lg:mt-0 lg:pb-0">
            <OutfitSelector />
          </div>
        </div>

        {/* Bottom 4-Item Rounded Feature Bar */}
        <div className="relative z-20 px-4 pb-6 sm:px-8 sm:pb-8 lg:static lg:px-0 lg:pb-0">
          <HeroFeatureStrip />
        </div>
      </div>
    </section>
  );
}
