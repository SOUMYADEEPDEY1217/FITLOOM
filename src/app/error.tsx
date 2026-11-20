"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, HelpCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <div
        role="alert"
        aria-labelledby="fitloom-error-heading"
        className="space-y-6 rounded-3xl border border-amber-200 bg-white/95 p-6 text-center shadow-xs sm:p-10"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <Badge variant="amber" size="sm">
            Recoverable Interface Error
          </Badge>
          <h1
            id="fitloom-error-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950"
          >
            Something Interrupted This View
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            FITLOOM caught an unexpected client rendering issue without losing
            the rest of the application. You can retry loading this screen or
            return home safely.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-500">
              Reference Digest: <code>{error.digest}</code>
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 pt-1">
          <Button type="button" size="sm" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Link href="/">
            <Button type="button" size="sm" variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return Home
            </Button>
          </Link>
          <Link href="/faq">
            <Button type="button" size="sm" variant="ghost">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help &amp; FAQ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
