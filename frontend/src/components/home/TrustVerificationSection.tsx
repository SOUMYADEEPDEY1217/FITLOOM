import React from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  FileText,
  Info,
  MessageSquareText,
  Palette,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";

const LISTING_EVIDENCE_ITEMS = [
  { icon: Camera, label: "Actual Product Photographs" },
  { icon: Camera, label: "Front & Back Garment Views" },
  { icon: FileText, label: "Fabric Close-Up Photography" },
  { icon: CheckCircle2, label: "Construction & Stitching Details" },
  { icon: Palette, label: "Actual Color & Variant Specs" },
  { icon: FileText, label: "Verified Fabric Composition" },
  { icon: Ruler, label: "Garment Measurements & Size Charts" },
  { icon: Video, label: "Optional Product Drape Videos" },
];

const EVIDENCE_STATUSES = [
  {
    status: "Physical Product Verified",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    badge: "bg-emerald-600 text-white",
    rule: "Reserved strictly for listings inspected against physical garment evidence—never auto-assigned by image AI alone.",
  },
  {
    status: "Seller Declared",
    tone: "border-violet-200 bg-[#FAF7FF] text-slate-900",
    badge: "bg-[#6633EE] text-white",
    rule: "Specifications, composition, and sizing charts submitted by the merchant prior to physical inspection.",
  },
  {
    status: "Unverified",
    tone: "border-slate-200 bg-slate-50 text-slate-800",
    badge: "bg-slate-600 text-white",
    rule: "Preliminary listing data lacking complete measurement tables or evidence confirmation; shown honestly to buyers.",
  },
];

export function TrustVerificationSection() {
  return (
    <section
      id="trust-verification"
      aria-labelledby="trust-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <div className="mb-8 max-w-3xl space-y-2">
        <h2
          id="trust-heading"
          className="fitloom-heading-balance text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
        >
          Clear verification standards and purchase-backed reviews.
        </h2>
        <p className="fitloom-prose-pretty max-w-[64ch] text-sm leading-relaxed text-slate-600 sm:text-base">
          Good sizing starts with truthful product specs. FITLOOM separates
          marketing visuals from documented garment details—and never uses image
          AI alone to mark a product physically verified.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Listing Evidence Checklist + 3 Verification Tiers */}
        <div className="space-y-6 rounded-3xl border border-violet-200/80 bg-white p-6 shadow-xs lg:col-span-7">
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Product Listing Evidence
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {LISTING_EVIDENCE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.label}
                    className="flex items-center gap-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-[#6633EE]"
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-950">
              Three Honest Evidence Statuses
            </h3>
            <div className="mt-3 space-y-2.5">
              {EVIDENCE_STATUSES.map((tier) => (
                <div
                  key={tier.status}
                  className={`rounded-xl border p-3.5 ${tier.tone}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${tier.badge}`}
                    >
                      {tier.status === "Physical Product Verified" ? (
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : tier.status === "Seller Declared" ? (
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {tier.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">
                    {tier.rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Review Experience Architecture (Strict zero fabricated stats) */}
        <div className="flex flex-col justify-between space-y-5 rounded-3xl border border-violet-200 bg-[#FAF7FF] p-6 shadow-xs lg:col-span-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6633EE]">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Customer Review Model
              </span>
              <span className="rounded-full border border-violet-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#4C1D95]">
                Schema Concept
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-950">
              Evidence-linked fit &amp; fabric feedback
            </h3>
            <p className="fitloom-prose-pretty text-sm leading-relaxed text-slate-600">
              FITLOOM&apos;s review architecture pairs customer ratings and
              written fit commentary with optional wearer photos—and restricts
              the <strong className="text-slate-900">Verified Purchase</strong>{" "}
              tag strictly to confirmed customer orders.
            </p>

            {/* Sample UI Slot Breakdown without fabricated reviews or fake numbers */}
            <div className="space-y-3 rounded-2xl border border-violet-200/90 bg-white p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold text-slate-900">
                  Illustrative Listing Evidence Card
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Verified Purchase Only on Confirmed Orders
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="text-xs font-semibold text-slate-900">
                    Ratings
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Order-backed score
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="text-xs font-semibold text-slate-900">
                    Written Fit Note
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Drape &amp; comfort context
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="text-xs font-semibold text-slate-900">
                    Wearer Photos
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Optional visual proof
                  </p>
                </div>
              </div>

              <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                Integrity safeguard: Mock prototype state displays sample
                catalogue entries only—live buyer reviews and physical
                inspection badges activate only after backend verification in
                Phase P3.
              </p>
            </div>
          </div>

          <div className="border-t border-violet-200/80 pt-4">
            <Link
              href="/shop"
              className="inline-flex min-h-8 items-center text-sm font-bold text-[#6633EE] hover:underline"
            >
              Inspect Product Specs &amp; Size Tables in Shop →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
