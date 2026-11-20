"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Info, Scissors, UserCheck } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoleDisplayLabel } from "@/lib/workspace-config";
import {
  type TailorRegistrationInput,
  TailorRegistrationSchema,
} from "@/lib/tailor-workspace-utils";

type RegistrationFieldErrors = Partial<
  Record<keyof TailorRegistrationInput, string>
>;

interface SubmittedDraft {
  workshop: string;
  city: string;
  specialty: string;
  contactEmail: string;
  weeklyCapacityOrders: number;
}

export default function TailorRegisterPage() {
  const router = useRouter();
  const { user, loginMock, updateTailorWorkshopProfile, toast } = useFitloom();

  const [workshop, setWorkshop] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("Bespoke Shirts & Blazers");
  const [contactEmail, setContactEmail] = useState("");
  const [weeklyCapacityOrders, setWeeklyCapacityOrders] = useState("10");
  const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
  const [submittedDraft, setSubmittedDraft] = useState<SubmittedDraft | null>(
    null
  );

  function clearError(field: keyof TailorRegistrationInput) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = TailorRegistrationSchema.safeParse({
      workshop,
      city,
      specialty,
      contactEmail,
      weeklyCapacityOrders,
    });

    if (!parsed.success) {
      const nextErrors: RegistrationFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TailorRegistrationInput | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      toast({
        type: "error",
        title: "Check Workshop Details",
        message:
          parsed.error.issues[0]?.message ??
          "Please fix the highlighted fields.",
      });
      return;
    }

    setFieldErrors({});
    setSubmittedDraft(parsed.data);
    toast({
      type: "info",
      title: "Demo Workshop Application Prepared",
      message:
        "Your session role was not changed. Use the explicit button below to preview Tailor Demo mode.",
    });
  }

  function handleActivateTailorDemo() {
    if (!submittedDraft) return;
    loginMock({
      name: submittedDraft.workshop,
      email: submittedDraft.contactEmail,
      role: "tailor",
      city: submittedDraft.city,
    });
    updateTailorWorkshopProfile({
      workshopName: submittedDraft.workshop,
      city: submittedDraft.city,
      specialty: submittedDraft.specialty,
      weeklyCapacityOrders: submittedDraft.weeklyCapacityOrders,
      turnaroundDays: 6,
      acceptingCustomOrders: true,
    });
    toast({
      type: "success",
      title: "Tailor Demo Session Active",
      message: `Switched demo session to ${submittedDraft.workshop}.`,
    });
    router.push("/tailor");
  }

  const currentRoleLabel = getRoleDisplayLabel(user.role);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-2">
      <Link
        href={user.role === "tailor" ? "/tailor" : "/"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#6633EE]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {user.role === "tailor" ? "Back to Tailor Dashboard" : "Back to Home"}
      </Link>

      <div className="rounded-3xl border border-violet-200/80 bg-white/95 p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6633EE]">
          Atelier Onboarding · Session Demo
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold text-slate-950">
          Partner Tailor Application
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Preview onboarding for FITLOOM&apos;s CUSTOMFIT atelier network. This
          frontend demo does not permanently register, store, or verify
          workshops.
        </p>

        {user.role === "tailor" && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-3 text-xs text-slate-700">
            <span>
              You are already in a Tailor Demo session (
              <strong>{user.name}</strong>).
            </span>
            <Link href="/tailor" className="shrink-0 font-semibold text-[#6633EE] hover:underline">
              Open Dashboard →
            </Link>
          </div>
        )}

        {submittedDraft ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950">
              <div className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    Application Draft Prepared (Unverified Demo)
                  </p>
                  <p>
                    <strong>Workshop:</strong> {submittedDraft.workshop} (
                    {submittedDraft.city})
                  </p>
                  <p>
                    <strong>Specialty:</strong> {submittedDraft.specialty} ·{" "}
                    {submittedDraft.weeklyCapacityOrders} orders/week
                  </p>
                  <p>
                    <strong>Contact:</strong> {submittedDraft.contactEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
                aria-hidden="true"
              />
              <p className="leading-relaxed">
                <strong>No Automatic Role Switch:</strong> Your current session
                remains <strong>{currentRoleLabel}</strong>, and this draft has
                not been permanently registered or verified. Click below only if
                you want to activate Tailor Demo mode for this workshop.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                className="w-full"
                onClick={handleActivateTailorDemo}
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                Activate Tailor Demo Session &amp; Open Dashboard
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSubmittedDraft(null)}
              >
                Edit Application Draft
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="reg-workshop"
                className="block text-xs font-semibold text-slate-700"
              >
                Workshop / Studio Name
              </label>
              <Input
                id="reg-workshop"
                value={workshop}
                onChange={(e) => {
                  setWorkshop(e.target.value);
                  clearError("workshop");
                }}
                placeholder="Atelier Paradox"
                aria-invalid={Boolean(fieldErrors.workshop)}
                className="mt-1"
              />
              {fieldErrors.workshop && (
                <p
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {fieldErrors.workshop}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-city"
                  className="block text-xs font-semibold text-slate-700"
                >
                  City
                </label>
                <Input
                  id="reg-city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearError("city");
                  }}
                  placeholder="Kolkata"
                  aria-invalid={Boolean(fieldErrors.city)}
                  className="mt-1"
                />
                {fieldErrors.city && (
                  <p
                    role="alert"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {fieldErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-capacity"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Weekly Capacity (orders)
                </label>
                <Input
                  id="reg-capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  step={1}
                  value={weeklyCapacityOrders}
                  onChange={(e) => {
                    setWeeklyCapacityOrders(e.target.value);
                    clearError("weeklyCapacityOrders");
                  }}
                  aria-invalid={Boolean(fieldErrors.weeklyCapacityOrders)}
                  className="mt-1"
                />
                {fieldErrors.weeklyCapacityOrders && (
                  <p
                    role="alert"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {fieldErrors.weeklyCapacityOrders}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Workshop Contact Email
              </label>
              <Input
                id="reg-email"
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  clearError("contactEmail");
                }}
                placeholder="studio@example.com"
                aria-invalid={Boolean(fieldErrors.contactEmail)}
                className="mt-1"
              />
              {fieldErrors.contactEmail && (
                <p
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {fieldErrors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-specialty"
                className="block text-xs font-semibold text-slate-700"
              >
                Primary Specialty
              </label>
              <Input
                id="reg-specialty"
                value={specialty}
                onChange={(e) => {
                  setSpecialty(e.target.value);
                  clearError("specialty");
                }}
                aria-invalid={Boolean(fieldErrors.specialty)}
                className="mt-1"
              />
              {fieldErrors.specialty && (
                <p
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {fieldErrors.specialty}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full">
              <Scissors className="h-4 w-4" aria-hidden="true" />
              Submit Demo Application
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
