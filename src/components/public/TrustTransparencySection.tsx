import React from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Eye,
  Ruler,
  Scissors,
  ShieldCheck,
} from "lucide-react";

const TRUST_PILLARS = [
  {
    icon: Ruler,
    title: "Transparent Fit Information",
    body: "Garment chest and waist measurements, fabric notes, and user-provided Body Profile dimensions work together to produce explainable size guidance rather than opaque guesses.",
    href: "/fit-check",
    cta: "Explore Fit Check",
  },
  {
    icon: Eye,
    title: "Virtual Try-On Simulation Transparency",
    body: "Virtual Try-On helps visualize styling and garment pairing. It is strictly a visual simulation and never a guarantee of physical garment drape or real-world fit accuracy.",
    href: "/try-on",
    cta: "Preview Virtual Try-On",
  },
  {
    icon: Scissors,
    title: "CUSTOMFIT Workflow Clarity",
    body: "CUSTOMFIT applies only to eligible garments. Submitting measurements creates a quote request requiring workshop acceptance and explicit customer approval before order confirmation.",
    href: "/customfit",
    cta: "Understand CUSTOMFIT",
  },
  {
    icon: ShieldCheck,
    title: "Seller & Tailor Demo Verification Disclosure",
    body: "Partner verification badges ('Verified (Demo)' or 'Pending Demo Review') reflect frontend session governance states only—they do not indicate real-world KYB or legal business checks.",
    href: "/faq",
    cta: "Read Partner FAQs",
  },
  {
    icon: ClipboardCheck,
    title: "Responsible Product Specifications",
    body: "Available sizes, prices, stock quantities, and delivery details rely strictly on confirmed listing records. Where stock or policy terms are unconfirmed, FITLOOM marks them unavailable instead of fabricating values.",
    href: "/shop",
    cta: "Browse Catalogue",
  },
] as const;

export function TrustTransparencySection() {
  return (
    <section
      id="trust"
      aria-labelledby="public-trust-heading"
      className="scroll-mt-24 space-y-5 rounded-3xl border border-violet-200/80 bg-white/95 p-6 shadow-xs sm:p-8"
    >
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6633EE]">
          Trust &amp; Transparency
        </p>
        <h2
          id="public-trust-heading"
          className="text-2xl font-extrabold tracking-tight text-slate-950"
        >
          How FITLOOM Separates Real Fit Data from Simulation
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          FITLOOM avoids fabricated confidence scores, hidden defaults, and
          unverified guarantees. Each capability clearly states what it measures
          and what remains a frontend demonstration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TRUST_PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article
              key={pillar.title}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/55 p-4 sm:p-5"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[#6633EE]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-950">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  {pillar.body}
                </p>
              </div>
              <Link
                href={pillar.href}
                className="w-fit text-xs font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                {pillar.cta} →
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
