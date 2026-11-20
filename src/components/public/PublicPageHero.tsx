import React from "react";
import { cn } from "@/lib/utils";

export function PublicPageHero({
  eyebrow,
  title,
  description,
  badgeVariant = "default",
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badgeVariant?: "default" | "neutral" | "info" | "amber" | "success";
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-3 border-b border-violet-100 pb-6">
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.14em]",
          badgeVariant === "neutral" ? "text-slate-500" : "text-[#6633EE]"
        )}
      >
        {eyebrow}
      </p>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 break-words sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
