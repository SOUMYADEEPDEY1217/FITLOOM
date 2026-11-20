"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { WorkspaceConfirmDialog } from "@/components/workspace/WorkspaceConfirmDialog";
import { WorkspaceRoleGuard } from "@/components/workspace/WorkspaceRoleGuard";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  APPROVED_PRODUCT_IMAGES,
  GARMENT_CATEGORIES,
  GARMENT_FIT_TYPES,
  GARMENT_OCCASIONS,
  GARMENT_SIZES,
  type GarmentCategory,
  type GarmentFitType,
  type GarmentOccasion,
  type GarmentSize,
  type SellerCatalogProduct,
  type SellerProductFormInput,
  type SellerProductStatus,
  formatModerationStatusLabel,
  formatProductStatusLabel,
  getSellerOwnedProducts,
  isProductReferencedByOrders,
} from "@/lib/seller-workspace-utils";

type FieldErrors = Partial<Record<keyof SellerProductFormInput, string>>;

interface FormDraftState {
  name: string;
  description: string;
  category: GarmentCategory;
  fitType: GarmentFitType;
  occasion: GarmentOccasion;
  color: string;
  swatchHex: string;
  image: string;
  fabric: string;
  stretchNote: string;
  priceInr: string;
  sizes: GarmentSize[];
  chestS: string;
  chestM: string;
  chestL: string;
  chestXL: string;
  waistS: string;
  waistM: string;
  waistL: string;
  waistXL: string;
  inventoryQty: string;
  status: SellerProductStatus;
  customFitEligible: boolean;
}

function createEmptyDraft(): FormDraftState {
  return {
    name: "",
    description: "",
    category: "Shirts",
    fitType: "Regular",
    occasion: "Work / Casual",
    color: "",
    swatchHex: "#6633EE",
    image: "",
    fabric: "",
    stretchNote: "",
    priceInr: "",
    sizes: ["S", "M", "L", "XL"],
    chestS: "94",
    chestM: "100",
    chestL: "106",
    chestXL: "112",
    waistS: "82",
    waistM: "88",
    waistL: "94",
    waistXL: "100",
    inventoryQty: "",
    status: "draft",
    customFitEligible: true,
  };
}

function draftFromProduct(p: SellerCatalogProduct): FormDraftState {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    fitType: p.fitType,
    occasion: p.occasion,
    color: p.color,
    swatchHex: p.swatchHex,
    image: p.image ?? "",
    fabric: p.fabric,
    stretchNote: p.stretchNote,
    priceInr: String(p.priceInr),
    sizes: [...p.sizes],
    chestS: String(p.chestMapCm.S),
    chestM: String(p.chestMapCm.M),
    chestL: String(p.chestMapCm.L),
    chestXL: String(p.chestMapCm.XL),
    waistS: String(p.waistMapCm.S),
    waistM: String(p.waistMapCm.M),
    waistL: String(p.waistMapCm.L),
    waistXL: String(p.waistMapCm.XL),
    inventoryQty: p.inventoryQty !== null ? String(p.inventoryQty) : "",
    status: p.status,
    customFitEligible: p.customFitEligible,
  };
}

function CreateParamWatcher({ onOpenCreate }: { onOpenCreate: () => void }) {
  const searchParams = useSearchParams();
  const createParam = searchParams.get("create");

  useEffect(() => {
    if (createParam === "1") {
      onOpenCreate();
    }
  }, [createParam, onOpenCreate]);

  return null;
}

