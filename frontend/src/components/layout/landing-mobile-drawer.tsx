"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

export interface LandingSectionLink {
  id: string;
  label: string;
  href: string;
}

export const LANDING_NAV_SECTIONS: LandingSectionLink[] = [
  { id: "about", label: "About", href: "#about" },
  { id: "body-profile", label: "Body Profile", href: "#body-profile" },
  { id: "fit-check", label: "Fit Check", href: "#fit-check" },
  { id: "style-studio", label: "Style Studio", href: "#style-studio" },
  { id: "featured-collection", label: "Featured Collection", href: "#featured-collection" },
  { id: "customfit", label: "CUSTOMFIT", href: "#customfit" },
  { id: "how-it-works", label: "How It Works", href: "#how-it-works" },
  { id: "faqs", label: "FAQs", href: "#faqs" },
];

export function LandingMobileDrawer({
  id,
  open,
  activeSection,
  onSelectSection,
  onClose,
}: {
  id: string;
  open: boolean;
  activeSection: string;
  onSelectSection?: (id: string) => void;
  onClose: (options?: { restoreFocus?: boolean }) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose({ restoreFocus: true });
    }
  }

  function handleSectionClick(id: string) {
    onSelectSection?.(id);
    onClose({ restoreFocus: false });
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Landing page sections menu"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose({ restoreFocus: true });
      }}
      className="fitloom-nav-drawer fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-black/45 p-0 backdrop-blur-xs open:flex open:justify-end"
    >
      <div
        ref={sheetRef}
        role="document"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xs flex-col border-l border-[#E9DDF5] bg-[#FCF9FD] p-6 text-[#2A1434] shadow-2xl focus:outline-none"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E9DDF5] pb-4">
          <Link
            href="/"
            onClick={() => onClose({ restoreFocus: false })}
            className="flex items-center gap-2 rounded-md text-[#1D0B24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-xs">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-[0.12em] text-[#1D0B24]">
              FITLOOM<sup className="ml-0.5 text-[10px] font-semibold">®</sup>
            </span>
          </Link>

          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close navigation menu"
            onClick={() => onClose({ restoreFocus: true })}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#4E2858]/25 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Section Navigation Links */}
        <div className="mt-4 flex-1 overflow-y-auto py-2">
          <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wider text-[#4E2858]/70">
            Landing Page Sections
          </p>
          <nav aria-label="Landing page sections" className="space-y-1">
            {LANDING_NAV_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <a
                  key={section.id}
                  href={section.href}
                  onClick={() => handleSectionClick(section.id)}
                  className={`flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] ${
                    active
                      ? "border border-[#873CC1] bg-[#E9DDF5]/75 text-[#4E2858]"
                      : "text-[#2A1434] hover:bg-[#E9DDF5]/50 hover:text-[#873CC1]"
                  }`}
                >
                  {section.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Auth Action Area (Mobile / Tablet) */}
        <div className="border-t border-[#E9DDF5] pt-4 space-y-2">
          <Link
            href="/signup"
            onClick={() => onClose({ restoreFocus: false })}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#5D145E] to-[#4E2858] text-sm font-semibold text-white shadow-xs transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            onClick={() => onClose({ restoreFocus: false })}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-[#4E2858]/25 bg-white text-sm font-semibold text-[#2A1434] transition-colors hover:bg-[#E9DDF5]/50 hover:text-[#873CC1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
          >
            Log In
          </Link>
          <p className="pt-2 text-center text-[11px] text-[#4E2858]/70">
            Public Exploration Mode
          </p>
        </div>
      </div>
    </dialog>
  );
}
