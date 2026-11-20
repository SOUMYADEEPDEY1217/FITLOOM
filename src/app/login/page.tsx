"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { LoginSchema, extractZodFieldErrors } from "@/lib/auth-validation";
import { sanitizeRedirectPath } from "@/lib/auth-routes";
import { AuthSplitShowcase } from "@/components/auth/AuthSplitShowcase";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { loginMock, toast } = useFitloom();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<"email" | "password", string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<{
    valid: boolean;
    email?: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
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
        title: "Validation Error",
        message: "Please enter a valid email address and password.",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedStatus({ valid: true, email: parsed.data.email });
      toast({
        type: "info",
        title: "Demo Authentication Scope",
        message:
          "Input validated. Live authentication infrastructure is scheduled for Phase P3.",
      });
    }, 300);
  }

  function handleDemoCustomerLogin() {
    loginMock({
      name: "Riya Sharma",
      email: email.trim() || "riya.demo@fitloom.local",
      role: "customer",
    });
    toast({
      type: "success",
      title: "Customer Session Active",
      message: "Exploring FITLOOM as Riya Sharma (Demo Customer).",
    });
    const destination = sanitizeRedirectPath(nextParam, "/shop");
    router.push(destination);
  }

  return (
    <AuthSplitShowcase>
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to FITLOOM
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-[#1A0D2E]">
        Welcome Back
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Access your AI Fashion Intelligence, Fit Calibration, and personalized
        wardrobe.
      </p>

      {submittedStatus?.valid ? (
        <div className="mt-7 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs text-emerald-950">
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">Credentials Validated (Demo Scope)</p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                Email <code className="font-semibold">{submittedStatus.email}</code>{" "}
                and password passed client validation. Live authentication
                infrastructure is scheduled for <strong>Phase P3</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-200/70 pt-3.5">
            <p className="text-[11px] font-medium text-emerald-900">
              Continue into your FITLOOM demo session?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleDemoCustomerLogin}
                className="h-9 rounded-full bg-gradient-to-r from-[#7E2DF2] to-[#4E1A6B] px-4 text-xs font-semibold text-white hover:brightness-110"
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Enter as Demo Customer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmittedStatus(null)}
                className="h-9 rounded-full border-emerald-300 text-xs text-emerald-900 hover:bg-emerald-100"
              >
                Edit Credentials
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#1A0D2E]"
            >
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="Enter your email"
                className={`h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm text-[#1A0D2E] placeholder:text-slate-400 focus-visible:border-[#7E2DF2] focus-visible:ring-[#C4B5FD] ${
                  errors.email
                    ? "border-rose-400 focus-visible:ring-rose-300"
                    : ""
                }`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p
                id="login-email-error"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#1A0D2E]"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="Enter your password"
                className={`h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm text-[#1A0D2E] placeholder:text-slate-400 focus-visible:border-[#7E2DF2] focus-visible:ring-[#C4B5FD] ${
                  errors.password
                    ? "border-rose-400 focus-visible:ring-rose-300"
                    : ""
                }`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
              />
            </div>
            {errors.password && (
              <p
                id="login-password-error"
                className="mt-1.5 text-xs font-medium text-rose-600"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="remember-me"
              className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none"
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#6633EE] focus:ring-[#7E2DF2]"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#6633EE] transition-colors hover:text-[#4C1D95] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] rounded"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#7E2DF2] via-[#6624D9] to-[#4E1A6B] text-sm font-semibold text-white shadow-[0_8px_22px_rgba(102,51,238,0.28)] transition-all hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
          >
            <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
            {!isSubmitting && (
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      )}

      <div className="mt-7 border-t border-slate-100 pt-5 text-center">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href={
              nextParam
                ? `/signup?next=${encodeURIComponent(nextParam)}`
                : "/signup"
            }
            className="font-bold text-[#6633EE] transition-colors hover:text-[#4C1D95] hover:underline"
          >
            Create Account →
          </Link>
        </p>
        <p className="mt-3 text-[11px] text-slate-400">
          Frontend demonstration scope — backend authentication scheduled for Phase P3.
        </p>
      </div>
    </AuthSplitShowcase>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormContent />
    </Suspense>
  );
}
