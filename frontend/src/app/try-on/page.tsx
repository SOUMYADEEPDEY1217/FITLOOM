"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Image as ImageIcon,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { LengthFieldKey } from "@/lib/body-profile-utils";
import { MOCK_GARMENTS, MockGarment } from "@/lib/mock-data";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { DigitalAvatarPreview } from "@/components/body-profile/DigitalAvatarPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type TryOnStatus = "idle" | "processing" | "demo_ready" | "error";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TryOnProductQuerySync({
  onHydrateProduct,
}: {
  onHydrateProduct: (productParam: string, found: MockGarment | undefined) => void;
}) {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const lastHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!productParam) {
      lastHandledRef.current = null;
      return;
    }
    if (lastHandledRef.current === productParam) return;
    lastHandledRef.current = productParam;
    const found = MOCK_GARMENTS.find((g) => g.id === productParam);
    onHydrateProduct(productParam, found);
  }, [productParam, onHydrateProduct]);

  return null;
}

export default function VirtualTryOnPage() {
  const { bodyProfile, hasBodyProfile, saveLook, toast } = useFitloom();

  const [mode, setMode] = useState<string>("you");
  const [garmentId, setGarmentId] = useState<string>("");
  const [invalidProductId, setInvalidProductId] = useState<string | null>(null);
  const [queryNotice, setQueryNotice] = useState<string | null>(null);

  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const [photoSizeBytes, setPhotoSizeBytes] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoRenderError, setPhotoRenderError] = useState<boolean>(false);
  const [garmentImgError, setGarmentImgError] = useState<boolean>(false);

  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [previewErrorMsg, setPreviewErrorMsg] = useState<string | null>(null);
  const [savedForGarmentId, setSavedForGarmentId] = useState<string | null>(
    null
  );
  const [activeAvatarZone, setActiveAvatarZone] =
    useState<LengthFieldKey>("chestCm");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectGarmentRef = useRef<HTMLSelectElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
      revokeCurrentObjectUrl();
    };
  }, [clearPendingTimer, revokeCurrentObjectUrl]);

  const selectedGarment = useMemo(
    () =>
      garmentId
        ? MOCK_GARMENTS.find((g) => g.id === garmentId) ?? null
        : null,
    [garmentId]
  );

  const handleHydrateProduct = useCallback(
    (productParam: string, found: MockGarment | undefined) => {
      clearPendingTimer();
      setPreviewErrorMsg(null);
      setStatus("idle");
      setGarmentImgError(false);

      if (!found) {
        setGarmentId("");
        setInvalidProductId(productParam);
        setQueryNotice(null);
        return;
      }

      setInvalidProductId(null);
      setGarmentId(found.id);
      setQueryNotice(`Pre-selected ${found.name} from navigation link.`);
    },
    [clearPendingTimer]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same file name triggers onChange
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      const msg =
        "Unsupported image format. Please upload a JPEG, PNG, or WebP file.";
      setUploadError(msg);
      toast({
        type: "error",
        title: "Invalid File Format",
        message: msg,
      });
      return;
    }

    if (file.size <= 0) {
      const msg = "The selected file is empty. Choose a valid image file.";
      setUploadError(msg);
      toast({
        type: "error",
        title: "Empty File",
        message: msg,
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const msg = `Image exceeds the 10 MB limit (${formatFileSize(
        file.size
      )} selected). Please choose a smaller file.`;
      setUploadError(msg);
      toast({
        type: "error",
        title: "File Too Large",
        message: msg,
      });
      return;
    }

    clearPendingTimer();
    revokeCurrentObjectUrl();

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;

    setPhotoPreviewUrl(nextUrl);
    setPhotoName(file.name);
    setPhotoSizeBytes(file.size);
    setUploadError(null);
    setPhotoRenderError(false);
    setPreviewErrorMsg(null);
    setStatus("idle");

    toast({
      type: "success",
      title: "Photo Loaded Locally",
      message: `${file.name} (${formatFileSize(
        file.size
      )}) is ready for preview in your browser.`,
    });
  }

  function handleRemovePhoto() {
    clearPendingTimer();
    revokeCurrentObjectUrl();

    setPhotoPreviewUrl(null);
    setPhotoName("");
    setPhotoSizeBytes(null);
    setUploadError(null);
    setPhotoRenderError(false);
    setPreviewErrorMsg(null);
    setStatus("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      type: "info",
      title: "Photo Removed",
      message: "Your uploaded photo was cleared from this browser session.",
    });
  }

  function handleSelectGarment(nextId: string) {
    clearPendingTimer();
    setGarmentId(nextId);
    setInvalidProductId(null);
    setQueryNotice(null);
    setGarmentImgError(false);
    setPreviewErrorMsg(null);
    setStatus("idle");
  }

  function handleResetWorkspace() {
    clearPendingTimer();
    revokeCurrentObjectUrl();

    setPhotoPreviewUrl(null);
    setPhotoName("");
    setPhotoSizeBytes(null);
    setUploadError(null);
    setPhotoRenderError(false);
    setGarmentId("");
    setInvalidProductId(null);
    setQueryNotice(null);
    setGarmentImgError(false);
    setPreviewErrorMsg(null);
    setStatus("idle");
    setSavedForGarmentId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      type: "info",
      title: "Workspace Reset",
      message: "Cleared photo and garment selection.",
    });
  }

  function handlePreviewTryOn() {
    if (!photoPreviewUrl || photoRenderError) {
      const msg =
        "Upload a valid JPEG, PNG, or WebP photo of yourself before running Preview Try-On.";
      setUploadError(msg);
      setStatus("error");
      setPreviewErrorMsg(msg);
      toast({
        type: "warning",
        title: "User Photo Required",
        message: msg,
      });
      fileInputRef.current?.focus();
      return;
    }

    if (!selectedGarment) {
      const msg = invalidProductId
        ? `Garment "${invalidProductId}" was not found. Select a valid garment from the catalogue first.`
        : "Select a garment from the catalogue before running Preview Try-On.";
      setStatus("error");
      setPreviewErrorMsg(msg);
      toast({
        type: "warning",
        title: "Garment Selection Required",
        message: msg,
      });
      selectGarmentRef.current?.focus();
      return;
    }

    clearPendingTimer();
    setPreviewErrorMsg(null);
    setStatus("processing");

    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null;
      setStatus("demo_ready");
      toast({
        type: "info",
        title: "Frontend Demo Preview Ready",
        message:
          "AI image rendering is not connected yet. Showing side-by-side photo and garment reference.",
      });
    }, 650);
  }

  function handleSaveLook() {
    if (!selectedGarment) {
      toast({
        type: "warning",
        title: "Select a Garment First",
        message: "Choose a garment before saving a look to your session.",
      });
      selectGarmentRef.current?.focus();
      return;
    }

    saveLook({
      title: `${selectedGarment.name} Try-On`,
      garmentIds: [selectedGarment.id],
      source: "Virtual Try-On (Mock)",
    });
    setSavedForGarmentId(selectedGarment.id);

    toast({
      type: "success",
      title: "Saved to Session Lookbook",
      message: `"${selectedGarment.name} Try-On" added to your local Saved Looks.`,
      action: { label: "View Saved Looks", href: "/saved-looks" },
    });
  }

  const hasValidPhoto = Boolean(photoPreviewUrl) && !photoRenderError;
  const bothInputsReady = hasValidPhoto && Boolean(selectedGarment);
  const isSavedCurrent =
    Boolean(selectedGarment) && savedForGarmentId === selectedGarment?.id;

  return (
    <div className="space-y-8 pb-10">
      <Suspense fallback={null}>
        <TryOnProductQuerySync onHydrateProduct={handleHydrateProduct} />
      </Suspense>

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 break-words">
              Virtual Try-On
            </h1>
            <Badge variant="amber">
              Coming Soon · AI Diffusion Pipeline In Development
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            Preview styling combinations in the browser sandbox. Photorealistic AI try-on is scheduled for Phase 2.
          </p>
        </div>

        <div className="shrink-0">
          <Tabs
            activeId={mode}
            onChange={setMode}
            tabs={[
              { id: "you", label: "You (Photo)" },
              { id: "avatar", label: "2D Avatar Reference" },
            ]}
          />
        </div>
      </div>

      {/* Coming Soon Disclosure */}
      <aside
        aria-label="Virtual Try-On coming soon notice"
        className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-xs text-violet-950"
      >
        <Sparkles
          className="mt-0.5 h-4 w-4 shrink-0 text-[#6633EE]"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong>Coming Soon (Phase 2):</strong> Photorealistic AI virtual try-on diffusion pipeline is currently under active development. In the meantime, full 3D Avatar calibration (SMPL meshes in A-Pose &amp; T-Pose) is live in Body Profile and Style Studio, and this sandbox lets you preview side-by-side garment pairings locally.
        </p>
      </aside>

      {/* Invalid Query Product State */}
      {invalidProductId && (
        <div
          role="alert"
          className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-1">
              <p className="font-extrabold">Garment Not Found in Catalogue</p>
              <p className="leading-relaxed break-words">
                No product matching{" "}
                <code className="rounded bg-white/80 px-1.5 py-0.5 font-semibold text-red-950">
                  {invalidProductId}
                </code>{" "}
                exists in the mock catalogue. Choose a valid garment below or
                return to the Shop Catalogue.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/shop">
              <Button type="button" size="sm" variant="outline">
                Browse Shop Catalogue
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setInvalidProductId(null)}
              aria-label="Dismiss missing product alert"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Valid Query Hydration Notice */}
      {queryNotice && !invalidProductId && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-xs font-medium text-slate-800"
        >
          <span className="min-w-0 break-words">{queryNotice}</span>
          <button
            type="button"
            onClick={() => setQueryNotice(null)}
            aria-label="Dismiss pre-selection notice"
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Try-On Workspace */}
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Photo Upload, Garment Selection & Navigation */}
        <section
          aria-labelledby="tryon-controls-heading"
          className="min-w-0 space-y-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <h2
              id="tryon-controls-heading"
              className="text-base font-extrabold text-slate-950"
            >
              Try-On Setup
            </h2>
            <button
              type="button"
              onClick={handleResetWorkspace}
              disabled={!photoPreviewUrl && !garmentId && !invalidProductId}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset All
            </button>
          </div>

          {/* 1. User Photo Upload */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="vton-photo-upload"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                1. User Photo (Local Browser Only)
              </label>
              {hasValidPhoto && (
                <Badge variant="success" size="sm">
                  Photo Ready
                </Badge>
              )}
            </div>

            <label
              htmlFor="vton-photo-upload"
              className={cn(
                "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition-colors focus-within:ring-2 focus-within:ring-[#6633EE] focus-within:ring-offset-2",
                uploadError
                  ? "border-red-300 bg-red-50/40 hover:border-red-400"
                  : hasValidPhoto
                  ? "border-emerald-300 bg-emerald-50/30 hover:border-[#6633EE]"
                  : "border-violet-300 bg-violet-50/40 hover:border-[#6633EE]"
              )}
            >
              <Upload
                className="h-5 w-5 text-[#6633EE]"
                aria-hidden="true"
              />
              <span className="mt-2 max-w-full text-xs font-bold text-slate-900 break-words">
                {photoName ? photoName : "Choose a photo from your device"}
              </span>
              <span className="mt-1 text-[11px] text-slate-600">
                {photoSizeBytes !== null
                  ? `${formatFileSize(photoSizeBytes)} · Click to replace photo`
                  : "JPEG, PNG, or WebP · Max 10 MB · Never uploaded externally"}
              </span>
              <input
                ref={fileInputRef}
                id="vton-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={uploadError ? "true" : "false"}
                aria-describedby={
                  uploadError
                    ? "vton-upload-error vton-upload-help"
                    : "vton-upload-help"
                }
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <p id="vton-upload-help" className="text-[11px] text-slate-500">
              Previewed locally via an in-browser object URL and cleared when
              replaced or closed.
            </p>

            {hasValidPhoto && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Replace Photo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                  Remove Photo
                </Button>
              </div>
            )}

            {uploadError && (
              <p
                id="vton-upload-error"
                role="alert"
                className="flex items-start gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
              >
                <AlertCircle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{uploadError}</span>
              </p>
            )}
          </div>

          {/* 2. Garment Selection */}
          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="vton-garment-select"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                2. Select Catalogue Garment
              </label>
              {selectedGarment && (
                <Badge variant="default" size="sm">
                  Selected
                </Badge>
              )}
            </div>

            <select
              ref={selectGarmentRef}
              id="vton-garment-select"
              value={garmentId}
              onChange={(e) => handleSelectGarment(e.target.value)}
              className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
            >
              <option value="">Select a garment from the catalogue...</option>
              {MOCK_GARMENTS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.color} · ₹{g.priceInr.toLocaleString("en-IN")})
                </option>
              ))}
            </select>

            {selectedGarment ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-xs">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-bold text-slate-950 break-words">
                    {selectedGarment.name}
                  </p>
                  <p className="text-slate-600">
                    {selectedGarment.category} · {selectedGarment.fitType} Fit ·{" "}
                    {selectedGarment.fabric}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectGarment("")}
                  className="cursor-pointer rounded text-xs font-semibold text-[#6633EE] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                No garment selected yet. Choose an item above or open Try-On from
                a Product Details page.
              </p>
            )}
          </div>

          {/* 3. Explicit Preview Action */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              size="lg"
              className="w-full"
              loading={status === "processing"}
              loadingText="Preparing Demo Preview..."
              onClick={handlePreviewTryOn}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Preview Try-On
            </Button>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Validates your uploaded photo and selected garment locally and
              displays a frontend simulation response without AI image synthesis.
            </p>
          </div>

          {/* 4. Related FITLOOM Navigation */}
          <nav
            aria-label="Try-On related pages"
            className="space-y-2 border-t border-slate-100 pt-4 text-xs"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Continue Exploring
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={
                  selectedGarment
                    ? `/shop/${selectedGarment.id}`
                    : "/shop"
                }
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-semibold text-slate-800 transition-colors hover:border-[#6633EE]/50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                <span>
                  {selectedGarment ? "Product Details" : "Shop Catalogue"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                href={
                  selectedGarment
                    ? `/studio?product=${encodeURIComponent(selectedGarment.id)}`
                    : "/studio"
                }
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-semibold text-slate-800 transition-colors hover:border-[#6633EE]/50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                <span>Style Studio</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                href="/body-profile"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-semibold text-slate-800 transition-colors hover:border-[#6633EE]/50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                <span>Body Profile</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>

              <Link
                href="/shop"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 font-semibold text-slate-800 transition-colors hover:border-[#6633EE]/50 hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                <span>All Garments</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </section>

        {/* Right Column: Preview Workspace */}
        <section
          role="tabpanel"
          aria-label={
            mode === "you"
              ? "You (Photo) Try-On Workspace"
              : "2D Avatar Reference Workspace"
          }
          className="min-w-0 flex flex-col justify-between space-y-5 rounded-2xl border border-violet-200/80 bg-white/95 p-5 shadow-2xs sm:p-6 lg:col-span-7"
        >
          {/* Workspace Header (375px flex-wrap safe) */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold text-slate-950">
                {mode === "you"
                  ? "Side-by-Side Photo & Garment Preview"
                  : "2D Digital Avatar & Garment Reference"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {mode === "you"
                  ? "Honest local reference view of your photo and chosen garment."
                  : "Uses your Body Profile proportions alongside the selected garment."}
              </p>
            </div>
            <Badge variant="amber">Demo Simulation · No AI Output</Badge>
          </div>

          {mode === "avatar" ? (
            <div className="space-y-4">
              {hasBodyProfile ? (
                <DigitalAvatarPreview
                  metricsCm={bodyProfile}
                  unit="cm"
                  fitPreference={bodyProfile.fitPreference}
                  bodyType={bodyProfile.bodyType}
                  weightKg={
                    typeof bodyProfile.weightKg === "number"
                      ? String(bodyProfile.weightKg)
                      : ""
                  }
                  hasSavedProfile={hasBodyProfile}
                  isEditing={false}
                  activeZone={activeAvatarZone}
                  onSelectZone={setActiveAvatarZone}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center">
                  <User
                    className="mx-auto h-8 w-8 text-violet-300"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-950">
                    No Body Profile Saved Yet
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Create your Body Profile to inspect proportional 2D avatar
                    zones here.
                  </p>
                  <Link href="/body-profile" className="mt-4 inline-block">
                    <Button type="button" size="sm">
                      Open Body Profile
                    </Button>
                  </Link>
                </div>
              )}

              {selectedGarment && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-950 break-words">
                      Selected Garment: {selectedGarment.name}
                    </p>
                    <p className="text-slate-600">
                      {selectedGarment.color} · {selectedGarment.fitType} Fit ·{" "}
                      {selectedGarment.fabric}
                    </p>
                  </div>
                  <Link href={`/fit-check?product=${encodeURIComponent(selectedGarment.id)}`}>
                    <Button type="button" size="sm" variant="outline">
                      Check Fit Metrics
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Processing / Error / Demo Response Banners */}
              {status === "processing" && (
                <div
                  role="status"
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-6 text-center"
                >
                  <p
                    id="vton-loading-label"
                    className="text-sm font-bold text-slate-900"
                  >
                    Preparing frontend demo preview...
                  </p>
                  <progress
                    aria-labelledby="vton-loading-label"
                    className="h-2 w-48 accent-[#6633EE]"
                  />
                  <p className="text-xs text-slate-600">
                    Validating local photo preview and selected garment inputs.
                  </p>
                </div>
              )}

              {status === "error" && previewErrorMsg && (
                <div
                  role="alert"
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="font-extrabold">Cannot Run Demo Preview</p>
                      <p className="leading-relaxed break-words">
                        {previewErrorMsg}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStatus("idle");
                      setPreviewErrorMsg(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {status === "demo_ready" && bothInputsReady && selectedGarment && (
                <div
                  role="status"
                  className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-extrabold">
                      <ShieldAlert
                        className="h-4 w-4 text-amber-700"
                        aria-hidden="true"
                      />
                      Demo Simulation Response — AI Rendering Not Connected Yet
                    </span>
                    <Badge variant="amber" size="sm">
                      Demo Simulation Only
                    </Badge>
                  </div>
                  <p className="leading-relaxed">
                    Both inputs (<strong>{photoName}</strong> and{" "}
                    <strong>{selectedGarment.name}</strong>) are ready, but live
                    IDM-VTON image generation is not connected in this frontend
                    phase. No garment image has been overlaid onto your photo,
                    and no fit percentage is claimed.
                  </p>
                </div>
              )}

              {/* Empty State Before Upload & Product Selection */}
              {!hasValidPhoto && !selectedGarment ? (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-gradient-to-b from-white to-violet-50/40 p-8 text-center">
                  <ImageIcon
                    className="mx-auto h-9 w-9 text-violet-300"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 text-base font-extrabold text-slate-950">
                    Upload a Photo &amp; Select a Garment
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
                    Add a JPEG, PNG, or WebP photo (up to 10 MB) and choose a
                    garment from the catalogue on the left to inspect the
                    preview workspace.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload Photo
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => selectGarmentRef.current?.focus()}
                    >
                      Choose Garment
                    </Button>
                  </div>
                </div>
              ) : (
                /* Side-by-Side Photo & Garment Workspace */
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* User Uploaded Photo Slot */}
                  <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Your Uploaded Photo
                        </span>
                        {hasValidPhoto ? (
                          <Badge variant="success" size="sm">
                            Local Preview
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Pending Upload
                          </Badge>
                        )}
                      </div>

                      <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {hasValidPhoto && photoPreviewUrl ? (
                          <Image
                            src={photoPreviewUrl}
                            alt={`Uploaded user photo preview: ${photoName}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, 300px"
                            onError={() => {
                              setPhotoRenderError(true);
                              setStatus("error");
                              setPreviewErrorMsg(
                                "Could not render the selected image file. Please choose another JPEG, PNG, or WebP photo."
                              );
                            }}
                            className="object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
                            <Upload
                              className="h-7 w-7 text-slate-300"
                              aria-hidden="true"
                            />
                            <p className="text-xs font-bold text-slate-800">
                              {photoRenderError
                                ? "Image preview failed"
                                : "No photo uploaded yet"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              JPEG, PNG, or WebP up to 10 MB
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-1"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Select Photo
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                      <span className="min-w-0 truncate">
                        {hasValidPhoto
                          ? `${photoName}${
                              photoSizeBytes !== null
                                ? ` (${formatFileSize(photoSizeBytes)})`
                                : ""
                            }`
                          : "Client-side only"}
                      </span>
                      {hasValidPhoto && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="cursor-pointer font-semibold text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </article>

                  {/* Selected Garment Slot */}
                  <article className="flex flex-col justify-between rounded-2xl border border-violet-200/80 bg-violet-50/30 p-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4C1D95]">
                          Selected Garment
                        </span>
                        {selectedGarment ? (
                          <Badge variant="default" size="sm">
                            {selectedGarment.category}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Not Selected
                          </Badge>
                        )}
                      </div>

                      <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden rounded-xl border border-violet-100 bg-white">
                        {selectedGarment ? (
                          selectedGarment.image && !garmentImgError ? (
                            <Image
                              src={selectedGarment.image}
                              alt={`${selectedGarment.name} in ${selectedGarment.color}`}
                              fill
                              sizes="(max-width: 640px) 100vw, 300px"
                              onError={() => setGarmentImgError(true)}
                              className="object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
                              <div
                                className="h-20 w-16 rounded-xl border border-black/10 shadow-xs"
                                style={{
                                  backgroundColor:
                                    selectedGarment.swatchHex || "#E2E8F0",
                                }}
                                aria-hidden="true"
                              />
                              <p className="text-xs font-bold text-slate-900">
                                {selectedGarment.color} Swatch
                              </p>
                              <p className="text-[11px] text-slate-600">
                                {selectedGarment.fabric}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
                            <Sparkles
                              className="h-7 w-7 text-violet-300"
                              aria-hidden="true"
                            />
                            <p className="text-xs font-bold text-slate-800">
                              {invalidProductId
                                ? "Invalid product ID"
                                : "No garment selected"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Pick a garment from the dropdown to pair with your
                              photo.
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-1"
                              onClick={() => selectGarmentRef.current?.focus()}
                            >
                              Select Garment
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                      {selectedGarment ? (
                        <>
                          <span className="min-w-0 truncate font-bold text-slate-950">
                            {selectedGarment.name} · ₹
                            {selectedGarment.priceInr.toLocaleString("en-IN")}
                          </span>
                          <Link
                            href={`/shop/${selectedGarment.id}`}
                            className="font-semibold text-[#6633EE] hover:underline"
                          >
                            View Specs →
                          </Link>
                        </>
                      ) : (
                        <span className="text-slate-500">
                          Choose from {MOCK_GARMENTS.length} catalogue items
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              )}

              {/* Ready Checklist */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs">
                <span className="font-semibold text-slate-700">
                  Preview Readiness:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-semibold",
                      hasValidPhoto ? "text-emerald-700" : "text-slate-500"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    User Photo
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-semibold",
                      selectedGarment ? "text-emerald-700" : "text-slate-500"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Garment Selected
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={!selectedGarment}
                onClick={handleSaveLook}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                {isSavedCurrent ? "Saved to Looks" : "Save Look"}
              </Button>

              {selectedGarment && (
                <Link
                  href={`/fit-check?product=${encodeURIComponent(
                    selectedGarment.id
                  )}`}
                >
                  <Button type="button" variant="ghost">
                    Inspect in Fit Check
                  </Button>
                </Link>
              )}
            </div>

            {selectedGarment ? (
              <Link href={`/shop/${selectedGarment.id}`}>
                <Button type="button" variant="secondary">
                  Back to Product Details
                </Button>
              </Link>
            ) : (
              <Link href="/shop">
                <Button type="button" variant="secondary">
                  Back to Shop Catalogue
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
