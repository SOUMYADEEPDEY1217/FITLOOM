"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Mail, Send } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { PublicPageHero } from "@/components/public/PublicPageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ContactFormInput,
  ContactFormSchema,
  ENQUIRY_CATEGORIES,
  type EnquiryCategory,
} from "@/lib/public-pages-utils";

type ContactFieldErrors = Partial<Record<keyof ContactFormInput, string>>;

interface RecordedDemoSubmission {
  fullName: string;
  email: string;
  category: EnquiryCategory;
  orderId?: string;
  subject: string;
}

export default function ContactPage() {
  const { user, toast } = useFitloom();

  const [fullName, setFullName] = useState(
    user.role !== "guest" ? user.name : ""
  );
  const [email, setEmail] = useState(
    user.role !== "guest" ? user.email : ""
  );
  const [category, setCategory] = useState<EnquiryCategory>("General Enquiry");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPreview, setSubmittedPreview] =
    useState<RecordedDemoSubmission | null>(null);

  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  function clearFieldError(field: keyof ContactFormInput) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = ContactFormSchema.safeParse({
      fullName,
      email,
      category,
      orderId: orderId.trim() || undefined,
      subject,
      message,
    });

    if (!parsed.success) {
      const nextErrors: ContactFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormInput | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setSubmittedPreview(null);
      toast({
        type: "error",
        title: "Check Contact Form Fields",
        message:
          parsed.error.issues[0]?.message ??
          "Please fix the highlighted fields before submitting.",
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    submitTimerRef.current = setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedPreview({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        category: parsed.data.category,
        orderId: parsed.data.orderId,
        subject: parsed.data.subject,
      });
      toast({
        type: "info",
        title: "Demo Enquiry Recorded Locally",
        message:
          "No email or support ticket was sent in this frontend-only build.",
      });
    }, 150);
  }

  function handleResetForm() {
    setSubject("");
    setOrderId("");
    setMessage("");
    setFieldErrors({});
    setSubmittedPreview(null);
  }

  return (
    <div className="space-y-8 pb-10">
      <PublicPageHero
        eyebrow="Contact FITLOOM"
        title="Get in Touch"
        description="Test a local enquiry preview below for fit questions, orders, or partner atelier and brand enquiries."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Contact Form Column */}
        <section
          aria-labelledby="contact-form-heading"
          className="min-w-0 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-7 lg:col-span-7"
        >
          <h2
            id="contact-form-heading"
            className="text-lg font-extrabold text-slate-950"
          >
            Enquiry Form (Demo Preview Only)
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            All fields are validated client-side. Submissions are never
            transmitted to an email server or live ticketing backend.
          </p>

          {submittedPreview ? (
            <div className="mt-5 space-y-4">
              <div
                role="status"
                className="rounded-2xl border border-emerald-200 bg-emerald-50/75 p-4 text-xs text-emerald-950"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div className="space-y-1 leading-relaxed">
                    <p className="text-sm font-bold">
                      Demo Enquiry Recorded (Not Transmitted)
                    </p>
                    <p>
                      <strong>Category:</strong> {submittedPreview.category}
                      {submittedPreview.orderId
                        ? ` · Order ID: ${submittedPreview.orderId}`
                        : ""}
                    </p>
                    <p>
                      <strong>From:</strong> {submittedPreview.fullName} (
                      {submittedPreview.email})
                    </p>
                    <p>
                      <strong>Subject:</strong> {submittedPreview.subject}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-950">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <p className="leading-relaxed">
                  <strong>Frontend Demo Notice:</strong> No email has been sent
                  and no real support ticket was created. Real helpdesk routing
                  is reserved for downstream backend phases.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetForm}
              >
                Prepare Another Enquiry
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Full Name
                  </label>
                  <Input
                    id="contact-name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      clearFieldError("fullName");
                    }}
                    placeholder="Your full name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    className="mt-1"
                  />
                  {fieldErrors.fullName && (
                    <p
                      role="alert"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    className="mt-1"
                  />
                  {fieldErrors.email && (
                    <p
                      role="alert"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-category"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Enquiry Category
                  </label>
                  <select
                    id="contact-category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as EnquiryCategory);
                      clearFieldError("category");
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                  >
                    {ENQUIRY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-order-id"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Order ID (optional)
                  </label>
                  <Input
                    id="contact-order-id"
                    value={orderId}
                    onChange={(e) => {
                      setOrderId(e.target.value);
                      clearFieldError("orderId");
                    }}
                    placeholder="e.g., FT-1042"
                    aria-invalid={Boolean(fieldErrors.orderId)}
                    className="mt-1"
                  />
                  {fieldErrors.orderId && (
                    <p
                      role="alert"
                      className="mt-1 text-xs font-medium text-red-600"
                    >
                      {fieldErrors.orderId}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Subject
                </label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    clearFieldError("subject");
                  }}
                  placeholder="Brief summary of your enquiry"
                  aria-invalid={Boolean(fieldErrors.subject)}
                  className="mt-1"
                />
                {fieldErrors.subject && (
                  <p
                    role="alert"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {fieldErrors.subject}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    clearFieldError("message");
                  }}
                  placeholder="Share details of your question (minimum 15 characters)..."
                  aria-invalid={Boolean(fieldErrors.message)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                />
                {fieldErrors.message && (
                  <p
                    role="alert"
                    className="mt-1 text-xs font-medium text-red-600"
                  >
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Recording..." : "Submit Demo Enquiry"}
              </Button>
            </form>
          )}
        </section>

        {/* Contact Info & Helpful Links Column */}
        <aside className="min-w-0 space-y-5 lg:col-span-5">
          <section
            aria-labelledby="contact-channels-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <h2
              id="contact-channels-heading"
              className="flex items-center gap-2 text-base font-extrabold text-slate-950"
            >
              <Mail className="h-4 w-4 text-[#6633EE]" aria-hidden="true" />
              Business &amp; Support Details
            </h2>

            <dl className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div>
                <dt className="font-bold text-slate-900">Project Origin</dt>
                <dd>
                  FITLOOM — Built by Team PARADOX for Hack N Pitch (E-Summit
                  &apos;26), Jadavpur University
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-900">
                  Demo Enquiry Channel
                </dt>
                <dd>
                  Use the interactive client-side enquiry preview on this page to
                  test category routing and Zod form validation (session demo
                  only; submissions are not transmitted).
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-900">
                  Commercial Support Channels
                </dt>
                <dd>
                  Direct business email, telephone helpline, and registered
                  office details are intentionally omitted in this hackathon
                  demonstration build and apply only upon live commercial
                  launch.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-900">Build Scope</dt>
                <dd>
                  Frontend Prototype — Client-side session state without live
                  email dispatch or helpdesk ticketing.
                </dd>
              </div>
            </dl>
          </section>

          <section
            id="socials"
            aria-labelledby="contact-socials-heading"
            className="scroll-mt-24 space-y-3 rounded-3xl border border-violet-100 bg-violet-50/50 p-5 text-xs text-slate-700"
          >
            <h2
              id="contact-socials-heading"
              className="text-sm font-bold text-slate-950"
            >
              Public Channels &amp; Self-Service Guides
            </h2>
            <p className="leading-relaxed">
              External social profile handles are not connected in this
              hackathon demonstration build. Explore verified platform guides and
              informational policy pages directly below:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/faq"
                className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 font-semibold text-[#6633EE] hover:bg-violet-50"
              >
                Help &amp; FAQ
              </Link>
              <Link
                href="/returns"
                className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 font-semibold text-[#6633EE] hover:bg-violet-50"
              >
                Returns Policy
              </Link>
              <Link
                href="/shipping"
                className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 font-semibold text-[#6633EE] hover:bg-violet-50"
              >
                Shipping Policy
              </Link>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-xs text-slate-600">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
              aria-hidden="true"
            />
            <p>
              To protect privacy, FITLOOM never invents placeholder phone numbers
              or displays personal team contact emails here.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
