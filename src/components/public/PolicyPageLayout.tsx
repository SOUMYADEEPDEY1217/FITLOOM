import React from "react";
import Link from "next/link";
import { AlertTriangle, BookOpen, Info } from "lucide-react";
import { PublicPageHero } from "@/components/public/PublicPageHero";

export interface PolicyTocItem {
  id: string;
  title: string;
}

const RELATED_POLICY_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Return & Refund Policy", href: "/returns" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Help & FAQ", href: "/faq" },
  { label: "Contact Support", href: "/contact" },
] as const;

export function PolicySection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 space-y-3 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0"
    >
      <h2
        id={`${id}-heading`}
        className="text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl"
      >
        {number}. {title}
      </h2>
      <div className="space-y-2.5 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export function PolicyPageLayout({
  eyebrow,
  title,
  description,
  scopeNotice,
  ownerReviewNotice,
  toc,
  currentHref,
  headerActions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeNotice: string;
  ownerReviewNotice?: string;
  toc: readonly PolicyTocItem[];
  currentHref: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8 pb-10">
      <PublicPageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        badgeVariant="neutral"
        actions={headerActions}
      />

      {/* Frontend Demo & Informational Policy Disclosures */}
      <div className="space-y-3">
        <aside
          aria-label="Frontend prototype scope notice"
          className="flex items-start gap-2.5 rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 text-xs leading-relaxed text-slate-700"
        >
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
            aria-hidden="true"
          />
          <p>{scopeNotice}</p>
        </aside>

        {ownerReviewNotice && (
          <aside
            aria-label="Informational demo policy notice"
            className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950"
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <p>{ownerReviewNotice}</p>
          </aside>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Table of Contents */}
        <aside className="lg:col-span-4">
          <nav
            aria-label="Policy sections"
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs lg:sticky lg:top-24"
          >
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <BookOpen
                className="h-3.5 w-3.5 text-[#6633EE]"
                aria-hidden="true"
              />
              On This Page
            </p>
            <ol className="mt-3 max-h-[55vh] space-y-1.5 overflow-y-auto pr-1 text-xs">
              {toc.map((item, idx) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block rounded-lg px-2.5 py-1.5 font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                  >
                    {idx + 1}. {item.title}
                  </a>
                </li>
              ))}
            </ol>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Related Policies
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {RELATED_POLICY_LINKS.filter((l) => l.href !== currentHref).map(
                  (link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-[#6633EE]"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Policy Body */}
        <article className="min-w-0 space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8 lg:col-span-8">
          {children}
        </article>
      </div>
    </div>
  );
}
