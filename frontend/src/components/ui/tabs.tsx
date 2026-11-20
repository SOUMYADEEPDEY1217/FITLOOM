"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabOption {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-xl border border-violet-100 bg-violet-50/70 p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "min-h-9 max-w-full cursor-pointer whitespace-normal rounded-lg px-3.5 py-1.5 text-center text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
              active
                ? "bg-white text-[#6633EE] shadow-xs"
                : "text-slate-700 hover:text-slate-950"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

