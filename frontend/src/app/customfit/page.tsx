"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Info,
  Package,
  Palette,
  RotateCcw,
  Ruler,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import {
  MOCK_GARMENTS,
  MOCK_TAILORS,
  getFitPreferenceEaseCm,
} from "@/lib/mock-data";
import {
  BodyProfileDraftState,
  BodyProfileErrorKey,
  FIT_PREFERENCE_CARDS,
  LengthFieldKey,
  MEASUREMENT_FIELDS,
  MeasurementUnit,
  cmToInchesNumber,
  formatLengthFromCm,
  switchDraftUnit,
} from "@/lib/body-profile-utils";
import {
  CustomFitRequest,
  approveCustomFitQuote,
  canConfirmCustomFitOrder,
  createInitialCustomFitDraft,
  createPendingCustomFitRequest,
  evaluateCustomFitEligibility,
  formatCustomFitNotesSummary,
  getAdjustmentOptionsForCategory,
  issueDemoWorkshopQuote,
  validateCustomFitSubmission,
} from "@/lib/customfit-utils";
import {
  getCustomerOrders,
  useFitloom,
} from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function CustomFitProductQuerySync({
  onResolveProduct,
}: {
  onResolveProduct: (result: {
    selectedId: string;
    invalidProductId: string | null;
  }) => void;
}) {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");

  useEffect(() => {
    if (productParam === null || productParam.trim() === "") {
      const firstEligible =
        MOCK_GARMENTS.find((g) => evaluateCustomFitEligibility(g).eligible) ??
        MOCK_GARMENTS[0];
      onResolveProduct({
        selectedId: firstEligible?.id ?? "",
        invalidProductId: null,
      });
      return;
    }

    const trimmed = productParam.trim();
    const matched = MOCK_GARMENTS.find((g) => g.id === trimmed);
    if (matched) {
      onResolveProduct({
        selectedId: matched.id,
        invalidProductId: null,
      });
    } else {
      onResolveProduct({
        selectedId: "",
        invalidProductId: trimmed,
      });
    }
  }, [productParam, onResolveProduct]);

  return null;
}

