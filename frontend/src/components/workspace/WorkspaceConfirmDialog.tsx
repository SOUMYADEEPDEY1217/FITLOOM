"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WorkspaceConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  requireReason = false,
  reasonLabel = "Reason (minimum 5 characters)",
  reasonPlaceholder = "Enter a clear operational reason...",
  minReasonLength = 5,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "default" | "outline" | "ghost";
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  minReasonLength?: number;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  function handleConfirmClick() {
    if (requireReason) {
      const trimmed = reason.trim();
      if (trimmed.length < minReasonLength) {
        setError(
          `Please provide a clear reason (minimum ${minReasonLength} characters).`
        );
        return;
      }
      setError(null);
      onConfirm(trimmed);
      return;
    }
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-confirm-title"
        className="w-full max-w-md space-y-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="workspace-confirm-title"
                className="text-base font-extrabold text-slate-950"
              >
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {requireReason && (
          <div className="space-y-1.5">
            <label
              htmlFor="workspace-confirm-reason"
              className="block text-xs font-semibold text-slate-700"
            >
              {reasonLabel}
            </label>
            <Input
              id="workspace-confirm-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder={reasonPlaceholder}
              aria-invalid={Boolean(error)}
            />
            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2.5 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirmClick}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
