"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Info,
  PauseCircle,
  PlayCircle,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceConfirmDialog } from "@/components/workspace/WorkspaceConfirmDialog";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type DemoPartnerRecord,
  type PartnerActionType,
  formatVerificationLabel,
} from "@/lib/admin-workspace-utils";

function AdminPartnersContent() {
  const {
    partners,
    verifyPartnerDemo,
    rejectPartnerDemo,
    suspendPartnerDemo,
    reactivatePartnerDemo,
    toast,
  } = useFitloom();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "seller" | "tailor">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending_demo" | "verified_demo" | "rejected_demo" | "suspended"
  >("all");
  const [inspectedPartnerId, setInspectedPartnerId] = useState<string | null>(
    partners[0]?.id ?? null
  );
  const [pendingAction, setPendingAction] = useState<{
    partner: DemoPartnerRecord;
    action: PartnerActionType;
  } | null>(null);

  const filteredPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter === "suspended" && p.operationalStatus !== "suspended") {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "suspended" &&
        p.verificationStatus !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${p.name} ${p.city} ${p.specialtyOrCategory} ${
          p.email ?? ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [partners, query, typeFilter, statusFilter]);

  const inspectedPartner = useMemo(() => {
    if (!inspectedPartnerId) return filteredPartners[0] ?? null;
    return (
      partners.find((p) => p.id === inspectedPartnerId) ??
      filteredPartners[0] ??
      null
    );
  }, [partners, filteredPartners, inspectedPartnerId]);

  function handleConfirmPartnerAction(reason?: string) {
    if (!pendingAction) return;
    const { partner, action } = pendingAction;
    setPendingAction(null);

    let res: { ok: boolean; error?: string } = { ok: false };
    if (action === "verify") {
      res = verifyPartnerDemo(partner.id);
    } else if (action === "reject") {
      res = rejectPartnerDemo(partner.id, reason ?? "");
    } else if (action === "suspend") {
      res = suspendPartnerDemo(partner.id, reason ?? "");
    } else if (action === "reactivate") {
      res = reactivatePartnerDemo(partner.id);
    }

    if (!res.ok) {
      toast({
        type: "error",
        title: "Partner Action Blocked",
        message: res.error ?? "Could not complete partner update.",
      });
      return;
    }

    const titles: Record<PartnerActionType, string> = {
      verify: "Partner Verified (Demo State)",
      reject: "Verification Rejected (Demo State)",
      suspend: "Partner Suspended (Demo State)",
      reactivate: "Partner Reactivated",
    };
    toast({
      type: action === "verify" || action === "reactivate" ? "success" : "info",
      title: titles[action],
      message: `${partner.name} updated in demo session governance.`,
    });
  }

  return (
    <WorkspaceShell
      workspaceId="admin"
      title="Partner Management (Sellers & Tailors)"
      description="Review demo verification requests and manage partner operational status. Demo verification is session-only and does not represent legal or KYB approval."
    >
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search partner, city, specialty..."
            aria-label="Search partners"
            className="pl-9"
          />
        </div>

        <select
          aria-label="Filter by partner type"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as "all" | "seller" | "tailor")
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="all">All Partner Types</option>
          <option value="seller">Sellers</option>
          <option value="tailor">Partner Tailors</option>
        </select>

        <select
          aria-label="Filter by verification or active status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as
                | "all"
                | "pending_demo"
                | "verified_demo"
                | "rejected_demo"
                | "suspended"
            )
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="all">All Statuses</option>
          <option value="pending_demo">Pending Demo Review</option>
          <option value="verified_demo">Verified (Demo)</option>
          <option value="rejected_demo">Rejected (Demo)</option>
          <option value="suspended">Suspended Partners</option>
        </select>
      </div>

      {filteredPartners.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Users
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No matching partners
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Clear your search or status filter to see all {partners.length}{" "}
            session partners.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Partner Cards */}
          <div className="space-y-3 lg:col-span-7">
            {filteredPartners.map((partner) => {
              const selected = inspectedPartner?.id === partner.id;
              return (
                <article
                  key={partner.id}
                  className={`space-y-3 rounded-2xl border p-4 transition-colors sm:p-5 ${
                    selected
                      ? "border-[#6633EE] bg-violet-50/45 shadow-2xs"
                      : "border-slate-200/80 bg-white/95"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            partner.type === "seller" ? "info" : "default"
                          }
                          size="sm"
                        >
                          {partner.type === "seller"
                            ? "Seller"
                            : "Partner Tailor"}
                        </Badge>
                        <Badge
                          variant={
                            partner.verificationStatus === "verified_demo"
                              ? "success"
                              : partner.verificationStatus === "rejected_demo"
                              ? "amber"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {formatVerificationLabel(partner.verificationStatus)}
                        </Badge>
                        {partner.operationalStatus === "suspended" && (
                          <Badge variant="amber" size="sm">
                            Suspended
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-950 break-words">
                        {partner.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {partner.city} · {partner.specialtyOrCategory}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setInspectedPartnerId(partner.id)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Details
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {partner.verificationStatus !== "verified_demo" &&
                      partner.operationalStatus === "active" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            setPendingAction({ partner, action: "verify" })
                          }
                        >
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Verify (Demo)
                        </Button>
                      )}
                    {partner.verificationStatus !== "rejected_demo" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPendingAction({ partner, action: "reject" })
                        }
                      >
                        <XCircle
                          className="h-3.5 w-3.5 text-red-500"
                          aria-hidden="true"
                        />
                        Reject Verification
                      </Button>
                    )}
                    {partner.operationalStatus === "active" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setPendingAction({ partner, action: "suspend" })
                        }
                      >
                        <PauseCircle
                          className="h-3.5 w-3.5 text-amber-600"
                          aria-hidden="true"
                        />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPendingAction({ partner, action: "reactivate" })
                        }
                      >
                        <PlayCircle
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Partner Detail Panel */}
          <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-5">
            {inspectedPartner ? (
              <div className="space-y-4">
                <div>
                  <Badge variant="neutral" size="sm">
                    Partner Profile Details
                  </Badge>
                  <h2 className="mt-2 text-xl font-extrabold text-slate-950">
                    {inspectedPartner.name}
                  </h2>
                  <p className="text-xs text-slate-600">
                    ID: {inspectedPartner.id} ·{" "}
                    {inspectedPartner.registrationSource}
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs">
                  <div>
                    <dt className="font-bold text-slate-700">Partner Role</dt>
                    <dd className="text-slate-600 capitalize">
                      {inspectedPartner.type}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">City</dt>
                    <dd className="text-slate-600">{inspectedPartner.city}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">
                      Specialty / Category
                    </dt>
                    <dd className="text-slate-600">
                      {inspectedPartner.specialtyOrCategory}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">Contact Email</dt>
                    <dd className="text-slate-600">
                      {inspectedPartner.email ?? "Not provided in demo seed"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">
                      Demo Verification Status
                    </dt>
                    <dd className="text-slate-600">
                      {formatVerificationLabel(
                        inspectedPartner.verificationStatus
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-700">
                      Operational Status
                    </dt>
                    <dd className="text-slate-600 capitalize">
                      {inspectedPartner.operationalStatus}
                    </dd>
                  </div>
                </dl>

                {inspectedPartner.rejectionReason && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <strong>Rejection Reason:</strong>{" "}
                    {inspectedPartner.rejectionReason}
                  </p>
                )}

                {inspectedPartner.suspensionReason && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                    <strong>Suspension Reason:</strong>{" "}
                    {inspectedPartner.suspensionReason}
                  </p>
                )}

                <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-xs text-slate-600">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  <p>
                    Suspending a partner blocks operational demo access for that
                    Seller or Tailor in WorkspaceRoleGuard without deleting
                    partner records.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Select a partner to inspect details.
              </p>
            )}
          </section>
        </div>
      )}

      <WorkspaceConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.action === "verify"
            ? `Mark "${pendingAction.partner.name}" Verified (Demo)?`
            : pendingAction?.action === "reject"
            ? `Reject Verification for "${pendingAction.partner.name}"?`
            : pendingAction?.action === "suspend"
            ? `Suspend Partner "${pendingAction.partner.name}"?`
            : `Reactivate Partner "${pendingAction?.partner.name ?? ""}"?`
        }
        description={
          pendingAction?.action === "verify"
            ? "Marks this partner Verified (Demo) for local session governance. This is not legal or KYB certification."
            : pendingAction?.action === "reject"
            ? "Logs a verification rejection reason in demo session state without deleting the partner."
            : pendingAction?.action === "suspend"
            ? "Pauses workspace operations for this partner until reactivated by Admin."
            : "Restores active operational status for this partner in demo session state."
        }
        confirmLabel={
          pendingAction?.action === "verify"
            ? "Confirm Verify (Demo)"
            : pendingAction?.action === "reject"
            ? "Confirm Reject"
            : pendingAction?.action === "suspend"
            ? "Confirm Suspend"
            : "Confirm Reactivate"
        }
        requireReason={
          pendingAction?.action === "reject" ||
          pendingAction?.action === "suspend"
        }
        reasonLabel="Governance Reason (minimum 5 characters)"
        reasonPlaceholder="e.g., Incomplete studio address or temporary policy review"
        onConfirm={handleConfirmPartnerAction}
        onCancel={() => setPendingAction(null)}
      />
    </WorkspaceShell>
  );
}

export default function AdminPartnersPage() {
  return (
    <WorkspaceRoleGuard workspaceId="admin">
      <AdminPartnersContent />
    </WorkspaceRoleGuard>
  );
}
