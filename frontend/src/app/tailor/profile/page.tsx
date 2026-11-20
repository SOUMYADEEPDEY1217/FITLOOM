"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info, Save } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TailorWorkshopProfileInput } from "@/lib/tailor-workspace-utils";

type ProfileFieldErrors = Partial<
  Record<keyof TailorWorkshopProfileInput, string>
>;

function TailorProfileContent() {
  const { tailorWorkshopProfile, updateTailorWorkshopProfile, toast } =
    useFitloom();

  const [workshopName, setWorkshopName] = useState(
    tailorWorkshopProfile.workshopName
  );
  const [city, setCity] = useState(tailorWorkshopProfile.city);
  const [specialty, setSpecialty] = useState(tailorWorkshopProfile.specialty);
  const [weeklyCapacityOrders, setWeeklyCapacityOrders] = useState(
    String(tailorWorkshopProfile.weeklyCapacityOrders)
  );
  const [turnaroundDays, setTurnaroundDays] = useState(
    String(tailorWorkshopProfile.turnaroundDays)
  );
  const [acceptingCustomOrders, setAcceptingCustomOrders] = useState(
    tailorWorkshopProfile.acceptingCustomOrders
  );
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setWorkshopName(tailorWorkshopProfile.workshopName);
    setCity(tailorWorkshopProfile.city);
    setSpecialty(tailorWorkshopProfile.specialty);
    setWeeklyCapacityOrders(String(tailorWorkshopProfile.weeklyCapacityOrders));
    setTurnaroundDays(String(tailorWorkshopProfile.turnaroundDays));
    setAcceptingCustomOrders(tailorWorkshopProfile.acceptingCustomOrders);
  }, [tailorWorkshopProfile]);

  function clearFieldError(field: keyof TailorWorkshopProfileInput) {
    setSavedNotice(false);
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = updateTailorWorkshopProfile({
      workshopName,
      city,
      specialty,
      weeklyCapacityOrders,
      turnaroundDays,
      acceptingCustomOrders,
    });

    if (!result.ok) {
      setSavedNotice(false);
      setFieldErrors(result.fieldErrors ?? {});
      toast({
        type: "error",
        title: "Invalid Workshop Settings",
        message:
          result.error ?? "Please correct the highlighted fields and try again.",
      });
      return;
    }

    setFieldErrors({});
    setSavedNotice(true);
    toast({
      type: "success",
      title: "Workshop Profile Updated",
      message: `${result.profile?.workshopName ?? workshopName} settings saved for this session (${result.profile?.weeklyCapacityOrders ?? weeklyCapacityOrders} orders/week).`,
    });
  }

  return (
    <WorkspaceShell
      workspaceId="tailor"
      title={`${tailorWorkshopProfile.workshopName} — Workshop Profile`}
      description="Configure workshop specialty, turnaround time, and numeric weekly stitching capacity for this session."
      actions={
        <Link href="/tailor">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </Link>
      }
    >
      <form
        onSubmit={handleSave}
        noValidate
        className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6"
      >
        <div>
          <label
            htmlFor="workshop-name"
            className="block text-xs font-semibold text-slate-700"
          >
            Workshop Name
          </label>
          <Input
            id="workshop-name"
            value={workshopName}
            onChange={(e) => {
              setWorkshopName(e.target.value);
              clearFieldError("workshopName");
            }}
            aria-invalid={Boolean(fieldErrors.workshopName)}
            className="mt-1"
          />
          {fieldErrors.workshopName && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.workshopName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="workshop-city"
              className="block text-xs font-semibold text-slate-700"
            >
              Workshop City
            </label>
            <Input
              id="workshop-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearFieldError("city");
              }}
              aria-invalid={Boolean(fieldErrors.city)}
              className="mt-1"
            />
            {fieldErrors.city && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.city}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="workshop-specialty"
              className="block text-xs font-semibold text-slate-700"
            >
              Primary Specialty
            </label>
            <Input
              id="workshop-specialty"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                clearFieldError("specialty");
              }}
              aria-invalid={Boolean(fieldErrors.specialty)}
              className="mt-1"
            />
            {fieldErrors.specialty && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.specialty}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="weekly-capacity-orders"
              className="block text-xs font-semibold text-slate-700"
            >
              Weekly Stitching Capacity (orders / week)
            </label>
            <Input
              id="weekly-capacity-orders"
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              step={1}
              value={weeklyCapacityOrders}
              onChange={(e) => {
                setWeeklyCapacityOrders(e.target.value);
                clearFieldError("weeklyCapacityOrders");
              }}
              aria-invalid={Boolean(fieldErrors.weeklyCapacityOrders)}
              className="mt-1"
            />
            {fieldErrors.weeklyCapacityOrders && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.weeklyCapacityOrders}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="turnaround-days"
              className="block text-xs font-semibold text-slate-700"
            >
              Standard Turnaround (days)
            </label>
            <Input
              id="turnaround-days"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              step={1}
              value={turnaroundDays}
              onChange={(e) => {
                setTurnaroundDays(e.target.value);
                clearFieldError("turnaroundDays");
              }}
              aria-invalid={Boolean(fieldErrors.turnaroundDays)}
              className="mt-1"
            />
            {fieldErrors.turnaroundDays && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.turnaroundDays}
              </p>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={acceptingCustomOrders}
            onChange={(e) => {
              setAcceptingCustomOrders(e.target.checked);
              setSavedNotice(false);
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#6633EE] focus:ring-[#6633EE]"
          />
          <span>
            <strong className="block text-slate-900">
              Accepting New CUSTOMFIT Orders
            </strong>
            Toggle whether your workshop displays as open for new made-to-measure
            requests in this demo session.
          </span>
        </label>

        {savedNotice && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            Workshop settings saved in session state.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Workshop Profile
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setWorkshopName(tailorWorkshopProfile.workshopName);
              setCity(tailorWorkshopProfile.city);
              setSpecialty(tailorWorkshopProfile.specialty);
              setWeeklyCapacityOrders(
                String(tailorWorkshopProfile.weeklyCapacityOrders)
              );
              setTurnaroundDays(String(tailorWorkshopProfile.turnaroundDays));
              setAcceptingCustomOrders(
                tailorWorkshopProfile.acceptingCustomOrders
              );
              setFieldErrors({});
              setSavedNotice(false);
            }}
          >
            Reset Unsaved Edits
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/45 p-3 text-xs text-slate-600">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
            aria-hidden="true"
          />
          <p>
            Changes update active FitloomProvider session state only. No
            external database persistence is connected in this frontend demo.
          </p>
        </div>
      </form>
    </WorkspaceShell>
  );
}

export default function TailorProfilePage() {
  return (
    <WorkspaceRoleGuard workspaceId="tailor">
      <TailorProfileContent />
    </WorkspaceRoleGuard>
  );
}
