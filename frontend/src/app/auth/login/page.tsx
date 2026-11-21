"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogOut,
  Scissors,
  Shield,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import {
  LoginSchema,
  deriveDisplayNameFromEmail,
  extractZodFieldErrors,
  otpSchema,
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

type AuthRoleChoice = "customer" | "seller" | "tailor" | "admin";
const ROLE_DEMO_EMAILS: Record<AuthRoleChoice, string> = {
  customer: "riya.demo@fitloom.local",
  seller: "seller.demo@fitloom.local",
  tailor: "tailor.demo@fitloom.local",
  admin: "admin.demo@fitloom.local",
};
type LoginFieldErrors = Partial<Record<"email" | "password" | "otp", string>>;

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, loginMock, logoutMock, switchRole, toast } = useFitloom();

  const [roleChoice, setRoleChoice] = useState<AuthRoleChoice>("customer");
  const [email, setEmail] = useState("riya.demo@fitloom.local");
  const [password, setPassword] = useState("demo1234");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("123456");
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleRoleChoiceChange(nextRole: AuthRoleChoice) {
    if (isSubmitting) return;
    setRoleChoice(nextRole);
    setErrors({});
    const currentEmail = email.trim().toLowerCase();
    const isKnownDemoEmail = Object.values(ROLE_DEMO_EMAILS).includes(currentEmail);
    if (isKnownDemoEmail) {
      setEmail(ROLE_DEMO_EMAILS[nextRole]);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = extractZodFieldErrors<"email" | "password">(
        parsed.error
      );
      setErrors(fieldErrors);
      toast({
        type: "error",
        title: "Invalid Sign-In Input",
        message: "Please review the highlighted email or password field.",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const isKnownDemo = Object.values(ROLE_DEMO_EMAILS).includes(
      email.trim().toLowerCase()
    );
    if (!isKnownDemo) {
      const result = await signIn(email, password);
      setIsSubmitting(false);
      if (result.ok) {
        toast({
          type: "success",
          title: "Signed In",
          message: "Welcome back to FITLOOM.",
        });
        const nextParam =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("next")
            : null;
        router.push(sanitizeRedirectPath(nextParam, "/shop"));
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast({
          type: "error",
          title: "Sign-In Failed",
          message: result.error || "Invalid credentials. Please try again.",
        });
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setOtpStep(true);
      toast({
        type: "info",
        title: "Simulated OTP Step",
        message:
          "Enter any 6-digit demo code (e.g. 123456) to enter your session.",
      });
    }, 250);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedOtp = otpSchema.safeParse(otp);
    if (!parsedOtp.success) {
      setErrors({
        otp:
          parsedOtp.error.issues[0]?.message ??
          "Enter any 6-digit simulated OTP (e.g. 123456).",
      });
      toast({
        type: "error",
        title: "Invalid Verification Code",
        message: "Enter a 6-digit numeric demo code (e.g. 123456).",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const normalizedEmail = email.trim();
    const displayName = deriveDisplayNameFromEmail(normalizedEmail);

    timerRef.current = setTimeout(() => {
      loginMock({
        name: displayName,
        email: normalizedEmail,
        role: roleChoice,
      });
      toast({
        type: "success",
        title: "Signed In",
        message: `Welcome, ${displayName}! Active ${getRoleDisplayLabel(
          roleChoice
        )} demo session started.`,
      });
      const nextParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.push(
        sanitizeRedirectPath(nextParam, getDefaultLandingRouteForRole(roleChoice))
      );
    }, 250);
  }

  function handleDemoShortcut(role: AuthRoleChoice) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    switchRole(role);
    toast({
      type: "success",
      title: "Demo Session Active",
      message: `Switched to ${getRoleDisplayLabel(role)} demo session.`,
    });
    const nextParam =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
    router.push(
      sanitizeRedirectPath(nextParam, getDefaultLandingRouteForRole(role))
    );
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
      backHref="/"
      backLabel="Back to Home"
      title={otpStep ? "Verify Simulated OTP" : "Welcome back to FITLOOM"}
      subtitle={
        otpStep
          ? `Confirming frontend demo session for ${email.trim()} (${getRoleDisplayLabel(
              roleChoice
            )}).`
          : "Sign in to access your calibrated Body Profile, Style Studio, and workspaces."
      }
      footer={
        <div className="space-y-4">
          {/* Quick Demo Role Shortcuts */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Demo Role Shortcuts
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleDemoShortcut("customer")}
              >
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                Demo Customer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleDemoShortcut("seller")}
              >
                <Store className="h-3.5 w-3.5" aria-hidden="true" />
                Demo Seller
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleDemoShortcut("tailor")}
              >
                <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                Demo Tailor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => handleDemoShortcut("admin")}
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Demo Admin
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              All demo roles run on local browser session state only.
            </p>
          </div>

          <p className="text-center text-xs text-slate-600">
            New to FITLOOM?{" "}
            <Link
              href="/auth/register"
              className="rounded font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              Create an account
            </Link>
          </p>
        </div>
      }
    >
      {/* Active Session Status Notice if already signed in */}
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
                You can return to your workspace or sign in with another demo
                identity below.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={getDefaultLandingRouteForRole(user.role)}>
              <Button type="button" size="sm" variant="secondary">
                Go to{" "}
                {user.role === "customer"
                  ? "Dashboard"
                  : `${getRoleDisplayLabel(user.role)} Workspace`}
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

      {!otpStep ? (
        <form onSubmit={handleLogin} noValidate className="mt-5 space-y-4">
          {/* Customer / Professional Role Selector */}
          <div>
            <span className="block text-xs font-semibold text-slate-700">
              Account Role
            </span>
            <div
              role="radiogroup"
              aria-label="Select account role"
              className="mt-1.5 grid grid-cols-2 gap-2"
            >
              {(
                [
                  { id: "customer", label: "Customer", Icon: User },
                  { id: "seller", label: "Seller", Icon: Store },
                  { id: "tailor", label: "Partner Tailor", Icon: Scissors },
                  { id: "admin", label: "Admin", Icon: Shield },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={roleChoice === id}
                  disabled={isSubmitting}
                  onClick={() => handleRoleChoiceChange(id)}
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
          </div>

          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              placeholder="you@example.com"
              className={cn(
                "mt-1",
                errors.email && "border-red-400 focus:ring-red-400/20"
              )}
            />
            {errors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="rounded text-xs font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="mt-1">
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
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
                  errors.password ? "login-password-error" : undefined
                }
                placeholder="Minimum 6 characters"
                className={cn(
                  errors.password && "border-red-400 focus:ring-red-400/20"
                )}
              />
            </div>
            {errors.password && (
              <p
                id="login-password-error"
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
            loadingText="Validating..."
            className="w-full"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Continue to Simulated OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="login-otp"
              className="block text-xs font-semibold text-slate-700"
            >
              6-Digit Simulated OTP <span className="text-red-500">*</span>
            </label>
            <Input
              id="login-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={isSubmitting}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (errors.otp) setErrors({ ...errors, otp: undefined });
              }}
              aria-invalid={Boolean(errors.otp)}
              aria-describedby={
                errors.otp ? "login-otp-error" : "login-otp-helper"
              }
              maxLength={6}
              className={cn(
                "mt-1 text-center font-mono text-base tracking-[0.4em]",
                errors.otp && "border-red-400 focus:ring-red-400/20"
              )}
            />
            <p id="login-otp-helper" className="mt-1 text-[11px] text-slate-500">
              Demo mode accepts any 6 digits (e.g. 123456). No SMS or email is
              dispatched.
            </p>
            {errors.otp && (
              <p
                id="login-otp-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {errors.otp}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Starting session..."
            className="w-full"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Verify &amp; Enter{" "}
            {roleChoice === "customer"
              ? "Dashboard"
              : `${getRoleDisplayLabel(roleChoice)} Workspace`}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={() => {
              setOtpStep(false);
              setErrors({});
            }}
            className="w-full"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Change Email or Role
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
