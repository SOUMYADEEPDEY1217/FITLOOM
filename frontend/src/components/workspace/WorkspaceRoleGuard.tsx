"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, UserCheck } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceAccessDenied } from "@/components/workspace/WorkspaceAccessDenied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { evaluatePartnerSuspension } from "@/lib/admin-workspace-utils";
import {
  evaluateWorkspaceAccess,
  getWorkspaceConfig,
  type WorkspaceId,
  type WorkspaceRole,
} from "@/lib/workspace-config";

export function WorkspaceRoleGuard({
  workspaceId,
  requiredRole,
  children,
}: {
  workspaceId: WorkspaceId;
  requiredRole?: WorkspaceRole;
  children: React.ReactNode;
}) {
  const { user, partners, switchRole, toast } = useFitloom();
  const targetRole: WorkspaceRole = requiredRole ?? workspaceId;
  const access = evaluateWorkspaceAccess(user.role, targetRole);

  if (!access.allowed) {
    return <WorkspaceAccessDenied workspaceId={workspaceId} />;
  }

  const suspension = evaluatePartnerSuspension(user, targetRole, partners);
  if (suspension.suspended) {
    const config = getWorkspaceConfig(workspaceId);
    return (
      <div className="mx-auto max-w-xl py-8">
        <div
          role="region"
          aria-labelledby="workspace-suspended-heading"
          className="space-y-4 rounded-3xl border border-amber-200 bg-white/95 p-6 text-center shadow-xs sm:p-8"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <Badge variant="amber" size="sm">
            Partner Suspended · Demo Admin State
          </Badge>
          <h1
            id="workspace-suspended-heading"
            className="text-2xl font-extrabold text-slate-950"
          >
            {suspension.partner?.name ?? config.title} Is Suspended
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Operational access to the <strong>{config.title}</strong> is
            currently paused in demo admin governance.
            {suspension.reason ? ` Reason: ${suspension.reason}` : ""}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <Button
              type="button"
              onClick={() => {
                switchRole("admin");
                toast({
                  type: "info",
                  title: "Admin Demo Active",
                  message:
                    "Switched to Admin Demo so you can review or reactivate partners.",
                });
              }}
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              Switch to Admin Demo
            </Button>
            <Link href="/account">
              <Button type="button" variant="outline">
                Account &amp; Role Switcher
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
