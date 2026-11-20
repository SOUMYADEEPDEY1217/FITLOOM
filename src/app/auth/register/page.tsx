"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, Scissors, Store, User, UserPlus } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import {
  RegisterSchema,
  extractZodFieldErrors,
} from "@/lib/auth-validation";
import {
  getDefaultLandingRouteForRole,
  getRoleDisplayLabel,
} from "@/lib/workspace-config";
import { sanitizeRedirectPath } from "@/lib/auth-routes";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RegisterRoleChoice = "customer" | "seller" | "tailor";
type RegisterFieldErrors = Partial<
  Record<"name" | "email" | "password", string>
>;

export default function RegisterPage() {
  const router = useRouter();
  const { user, loginMock, logoutMock, toast } = useFitloom();

  const [roleChoice, setRoleChoice] = useState<RegisterRoleChoice>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = RegisterSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fieldErrors = extractZodFieldErrors<"name" | "email" | "password">(
        parsed.error
      );
      setErrors(fieldErrors);
      toast({
        type: "error",
        title: "Check Registration Fields",
        message: "Please fix the highlighted fields before creating your demo account.",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    timerRef.current = setTimeout(() => {
      loginMock({
        name: parsed.data.name,
        email: parsed.data.email,
        role: roleChoice,
      });

      toast({
        type: "success",
        title: "Demo Account Created",
        message:
          roleChoice === "customer"
            ? `Welcome, ${parsed.data.name}! Let's calibrate your Body Profile next.`
            : `Welcome, ${parsed.data.name}! ${getRoleDisplayLabel(
                roleChoice
              )} demo session started.`,
      });

      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      const fallback =
        roleChoice === "customer"
          ? "/shop"
          : getDefaultLandingRouteForRole(roleChoice);
      router.push(sanitizeRedirectPath(nextParam, fallback));
    }, 250);
  }

  function handleSignOutCurrent() {
    logoutMock();
    toast({
      type: "info",
      title: "Signed Out",
      message: "Session reset to Guest mode.",
    });
  }

  return (
    <AuthShell
      backHref="/auth/login"
      backLabel="Back to Sign In"
      title="Create your FITLOOM account"
      subtitle="Start a demo session to save your Body Profile, compose looks, and try CUSTOMFIT tailoring."
      footer={
        <div className="space-y-3 text-center text-xs text-slate-600">
          <p>
            Already have a session?{" "}
            <Link
              href="/auth/login"
              className="rounded font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              Sign In
            </Link>
          </p>
          <p>
            Trouble signing in?{" "}
            <Link
              href="/auth/forgot-password"
              className="rounded font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      }
    >
      {/* Active Session Banner if already signed in */}
      {user.role !== "guest" && (
        <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
          <div className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">
                Active Session: {user.name} ({user.role})
              </p>
              <p className="text-[11px] text-emerald-800">
                Creating a new demo account replaces the active local session.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={user.role === "tailor" ? "/tailor" : "/dashboard"}>
              <Button type="button" size="sm" variant="secondary">
                Go to {user.role === "tailor" ? "Tailor Workspace" : "Dashboard"}
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleSignOutCurrent}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleRegister} noValidate className="mt-5 space-y-4">
        {/* Customer / Professional Role Selector */}
        <div>
          <span className="block text-xs font-semibold text-slate-700">
            Account Type
          </span>
          <div
            role="radiogroup"
            aria-label="Select account type"
            className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {(
              [
                { id: "customer", label: "Customer", Icon: User },
                { id: "seller", label: "Seller", Icon: Store },
                { id: "tailor", label: "Partner Tailor", Icon: Scissors },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={roleChoice === id}
                disabled={isSubmitting}
                onClick={() => setRoleChoice(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                  roleChoice === id
                    ? "border-[#6633EE] bg-violet-50/80 text-[#4C1D95]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          {roleChoice === "tailor" ? (
            <p className="mt-1.5 text-[11px] text-slate-600">
              Need workshop specialty setup?{" "}
              <Link
                href="/tailor/register"
                className="font-semibold text-[#6633EE] hover:underline"
              >
                Open Tailor Workshop Onboarding →
              </Link>
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Admin oversight roles can be tested from Sign In or Account Role Switcher.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-name"
            className="block text-xs font-semibold text-slate-700"
          >
            {roleChoice === "tailor" ? "Workshop or Full Name" : "Full Name"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            placeholder={
              roleChoice === "tailor" ? "Atelier Paradox" : "Riya Sharma"
            }
            className={cn(
              "mt-1",
              errors.name && "border-red-400 focus:ring-red-400/20"
            )}
          />
          {errors.name && (
            <p
              id="register-name-error"
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-slate-700"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? "register-email-error" : undefined
            }
            placeholder="riya@example.com"
            className={cn(
              "mt-1",
              errors.email && "border-red-400 focus:ring-red-400/20"
            )}
          />
          {errors.email && (
            <p
              id="register-email-error"
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-slate-700"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors({ ...errors, password: undefined });
                }
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? "register-password-error"
                  : "register-password-helper"
              }
              placeholder="Minimum 6 characters"
              className={cn(
                errors.password && "border-red-400 focus:ring-red-400/20"
              )}
            />
          </div>
          <p
            id="register-password-helper"
            className="mt-1 text-[11px] text-slate-500"
          >
            Use 6–64 characters. Stored only in temporary demo form state.
          </p>
          {errors.password && (
            <p
              id="register-password-error"
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          loadingText="Creating demo account..."
          className="w-full"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create Demo{" "}
          {roleChoice === "tailor" ? "Tailor" : "Customer"} Account
        </Button>
      </form>
    </AuthShell>
  );
}
