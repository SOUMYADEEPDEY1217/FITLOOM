import type { Metadata } from "next";
import React from "react";
import { FitloomHero } from "@/components/hero/FitloomHero";

export const metadata: Metadata = {
  title: "FITLOOM — AI Fashion Intelligence & Fit Calibration",
  description:
    "Your Body. Your Fit. Your Style. Explore Body Profiles, explainable Fit Intelligence, simulated Virtual Try-On, and optional CUSTOMFIT tailoring.",
};
import { BrandIntroSection } from "@/components/home/BrandIntroSection";
import { BodyProfileSection } from "@/components/home/BodyProfileSection";
import { FitIntelligenceSection } from "@/components/home/FitIntelligenceSection";
import { VirtualTryOnSection } from "@/components/home/VirtualTryOnSection";
import { DiscoveryCarouselSection } from "@/components/home/DiscoveryCarouselSection";
import { CustomFitSection } from "@/components/home/CustomFitSection";
import { TrustVerificationSection } from "@/components/home/TrustVerificationSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { FaqPreviewSection } from "@/components/home/FaqPreviewSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Approved Hero Section — strictly preserved */}
      <FitloomHero />

      {/* Homepage Middle Sections 01–10 seamlessly bridging Hero into approved Footer */}
      <div className="space-y-16 bg-[linear-gradient(180deg,rgba(222,198,238,0.42)_0px,rgba(247,245,255,0.24)_72px,transparent_150px)] sm:space-y-20">
        <BrandIntroSection />
        <BodyProfileSection />
        <FitIntelligenceSection />
        <VirtualTryOnSection />
        <DiscoveryCarouselSection />
        <CustomFitSection />
        <TrustVerificationSection />
        <HowItWorksSection />
        <FaqPreviewSection />
        <FinalCtaSection />
      </div>
    </div>
  );
}
