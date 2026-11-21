"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, Lock } from "lucide-react";
import {
  type FitPreference,
  MOCK_GARMENTS,
  MOCK_TAILORS,
  type MockGarment,
} from "@/lib/mock-data";
import {
  type BodyProfileDraftState,
  type BodyProfileErrorKey,
  type LengthFieldKey,
  type MeasurementUnit,
  switchDraftUnit,
} from "@/lib/body-profile-utils";
import {
  type CustomFitRequest,
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
import {
  CustomFitHero,
  CustomFitInvalidProductView,
} from "@/components/customfit/CustomFitHero";
import { GarmentSelector } from "@/components/customfit/GarmentSelector";
import { MeasurementEditor } from "@/components/customfit/MeasurementEditor";
import {
  FitPreferenceSelector,
  TailorWorkshopSelector,
} from "@/components/customfit/FitAndTailorSelector";
import {
  CustomFitRequestStatus,
  CustomFitReviewSummary,
} from "@/components/customfit/CustomFitSummaryAndStatus";

function CustomFitProductQuerySync({
  garments,
  onResolveProduct,
}: {
  garments: readonly MockGarment[];
  onResolveProduct: (result: {
    selectedId: string;
    invalidProductId: string | null;
  }) => void;
}) {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const lastHandledRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (lastHandledRef.current === productParam) return;
    const isInitialMount = lastHandledRef.current === undefined;
    lastHandledRef.current = productParam;

    if (productParam === null || productParam.trim() === "") {
      if (isInitialMount) {
        const firstEligible =
          garments.find((g) => evaluateCustomFitEligibility(g).eligible) ??
          garments[0];
        onResolveProduct({
          selectedId: firstEligible?.id ?? "",
          invalidProductId: null,
        });
      }
      return;
    }

    const trimmed = productParam.trim();
    const matched = garments.find((g) => g.id === trimmed);
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
  }, [productParam, garments, onResolveProduct]);

  return null;
}

