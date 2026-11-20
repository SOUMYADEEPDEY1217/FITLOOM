"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Button } from "@/components/ui/button";
import {
  COOKIE_STORAGE_KEY,
  type CookiePreferences,
  DEFAULT_COOKIE_PREFERENCES,
  OPEN_COOKIE_SETTINGS_EVENT,
  parseStoredCookiePreferences,
} from "@/lib/public-pages-utils";

export function CookieConsentBanner() {
  const { toast } = useFitloom();

  const [mounted, setMounted] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preferencesAllowed, setPreferencesAllowed] = useState<boolean>(
    DEFAULT_COOKIE_PREFERENCES.preferences
  );
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(
    DEFAULT_COOKIE_PREFERENCES.analytics
  );

  useEffect(() => {
    setMounted(true);
    try {
      const saved = parseStoredCookiePreferences(
        window.localStorage.getItem(COOKIE_STORAGE_KEY)
      );
      if (saved) {
        setPreferencesAllowed(saved.preferences);
        setAnalyticsAllowed(saved.analytics);
        setBannerVisible(false);
      } else {
        setBannerVisible(true);
      }
    } catch {
      setBannerVisible(true);
    }

    function handleOpenModal() {
      try {
        const saved = parseStoredCookiePreferences(
          window.localStorage.getItem(COOKIE_STORAGE_KEY)
        );
        if (saved) {
          setPreferencesAllowed(saved.preferences);
          setAnalyticsAllowed(saved.analytics);
        }
      } catch {
        // Ignore storage read failure in restricted environments
      }
      setModalOpen(true);
    }

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenModal);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenModal);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function persistConsent(prefs: boolean, analytics: boolean, label: string) {
    const payload: CookiePreferences = {
      essential: true,
      preferences: prefs,
      analytics,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    try {
      window.localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Non-fatal in private/quota-restricted contexts
    }
    setPreferencesAllowed(prefs);
    setAnalyticsAllowed(analytics);
    setBannerVisible(false);
    setModalOpen(false);
    toast({
      type: "info",
      title: "Cookie Preferences Saved",
      message: `${label} stored locally in your browser.`,
    });
  }

  if (!mounted) return null;

  return (
    <>
      {bannerVisible && !modalOpen && (
        <aside
          role="region"
          aria-label="Cookie consent notice"
          className="fixed right-3 bottom-3 left-3 z-40 mx-auto max-w-4xl rounded-2xl border border-violet-200 bg-white/95 p-4 shadow-lg backdrop-blur-md sm:right-6 sm:bottom-5 sm:left-6 sm:p-5"
        >
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[#6633EE]">
                <Cookie className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1 text-xs leading-relaxed text-slate-600">
                <p className="text-sm font-bold text-slate-950">
                  Browser Storage &amp; Cookie Preferences
                </p>
                <p>
                  FITLOOM uses essential browser storage for session demo
                  continuity. Optional preference and telemetry categories can
                  be customized below or via our{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-[#6633EE] underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setModalOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                Manage Preferences
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  persistConsent(false, false, "Essential-only settings")
                }
              >
                Essential Only
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  persistConsent(true, true, "All cookie categories")
                }
              >
                Accept All
              </Button>
            </div>
          </div>
        </aside>
      )}

      {modalOpen && (
        <div
          role="presentation"
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-heading"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg space-y-5 rounded-3xl border border-violet-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[#6633EE]">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="cookie-modal-heading"
                    className="text-base font-extrabold text-slate-950"
                  >
                    Manage Cookie &amp; Storage Preferences
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Stored locally in this browser (`localStorage`). No external
                    tracking scripts run in this frontend demo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close cookie preferences"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-950">
                    Essential Session Storage (Always Active)
                  </p>
                  <p className="text-slate-600">
                    Supports core navigation, cart bag continuity, and saving
                    your consent selection.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Required
                </span>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-violet-200">
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-950">
                    Fit &amp; Unit Preferences
                  </span>
                  <span className="block text-slate-600">
                    Remembers measurement unit choices (cm/in) and fit display
                    preferences.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesAllowed}
                  onChange={(e) => setPreferencesAllowed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#6633EE]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-violet-200">
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-950">
                    Analytics &amp; Telemetry (Planned Production Scope)
                  </span>
                  <span className="block text-slate-600">
                    Reserved preference toggle for future aggregated fit-accuracy
                    telemetry (no third-party analytics run in this build).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsAllowed}
                  onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#6633EE]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-4">
              <Link
                href="/privacy"
                onClick={() => setModalOpen(false)}
                className="text-xs font-semibold text-[#6633EE] hover:underline"
              >
                Read Privacy Policy →
              </Link>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    persistConsent(false, false, "Essential-only settings")
                  }
                >
                  Essential Only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    persistConsent(
                      preferencesAllowed,
                      analyticsAllowed,
                      "Custom cookie preferences"
                    )
                  }
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
