"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import {
  LANDING_NAV_SECTIONS,
  LandingMobileDrawer,
} from "@/components/layout/landing-mobile-drawer";
import { useMobileDrawerController } from "@/components/layout/mobile-nav-drawer";

export function HeroNavbar() {
  const { mobileOpen, triggerRef, closeDrawer, toggleDrawer } =
    useMobileDrawerController("/");
  const [activeSection, setActiveSection] = useState<string>("about");

  const isNavClickRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    isNavClickRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isNavClickRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockScroll = () => {
      isNavClickRef.current = false;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };

    // 1. Sync from hash on initial load or popstate/hashchange
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (LANDING_NAV_SECTIONS.some((s) => s.id === hash)) {
        setActiveSection(hash);
        isNavClickRef.current = true;
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = setTimeout(unlockScroll, 1000);
        return true;
      }
      return false;
    };

    // 2. Active section detection based on dominant visible coverage in reading zone
    let rafId: number | null = null;
    const updateActiveSectionOnScroll = () => {
      if (isNavClickRef.current) return;

      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const navH = 72;

      // Top of page (Hero section)
      if (scrollY < 120) {
        setActiveSection(LANDING_NAV_SECTIONS[0].id);
        return;
      }

      // Bottom of page (FAQs / Footer)
      if (scrollY + vh >= docH - 60) {
        setActiveSection(
          LANDING_NAV_SECTIONS[LANDING_NAV_SECTIONS.length - 1].id
        );
        return;
      }

      // Focal Reading Zone (between sticky navbar and upper 70% of viewport)
      const zoneTop = navH;
      const zoneBottom = Math.min(vh, navH + (vh - navH) * 0.7);

      let bestId = LANDING_NAV_SECTIONS[0].id;
      let maxCoverage = -1;

      for (const section of LANDING_NAV_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const visTop = Math.max(r.top, zoneTop);
        const visBottom = Math.min(r.bottom, zoneBottom);
        const coverage = Math.max(0, visBottom - visTop);

        if (coverage > maxCoverage) {
          maxCoverage = coverage;
          bestId = section.id;
        }
      }

      if (maxCoverage > 0) {
        setActiveSection(bestId);
      }
    };

    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveSectionOnScroll);
    };

    // User manual scroll interactions immediately release click-lock
    window.addEventListener("wheel", unlockScroll, { passive: true });
    window.addEventListener("touchmove", unlockScroll, { passive: true });
    window.addEventListener("scrollend", unlockScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    window.addEventListener("resize", handleScroll, { passive: true });

    if (!syncFromHash()) {
      updateActiveSectionOnScroll();
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      window.removeEventListener("wheel", unlockScroll);
      window.removeEventListener("touchmove", unlockScroll);
      window.removeEventListener("scrollend", unlockScroll);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E9DDF5]/90 bg-[#FCF9FD]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1672px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-3 lg:px-4 xl:gap-4 xl:px-6">
        {/* Left: FITLOOM Brand Logo & Icon */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 rounded-md text-[#2B1235] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] sm:gap-2 xl:gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_6px_16px_rgba(126,45,242,0.28)] sm:h-8.5 sm:w-8.5 xl:h-9 xl:w-9">
            <Sparkles
              className="h-4 w-4 sm:h-4.5 sm:w-4.5 xl:h-5 xl:w-5"
              aria-hidden="true"
            />
          </span>
          <span className="text-[17px] font-black tracking-[0.04em] text-[#1D0B24] sm:text-[18px] xl:text-[22px]">
            FITLOOM
            <sup className="ml-0.5 align-super text-[10px] font-bold sm:text-[11px]">
              ®
            </sup>
          </span>
        </Link>

        {/* Center: Clean Landing Page Section Anchors (Desktop >= 1024px) */}
        <nav
          aria-label="Landing page sections navigation"
          className="hidden flex-1 lg:flex lg:items-center lg:justify-center px-1 xl:px-2"
        >
          <div className="inline-flex items-center gap-0.5 xl:gap-1 rounded-full border border-[#E9DDF5]/70 bg-white/70 p-1 shadow-2xs backdrop-blur-xs">
            {LANDING_NAV_SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <a
                  key={section.id}
                  href={section.href}
                  onClick={() => handleNavClick(section.id)}
                  className={`rounded-full px-2.5 py-1 text-[12px] xl:px-3.5 xl:text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] ${
                    active
                      ? "bg-gradient-to-r from-[#7E2DF2] to-[#5E22DF] text-white shadow-[0_2px_8px_rgba(126,45,242,0.3)]"
                      : "text-[#3D1A45]/85 hover:bg-[#E9DDF5]/60 hover:text-[#1D0B24]"
                  }`}
                >
                  {section.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Right: Auth Action Cluster on Desktop / Hamburger on Mobile */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          {/* Desktop Auth Buttons (>= 1024px) */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#4E2858]/20 bg-white/95 px-3.5 text-xs font-semibold text-[#2A1434] transition-colors hover:border-[#873CC1]/50 hover:bg-[#E9DDF5]/40 hover:text-[#873CC1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-[#5D145E] to-[#4E2858] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile hamburger trigger */}
          <button
            ref={triggerRef}
            type="button"
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="hero-landing-nav-drawer"
            onClick={toggleDrawer}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#4E2858]/25 bg-white text-[#2A1434] hover:bg-[#E9DDF5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] sm:h-10 sm:w-10 lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Landing Page Section Links + Guest Auth Buttons) */}
      <LandingMobileDrawer
        id="hero-landing-nav-drawer"
        open={mobileOpen}
        activeSection={activeSection}
        onSelectSection={handleNavClick}
        onClose={closeDrawer}
      />
    </header>
  );
}