export default function CustomFitPage() {
  const router = useRouter();
  const { user, bodyProfile, hasBodyProfile, addToCart, orders, toast } =
    useFitloom();

  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(
    MOCK_GARMENTS[0]?.id ?? ""
  );
  const [invalidProductId, setInvalidProductId] = useState<string | null>(null);
  const [tailorId, setTailorId] = useState<string>(MOCK_TAILORS[0]?.id ?? "");
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [draft, setDraft] = useState<BodyProfileDraftState>(() =>
    createInitialCustomFitDraft(bodyProfile, hasBodyProfile, "cm")
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<BodyProfileErrorKey, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [adjustmentAreas, setAdjustmentAreas] = useState<string[]>([
    "Waist Taper",
  ]);
  const [notes, setNotes] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  // Session CUSTOMFIT requests and active request state
  const [requests, setRequests] = useState<CustomFitRequest[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const syncedProfileRef = useRef<boolean>(hasBodyProfile);

  // Re-sync draft cleanly if user creates or updates Body Profile while staying mounted
  useEffect(() => {
    if (syncedProfileRef.current !== hasBodyProfile) {
      syncedProfileRef.current = hasBodyProfile;
      setDraft(createInitialCustomFitDraft(bodyProfile, hasBodyProfile, unit));
      setFieldErrors({});
    }
  }, [bodyProfile, hasBodyProfile, unit]);

  const handleResolveProduct = useMemo(
    () =>
      (result: { selectedId: string; invalidProductId: string | null }) => {
        setInvalidProductId(result.invalidProductId);
        if (result.selectedId) {
          setSelectedGarmentId(result.selectedId);
        } else if (result.invalidProductId) {
          setSelectedGarmentId("");
        }
        setImgError(false);
        setFormError(null);
      },
    []
  );

  const garment = useMemo(
    () =>
      selectedGarmentId
        ? MOCK_GARMENTS.find((g) => g.id === selectedGarmentId) ?? null
        : null,
    [selectedGarmentId]
  );

  const tailor = useMemo(
    () => MOCK_TAILORS.find((t) => t.id === tailorId) ?? null,
    [tailorId]
  );

  const eligibility = useMemo(
    () => evaluateCustomFitEligibility(garment),
    [garment]
  );

  const categoryAdjustments = useMemo(
    () =>
      garment ? getAdjustmentOptionsForCategory(garment.category) : [],
    [garment]
  );

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === activeRequestId) ?? null,
    [requests, activeRequestId]
  );

  const customerCustomOrders = useMemo(
    () =>
      getCustomerOrders(orders, user).filter((ord) => ord.isCustomFit),
    [orders, user]
  );

  function handleSelectGarment(nextId: string) {
    setInvalidProductId(null);
    setSelectedGarmentId(nextId);
    setImgError(false);
    setFormError(null);

    const nextGarment = MOCK_GARMENTS.find((g) => g.id === nextId);
    if (nextGarment) {
      const validLabels = new Set(
        getAdjustmentOptionsForCategory(nextGarment.category).map(
          (o) => o.label
        )
      );
      setAdjustmentAreas((prev) =>
        prev.filter((label) => validLabels.has(label))
      );
    }

    router.replace(`/customfit?product=${encodeURIComponent(nextId)}`, {
      scroll: false,
    });
  }

  function handleUnitSwitch(nextUnit: MeasurementUnit) {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    setDraft((prev) => switchDraftUnit(prev, nextUnit));
    setFieldErrors({});
  }

  function handleLengthChange(key: LengthFieldKey, rawValue: string) {
    setDraft((prev) => ({
      ...prev,
      lengths: {
        ...prev.lengths,
        [key]: rawValue,
      },
      dirtyFields: prev.dirtyFields.includes(key)
        ? prev.dirtyFields
        : [...prev.dirtyFields, key],
    }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (formError) setFormError(null);
  }

  function handleResetToBodyProfile() {
    setDraft(createInitialCustomFitDraft(bodyProfile, hasBodyProfile, unit));
    setFieldErrors({});
    setFormError(null);
    toast({
      type: "info",
      title: hasBodyProfile ? "Synced Body Profile" : "Measurements Cleared",
      message: hasBodyProfile
        ? "Loaded your saved Body Profile measurements."
        : "No saved Body Profile exists; measurement fields remain blank.",
    });
  }

  function handleToggleAdjustment(label: string) {
    setAdjustmentAreas((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  }

  function handleSubmitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validation = validateCustomFitSubmission({
      garment,
      tailor,
      draft,
      notes,
    });

    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setFormError(validation.formError);

      const firstKey = Object.keys(validation.fieldErrors)[0];
      if (firstKey) {
        const el = document.getElementById(`customfit-${firstKey}`);
        el?.focus();
      }

      toast({
        type: "warning",
        title: "Check CUSTOMFIT Form",
        message: validation.formError,
      });
      return;
    }

    if (!garment || !tailor) return;

    setFieldErrors({});
    setFormError(null);

    const newReq = createPendingCustomFitRequest({
      garment,
      tailor,
      measurements: validation.measurements,
      adjustmentAreas,
      notes: validation.trimmedNotes,
      createdAt: new Date().toISOString().slice(0, 10),
    });

    setRequests((prev) => [newReq, ...prev]);
    setActiveRequestId(newReq.id);

    toast({
      type: "success",
      title: "CUSTOMFIT Request Created",
      message: `Request ${newReq.id} logged with Pending Tailor Quote and Pending Tailor Acceptance.`,
    });
  }

  function handleSimulateWorkshopQuote(req: CustomFitRequest) {
    const reqGarment = MOCK_GARMENTS.find((g) => g.id === req.garmentId);
    const reqTailor = MOCK_TAILORS.find((t) => t.id === req.tailorId);
    if (!reqGarment || !reqTailor) return;

    const updated = issueDemoWorkshopQuote(req, reqGarment, reqTailor);
    setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));

    toast({
      type: "info",
      title: "Demo Quote Issued",
      message: `Review quote total ₹${updated.quote?.totalPriceInr.toLocaleString(
        "en-IN"
      )} and approve before adding to bag.`,
    });
  }

  function handleApproveQuote(req: CustomFitRequest) {
    const res = approveCustomFitQuote(req);
    if (!res.ok) {
      toast({
        type: "warning",
        title: "Approval Blocked",
        message: res.error,
      });
      return;
    }

    setRequests((prev) => prev.map((r) => (r.id === req.id ? res.updated : r)));
    toast({
      type: "success",
      title: "Tailoring Quote Approved",
      message: `Quote approved for ${req.garmentName}. You can now add this CUSTOMFIT piece to your bag.`,
    });
  }

  function handleConfirmAndAddToBag(req: CustomFitRequest) {
    const gate = canConfirmCustomFitOrder(req);
    if (!gate.allowed || !req.quote) {
      toast({
        type: "warning",
        title: "Quote Approval Required",
        message: !gate.allowed ? gate.reason : "Quote missing.",
      });
      return;
    }

    addToCart({
      garmentId: req.garmentId,
      name: `${req.garmentName} (CUSTOMFIT)`,
      size: "CUSTOMFIT",
      priceInr: req.quote.totalPriceInr,
      customFitNotes: formatCustomFitNotesSummary(req),
      customFitMeasurements: { ...req.measurements },
      tailorName: req.tailorName,
    });

    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id ? { ...r, stage: "added_to_bag" } : r
      )
    );

    toast({
      type: "success",
      title: "Approved CUSTOMFIT Added to Bag",
      message: `${req.garmentName} with ${req.tailorName} added to your shopping bag.`,
      action: { label: "View Bag / Checkout", href: "/cart" },
    });
  }

  // Dedicated Invalid-Product Error State (no silent fallback to MOCK_GARMENTS[0])
  if (invalidProductId) {
    return (
      <>
        <Suspense fallback={null}>
          <CustomFitProductQuerySync onResolveProduct={handleResolveProduct} />
        </Suspense>
        <div className="mx-auto max-w-2xl space-y-6 py-8">
          <div
            role="alert"
            className="rounded-3xl border border-dashed border-amber-300 bg-white/95 p-6 text-center shadow-xs sm:p-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <Badge variant="amber" className="mt-4">
              Product Not Found
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
              Garment Unavailable for CUSTOMFIT
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              No product matching{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">
                {invalidProductId}
              </code>{" "}
              exists in the FITLOOM catalogue. Pick a valid garment below or
              return to the Shop.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {MOCK_GARMENTS.slice(0, 4).map((g) => (
                <Button
                  key={g.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectGarment(g.id)}
                >
                  {g.name}
                </Button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 border-t border-slate-100 pt-5">
              <Link href="/shop">
                <Button>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Browse Shop Catalogue
                </Button>
              </Link>
              <Link href="/body-profile">
                <Button variant="outline">Manage Body Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const quoteGate = activeRequest
    ? canConfirmCustomFitOrder(activeRequest)
    : null;

  return (
    <div className="space-y-8 pb-12">
      <Suspense fallback={null}>
        <CustomFitProductQuerySync onResolveProduct={handleResolveProduct} />
      </Suspense>

      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 break-words">
              CUSTOMFIT Tailoring
            </h1>
            <Badge variant="amber">Demo Flow · Quote Approval Gate</Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Configure tailored dimensions for eligible garments, review and
            approve a workshop quote, and add made-to-measure pieces to your bag.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {garment && (
            <Link href={`/fit-check?product=${encodeURIComponent(garment.id)}`}>
              <Button variant="ghost" size="sm">
                <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                Fit Intelligence
              </Button>
            </Link>
          )}
          <Link href="/shop">
            <Button variant="outline" size="sm">
              Back to Shop
            </Button>
          </Link>
        </div>
      </header>

      {/* Honest Frontend Disclosure */}
      <aside
        aria-label="CUSTOMFIT demo disclosure"
        className="flex items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-xs text-slate-700"
      >
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong>Frontend Demo Notice:</strong> Measurements are manually
          entered or synced from your Body Profile (never AI-generated or
          physically verified). Live workshop availability, slot capacity, and
          confirmed calendar delivery dates are unavailable in this frontend
          demo. No real payment or backend dispatch occurs.
        </p>
      </aside>

      {/* Main Split Grid */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Configuration Form */}
        <form
          onSubmit={handleSubmitRequest}
          noValidate
          className="min-w-0 space-y-6 lg:col-span-7"
        >
          {/* Step 1: Garment Selection & Eligibility */}
          <section
            aria-labelledby="cf-garment-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                id="cf-garment-heading"
                htmlFor="customfit-garment-select"
                className="text-xs font-extrabold uppercase tracking-wider text-slate-700"
              >
                1. Eligible Garment Selection
              </label>
              <Badge variant={eligibility.eligible ? "success" : "destructive"}>
                {eligibility.eligible ? "CUSTOMFIT Eligible" : "Ineligible"}
              </Badge>
            </div>

            <select
              id="customfit-garment-select"
              value={garment?.id ?? ""}
              onChange={(e) => handleSelectGarment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
            >
              {MOCK_GARMENTS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — ₹{g.priceInr.toLocaleString("en-IN")} ({g.category}
                  )
                </option>
              ))}
            </select>

            {garment && (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {garment.image && !imgError ? (
                    <Image
                      src={garment.image}
                      alt={`${garment.name} garment preview`}
                      fill
                      sizes="64px"
                      onError={() => setImgError(true)}
                      className="object-cover object-top"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        backgroundColor: garment.swatchHex || "#EDE9FE",
                      }}
                    >
                      <Palette
                        className="h-5 w-5 text-slate-700/70"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/shop/${encodeURIComponent(garment.id)}`}
                      className="truncate text-sm font-extrabold text-slate-950 hover:text-[#6633EE] hover:underline"
                    >
                      {garment.name}
                    </Link>
                    <span className="font-bold text-slate-900">
                      Base: ₹{garment.priceInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-slate-600">{garment.fabric}</p>
                  <p className="text-[11px] text-slate-500">
                    {eligibility.reason}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Step 2 & 3: Body Profile Review & Custom Measurements (CM/IN) */}
          <section
            aria-labelledby="cf-measurements-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2
                  id="cf-measurements-heading"
                  className="text-sm font-extrabold uppercase tracking-wider text-slate-800"
                >
                  2. Customer Tailoring Measurements ({unit.toUpperCase()})
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  {hasBodyProfile
                    ? "Pre-filled from your Body Profile. Adjust any measurement directly for this custom order."
                    : "No saved Body Profile found — enter your exact measurements below or create a profile first."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Measurement unit"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold"
                >
                  {(["cm", "in"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={unit === u}
                      onClick={() => handleUnitSwitch(u)}
                      className={cn(
                        "cursor-pointer rounded-lg px-2.5 py-1 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        unit === u
                          ? "bg-[#6633EE] text-white"
                          : "text-slate-600 hover:text-slate-950"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {hasBodyProfile && (
                  <button
                    type="button"
                    onClick={handleResetToBodyProfile}
                    className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-[#6633EE] hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Sync Profile
                  </button>
                )}
              </div>
            </div>

            {!hasBodyProfile && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-extrabold">Body Profile Missing</p>
                  <p className="text-amber-900">
                    Measurement fields start blank because FITLOOM never
                    fabricates body dimensions. Fill them manually below or save
                    a Body Profile first.
                  </p>
                </div>
                <Link href="/body-profile" className="shrink-0">
                  <Button type="button" size="sm">
                    Open Body Profile →
                  </Button>
                </Link>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {MEASUREMENT_FIELDS.map((field) => {
                const err = fieldErrors[field.key];
                const rangeLabel =
                  unit === "in"
                    ? `${cmToInchesNumber(field.minCm)}–${cmToInchesNumber(
                        field.maxCm
                      )} in`
                    : `${field.minCm}–${field.maxCm} cm`;

                return (
                  <div key={field.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`customfit-${field.key}`}
                        className="text-xs font-bold text-slate-800"
                      >
                        {field.label} ({unit}){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {rangeLabel}
                      </span>
                    </div>
                    <Input
                      id={`customfit-${field.key}`}
                      name={field.key}
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder={
                        unit === "cm"
                          ? field.placeholderCm
                          : field.placeholderIn
                      }
                      value={draft.lengths[field.key]}
                      onChange={(e) =>
                        handleLengthChange(field.key, e.target.value)
                      }
                      aria-invalid={Boolean(err)}
                      aria-describedby={
                        err ? `customfit-${field.key}-err` : undefined
                      }
                    />
                    {err && (
                      <p
                        id={`customfit-${field.key}-err`}
                        role="alert"
                        className="text-xs font-medium text-red-600"
                      >
                        {err}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 4: Tailoring Preferences & Notes */}
          <section
            aria-labelledby="cf-preferences-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <h2
              id="cf-preferences-heading"
              className="text-sm font-extrabold uppercase tracking-wider text-slate-800"
            >
              3. Fit Preference &amp; Tailoring Instructions
            </h2>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-700">
                Target Fit Ease Preference
              </legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {FIT_PREFERENCE_CARDS.map((card) => {
                  const selected = draft.fitPreference === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          fitPreference: card.id,
                        }))
                      }
                      className={cn(
                        "cursor-pointer rounded-xl border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                        selected
                          ? "border-[#6633EE] bg-violet-50/90 ring-1 ring-[#6633EE]"
                          : "border-slate-200 bg-white hover:border-violet-300"
                      )}
                    >
                      <span className="block text-xs font-extrabold text-slate-950">
                        {card.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-[#6633EE]">
                        +{getFitPreferenceEaseCm(card.id)} cm ease
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {categoryAdjustments.length > 0 && (
              <fieldset className="space-y-2 border-t border-slate-100 pt-3.5">
                <legend className="text-xs font-bold text-slate-700">
                  Adjustment Focus Areas ({garment?.category})
                </legend>
                <div className="flex flex-wrap gap-2">
                  {categoryAdjustments.map((opt) => {
                    const checked = adjustmentAreas.includes(opt.label);
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          checked
                            ? "border-[#6633EE] bg-violet-50 text-[#4C1D95]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleAdjustment(opt.label)}
                          className="accent-[#6633EE]"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="space-y-1.5 border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="customfit-notes"
                  className="font-bold text-slate-800"
                >
                  Additional Tailoring Notes (Optional)
                </label>
                <span className="text-[11px] text-slate-500">
                  {notes.trim().length}/300
                </span>
              </div>
              <textarea
                id="customfit-notes"
                rows={2}
                maxLength={300}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Taper waist slightly (-2 cm), leave 1 cm extra cuff allowance"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
              />
            </div>
          </section>

          {/* Step 5: Partner Tailor Selection */}
          <section
            aria-labelledby="cf-tailor-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div>
              <h2
                id="cf-tailor-heading"
                className="text-sm font-extrabold uppercase tracking-wider text-slate-800"
              >
                4. Select Partner Workshop
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Fees and turnaround days shown below are catalogue reference
                figures. Live capacity and calendar delivery dates require
                workshop confirmation.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="cf-tailor-heading"
              className="grid gap-3"
            >
              {MOCK_TAILORS.map((t) => {
                const selected = t.id === tailorId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTailorId(t.id)}
                    className={cn(
                      "flex flex-col justify-between gap-2.5 rounded-2xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] sm:flex-row sm:items-center",
                      selected
                        ? "border-[#6633EE] bg-violet-50/70 ring-1 ring-[#6633EE]"
                        : "border-slate-200 bg-white hover:border-violet-300"
                    )}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-extrabold text-slate-950">
                        {t.name}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          · {t.city}
                        </span>
                      </p>
                      <p className="text-xs text-slate-600">{t.specialty}</p>
                      <p className="text-[11px] text-slate-500">
                        Availability &amp; Capacity: Pending tailor confirmation
                      </p>
                    </div>

                    <div className="shrink-0 text-left text-xs sm:text-right">
                      <p className="font-extrabold text-[#6633EE]">
                        Ref. fee: +₹{t.feeInr.toLocaleString("en-IN")}
                      </p>
                      <p className="inline-flex items-center gap-1 text-slate-600">
                        <Star
                          className="h-3 w-3 fill-amber-400 text-amber-400"
                          aria-hidden="true"
                        />
                        {t.rating} · Ref. ~{t.turnaroundDays} days
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"
              >
                {formError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={!eligibility.eligible}
              className="w-full whitespace-normal text-center"
            >
              <Scissors className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Submit CUSTOMFIT Request (Pending Quote)</span>
            </Button>
          </section>
        </form>

        {/* RIGHT COLUMN: Quote Gate, Customer Approval & Order Tracking */}
        <div className="min-w-0 space-y-6 lg:col-span-5">
          {/* Quote Review & Approval Panel */}
          <section
            aria-labelledby="cf-quote-heading"
            className="space-y-5 rounded-3xl border border-violet-200/90 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <h2
                id="cf-quote-heading"
                className="flex items-center gap-2 text-base font-extrabold text-slate-950"
              >
                <ClipboardCheck
                  className="h-4 w-4 text-[#6633EE]"
                  aria-hidden="true"
                />
                Quote &amp; Approval Gate
              </h2>
              {activeRequest ? (
                <Badge
                  variant={
                    activeRequest.stage === "added_to_bag"
                      ? "success"
                      : activeRequest.quoteApproved
                      ? "success"
                      : activeRequest.quoteStatus === "issued_demo"
                      ? "info"
                      : "amber"
                  }
                >
                  {activeRequest.stage === "pending_quote"
                    ? "Pending Quote"
                    : activeRequest.stage === "quote_ready"
                    ? "Awaiting Approval"
                    : activeRequest.stage === "quote_approved"
                    ? "Quote Approved"
                    : "Added to Bag"}
                </Badge>
              ) : (
                <Badge variant="neutral">Not Submitted Yet</Badge>
              )}
            </div>

            {!activeRequest ? (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Submit your CUSTOMFIT measurement request on the left to
                  initiate the workflow:
                </p>
                <ol className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <li className="flex items-center gap-2">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>Quote Status:</strong> Starts as Pending Tailor
                      Quote.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>Tailor Acceptance:</strong> Starts as Pending
                      Tailor Acceptance.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck
                      className="h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>Approval Gate:</strong> Order placement stays
                      locked until a quote exists and you approve it.
                    </span>
                  </li>
                </ol>

                {garment && tailor && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5 text-[11px] text-slate-700">
                    <p className="font-bold text-slate-900">
                      Current Selection Reference
                    </p>
                    <p className="mt-1">
                      {garment.name} (₹
                      {garment.priceInr.toLocaleString("en-IN")}) +{" "}
                      {tailor.name} (ref. +₹
                      {tailor.feeInr.toLocaleString("en-IN")}).
                    </p>
                    <p className="mt-1 text-slate-500">
                      Delivery date &amp; live tailor slot availability: Pending
                      workshop confirmation.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Request Header */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-[#6633EE]">
                      Request {activeRequest.id}
                    </span>
                    <span className="text-slate-500">
                      {activeRequest.createdAt}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-950">
                    {activeRequest.garmentName}
                  </p>
                  <p className="text-slate-600">
                    Workshop: <strong>{activeRequest.tailorName}</strong> (
                    {activeRequest.tailorCity})
                  </p>
                  <p className="text-slate-600 break-words">
                    Specs:{" "}
                    {formatLengthFromCm(
                      activeRequest.measurements.chestCm,
                      unit
                    )}{" "}
                    {unit} chest ·{" "}
                    {formatLengthFromCm(
                      activeRequest.measurements.waistCm,
                      unit
                    )}{" "}
                    {unit} waist ·{" "}
                    {formatLengthFromCm(
                      activeRequest.measurements.hipCm,
                      unit
                    )}{" "}
                    {unit} hip ·{" "}
                    <span className="capitalize">
                      {activeRequest.fitPreference} fit
                    </span>
                  </p>
                </div>

                {/* Explicit Quote & Acceptance Status Rows */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-white p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Quote Status
                    </span>
                    <span className="mt-1 block font-extrabold text-slate-950">
                      {activeRequest.quoteStatus === "issued_demo"
                        ? "Demo Quote Issued"
                        : "Pending Tailor Quote"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tailor Acceptance
                    </span>
                    <span className="mt-1 block font-extrabold text-slate-950">
                      {activeRequest.tailorAcceptanceStatus === "accepted_demo"
                        ? "Demo Accepted (Simulated)"
                        : "Pending Tailor Acceptance"}
                    </span>
                  </div>
                </div>

                {/* Quote Pending vs Quote Details */}
                {activeRequest.quote === null ? (
                  <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950">
                    <p className="font-extrabold">
                      No Verified Tailor Quote Exists Yet
                    </p>
                    <p className="leading-relaxed text-amber-900">
                      In production, the partner workshop reviews your
                      measurements and confirms availability and final quote.
                      Quote approval and order placement remain locked while
                      pending.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulateWorkshopQuote(activeRequest)}
                      className="w-full whitespace-normal bg-white text-center"
                    >
                      <Sparkles
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        Simulate Workshop Quote Response (Frontend Demo)
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-950">
                        Reference Quote Breakdown
                      </span>
                      <Badge variant="amber" size="sm">
                        Demo Simulation
                      </Badge>
                    </div>
                    <div className="space-y-1.5 border-b border-violet-200/70 pb-2.5 text-slate-700">
                      <div className="flex justify-between">
                        <span>Base Garment Price</span>
                        <span className="font-semibold">
                          ₹
                          {activeRequest.quote.garmentBasePriceInr.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tailoring Reference Fee</span>
                        <span className="font-semibold">
                          +₹
                          {activeRequest.quote.tailoringFeeInr.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Ref. Turnaround (Date pending)</span>
                        <span>
                          ~{activeRequest.quote.referenceTurnaroundDays} days
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-950">
                      <span>Quoted Total</span>
                      <span>
                        ₹
                        {activeRequest.quote.totalPriceInr.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {activeRequest.quote.issuedNotice}
                    </p>
                  </div>
                )}

                {/* Gate Actions: Step 8 (Approve) -> Step 9 (Confirm to Bag) */}
                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant={
                      activeRequest.quoteApproved ? "secondary" : "default"
                    }
                    size="sm"
                    disabled={
                      activeRequest.quote === null ||
                      activeRequest.quoteApproved
                    }
                    onClick={() => handleApproveQuote(activeRequest)}
                    className="w-full whitespace-normal text-center"
                  >
                    {activeRequest.quoteApproved ? (
                      <>
                        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Quote Approved by Customer</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          {activeRequest.quote === null
                            ? "Approve Quote (Locked Until Quote Exists)"
                            : "Approve Tailoring Quote"}
                        </span>
                      </>
                    )}
                  </Button>

                  {activeRequest.stage === "added_to_bag" ? (
                    <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-emerald-950">
                      <p className="font-extrabold">
                        Added Approved CUSTOMFIT Item to Shopping Bag
                      </p>
                      <p className="text-emerald-900">
                        Proceed to Shopping Bag or Demo Checkout to place a
                        tracked CUSTOMFIT session order.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href="/cart" className="flex-1">
                          <Button size="sm" className="w-full">
                            Open Shopping Bag
                            <ArrowRight
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        </Link>
                        <Link href="/checkout" className="flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full bg-white"
                          >
                            Checkout
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="lg"
                        disabled={!quoteGate?.allowed}
                        onClick={() => handleConfirmAndAddToBag(activeRequest)}
                        className="w-full whitespace-normal text-center"
                      >
                        <ShoppingBag
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Add Approved CUSTOMFIT to Bag</span>
                      </Button>
                      {quoteGate && !quoteGate.allowed && (
                        <p className="text-center text-[11px] text-slate-500">
                          {quoteGate.reason}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Step 10: Session Requests & Tracked CUSTOMFIT Orders */}
          <section
            aria-labelledby="cf-tracking-heading"
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2
                id="cf-tracking-heading"
                className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-800"
              >
                <Package
                  className="h-4 w-4 text-[#6633EE]"
                  aria-hidden="true"
                />
                Request Status &amp; Order Tracking
              </h2>
              <Link
                href="/orders"
                className="text-xs font-bold text-[#6633EE] hover:underline"
              >
                All Orders →
              </Link>
            </div>

            {requests.length === 0 && customerCustomOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center text-xs text-slate-500">
                No active CUSTOMFIT requests or tailored orders in this customer
                session yet.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setActiveRequestId(req.id)}
                    className={cn(
                      "w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
                      req.id === activeRequestId
                        ? "border-[#6633EE] bg-violet-50/60"
                        : "border-slate-200 bg-white hover:border-violet-300"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-950">
                        {req.id} · {req.garmentName}
                      </span>
                      <Badge
                        variant={
                          req.stage === "added_to_bag"
                            ? "success"
                            : req.quoteApproved
                            ? "success"
                            : "amber"
                        }
                        size="sm"
                      >
                        {req.stage === "pending_quote"
                          ? "Pending Quote"
                          : req.stage === "quote_ready"
                          ? "Quote Ready"
                          : req.stage === "quote_approved"
                          ? "Approved"
                          : "In Bag"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {req.tailorName} · Quote:{" "}
                      {req.quote
                        ? `₹${req.quote.totalPriceInr.toLocaleString("en-IN")}`
                        : "Pending"}
                    </p>
                  </button>
                ))}

                {customerCustomOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/orders/${encodeURIComponent(ord.id)}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-colors hover:border-[#6633EE]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-950">
                        Order {ord.id} ·{" "}
                        {ord.items.map((i) => i.name).join(", ")}
                      </span>
                      <Badge variant="default" size="sm">
                        {ord.stage}
                      </Badge>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {ord.tailorName ? `${ord.tailorName} · ` : ""}₹
                      {ord.totalInr.toLocaleString("en-IN")} · Track progress →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
