"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getWorkspaceConfig, type WorkspaceId } from "@/lib/workspace-config";

function isWorkspaceLinkActive(
  pathname: string,
  href: string,
  basePath: string
): boolean {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const cleanHref = href.replace(/\/+$/, "") || "/";

  if (cleanHref === basePath) {
    return cleanPath === cleanHref;
  }
  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
}

export function WorkspaceSubnav({ workspaceId }: { workspaceId: WorkspaceId }) {
  const pathname = usePathname() ?? "/";
  const config = getWorkspaceConfig(workspaceId);

  return (
    <nav
      aria-label={`${config.title} navigation`}
      className="flex flex-wrap items-center gap-2 pt-2"
    >
      {config.links.map((link) => {
        const active = isWorkspaceLinkActive(
          pathname,
          link.href,
          config.basePath
        );
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
              active
                ? "border-[#6633EE] bg-[#6633EE] text-white shadow-2xs"
                : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/60 hover:text-[#4C1D95]"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
