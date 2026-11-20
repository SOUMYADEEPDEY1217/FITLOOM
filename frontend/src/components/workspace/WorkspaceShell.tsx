"use client";

import React from "react";
import { Info } from "lucide-react";
import { WorkspaceSubnav } from "@/components/workspace/WorkspaceSubnav";
import { getWorkspaceConfig, type WorkspaceId } from "@/lib/workspace-config";

export function WorkspaceShell({
  workspaceId,
  title,
  description,
  actions,
  children,
}: {
  workspaceId: WorkspaceId;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const config = getWorkspaceConfig(workspaceId);

  return (
    <div className="min-w-0 space-y-6 pb-10">
      <header className="space-y-4 border-b border-violet-100 pb-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6633EE]">
              {config.eyebrow}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 break-words sm:text-3xl">
              {title ?? config.title}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              {description ?? config.description}
            </p>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        <WorkspaceSubnav workspaceId={workspaceId} />
      </header>

      <aside
        aria-label="Workspace frontend demo notice"
        className="flex items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/40 px-3.5 py-2.5 text-xs text-slate-600"
      >
        <Info
          className="h-3.5 w-3.5 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p className="leading-snug">
          Session Demo Workspace — Updates stay in active browser memory
          without a backend server.
        </p>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
