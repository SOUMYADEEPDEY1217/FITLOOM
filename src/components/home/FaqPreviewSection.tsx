import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

const HOMEPAGE_FAQS = [
  {
    q: "What is FITLOOM?",
    a: "FITLOOM is a Fashion Intelligence and Fit Calibration platform combining structured Body Profiles, deterministic garment-compatibility analysis, visual Virtual Try-On previews, and optional CUSTOMFIT tailoring.",
    defaultOpen: true,
  },
  {
    q: "How does Fit Intelligence work?",
    a: "Fit Intelligence compares your body measurements and fit ease preference (Slim, Regular, Relaxed, or Oversized) against per-size garment dimensions, fabric composition/stretch, and construction cut to explain chest, waist, hip, and shoulder fit.",
  },
  {
    q: "Is Body Profile mandatory?",
    a: "No. Body Profile remains completely optional during registration and browsing. You can add or update measurements at any point to configure sizing insights and CUSTOMFIT pre-fill.",
  },
  {
    q: "Is Virtual Try-On an exact representation?",
    a: "No. Virtual Try-On provides a visual simulation to explore styling and proportions. Exact dimensional fit verification is always handled separately by Fit Intelligence.",
  },
  {
    q: "What is CUSTOMFIT?",
    a: "CUSTOMFIT is FITLOOM's made-to-measure option when ready-to-wear standard sizes do not provide a suitable fit. You verify garment measurements, confirm tailor availability, and approve a tailored quote prior to payment and production.",
  },
  {
    q: "Are all products eligible for CUSTOMFIT?",
    a: "No. CUSTOMFIT is offered strictly on eligible products from participating sellers and partner tailors where serviceability and workshop capacity are confirmed.",
  },
];

export function FaqPreviewSection() {
  return (
    <section
      id="faqs"
      aria-labelledby="faq-preview-heading"
      className="mx-auto w-full max-w-4xl px-4 sm:px-6 scroll-mt-24"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2
            id="faq-preview-heading"
            className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            Frequently Asked Questions
          </h2>
        </div>

        <Link
          href="/faq"
          className="inline-flex min-h-8 items-center gap-1 text-sm font-bold text-[#6633EE] hover:underline"
        >
          View All FAQs <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Native <details> accordions keep text searchable via Find-in-page and place no headings inside <summary> */}
      <div className="mt-6 space-y-3">
        {HOMEPAGE_FAQS.map((item) => (
          <details
            key={item.q}
            open={item.defaultOpen}
            className="fitloom-faq-item rounded-2xl border border-violet-200/90 bg-white shadow-xs transition-shadow hover:border-[#6633EE]/40 hover:shadow-sm"
          >
            <summary className="flex cursor-pointer items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-bold text-slate-950 transition-colors hover:bg-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:text-base">
              <ChevronDown
                className="fitloom-faq-chevron h-4 w-4 text-[#6633EE]"
                aria-hidden="true"
              />
              <span>{item.q}</span>
            </summary>
            <div className="fitloom-prose-pretty border-t border-violet-100 px-5 pb-5 pt-3.5 text-sm leading-relaxed text-slate-700">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
