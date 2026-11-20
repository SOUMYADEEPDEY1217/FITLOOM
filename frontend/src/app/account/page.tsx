"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  Check,
  CheckCircle2,
  Info,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Shield,
  Sparkles,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useFitloom, MockRole } from "@/components/providers/fitloom-provider";
import { FitPreference, getFitPreferenceEaseCm } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ProfileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(50, "Full name cannot exceed 50 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address (e.g. name@domain.com).")
    .max(80, "Email cannot exceed 80 characters."),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits.")
    .max(18, "Phone number cannot exceed 18 characters.")
    .regex(
      /^[+]?[0-9\s-]{10,18}$/,
      "Enter a valid phone number (e.g. +91 98765 43210 or 10 digits).",
    ),
  city: z
    .string()
    .trim()
    .min(2, "City / Region must be at least 2 characters.")
    .max(50, "City cannot exceed 50 characters."),
});

type ProfileFormErrors = Partial<
  Record<"name" | "email" | "phone" | "city", string>
>;

const ROLES: Array<{ role: MockRole; label: string; desc: string }> = [
  {
    role: "customer",
    label: "Customer",
    desc: "Access Dashboard, Saved Looks, Wishlist, Orders & CUSTOMFIT.",
  },
  {
    role: "seller",
    label: "Seller",
    desc: "Access Seller Workspace, catalogue listings & standard fulfillment.",
  },
  {
    role: "tailor",
    label: "Partner Tailor",
    desc: "Access Tailor Dashboard, Order Queue & Production Tracking.",
  },
  {
    role: "admin",
    label: "Admin",
    desc: "Access Platform Oversight, Partner Verification & Governance.",
  },
  {
    role: "guest",
    label: "Guest (Signed Out)",
    desc: "Test protected-route guards on /dashboard, /orders, and workspaces.",
  },
];

const FIT_PREFERENCE_OPTIONS: Array<{
  value: FitPreference;
  label: string;
  easeNote: string;
  desc: string;
}> = [
  {
    value: "slim",
    label: "Slim Fit",
    easeNote: "+5 cm ease",
    desc: "Tapered torso darts and contour sleeve fit.",
  },
  {
    value: "regular",
    label: "Regular Fit",
    easeNote: "+8 cm ease",
    desc: "Standard classic drape engineered for all-day comfort.",
  },
  {
    value: "relaxed",
    label: "Relaxed Fit",
    easeNote: "+12 cm ease",
    desc: "Generous contemporary silhouette with fluid motion.",
  },
  {
    value: "oversized",
    label: "Oversized Fit",
    easeNote: "+15 cm ease",
    desc: "Intentional dropped-shoulder architectural volume.",
  },
];

function getMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AccountPage() {
  const {
    user,
    switchRole,
    logoutMock,
    updateUserProfile,
    bodyProfile,
    hasBodyProfile,
    updateFitPreference,
    toast,
  } = useFitloom();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "+91 98765 43210",
    city: user.city || "Kolkata",
    fitPreference: bodyProfile.fitPreference || "regular",
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize form when user or bodyProfile updates outside of edit mode
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "+91 98765 43210",
        city: user.city || "Kolkata",
        fitPreference: bodyProfile.fitPreference || "regular",
      });
      setErrors({});
    }
  }, [user, bodyProfile, isEditing]);

  function handleStartEditing() {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "+91 98765 43210",
      city: user.city || "Kolkata",
      fitPreference: bodyProfile.fitPreference || "regular",
    });
    setErrors({});
    setIsEditing(true);
  }

  function handleCancel() {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "+91 98765 43210",
      city: user.city || "Kolkata",
      fitPreference: bodyProfile.fitPreference || "regular",
    });
    setErrors({});
    setIsEditing(false);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const validationResult = ProfileFormSchema.safeParse({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
    });

    if (!validationResult.success) {
      const fieldErrors: ProfileFormErrors = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProfileFormErrors;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSaving(false);
      toast({
        type: "error",
        title: "Validation Error",
        message:
          "Please correct the highlighted fields before saving your profile.",
      });
      return;
    }

    // Persist into FitloomProvider shared state
    const updateResult = updateUserProfile({
      name: validationResult.data.name,
      email: validationResult.data.email,
      phone: validationResult.data.phone,
      city: validationResult.data.city,
    });

    if (!updateResult.ok) {
      setIsSaving(false);
      toast({
        type: "error",
        title: "Update Failed",
        message: updateResult.error || "Could not save profile changes.",
      });
      return;
    }

    // Update fit preference independently without toggling Body Profile completeness
    if (formData.fitPreference !== bodyProfile.fitPreference) {
      updateFitPreference(formData.fitPreference);
    }

    setIsSaving(false);
    setIsEditing(false);
    setErrors({});

    toast({
      type: "success",
      title: "Profile Saved",
      message:
        "Your personal information and fit preferences are updated across your active session.",
    });
  }

  function handleRoleSwitch(role: MockRole, label: string) {
    if (user.role === role) return;
    if (isEditing) {
      setIsEditing(false);
    }
    switchRole(role);
    toast({
      type: "info",
      title: "Session Role Changed",
      message: `Active mock session switched to ${label}.`,
    });
  }

  function handleLogout() {
    if (isEditing) {
      setIsEditing(false);
    }
    logoutMock();
    toast({
      type: "info",
      title: "Signed Out",
      message: "Current session switched to Guest mode.",
    });
  }

  function handleQuickFitPreferenceChange(pref: FitPreference) {
    if (bodyProfile.fitPreference === pref) return;
    const res = updateFitPreference(pref);
    if (res.ok) {
      setFormData((prev) => ({ ...prev, fitPreference: pref }));
      toast({
        type: hasBodyProfile ? "success" : "info",
        title: hasBodyProfile
          ? "Fit Preference Calibrated"
          : "Fit Preference Saved",
        message: hasBodyProfile
          ? `Default ease adjusted to ${pref.toUpperCase()} (+${getFitPreferenceEaseCm(
              pref,
            )} cm).`
          : `Saved preferred silhouette as ${pref.toUpperCase()} (+${getFitPreferenceEaseCm(
              pref,
            )} cm). Create a Body Profile to apply garment sizing.`,
      });
    }
  }

  const monogram = getMonogram(user.name || "Customer");
  const isGuest = user.role === "guest";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-violet-100 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          Customer Account
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Manage your personal details, fit preferences, and active demo role.
        </p>
      </div>

      {/* Guest Notice Banner if Guest */}
      {isGuest && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold">Browsing as Guest</p>
              <p className="text-xs text-amber-800">
                You are currently in a read-only guest session. Switch to the
                Customer role below or sign in to edit personal details and
                synchronize fit calibrations.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleRoleSwitch("customer", "Customer")}
            className="self-start sm:self-auto"
          >
            Switch to Customer
          </Button>
        </div>
      )}

      {/* Profile Card (View Mode / Edit Mode) */}
      <section
        aria-labelledby="personal-info-heading"
        className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7E2DF2] to-[#5522DD] text-xl font-black text-white shadow-md shadow-violet-500/20 ring-4 ring-violet-50 sm:h-18 sm:w-18 sm:text-2xl"
            >
              {monogram}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="personal-info-heading"
                  className="text-xl font-extrabold text-slate-950 sm:text-2xl"
                >
                  {isGuest ? "Guest Visitor" : user.name}
                </h2>
                <Badge
                  variant={
                    user.role === "customer"
                      ? "success"
                      : user.role === "tailor"
                        ? "default"
                        : "neutral"
                  }
                >
                  {user.role === "customer"
                    ? "Verified Customer"
                    : user.role === "tailor"
                      ? "Partner Tailor"
                      : "Guest Session"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {isGuest
                  ? "Unauthenticated local exploration mode"
                  : `Member since ${user.memberSince || "November 2026"} · Session Active`}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <Button
              type="button"
              variant="outline"
              disabled={isGuest}
              onClick={handleStartEditing}
              className="self-start sm:self-auto"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Content */}
        {!isEditing ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Full Name
                </span>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {user.name || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email Address
                </span>
                <p className="mt-1 text-sm font-bold text-slate-900 break-all">
                  {user.email || "No email assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Phone className="h-3 w-3 text-slate-400" />
                  Phone Number
                </span>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {user.phone || "+91 98765 43210"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  Primary Location
                </span>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {user.city || "Kolkata, India"}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[#6633EE]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-950">
                    {hasBodyProfile
                      ? "Active Fit Intelligence Baseline"
                      : "Body Profile Not Configured"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {hasBodyProfile ? (
                      <>
                        Calibrated Fit:{" "}
                        <strong className="capitalize text-[#4C1D95]">
                          {bodyProfile.fitPreference} fit
                        </strong>{" "}
                        (+{getFitPreferenceEaseCm(bodyProfile.fitPreference)} cm
                        ease)
                      </>
                    ) : (
                      <>
                        Measurements are cleared or not set yet. Preferred fit:{" "}
                        <strong className="capitalize text-[#4C1D95]">
                          {bodyProfile.fitPreference}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/body-profile">
                  <Button variant="outline" size="sm">
                    <Ruler className="h-3.5 w-3.5" />
                    {hasBodyProfile
                      ? "Full Body Profile"
                      : "Create Body Profile"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form
            onSubmit={handleSaveProfile}
            noValidate
            className="mt-6 space-y-6"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="profile-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  placeholder="e.g. Riya Sharma"
                  className={cn(
                    "mt-1.5",
                    errors.name && "border-red-400 focus:ring-red-400/20",
                  )}
                />
                {errors.name && (
                  <p
                    id="name-error"
                    role="alert"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="profile-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email)
                      setErrors({ ...errors, email: undefined });
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  placeholder="e.g. riya@example.com"
                  className={cn(
                    "mt-1.5",
                    errors.email && "border-red-400 focus:ring-red-400/20",
                  )}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="profile-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone)
                      setErrors({ ...errors, phone: undefined });
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  placeholder="e.g. +91 98765 43210"
                  className={cn(
                    "mt-1.5",
                    errors.phone && "border-red-400 focus:ring-red-400/20",
                  )}
                />
                {errors.phone && (
                  <p
                    id="phone-error"
                    role="alert"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* City / Region */}
              <div>
                <label
                  htmlFor="profile-city"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  City / Region <span className="text-red-500">*</span>
                </label>
                <Input
                  id="profile-city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (errors.city) setErrors({ ...errors, city: undefined });
                  }}
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  placeholder="e.g. Kolkata"
                  className={cn(
                    "mt-1.5",
                    errors.city && "border-red-400 focus:ring-red-400/20",
                  )}
                />
                {errors.city && (
                  <p
                    id="city-error"
                    role="alert"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.city}
                  </p>
                )}
              </div>
            </div>

            {/* Fit Preference Selection in Edit Mode */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Default Fit Calibration Preference
              </label>
              <p className="mt-0.5 text-xs text-slate-600">
                Controls target ease calculations across Shop and Style Studio
                sizing recommendations.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {FIT_PREFERENCE_OPTIONS.map((opt) => {
                  const selected = formData.fitPreference === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, fitPreference: opt.value })
                      }
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        selected
                          ? "border-[#6633EE] bg-white shadow-xs"
                          : "border-slate-200 bg-white/70 hover:border-violet-300",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {opt.label}
                        </span>
                        <Badge
                          variant={selected ? "default" : "secondary"}
                          size="sm"
                        >
                          {opt.easeNote}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" loading={isSaving} loadingText="Saving...">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Account Preferences: Fashion & Fit Calibration */}
      <section
        aria-labelledby="preferences-heading"
        className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <h2
              id="preferences-heading"
              className="flex items-center gap-2 text-lg font-bold text-slate-950"
            >
              <Ruler className="h-4 w-4 text-[#6633EE]" />
              Fashion &amp; Fit Calibration Preferences
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {hasBodyProfile
                ? "Personal fit bias applied by the deterministic Fit Intelligence algorithm to garment size charts."
                : "Default silhouette preference saved for your session. Create a Body Profile to apply it to Fit Intelligence recommendations."}
            </p>
          </div>
          <Link href="/body-profile">
            <Button variant="ghost" size="sm">
              {hasBodyProfile ? "Edit Body Profile →" : "Create Body Profile →"}
            </Button>
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FIT_PREFERENCE_OPTIONS.map((opt) => {
            const active = bodyProfile.fitPreference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleQuickFitPreferenceChange(opt.value)}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  active
                    ? "border-[#6633EE] bg-violet-50/70 shadow-xs"
                    : "border-slate-200 bg-white hover:border-violet-300",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-950">
                      {opt.label}
                    </span>
                    {active ? (
                      <Badge variant="default" size="sm">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        {opt.easeNote}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-[#6633EE]">
                  {active ? "Currently Selected" : "Click to Apply"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Role Session Switcher (Preserved for Demo / Testing, Enhanced with Toast) */}
      <section
        aria-labelledby="role-switcher-heading"
        className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xs sm:p-8 space-y-5"
      >
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="role-switcher-heading"
              className="flex items-center gap-2 text-lg font-bold text-slate-950"
            >
              <Shield className="h-4 w-4 text-[#6633EE]" />
              Active Session &amp; Demo Role Switcher
            </h2>
            <Badge variant="default">Demo Session Context</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Switch between demo user personas to inspect role guards, customer
            dashboard, and partner tailor workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map((item) => {
            const active = user.role === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => handleRoleSwitch(item.role, item.label)}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  active
                    ? "border-[#6633EE] bg-violet-50/70 shadow-xs"
                    : "border-slate-200 bg-white hover:border-violet-300",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-950">
                      {item.label}
                    </p>
                    {active && (
                      <Badge variant="default" size="sm">
                        <UserCheck className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-[#6633EE]">
                  {active ? "Active Session" : `Switch to ${item.label}`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <User className="h-4 w-4" />
              Customer Dashboard
            </Button>
          </Link>
          <Link href="/seller">
            <Button variant="outline">
              <Shield className="h-4 w-4" />
              Seller Workspace
            </Button>
          </Link>
          <Link href="/tailor">
            <Button variant="outline">
              <Shield className="h-4 w-4" />
              Tailor Workspace
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">
              <Shield className="h-4 w-4" />
              Admin Workspace
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out (Guest)
          </Button>
        </div>
      </section>

      {/* Security & Backend Governance Notice (Distinguishing unsupported settings) */}
      <section
        aria-labelledby="security-governance-heading"
        className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 text-xs text-slate-700"
      >
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]" />
          <div>
            <h3
              id="security-governance-heading"
              className="font-bold text-slate-950"
            >
              Account Security &amp; Communications Notice
            </h3>
            <p className="mt-1 leading-relaxed text-slate-600">
              Live authentication credentials, password resets, SMS
              notifications, and privacy consent management will be connected to
              the PostgreSQL database and Better Auth engine in Phase P3. All
              personal information and fit preference updates modified above are
              instantly synchronized in shared frontend state for the duration
              of this session.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
