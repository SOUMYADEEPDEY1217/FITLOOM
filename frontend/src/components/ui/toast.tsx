"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ToastInput {
  type?: ToastType;
  title?: string;
  message: string;
  /** Auto-dismiss delay in ms. Pass null or 0 for persistent until dismissed. */
  duration?: number | null;
  action?: ToastAction;
}

export interface ToastItem extends ToastInput {
  id: string;
  type: ToastType;
  createdAt: number;
}

const TOAST_META: Record<
  ToastType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    border: string;
    accentBar: string;
    iconClass: string;
    badgeBg: string;
  }
> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    border: "border-emerald-200",
    accentBar: "bg-emerald-600",
    iconClass: "text-emerald-700",
    badgeBg: "bg-emerald-50 text-emerald-900",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    border: "border-red-200",
    accentBar: "bg-red-600",
    iconClass: "text-red-700",
    badgeBg: "bg-red-50 text-red-900",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    border: "border-amber-300",
    accentBar: "bg-amber-600",
    iconClass: "text-amber-700",
    badgeBg: "bg-amber-50 text-amber-900",
  },
  info: {
    label: "Info",
    icon: Info,
    border: "border-violet-200",
    accentBar: "bg-[#6633EE]",
    iconClass: "text-[#6633EE]",
    badgeBg: "bg-[#EDE9FE] text-[#4C1D95]",
  },
};

function ToastCard({
  toast,
  onDismiss,
  registerDismissBtn,
}: {
  toast: ToastItem;
  onDismiss: (id: string, fromUserInteraction?: boolean) => void;
  registerDismissBtn: (id: string, el: HTMLButtonElement | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const defaultDuration =
    toast.type === "error" || toast.type === "warning" ? 6000 : 4500;
  const effectiveDuration =
    toast.duration === undefined ? defaultDuration : toast.duration;

  const remainingRef = useRef<number>(
    effectiveDuration && effectiveDuration > 0 ? effectiveDuration : 0
  );
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paused = hovered || focused;

  useEffect(() => {
    if (!effectiveDuration || effectiveDuration <= 0) return;

    if (paused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(
          250,
          remainingRef.current - (Date.now() - startedAtRef.current)
        );
        startedAtRef.current = null;
      }
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id, false);
    }, remainingRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast.id, effectiveDuration, paused, onDismiss]);

  const meta = TOAST_META[toast.type] ?? TOAST_META.info;
  const Icon = meta.icon;

  return (
    <div
      role="group"
      aria-label={toast.title ? `${meta.label}: ${toast.title}` : meta.label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      className={cn(
        "fitloom-toast-card pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border bg-white p-3.5 pl-4 text-slate-900 shadow-lg ring-1 ring-slate-950/5",
        meta.border
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", meta.accentBar)}
      />

      <span className={cn("mt-0.5 shrink-0", meta.iconClass)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              meta.badgeBg
            )}
          >
            {meta.label}
          </span>
          {toast.title && (
            <p className="text-sm font-bold leading-snug text-slate-950 break-words">
              {toast.title}
            </p>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-700 break-words">
          {toast.message}
        </p>

        {toast.action && (
          <div className="pt-1">
            {toast.action.href ? (
              <Link
                href={toast.action.href}
                onClick={() => onDismiss(toast.id, false)}
                className="inline-flex min-h-8 items-center rounded-md px-2 py-1 text-xs font-bold text-[#6633EE] hover:bg-violet-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                {toast.action.label} →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick?.();
                  onDismiss(toast.id, false);
                }}
                className="inline-flex min-h-8 cursor-pointer items-center rounded-md px-2 py-1 text-xs font-bold text-[#6633EE] hover:bg-violet-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>

      <button
        ref={(el) => registerDismissBtn(toast.id, el)}
        type="button"
        onClick={() => onDismiss(toast.id, true)}
        aria-label="Dismiss notification"
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const dismissBtnRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const externalFocusRef = useRef<HTMLElement | null>(null);
  const announcedIdsRef = useRef<Set<string>>(new Set());

  const [politeText, setPoliteText] = useState("");
  const [assertiveText, setAssertiveText] = useState("");

  // Announce newly added toasts via single centralized live regions
  useEffect(() => {
    const unseen = toasts.filter((t) => !announcedIdsRef.current.has(t.id));
    if (unseen.length === 0) return;

    const latest = unseen[unseen.length - 1];
    unseen.forEach((t) => announcedIdsRef.current.add(t.id));

    const label = TOAST_META[latest.type]?.label ?? "Notification";
    const announcement = `${label}: ${latest.title ? `${latest.title}. ` : ""}${latest.message}${latest.action ? " Actions available." : ""}`;

    if (latest.type === "error") {
      setAssertiveText("");
      const raf = requestAnimationFrame(() => setAssertiveText(announcement));
      return () => cancelAnimationFrame(raf);
    }

    setPoliteText("");
    const raf = requestAnimationFrame(() => setPoliteText(announcement));
    return () => cancelAnimationFrame(raf);
  }, [toasts]);

  // Promote container to Top Layer via popover="manual" when notifications exist
  useEffect(() => {
    const el = regionRef.current as
      | (HTMLDivElement & {
          showPopover?: () => void;
          hidePopover?: () => void;
        })
      | null;
    if (!el) return;

    try {
      if (toasts.length > 0 && typeof el.showPopover === "function") {
        if (!el.matches(":popover-open")) {
          el.showPopover();
        }
      } else if (toasts.length === 0 && typeof el.hidePopover === "function") {
        if (el.matches(":popover-open")) {
          el.hidePopover();
        }
      }
    } catch {
      // Fallback to fixed CSS stacking cleanly
    }
  }, [toasts.length]);

  function registerDismissBtn(id: string, el: HTMLButtonElement | null) {
    if (el) {
      dismissBtnRefs.current.set(id, el);
    } else {
      dismissBtnRefs.current.delete(id);
    }
  }

  function handleDismiss(id: string, fromUserInteraction = false) {
    if (fromUserInteraction) {
      const idx = toasts.findIndex((t) => t.id === id);
      const remaining = toasts.filter((t) => t.id !== id);
      const nextToast = remaining[Math.min(idx, remaining.length - 1)];

      onDismiss(id);

      requestAnimationFrame(() => {
        if (nextToast) {
          dismissBtnRefs.current.get(nextToast.id)?.focus();
        } else if (
          externalFocusRef.current &&
          externalFocusRef.current.isConnected
        ) {
          externalFocusRef.current.focus();
          externalFocusRef.current = null;
        }
      });
      return;
    }

    onDismiss(id);
  }

  return (
    <>
      {/* Persistent single polite & assertive screen-reader live regions */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeText}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveText}
      </div>

      {/* Popover top-layer / fixed non-blocking stack */}
      <div
        ref={regionRef}
        role="region"
        aria-label="Notifications"
        {...({ popover: "manual" } as React.HTMLAttributes<HTMLDivElement>)}
        onFocusCapture={(e) => {
          const prev = e.relatedTarget;
          if (
            prev instanceof HTMLElement &&
            !e.currentTarget.contains(prev)
          ) {
            externalFocusRef.current = prev;
          }
        }}
        className={cn(
          "fitloom-toast-region pointer-events-none flex flex-col gap-2.5",
          toasts.length === 0 && "hidden"
        )}
      >
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            onDismiss={handleDismiss}
            registerDismissBtn={registerDismissBtn}
          />
        ))}
      </div>
    </>
  );
}