export default function CustomFitPage() {
  const router = useRouter();
  const {
    user,
    bodyProfile,
    hasBodyProfile,
    eligibleCustomerGarments,
    addToCart,
    orders,
    toast,
  } = useFitloom();

  const availableGarments = useMemo(
    () =>
      eligibleCustomerGarments.length > 0
        ? eligibleCustomerGarments
        : MOCK_GARMENTS,
    [eligibleCustomerGarments]
  );

  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(
    () => availableGarments[0]?.id ?? ""
  );
  const [invalidProductId, setInvalidProductId] = useState<string | null>(null);
  const [tailorId, setTailorId] = useState<string>(MOCK_TAILORS[0]?.id ?? "");
  const [unit, setUnit] = useState<MeasurementUnit>("cm");
  const [draft, setDraft] = useState<BodyProfileDraftState>(() =>
    createInitialCustomFitDraft(bodyProfile, hasBodyProfile, "cm")
  );
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<BodyProfileErrorKey, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [adjustmentAreas, setAdjustmentAreas] = useState<string[]>([
    "Waist Taper",
  ]);
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeView, setActiveView] = useState<"configure" | "status">(
    "configure"
  );
  const [requests, setRequests] = useState<CustomFitRequest[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  const syncedProfileRef = useRef<boolean>(hasBodyProfile);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (syncedProfileRef.current !== hasBodyProfile && !hasManualEdits) {
      syncedProfileRef.current = hasBodyProfile;
      setDraft(createInitialCustomFitDraft(bodyProfile, hasBodyProfile, unit));
      setFieldErrors({});
    }
  }, [bodyProfile, hasBodyProfile, unit, hasManualEdits]);

  const handleResolveProduct = useCallback(
    (result: { selectedId: string; invalidProductId: string | null }) => {
      setInvalidProductId(result.invalidProductId);
      if (result.selectedId) {
        setSelectedGarmentId(result.selectedId);
      } else if (result.invalidProductId) {
        setSelectedGarmentId("");
      }
      setFormError(null);
    },
    []
  );

  const garment = useMemo(
    () =>
      selectedGarmentId
        ? availableGarments.find((g) => g.id === selectedGarmentId) ??
          MOCK_GARMENTS.find((g) => g.id === selectedGarmentId) ??
          null
        : null,
    [selectedGarmentId, availableGarments]
  );

  const tailor = useMemo(
    () => MOCK_TAILORS.find((t) => t.id === tailorId) ?? null,
    [tailorId]
  );

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === activeRequestId) ?? null,
    [requests, activeRequestId]
  );

  const customerCustomOrders = useMemo(
    () => getCustomerOrders(orders, user).filter((ord) => ord.isCustomFit),
    [orders, user]
  );

  function handleSelectGarment(nextId: string) {
    setInvalidProductId(null);
    setSelectedGarmentId(nextId);
    setFormError(null);

    const nextGarment =
      availableGarments.find((g) => g.id === nextId) ??
      MOCK_GARMENTS.find((g) => g.id === nextId);
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

  function handleClearGarment() {
    setInvalidProductId(null);
    setSelectedGarmentId("");
    setFormError(null);
    router.replace("/customfit", { scroll: false });
  }

  function handleUnitSwitch(nextUnit: MeasurementUnit) {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    setDraft((prev) => switchDraftUnit(prev, nextUnit));
    setFieldErrors({});
  }

  function handleLengthChange(key: LengthFieldKey, rawValue: string) {
    setHasManualEdits(true);
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

  function handleConfirmImportProfile() {
    setDraft(createInitialCustomFitDraft(bodyProfile, hasBodyProfile, unit));
    setHasManualEdits(false);
    syncedProfileRef.current = hasBodyProfile;
    setFieldErrors({});
    setFormError(null);
    toast({
      type: "info",
      title: hasBodyProfile ? "Imported Body Profile" : "Measurements Cleared",
      message: hasBodyProfile
        ? "Loaded saved measurements from your Body Profile."
        : "No saved Body Profile exists; measurement fields remain blank.",
    });
  }

  function handleSelectFitPreference(next: FitPreference) {
    setDraft((prev) => ({
      ...prev,
      fitPreference: next,
    }));
  }

  function handleToggleAdjustment(label: string) {
    setAdjustmentAreas((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  }

  function handleSubmitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

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

    submitLockRef.current = true;
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    submitTimerRef.current = setTimeout(() => {
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
      setJustSubmittedId(newReq.id);
      setActiveView("status");
      setIsSubmitting(false);
      submitLockRef.current = false;

      toast({
        type: "success",
        title: "CUSTOMFIT Request Submitted",
        message: `Request ${newReq.id} logged with Pending Tailor Quote and Pending Tailor Acceptance.`,
      });

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 180);
  }

  function handleSimulateWorkshopQuote(req: CustomFitRequest) {
    const reqGarment =
      availableGarments.find((g) => g.id === req.garmentId) ??
      MOCK_GARMENTS.find((g) => g.id === req.garmentId);
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

  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#EAE2F8] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#DDD6FE] bg-[#F7F5FF] text-[#6633EE]">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl font-semibold text-[#1D0B24]">
          Customer Sign-In Required
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#4B5563]">
          Sign in with a Customer session to customize garments in CUSTOMFIT
          Studio and submit requests to partner workshops.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?next=%2Fcustomfit"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-110"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (invalidProductId) {
    return (
      <>
        <Suspense fallback={null}>
          <CustomFitProductQuerySync
            garments={availableGarments}
            onResolveProduct={handleResolveProduct}
          />
        </Suspense>
        <CustomFitInvalidProductView
          invalidProductId={invalidProductId}
          garments={availableGarments}
          onSelectGarment={handleSelectGarment}
        />
      </>
    );
  }

  const totalTrackedCount = requests.length + customerCustomOrders.length;

  return (
    <div className="space-y-8 pb-10">
      <Suspense fallback={null}>
        <CustomFitProductQuerySync
          garments={availableGarments}
          onResolveProduct={handleResolveProduct}
        />
      </Suspense>

      <CustomFitHero
        selectedGarment={garment}
        activeView={activeView}
        onChangeView={setActiveView}
        totalTrackedCount={totalTrackedCount}
      />

      {activeView === "status" ? (
        <CustomFitRequestStatus
          requests={requests}
          activeRequest={activeRequest}
          justSubmittedId={justSubmittedId}
          unit={unit}
          customerCustomOrders={customerCustomOrders}
          onSelectRequest={(id) => {
            setActiveRequestId(id);
            setJustSubmittedId(null);
          }}
          onSimulateQuote={handleSimulateWorkshopQuote}
          onApproveQuote={handleApproveQuote}
          onAddToBag={handleConfirmAndAddToBag}
          onBackToConfigurator={() => setActiveView("configure")}
        />
      ) : (
        <form
          onSubmit={handleSubmitRequest}
          noValidate
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"
        >
          {/* Left Studio Canvas: Sections 02 - 05 */}
          <div className="min-w-0 space-y-8 lg:col-span-8">
            <GarmentSelector
              garments={availableGarments}
              selectedGarmentId={selectedGarmentId}
              onSelectGarment={handleSelectGarment}
              onClearGarment={handleClearGarment}
            />

            <MeasurementEditor
              unit={unit}
              draft={draft}
              hasBodyProfile={hasBodyProfile}
              hasManualEdits={hasManualEdits}
              fieldErrors={fieldErrors}
              onUnitSwitch={handleUnitSwitch}
              onLengthChange={handleLengthChange}
              onConfirmImportProfile={handleConfirmImportProfile}
            />

            <FitPreferenceSelector
              fitPreference={draft.fitPreference}
              onSelectFitPreference={handleSelectFitPreference}
              selectedGarment={garment}
              adjustmentAreas={adjustmentAreas}
              onToggleAdjustment={handleToggleAdjustment}
              notes={notes}
              onNotesChange={(val) => {
                setNotes(val);
                if (formError) setFormError(null);
              }}
            />

            <TailorWorkshopSelector
              tailors={MOCK_TAILORS}
              selectedTailorId={tailorId}
              onSelectTailor={(id) => {
                setTailorId(id);
                if (formError) setFormError(null);
              }}
            />
          </div>

          {/* Right Column: Section 06 Unified Review Summary + Section 07 Submit */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <CustomFitReviewSummary
              selectedGarment={garment}
              selectedTailor={tailor}
              draft={draft}
              unit={unit}
              adjustmentAreas={adjustmentAreas}
              notes={notes}
              formError={formError}
              isSubmitting={isSubmitting}
            />

            <aside
              aria-label="CUSTOMFIT frontend scope note"
              className="flex items-start gap-2.5 rounded-2xl border border-[#EAE2F8] bg-[#FAF8FE] px-4 py-3 text-[11px] leading-relaxed text-[#6B7280]"
            >
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                aria-hidden="true"
              />
              <p>
                Frontend demo session: measurements and quotes are managed in
                session state with no real payment or live workshop scheduling.
              </p>
            </aside>
          </div>
        </form>
      )}
    </div>
  );
}
