import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How FITLOOM Works",
  description:
    "Understand how FITLOOM separates explainable Fit Intelligence calibration from visual Virtual Try-On simulation and optional made-to-measure CUSTOMFIT.",
};
import { ArrowRight } from "lucide-react";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { TrustTransparencySection } from "@/components/public/TrustTransparencySection";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <div className="space-y-10 pb-10">
      <PublicPageHero
        eyebrow="Methodology · Your Body. Your Fit. Your Style."
        title="How FITLOOM Works"
        description="FITLOOM separates explainable measurement-based Fit Intelligence from visual Virtual Try-On previews and optional made-to-measure CUSTOMFIT requests."
        actions={
          <Link href="/body-profile">
            <Button size="sm">
              Start Your Body Profile{" "}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8">
        <section id="fit-tech" className="scroll-mt-24 space-y-2">
          <h2 className="text-xl font-bold text-slate-950">
            Size &amp; Fit Tech (Explainable Calibration)
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            FITLOOM&apos;s Fit Intelligence Engine compares your Body Profile
            measurements against per-size garment dimensions, fabric notes, and
            your chosen fit preference (Slim, Regular, Relaxed, or Oversized) to
            present zone-by-zone ease calculations rather than opaque guesses or
            fabricated fit percentages.
          </p>
        </section>

        <section
          id="fashion-ai"
          className="scroll-mt-24 space-y-2 border-t border-slate-100 pt-6"
        >
          <h2 className="text-xl font-bold text-slate-950">
            Fashion AI &amp; Virtual Try-On Simulation
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Virtual Try-On allows you to preview how garments appear alongside a
            demo styling canvas or local photo preview. Visual try-on is
            strictly positioned as visual exploration and never replaces
            measurement-based Fit Check verification.
          </p>
        </section>

        <section
          id="styling"
          className="scroll-mt-24 space-y-2 border-t border-slate-100 pt-6"
        >
          <h2 className="text-xl font-bold text-slate-950">
            Personal Styling &amp; Wardrobe Composition
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Use Style Studio to pair shirts, outerwear, and trousers into Saved
            Looks, compare up to three garments side-by-side, and select exact
            ready-to-wear sizes explicitly before adding items to your bag.
          </p>
        </section>

        <section
          id="sustainability"
          className="scroll-mt-24 space-y-2 border-t border-slate-100 pt-6"
        >
          <h2 className="text-xl font-bold text-slate-950">
            Fit-First Commerce &amp; Optional CUSTOMFIT
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Helping customers evaluate garment chest and waist dimensions before
            ordering aims to reduce sizing confusion, while eligible items offer
            optional CUSTOMFIT partner tailoring with quote review and explicit
            customer approval.
          </p>
        </section>
      </div>

      <TrustTransparencySection />

      <div className="flex flex-wrap gap-3">
        <Link href="/fit-check">
          <Button size="sm">Open Fit Check</Button>
        </Link>
        <Link href="/try-on">
          <Button size="sm" variant="outline">
            Explore Try-On Demo
          </Button>
        </Link>
        <Link href="/faq">
          <Button size="sm" variant="ghost">
            Read FAQs →
          </Button>
        </Link>
      </div>
    </div>
  );
}