function SellerProductsContent() {
  const {
    user,
    sellerProducts,
    orders,
    createSellerProduct,
    updateSellerProduct,
    setSellerProductStatus,
    deleteSellerProduct,
    toast,
  } = useFitloom();

  const ownedProducts = useMemo(
    () => getSellerOwnedProducts(sellerProducts, user),
    [sellerProducts, user]
  );

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<
    "updated" | "price-asc" | "price-desc" | "name-asc"
  >("updated");

  const [editorMode, setEditorMode] = useState<"closed" | "create" | "edit">(
    "closed"
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormDraftState>(createEmptyDraft);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<SellerCatalogProduct | null>(
    null
  );

  function openCreateForm() {
    setEditingProductId(null);
    setDraft(createEmptyDraft());
    setFieldErrors({});
    setEditorMode("create");
  }

  function openEditForm(product: SellerCatalogProduct) {
    setEditingProductId(product.id);
    setDraft(draftFromProduct(product));
    setFieldErrors({});
    setEditorMode("edit");
  }

  function toggleDraftSize(sz: GarmentSize) {
    setDraft((prev) => {
      const exists = prev.sizes.includes(sz);
      const nextSizes = exists
        ? prev.sizes.filter((s) => s !== sz)
        : GARMENT_SIZES.filter((s) => s === sz || prev.sizes.includes(s));
      return { ...prev, sizes: nextSizes };
    });
    setFieldErrors((prev) => {
      if (!prev.sizes) return prev;
      const next = { ...prev };
      delete next.sizes;
      return next;
    });
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload: SellerProductFormInput = {
      name: draft.name,
      description: draft.description,
      category: draft.category,
      fitType: draft.fitType,
      occasion: draft.occasion,
      color: draft.color,
      swatchHex: draft.swatchHex,
      image: draft.image,
      fabric: draft.fabric,
      stretchNote: draft.stretchNote,
      priceInr: draft.priceInr,
      sizes: draft.sizes,
      chestMapCm: {
        S: draft.chestS,
        M: draft.chestM,
        L: draft.chestL,
        XL: draft.chestXL,
      },
      waistMapCm: {
        S: draft.waistS,
        M: draft.waistM,
        L: draft.waistL,
        XL: draft.waistXL,
      },
      inventoryQty: draft.inventoryQty,
      status: draft.status,
      customFitEligible: draft.customFitEligible,
    };

    if (editorMode === "create") {
      const res = createSellerProduct(payload);
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        toast({
          type: "error",
          title: "Cannot Create Product",
          message: res.error ?? "Fix the highlighted fields.",
        });
        return;
      }
      setFieldErrors({});
      setEditorMode("closed");
      toast({
        type: "success",
        title: "Product Created (Pending Admin Review)",
        message: `"${res.product?.name}" added to your seller catalogue.`,
      });
      return;
    }

    if (editorMode === "edit" && editingProductId) {
      const res = updateSellerProduct(editingProductId, payload);
      if (!res.ok) {
        setFieldErrors(res.fieldErrors ?? {});
        toast({
          type: "error",
          title: "Cannot Update Product",
          message: res.error ?? "Fix the highlighted fields.",
        });
        return;
      }
      setFieldErrors({});
      setEditorMode("closed");
      setEditingProductId(null);
      toast({
        type: "success",
        title: "Product Updated",
        message: `"${res.product?.name}" changes saved in session state.`,
      });
    }
  }

  function handleStatusChange(
    product: SellerCatalogProduct,
    nextStatus: SellerProductStatus
  ) {
    const res = setSellerProductStatus(product.id, nextStatus);
    if (!res.ok) {
      toast({
        type: "error",
        title: "Availability Update Blocked",
        message: res.error ?? "Unable to update product status.",
      });
      return;
    }
    toast({
      type: "success",
      title: "Availability Updated",
      message: `"${product.name}" marked ${formatProductStatusLabel(nextStatus)}.`,
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const res = deleteSellerProduct(target.id);
    if (!res.ok) {
      toast({
        type: "error",
        title: "Cannot Remove Product",
        message: res.error ?? "Unable to remove product.",
      });
      return;
    }
    if (res.archivedInstead) {
      toast({
        type: "info",
        title: "Marked Inactive to Preserve Orders",
        message:
          res.error ??
          `"${target.name}" is referenced by past orders, so it was deactivated rather than erased.`,
      });
      return;
    }
    toast({
      type: "success",
      title: "Product Removed",
      message: `"${target.name}" removed from your catalogue.`,
    });
  }

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ownedProducts.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "All" && p.status !== statusFilter) {
        return false;
      }
      if (q) {
        const hay = `${p.id} ${p.name} ${p.category} ${p.color} ${p.fabric}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortKey === "price-asc") {
      return [...list].sort((a, b) => a.priceInr - b.priceInr);
    }
    if (sortKey === "price-desc") {
      return [...list].sort((a, b) => b.priceInr - a.priceInr);
    }
    if (sortKey === "name-asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort((a, b) =>
      (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
    );
  }, [ownedProducts, query, categoryFilter, statusFilter, sortKey]);

  return (
    <WorkspaceShell
      workspaceId="seller"
      title="Seller Product Catalogue"
      description="Create, edit, and manage availability for your merchant products. Only your owned listings are editable."
      actions={
        <Button type="button" size="sm" onClick={openCreateForm}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Product Listing
        </Button>
      }
    >
      <Suspense fallback={null}>
        <CreateParamWatcher onOpenCreate={openCreateForm} />
      </Suspense>

      {/* Product Create / Edit Panel */}
      {editorMode !== "closed" && (
        <section
          aria-labelledby="seller-product-form-heading"
          className="space-y-5 rounded-2xl border border-violet-200 bg-white/95 p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2
                id="seller-product-form-heading"
                className="text-lg font-extrabold text-slate-950"
              >
                {editorMode === "create"
                  ? "Create Seller Product Listing"
                  : `Edit Listing: ${draft.name || editingProductId}`}
              </h2>
              <p className="text-xs text-slate-600">
                Complete garment chest/waist size dimensions are required for Fit
                Intelligence eligibility.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditorMode("closed");
                setEditingProductId(null);
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </Button>
          </div>

          <form onSubmit={handleSaveProduct} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="prod-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Product Name
                </label>
                <Input
                  id="prod-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g., Atelier Structured Overshirt"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="mt-1"
                />
                {fieldErrors.name && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-price"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Price (INR)
                </label>
                <Input
                  id="prod-price"
                  type="number"
                  min={299}
                  max={99999}
                  value={draft.priceInr}
                  onChange={(e) =>
                    setDraft({ ...draft, priceInr: e.target.value })
                  }
                  placeholder="1999"
                  aria-invalid={Boolean(fieldErrors.priceInr)}
                  className="mt-1"
                />
                {fieldErrors.priceInr && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.priceInr}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="prod-desc"
                className="block text-xs font-semibold text-slate-700"
              >
                Description
              </label>
              <Input
                id="prod-desc"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                placeholder="Tailoring silhouette, fabric handfeel, and intended fit."
                aria-invalid={Boolean(fieldErrors.description)}
                className="mt-1"
              />
              {fieldErrors.description && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="prod-category"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Category
                </label>
                <select
                  id="prod-category"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value as GarmentCategory,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                >
                  {GARMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="prod-fit"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Fit Type
                </label>
                <select
                  id="prod-fit"
                  value={draft.fitType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      fitType: e.target.value as GarmentFitType,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                >
                  {GARMENT_FIT_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="prod-occasion"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Occasion
                </label>
                <select
                  id="prod-occasion"
                  value={draft.occasion}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      occasion: e.target.value as GarmentOccasion,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                >
                  {GARMENT_OCCASIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="prod-color"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Colour Label
                </label>
                <Input
                  id="prod-color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  placeholder="Midnight Navy"
                  aria-invalid={Boolean(fieldErrors.color)}
                  className="mt-1"
                />
                {fieldErrors.color && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.color}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-swatch"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Swatch Hex
                </label>
                <Input
                  id="prod-swatch"
                  value={draft.swatchHex}
                  onChange={(e) =>
                    setDraft({ ...draft, swatchHex: e.target.value })
                  }
                  placeholder="#1E3A8A"
                  aria-invalid={Boolean(fieldErrors.swatchHex)}
                  className="mt-1"
                />
                {fieldErrors.swatchHex && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.swatchHex}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-image"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Product Visual (Approved Demo Asset)
                </label>
                <select
                  id="prod-image"
                  value={draft.image}
                  onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                >
                  <option value="">Colour swatch fallback (no image)</option>
                  {APPROVED_PRODUCT_IMAGES.map((img) => (
                    <option key={img.value} value={img.value}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="prod-fabric"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Fabric Specification
                </label>
                <Input
                  id="prod-fabric"
                  value={draft.fabric}
                  onChange={(e) =>
                    setDraft({ ...draft, fabric: e.target.value })
                  }
                  placeholder="100% Combed Cotton Twill"
                  aria-invalid={Boolean(fieldErrors.fabric)}
                  className="mt-1"
                />
                {fieldErrors.fabric && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.fabric}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-stretch"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Stretch / Construction Note
                </label>
                <Input
                  id="prod-stretch"
                  value={draft.stretchNote}
                  onChange={(e) =>
                    setDraft({ ...draft, stretchNote: e.target.value })
                  }
                  placeholder="Low natural stretch; breathable drape."
                  aria-invalid={Boolean(fieldErrors.stretchNote)}
                  className="mt-1"
                />
                {fieldErrors.stretchNote && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.stretchNote}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Available Sizes
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {GARMENT_SIZES.map((sz) => {
                    const selected = draft.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleDraftSize(sz)}
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                          selected
                            ? "border-[#6633EE] bg-violet-50 text-[#6633EE]"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.sizes && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.sizes}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-inventory"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Inventory Quantity (optional)
                </label>
                <Input
                  id="prod-inventory"
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={draft.inventoryQty}
                  onChange={(e) =>
                    setDraft({ ...draft, inventoryQty: e.target.value })
                  }
                  placeholder="Leave blank if untracked"
                  aria-invalid={Boolean(fieldErrors.inventoryQty)}
                  className="mt-1"
                />
                {fieldErrors.inventoryQty && (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.inventoryQty}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prod-status"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Listing Availability
                </label>
                <select
                  id="prod-status"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as SellerProductStatus,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#6633EE] focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Required Fit Intelligence Garment Dimensions */}
            <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <p className="text-xs font-bold text-slate-900">
                Garment Dimensions (cm) — Required for Fit Intelligence
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label htmlFor="chest-s" className="block text-xs text-slate-600">
                    Chest S
                  </label>
                  <Input
                    id="chest-s"
                    type="number"
                    value={draft.chestS}
                    onChange={(e) => setDraft({ ...draft, chestS: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="chest-m" className="block text-xs text-slate-600">
                    Chest M
                  </label>
                  <Input
                    id="chest-m"
                    type="number"
                    value={draft.chestM}
                    onChange={(e) => setDraft({ ...draft, chestM: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="chest-l" className="block text-xs text-slate-600">
                    Chest L
                  </label>
                  <Input
                    id="chest-l"
                    type="number"
                    value={draft.chestL}
                    onChange={(e) => setDraft({ ...draft, chestL: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="chest-xl" className="block text-xs text-slate-600">
                    Chest XL
                  </label>
                  <Input
                    id="chest-xl"
                    type="number"
                    value={draft.chestXL}
                    onChange={(e) => setDraft({ ...draft, chestXL: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="waist-s" className="block text-xs text-slate-600">
                    Waist S
                  </label>
                  <Input
                    id="waist-s"
                    type="number"
                    value={draft.waistS}
                    onChange={(e) => setDraft({ ...draft, waistS: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="waist-m" className="block text-xs text-slate-600">
                    Waist M
                  </label>
                  <Input
                    id="waist-m"
                    type="number"
                    value={draft.waistM}
                    onChange={(e) => setDraft({ ...draft, waistM: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="waist-l" className="block text-xs text-slate-600">
                    Waist L
                  </label>
                  <Input
                    id="waist-l"
                    type="number"
                    value={draft.waistL}
                    onChange={(e) => setDraft({ ...draft, waistL: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="waist-xl" className="block text-xs text-slate-600">
                    Waist XL
                  </label>
                  <Input
                    id="waist-xl"
                    type="number"
                    value={draft.waistXL}
                    onChange={(e) => setDraft({ ...draft, waistXL: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              {(fieldErrors.chestMapCm || fieldErrors.waistMapCm) && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {fieldErrors.chestMapCm || fieldErrors.waistMapCm}
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={draft.customFitEligible}
                onChange={(e) =>
                  setDraft({ ...draft, customFitEligible: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-[#6633EE]"
              />
              Eligible for partner CUSTOMFIT tailoring option
            </label>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {editorMode === "create"
                  ? "Save New Listing"
                  : "Save Listing Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditorMode("closed");
                  setEditingProductId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, fabric, ID..."
            aria-label="Search seller products"
            className="pl-9"
          />
        </div>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="All">All Categories</option>
          {GARMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by listing status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          aria-label="Sort seller products"
          value={sortKey}
          onChange={(e) =>
            setSortKey(
              e.target.value as
                | "updated"
                | "price-asc"
                | "price-desc"
                | "name-asc"
            )
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
        >
          <option value="updated">Sort: Recently Updated</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
        </select>
      </div>

      {/* Product Cards / Empty States */}
      {ownedProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Package
            className="mx-auto h-8 w-8 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            Your seller catalogue is empty
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Create your first product listing to configure sizes, dimensions, and
            availability.
          </p>
          <Button type="button" size="sm" className="mt-4" onClick={openCreateForm}>
            Create Listing
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center">
          <Search
            className="mx-auto h-7 w-7 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-base font-bold text-slate-950">
            No matching seller listings
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Clear your search or filter selections to view all{" "}
            {ownedProducts.length} owned products.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setCategoryFilter("All");
              setStatusFilter("All");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredProducts.map((prod) => {
            const referencedOrders = isProductReferencedByOrders(prod.id, orders);
            return (
              <article
                key={prod.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    style={
                      !prod.image
                        ? { backgroundColor: prod.swatchHex }
                        : undefined
                    }
                  >
                    {prod.image && (
                      <Image
                        src={prod.image}
                        alt={prod.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={
                          prod.status === "active"
                            ? "success"
                            : prod.status === "out_of_stock"
                            ? "amber"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {formatProductStatusLabel(prod.status)}
                      </Badge>
                      <Badge
                        variant={
                          prod.moderationStatus === "approved"
                            ? "default"
                            : prod.moderationStatus === "pending_review"
                            ? "info"
                            : "amber"
                        }
                        size="sm"
                      >
                        {formatModerationStatusLabel(prod.moderationStatus)}
                      </Badge>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-950 break-words">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {prod.category} · {prod.fitType} · ₹
                      {prod.priceInr.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Sizes: {prod.sizes.join(", ")} · Stock:{" "}
                      {prod.inventoryQty !== null
                        ? `${prod.inventoryQty} units`
                        : "Not specified"}
                      {prod.updatedAt ? ` · Updated ${prod.updatedAt}` : ""}
                    </p>
                    {prod.moderationReason && (
                      <p className="text-xs font-medium text-amber-800">
                        Admin Note: {prod.moderationReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {prod.status !== "active" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(prod, "active")}
                      >
                        Set Active
                      </Button>
                    )}
                    {prod.status !== "out_of_stock" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(prod, "out_of_stock")}
                      >
                        Mark Out of Stock
                      </Button>
                    )}
                    {prod.status === "active" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(prod, "draft")}
                      >
                        Move to Draft
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEditForm(prod)}
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(prod)}
                    >
                      <Trash2
                        className="h-3.5 w-3.5 text-red-500"
                        aria-hidden="true"
                      />
                      {referencedOrders.length > 0 ? "Deactivate" : "Delete"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <WorkspaceConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget &&
          isProductReferencedByOrders(deleteTarget.id, orders).length > 0
            ? `Deactivate Referenced Listing "${deleteTarget.name}"?`
            : `Delete Listing "${deleteTarget?.name ?? ""}"?`
        }
        description={
          deleteTarget &&
          isProductReferencedByOrders(deleteTarget.id, orders).length > 0
            ? "This product appears on existing session orders. To protect historical order snapshots, confirming will mark it Inactive rather than erasing records."
            : "This removes the listing from your active session catalogue. No customer order history will be altered."
        }
        confirmLabel={
          deleteTarget &&
          isProductReferencedByOrders(deleteTarget.id, orders).length > 0
            ? "Mark Inactive"
            : "Delete Listing"
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </WorkspaceShell>
  );
}

export default function SellerProductsPage() {
  return (
    <WorkspaceRoleGuard workspaceId="seller">
      <SellerProductsContent />
    </WorkspaceRoleGuard>
  );
}
