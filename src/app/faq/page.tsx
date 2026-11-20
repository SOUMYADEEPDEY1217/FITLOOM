"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, RotateCcw, Search } from "lucide-react";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FAQ_CATEGORIES,
  FITLOOM_FAQS,
  type FaqCategory,
  filterFaqs,
} from "@/lib/public-pages-utils";

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("All");
  const [openId, setOpenId] = useState<string | null>(
    FITLOOM_FAQS[0]?.id ?? null
  );

  const visibleFaqs = useMemo(
    () => filterFaqs(query, selectedCategory, FITLOOM_FAQS),
    [query, selectedCategory]
  );

  function handleReset() {
    setQuery("");
    setSelectedCategory("All");
    setOpenId(FITLOOM_FAQS[0]?.id ?? null);
  }

  return (
    <div className="space-y-8 pb-10">
      <PublicPageHero
        eyebrow="Help & Knowledge Base"
        title="Frequently Asked Questions"
        description="Find clear answers on FITLOOM accounts, Body Profiles, Fit Intelligence, simulated Virtual Try-On, CUSTOMFIT tailoring, orders, and privacy policies."
        actions={
          <Link href="/contact">
            <Button size="sm" variant="outline">
              Ask a Question
            </Button>
          </Link>
        }
      />

      {/* Search & Category Controls */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs sm:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions (e.g., Body Profile, CUSTOMFIT, Virtual Try-On, returns)..."
            aria-label="Search FAQ questions"
            className="pl-9"
          />
        </div>

        <div
          role="group"
          aria-label="Filter FAQs by category"
          className="flex flex-wrap gap-2"
        >
          {FAQ_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  active
                    ? "border-[#6633EE] bg-[#6633EE] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50"
                )}
              >
                {category}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Showing {visibleFaqs.length} of {FITLOOM_FAQS.length} topics
        </p>
      </div>

      {/* Accordion List or Empty State */}
      {visibleFaqs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-white/95 p-10 text-center">
          <HelpCircle
            className="mx-auto h-8 w-8 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No matching FAQ topics found
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Try another keyword or reset your category filter to view all help
            topics.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Search &amp; Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFaqs.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            return (
              <div
                key={item.id}
                id={item.id}
                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xs"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl p-5 text-left text-sm font-bold text-slate-950 transition-colors hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:text-base"
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6633EE]">
                        {item.category}
                      </span>
                      <span className="block break-words">{item.question}</span>
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#6633EE] transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    className="space-y-3 border-t border-slate-100 px-5 pt-3.5 pb-5 text-sm leading-relaxed text-slate-700"
                  >
                    <p>{item.answer}</p>
                    {item.links && item.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.links.map((l) => (
                          <Link
                            key={l.href + l.label}
                            href={l.href}
                            className="rounded-lg border border-violet-200 bg-violet-50/50 px-3 py-1 text-xs font-semibold text-[#6633EE] hover:bg-violet-100/70"
                          >
                            {l.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Policy Cross-Links */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/45 p-5 text-xs text-slate-700">
        <span className="font-semibold text-slate-900">
          Need legal or fulfillment policy specifics?
        </span>
        <div className="flex flex-wrap gap-2">
          <Link href="/terms" className="font-semibold text-[#6633EE] hover:underline">
            Terms &amp; Conditions
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="font-semibold text-[#6633EE] hover:underline">
            Privacy Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/returns" className="font-semibold text-[#6633EE] hover:underline">
            Return &amp; Refund Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/shipping" className="font-semibold text-[#6633EE] hover:underline">
            Shipping Policy
          </Link>
        </div>
      </section>
    </div>
  );
}
