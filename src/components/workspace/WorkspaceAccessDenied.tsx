"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Info, Lock, ShieldAlert, UserCheck } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDefaultLandingRouteForRole,
  getRoleDisplayLabel,
  getWorkspaceConfig,
  type WorkspaceId,
} from "@/lib/workspace-config";

export function WorkspaceAccessDenied({
  workspaceId,
}: {
  workspaceId: WorkspaceId;
}) {
  const { user, switchRole, toast } = useFitloom();
  const config = getWorkspaceConfig(workspaceId);
  const currentRoleLabel = getRoleDisplayLabel(user.role);
  const fallbackHref = getDefaultLandingRouteForRole(user.role);

  function handleExplicitRoleSwitch() {
    switchRole(config.requiredRole);
    toast({
      type: "info",
      title: `${config.roleLabel} Demo Active`,
      message: `Switched active demo session to ${config.roleLabel} to view ${config.title}.`,
    });
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      <div
        role="region"
        aria-labelledby="workspace-access-denied-heading"
        className="space-y-5 rounded-3xl border border-violet-200/90 bg-white/95 p-6 text-center shadow-xs sm:p-8"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-[#6633EE]">
          {user.role === "guest" ? (
            <Lock className="h-6 w-6" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <Badge variant="amber" size="sm">
            {config.roleLabel} Role Required
          </Badge>
          <h1
            id="workspace-access-denied-heading"
            className="text-2xl font-extrabold text-slate-950"
          >
            Access Restricted to {config.roleLabel}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Your active demo session is currently{" "}
            <strong className="text-slate-950">{currentRoleLabel}</strong>. The{" "}
            <strong className="text-slate-950">{config.title}</strong> requires
            the <strong className="text-[#4C1D95]">{config.roleLabel}</strong>{" "}
            role.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left text-xs text-slate-600">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            <strong>Frontend Demo Guard:</strong> Roles never switch
            automatically. Use the explicit switch button below to test{" "}
            {config.roleLabel} access on this route, or sign in via the demo
            login flow.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 pt-1">
          <Button type="button" onClick={handleExplicitRoleSwitch}>
            <UserCheck className="h-4 w-4" aria-hidden="true" />
            Switch to {config.roleLabel} Demo
          </Button>

          <Link href="/auth/login">
            <Button type="button" variant="outline">
              Sign In
            </Button>
          </Link>

          <Link href={fallbackHref}>
            <Button type="button" variant="ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {user.role === "guest" ? "Return Home" : `Go to ${currentRoleLabel} Home`}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
