"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";

interface AuthShellProps {
  backHref: string;
  backLabel: string;
  badgeLabel?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  backHref,
  backLabel,
  badgeLabel,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-semibold text-slate-600 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>

      <div className="rounded-3xl border border-violet-200/80 bg-white/95 p-6 shadow-sm sm:p-7">
        {badgeLabel && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {badgeLabel}
          </p>
        )}
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {subtitle}
        </p>

        {children}

        {footer && (
          <div className="mt-5 border-t border-slate-100 pt-4">{footer}</div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-[11px] leading-relaxed text-slate-600">
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p>
          <strong>Session Demo Only:</strong> Sign-in, OTP verification, and
          password recovery run locally in your browser without a live database,
          JWT server, or email delivery.
        </p>
      </div>
    </div>
  );
}
