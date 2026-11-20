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
  User,
  UserCheck,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import {
  fullNameSchema,
  emailSchema,
  passwordSchema,
  extractZodFieldErrors,
} from "@/lib/auth-validation";
import { sanitizeRedirectPath } from "@/lib/auth-routes";
import { AuthSplitShowcase } from "@/components/auth/AuthSplitShowcase";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const SignUpValidationSchema = z
  .object({
    name: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignUpFieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { loginMock, toast } = useFitloom();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SignUpFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = SignUpValidationSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors = extractZodFieldErrors<
        "name" | "email" | "password" | "confirmPassword"
      >(parsed.error);
      setErrors(fieldErrors);
      toast({
        type: "error",
        title: "Validation Error",
        message: "Please complete all registration fields correctly.",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedData({
        name: parsed.data.name,
        email: parsed.data.email,
      });
      toast({
        type: "info",
        title: "Demo Registration Scope",
        message:
          "Registration fields validated. Account creation API is scheduled for Phase P3.",
      });
    }, 300);
  }

  function handleDemoCustomerActivate() {
    if (!submittedData) return;
    loginMock({
      name: submittedData.name,
      email: submittedData.email,
      role: "customer",
    });
    toast({
      type: "success",
      title: "Demo Profile Activated",
      message: `Welcome, ${submittedData.name}! Exploring FITLOOM as a Customer.`,
    });
    const destination = sanitizeRedirectPath(nextParam, "/shop");
    router.push(destination);
  }

  return (
    <AuthSplitShowcase>
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to FITLOOM
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-[#1A0D2E]">
        Create Your Account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Start your journey toward better-fitting fashion and personalized style.
      </p>

      {submittedData ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs text-emerald-950">
          <div className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">Registration Validated (Demo Scope)</p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                Profile for <code className="font-semibold">{submittedData.name}</code>{" "}
                ({submittedData.email}) passed client validation. Backend user
                creation is scheduled for <strong>Phase P3</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-emerald-200/70 pt-3.5">
            <p className="text-[11px] font-medium text-emerald-900">
              Proceed into the demo platform with this profile?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleDemoCustomerActivate}
                className="h-9 rounded-full bg-gradient-to-r from-[#7E2DF2] to-[#4E1A6B] px-4 text-xs font-semibold text-white hover:brightness-110"
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Explore as {submittedData.name.split(" ")[0]}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubmittedData(null)}
                className="h-9 rounded-full border-emerald-300 text-xs text-emerald-900 hover:bg-emerald-100"
              >
                Edit Registration
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-xs font-semibold text-[#1A0D2E]"
            >
              Full Name
            </label>
            <div className="relative mt-1.5">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name)
                    setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter your full name"
                className={`h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm text-[#1A0D2E] placeholder:text-slate-400 focus-visible:border-[#7E2DF2] focus-visible:ring-[#C4B5FD] ${
                  errors.name ? "border-rose-400 focus-visible:ring-rose-300" : ""
                }`}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "signup-name-error" : undefined}
              />
            </div>
            {errors.name && (
              <p
                id="signup-name-error"
                className="mt-1 text-xs font-medium text-rose-600"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-email"
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
                id="signup-email"
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
                aria-describedby={
                  errors.email ? "signup-email-error" : undefined
                }
              />
            </div>
            {errors.email && (
              <p
                id="signup-email-error"
                className="mt-1 text-xs font-medium text-rose-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-password"
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
                id="signup-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="At least 6 characters"
                className={`h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm text-[#1A0D2E] placeholder:text-slate-400 focus-visible:border-[#7E2DF2] focus-visible:ring-[#C4B5FD] ${
                  errors.password
                    ? "border-rose-400 focus-visible:ring-rose-300"
                    : ""
                }`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "signup-password-error" : undefined
                }
              />
            </div>
            {errors.password && (
              <p
                id="signup-password-error"
                className="mt-1 text-xs font-medium text-rose-600"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-xs font-semibold text-[#1A0D2E]"
            >
              Confirm Password
            </label>
            <div className="relative mt-1.5">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <PasswordInput
                id="signup-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                }}
                placeholder="Re-enter your password"
                className={`h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm text-[#1A0D2E] placeholder:text-slate-400 focus-visible:border-[#7E2DF2] focus-visible:ring-[#C4B5FD] ${
                  errors.confirmPassword
                    ? "border-rose-400 focus-visible:ring-rose-300"
                    : ""
                }`}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "signup-confirm-error" : undefined
                }
              />
            </div>
            {errors.confirmPassword && (
              <p
                id="signup-confirm-error"
                className="mt-1 text-xs font-medium text-rose-600"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-11 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#7E2DF2] via-[#6624D9] to-[#4E1A6B] text-sm font-semibold text-white shadow-[0_8px_22px_rgba(102,51,238,0.28)] transition-all hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E2DF2] focus-visible:ring-offset-2"
          >
            <span>{isSubmitting ? "Creating Account..." : "Create Account"}</span>
            {!isSubmitting && (
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      )}

      <div className="mt-6 border-t border-slate-100 pt-5 text-center">
        <p className="text-xs text-slate-600">
          Already have an account?{" "}
          <Link
            href={
              nextParam
                ? `/login?next=${encodeURIComponent(nextParam)}`
                : "/login"
            }
            className="font-bold text-[#6633EE] transition-colors hover:text-[#4C1D95] hover:underline"
          >
            Sign In →
          </Link>
        </p>
        <p className="mt-3 text-[11px] text-slate-400">
          Frontend demonstration scope — real account persistence scheduled for Phase P3.
        </p>
      </div>
    </AuthSplitShowcase>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupFormContent />
    </Suspense>
  );
}
