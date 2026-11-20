"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info, Mail, RotateCcw } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import {
  ForgotPasswordSchema,
  extractZodFieldErrors,
} from "@/lib/auth-validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const { toast } = useFitloom();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = ForgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const fieldErrors = extractZodFieldErrors<"email">(parsed.error);
      setEmailError(fieldErrors.email ?? "Enter a valid email address.");
      toast({
        type: "error",
        title: "Invalid Email",
        message: "Please enter a valid email address to continue.",
      });
      return;
    }

    setEmailError(undefined);
    setIsSubmitting(true);

    timerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedEmail(parsed.data.email);
      toast({
        type: "info",
        title: "Frontend Demo Only",
        message:
          "Email format verified. No reset email was sent because backend auth is inactive.",
      });
    }, 250);
  }

  return (
    <AuthShell
      backHref="/auth/login"
      backLabel="Back to Sign In"
      title="Password Recovery (Demo)"
      subtitle="Verify your account email format or return to sign in with an instant demo session."
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <Link
            href="/auth/login"
            className="rounded font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            Return to Sign In
          </Link>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <Link
            href="/auth/register"
            className="rounded font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            Create an account
          </Link>
        </div>
      }
    >
      {submittedEmail ? (
        <div className="mt-5 space-y-4">
          <div
            role="status"
            className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-xs leading-relaxed text-slate-800"
          >
            <div className="flex items-start gap-2.5">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
                aria-hidden="true"
              />
              <div className="space-y-1.5">
                <p className="font-bold text-slate-950">
                  Demo Validation Complete
                </p>
                <p>
                  Email format verified for{" "}
                  <strong className="break-all">{submittedEmail}</strong>.
                </p>
                <p className="text-slate-600">
                  <strong>No email was sent and no password was changed.</strong>{" "}
                  Password reset emails and recovery tokens are unavailable in
                  this frontend demonstration and will connect in Phase P3.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link href="/auth/login" className="block">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Return to Sign In
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubmittedEmail(null);
                setEmailError(undefined);
              }}
              className="w-full"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Check Another Email
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined);
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError ? "forgot-email-error" : "forgot-email-helper"
              }
              placeholder="riya.demo@fitloom.local"
              className={cn(
                "mt-1",
                emailError && "border-red-400 focus:ring-red-400/20"
              )}
            />
            <p
              id="forgot-email-helper"
              className="mt-1 text-[11px] text-slate-500"
            >
              Note: Real password reset emails are not delivered in this
              frontend demo. You can use any demo password on Sign In.
            </p>
            {emailError && (
              <p
                id="forgot-email-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {emailError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Checking email..."
            className="w-full"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Preview Demo Recovery Notice
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
