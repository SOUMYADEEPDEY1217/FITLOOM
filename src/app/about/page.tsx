import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About FITLOOM",
  description:
    "Discover FITLOOM's mission to replace online sizing guesswork with transparent garment dimensions, Body Profiles, Fit Intelligence, and optional CUSTOMFIT.",
};
import {
  ArrowRight,
  Compass,
  Heart,
  Layers,
  Ruler,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { TrustTransparencySection } from "@/components/public/TrustTransparencySection";
import { Button } from "@/components/ui/button";

const MISSION_CHALLENGES = [
  {
    title: "Inconsistent Garment Sizing",
    detail:
      "Letter labels like S, M, L, or XL vary significantly across silhouettes and brands, making guesswork common.",
  },
  {
    title: "Difficulty Reading Fit Intent",
    detail:
      "Flat size labels rarely explain whether a garment is cut slim, relaxed, or oversized across chest and waist zones.",
  },
  {
    title: "Uncertainty While Shopping Online",
    detail:
      "Without structured comparison between body measurements and garment dimensions, buyers hesitate or order multiple sizes.",
  },
  {
    title: "Lack of Personalized Guidance",
    detail:
      "Most storefronts display identical charts to everyone rather than explaining fit against individual preferences.",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Build Your Body Profile",
    summary:
      "Optional measurement capture (cm or inches) with slim, regular, relaxed, or oversized fit preference.",
  },
  {
    step: "02",
    title: "Explore Products & Garment Dimensions",
    summary:
      "Browse catalogue listings with transparent chest and waist garment measurements, fabric composition, and stretch notes.",
  },
  {
    step: "03",
    title: "Understand Fit Intelligence",
    summary:
      "Deterministic fit guidance compares your saved Body Profile against garment charts without invented confidence scores.",
  },
  {
    step: "04",
    title: "Preview Supported Items via Virtual Try-On",
    summary:
      "Explore visual appearance in the simulated Fitting Room. Virtual Try-On is strictly visual exploration—never a physical fit guarantee.",
  },
  {
    step: "05",
    title: "Explore CUSTOMFIT Where Eligible",
    summary:
      "Request made-to-measure tailoring on eligible garments through a quote, workshop acceptance, and explicit customer approval workflow.",
  },
] as const;

const PLATFORM_CAPABILITIES = [
  {
    icon: Ruler,
    title: "Personalized Body Profile",
    desc: "Save and edit optional 7-point body measurements and switch units smoothly between centimetres and inches.",
    href: "/body-profile",
  },
  {
    icon: Sparkles,
    title: "Fit Intelligence",
    desc: "Zone-by-zone ease analysis comparing your Body Profile to ready-to-wear chest and waist dimensions.",
    href: "/fit-check",
  },
  {
    icon: Layers,
    title: "Virtual Try-On Simulation",
    desc: "Interactive demo Fitting Room preview separated clearly from physical sizing verification.",
    href: "/try-on",
  },
  {
    icon: Compass,
    title: "Style Studio",
    desc: "Compose complete outfits from shirts, outerwear, and trousers with explicit per-garment size selection.",
    href: "/studio",
  },
  {
    icon: Heart,
    title: "Compare & Wishlist",
    desc: "Side-by-side garment specification comparisons (up to 3 items) and curated wishlist tracking.",
    href: "/compare",
  },
  {
    icon: Scissors,
    title: "CUSTOMFIT Tailoring",
    desc: "Optional made-to-measure requests on eligible garments paired with partner workshops.",
    href: "/customfit",
  },
  {
    icon: Store,
    title: "Seller & Tailor Ecosystem (Demo)",
    desc: "Role-isolated frontend workspaces for Sellers (standard retail listings/orders) and Partner Tailors (CUSTOMFIT).",
    href: "/tailor/register",
  },
] as const;

const PHILOSOPHY_PILLARS = [
  "Better Fit Discovery",
  "Clear Simulation Boundaries",
  "Customer-Controlled Preferences",
  "Transparent Garment Specs",
  "Informed Shopping Decisions",
] as const;

const TEAM = [
  "MD Danish Raza",
  "Soumyadeep Dey",
  "Harshit Raj",
  "Krishnendu Das",
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-10">
      <PublicPageHero
        eyebrow="About FITLOOM"
        title="Fashion Should Fit You, Not the Other Way Around"
        description="Built by Team PARADOX for Hack N Pitch (E-Summit '26, Jadavpur University), FITLOOM brings together Body Profiles, deterministic Fit Intelligence, visual Virtual Try-On previews, and optional CUSTOMFIT tailoring."
        actions={
          <>
            <Link href="/shop">
              <Button size="sm">
                Explore Shop <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="sm" variant="outline">
                How FITLOOM Works
              </Button>
            </Link>
          </>
        }
      />

      {/* B. Our Mission */}
      <section aria-labelledby="about-mission-heading" className="space-y-4">
        <div className="space-y-1.5">
          <h2
            id="about-mission-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Our Mission
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Online fashion discovery breaks down when shoppers are asked to
            guess sizing from static labels. FITLOOM focuses on clear
            measurement comparison and structured workflow transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MISSION_CHALLENGES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs"
            >
              <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* C. How FITLOOM Works */}
      <section aria-labelledby="about-journey-heading" className="space-y-4">
        <div className="space-y-1.5">
          <h2
            id="about-journey-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            How the FITLOOM Journey Fits Together
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Visual exploration and physical measurement checks play intentionally
            separate roles across every shopping session.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {JOURNEY_STEPS.map((item) => (
            <li
              key={item.step}
              className="flex flex-col gap-2 rounded-2xl border border-violet-100 bg-white/95 p-4 shadow-2xs"
            >
              <span className="text-xs font-extrabold text-[#6633EE]">
                STEP {item.step}
              </span>
              <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {item.summary}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* D. Platform Features */}
      <section aria-labelledby="about-features-heading" className="space-y-4">
        <div className="space-y-1.5">
          <h2
            id="about-features-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Implemented Platform Capabilities (Frontend Demo)
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            All capabilities listed below are interactive in local browser
            session state. Live database persistence, external payment gateways,
            and production AI inference belong to downstream phases.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[#6633EE]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-950">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {cap.desc}
                  </p>
                </div>
                <Link
                  href={cap.href}
                  className="w-fit text-xs font-semibold text-[#6633EE] hover:underline"
                >
                  Open Module →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* E. Philosophy */}
      <section
        aria-labelledby="about-philosophy-heading"
        className="rounded-3xl border border-violet-200/80 bg-violet-50/45 p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6633EE]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Philosophy
        </div>
        <h2
          id="about-philosophy-heading"
          className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950"
        >
          Clarity Over Guesswork, Customer Control First
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PHILOSOPHY_PILLARS.map((pillar) => (
            <span
              key={pillar}
              className="text-sm font-semibold text-slate-800"
            >
              — {pillar}
            </span>
          ))}
        </div>
      </section>

      {/* F. Trust & Transparency */}
      <TrustTransparencySection />

      {/* Team, Careers & Milestones (Preserving Footer anchor targets cleanly) */}
      <section aria-labelledby="about-team-heading" className="space-y-4">
        <h2
          id="about-team-heading"
          className="text-xl font-bold text-slate-950"
        >
          Team PARADOX
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((name) => (
            <div
              key={name}
              className="rounded-2xl border border-slate-200/80 bg-white/95 p-4"
            >
              <p className="font-bold text-slate-950">{name}</p>
              <p className="text-xs text-slate-500">Team PARADOX · FITLOOM</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section
          id="careers"
          aria-labelledby="careers-heading"
          className="scroll-mt-24 space-y-2 rounded-2xl border border-slate-200/80 bg-white/95 p-5"
        >
          <h2 id="careers-heading" className="text-lg font-bold text-slate-950">
            Careers &amp; Partner Onboarding
          </h2>
          <p className="text-xs leading-relaxed text-slate-600">
            FITLOOM is an active product prototype without open corporate job
            listings yet. Independent ateliers can preview workshop onboarding
            through the{" "}
            <Link
              href="/tailor/register"
              className="font-semibold text-[#6633EE] underline"
            >
              Partner Tailor Application
            </Link>
            .
          </p>
        </section>

        <section
          id="news"
          aria-labelledby="news-heading"
          className="scroll-mt-24 space-y-2 rounded-2xl border border-slate-200/80 bg-white/95 p-5"
        >
          <h2 id="news-heading" className="text-lg font-bold text-slate-950">
            News &amp; Project Notes
          </h2>
          <p className="text-xs leading-relaxed text-slate-600">
            Customer shopping flows, Tailor/Seller/Admin demo workspaces, and
            public transparency documentation are active in frontend preview
            ahead of downstream database and AI integration.
          </p>
        </section>
      </div>

      {/* CTA Section */}
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-violet-200 bg-white/95 p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-950">
            Ready to Explore Personalized Fit?
          </h2>
          <p className="text-sm text-slate-600">
            Browse the catalogue, start a demo account, or walk through how
            FITLOOM evaluates garment proportions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/shop">
            <Button size="sm">Browse Shop</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" variant="outline">
              Create Account
            </Button>
          </Link>
          <Link href="/how-it-works">
            <Button size="sm" variant="ghost">
              How FITLOOM Works →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
