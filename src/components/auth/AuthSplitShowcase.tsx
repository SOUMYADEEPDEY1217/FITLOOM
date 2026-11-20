"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { Sparkles } from "lucide-react";

const AMBIENT_PARTICLES = [
  { top: "18%", left: "16%", size: 4, delay: "0s" },
  { top: "28%", left: "82%", size: 5, delay: "1.1s" },
  { top: "46%", left: "12%", size: 3, delay: "2.2s" },
  { top: "62%", left: "86%", size: 4, delay: "0.7s" },
  { top: "74%", left: "22%", size: 5, delay: "1.8s" },
  { top: "36%", left: "72%", size: 3, delay: "2.9s" },
  { top: "78%", left: "74%", size: 4, delay: "0.4s" },
  { top: "22%", left: "44%", size: 3, delay: "1.6s" },
] as const;

export function AuthSplitShowcase({
  children,
}: {
  children: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const parallaxLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const layer = parallaxLayerRef.current;
    if (!stage || !layer || typeof window === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reducedMotion || !isDesktop) return;

    const ctx = gsap.context(() => {
      const moveX = gsap.quickTo(layer, "x", {
        duration: 0.65,
        ease: "power2.out",
      });
      const moveY = gsap.quickTo(layer, "y", {
        duration: 0.65,
        ease: "power2.out",
      });
      const tiltY = gsap.quickTo(layer, "rotateY", {
        duration: 0.65,
        ease: "power2.out",
      });
      const tiltX = gsap.quickTo(layer, "rotateX", {
        duration: 0.65,
        ease: "power2.out",
      });

      const handleMove = (e: PointerEvent) => {
        const rect = stage.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        moveX(nx * 14);
        moveY(ny * 10);
        tiltY(nx * 7);
        tiltX(-ny * 5);
      };

      const handleLeave = () => {
        moveX(0);
        moveY(0);
        tiltY(0);
        tiltX(0);
      };

      stage.addEventListener("pointermove", handleMove, { passive: true });
      stage.addEventListener("pointerleave", handleLeave, { passive: true });

      return () => {
        stage.removeEventListener("pointermove", handleMove);
        stage.removeEventListener("pointerleave", handleLeave);
      };
    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row">
      {/* LEFT PANEL — Dark Plum 3D Fashion-Tech Studio */}
      <aside
        ref={stageRef}
        aria-label="FITLOOM AI Fashion Intelligence showcase"
        className="relative isolate flex w-full shrink-0 flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,#361463_0%,#1C0A36_48%,#0C0417_100%)] text-white lg:min-h-screen lg:w-1/2"
      >
        {/* Ambient Studio Light Arcs & Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="fitloom-auth-glow-pulse absolute left-1/2 top-[48%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B3DFF]/25 blur-[95px] lg:h-[440px] lg:w-[440px]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B98BFF]/15 blur-[90px]" />
          <div className="absolute -left-24 bottom-8 h-64 w-64 rounded-full bg-[#6633EE]/20 blur-[90px]" />

          {/* Sweeping studio light arc */}
          <svg
            viewBox="0 0 800 900"
            fill="none"
            className="hidden h-full w-full opacity-55 lg:block"
            preserveAspectRatio="none"
          >
            <path
              d="M520 -40 C720 140, 770 420, 610 720"
              stroke="url(#fitloomArc)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M-40 240 C90 360, 140 520, 60 760"
              stroke="url(#fitloomArcSoft)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="fitloomArc" x1="520" y1="0" x2="620" y2="720" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D8B4FE" stopOpacity="0" />
                <stop offset="0.45" stopColor="#C084FC" stopOpacity="0.65" />
                <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fitloomArcSoft" x1="0" y1="240" x2="80" y2="760" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" stopOpacity="0" />
                <stop offset="0.5" stopColor="#A78BFA" stopOpacity="0.35" />
                <stop offset="1" stopColor="#6D28D9" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Subtle dotted contour wave mesh along studio floor (desktop) */}
          <svg
            viewBox="0 0 600 180"
            fill="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 w-full opacity-45 lg:block"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="fitloomDotWave"
                x="0"
                y="0"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.15" fill="#C4B5FD" fillOpacity="0.45" />
              </pattern>
              <linearGradient id="fitloomWaveMask" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="55%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="white" stopOpacity="0.15" />
              </linearGradient>
              <mask id="waveFade">
                <rect width="600" height="180" fill="url(#fitloomWaveMask)" />
              </mask>
            </defs>
            <path
              d="M0 70 Q110 20 220 75 T440 70 T600 45 L600 180 L0 180 Z"
              fill="url(#fitloomDotWave)"
              mask="url(#waveFade)"
            />
          </svg>

          {/* Floating ambient particles (desktop) */}
          <div className="hidden lg:block">
            {AMBIENT_PARTICLES.map((p, i) => (
              <span
                key={i}
                className="fitloom-auth-mote absolute rounded-full bg-purple-200/80 shadow-[0_0_10px_rgba(192,132,252,0.9)]"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>
        </div>

        {/* MOBILE COMPACT BRANDED HEADER (< 1024px) */}
        <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6 lg:hidden">
          <div className="min-w-0 space-y-1.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B3DFF] to-[#5E22DF] text-white shadow-[0_4px_14px_rgba(126,45,242,0.5)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-extrabold tracking-[0.14em] text-white">
                FITLOOM<sup className="ml-0.5 text-[9px] font-semibold">®</sup>
              </span>
            </Link>
            <p className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
              AI Fashion,{" "}
              <span className="bg-gradient-to-r from-[#D4B3FF] to-[#A675FF] bg-clip-text text-transparent">
                Your Fit.
              </span>
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-purple-100/75">
              Intelligent sizing, personalized style, and a wardrobe that truly fits you.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-white/[0.06] p-2 backdrop-blur-sm sm:flex"
          >
            <Image
              src="/assets/hero/item-jacket.webp"
              alt=""
              width={68}
              height={68}
              className="h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(168,85,247,0.45)]"
            />
          </div>
        </div>

        {/* DESKTOP FULL 3D STUDIO COMPOSITION (>= 1024px) */}
        <div className="relative z-10 hidden flex-1 flex-col items-center justify-between px-8 py-9 xl:px-12 xl:py-11 lg:flex">
          {/* Top Brand & Identity Copy */}
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-lg px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B3DFF] to-[#5E22DF] text-white shadow-[0_0_24px_rgba(139,61,255,0.55)]">
                <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-[0.16em] text-white">
                FITLOOM<sup className="ml-0.5 text-[10px] font-semibold">®</sup>
              </span>
            </Link>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white xl:text-[2.35rem] xl:leading-[1.15]">
              AI Fashion,{" "}
              <span className="bg-gradient-to-r from-[#D4B3FF] via-[#B98BFF] to-[#9861FF] bg-clip-text text-transparent">
                Your Fit.
              </span>
            </h2>
            <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-purple-100/80">
              Intelligent sizing, personalized style, and a wardrobe that truly fits you.
            </p>
          </div>

          {/* Center 3D Animated Garment & Holographic Measurement Stage */}
          <div
            aria-hidden="true"
            className="relative flex w-full max-w-[460px] flex-1 items-center justify-center py-4 [perspective:1000px]"
          >
            <div
              ref={parallaxLayerRef}
              className="relative flex h-[360px] w-full items-center justify-center [transform-style:preserve-3d] xl:h-[400px]"
            >
              {/* Rotating 3D Measurement Ring — Primary */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center [perspective:900px]">
                <div className="fitloom-auth-ring-primary relative h-[320px] w-[320px] rounded-full border-[2px] border-purple-300/75 shadow-[0_0_26px_rgba(168,85,247,0.7),inset_0_0_18px_rgba(216,180,254,0.45)] xl:h-[360px] xl:w-[360px]">
                  <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_16px_4px_rgba(216,180,254,0.95)]" />
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-purple-200 shadow-[0_0_12px_3px_rgba(168,85,247,0.9)]" />
                </div>
              </div>

              {/* Rotating 3D Measurement Ring — Secondary */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center [perspective:900px]">
                <div className="fitloom-auth-ring-secondary h-[265px] w-[265px] rounded-full border border-dashed border-violet-300/45 shadow-[0_0_16px_rgba(139,61,255,0.4)] xl:h-[295px] xl:w-[295px]" />
              </div>

              {/* Holographic Panel 1 — Left Garment Wireframe */}
              <div className="fitloom-auth-card-a absolute left-1 top-[26%] z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-purple-200/25 bg-white/[0.06] p-2.5 shadow-[0_12px_32px_rgba(10,3,24,0.45)] backdrop-blur-md xl:left-3 xl:h-[88px] xl:w-[88px]">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  className="h-11 w-11 text-purple-100/90"
                >
                  <path
                    d="M22 12 L10 20 L15 30 L20 27 L20 52 L44 52 L44 27 L49 30 L54 20 L42 12 C39 16 25 16 22 12 Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                    fill="rgba(196,155,255,0.14)"
                  />
                  <line x1="20" y1="30" x2="44" y2="30" stroke="#D8B4FE" strokeWidth="1" strokeDasharray="2.5 2.5" />
                  <line x1="20" y1="41" x2="44" y2="41" stroke="#D8B4FE" strokeWidth="1" strokeDasharray="2.5 2.5" />
                </svg>
                <span className="mt-1 text-[9px] font-semibold tracking-wider text-purple-200/80 uppercase">
                  Garment
                </span>
              </div>

              {/* Holographic Panel 2 — Top-Right Body Measurement Mesh */}
              <div className="fitloom-auth-card-b absolute right-1 top-[14%] z-10 flex h-[86px] w-[82px] flex-col items-center justify-center rounded-2xl border border-purple-200/25 bg-white/[0.06] p-2.5 shadow-[0_12px_32px_rgba(10,3,24,0.45)] backdrop-blur-md xl:right-3 xl:h-[94px] xl:w-[88px]">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  className="h-12 w-12 text-purple-100/90"
                >
                  <path
                    d="M25 12 C25 15 39 15 39 12 L48 18 L51 32 L45 33 L43 24 L41 52 L23 52 L21 24 L19 33 L13 32 L16 18 Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="rgba(167,139,250,0.14)"
                  />
                  <path d="M22 25 Q32 28 42 25" stroke="#E9D5FF" strokeWidth="1.1" />
                  <path d="M23 35 Q32 38 41 35" stroke="#E9D5FF" strokeWidth="1.1" />
                  <path d="M23 45 Q32 47 41 45" stroke="#E9D5FF" strokeWidth="1.1" />
                  <line x1="32" y1="14" x2="32" y2="52" stroke="#D8B4FE" strokeWidth="0.9" strokeDasharray="2 2" />
                </svg>
                <span className="mt-0.5 text-[9px] font-semibold tracking-wider text-purple-200/80 uppercase">
                  Body Fit
                </span>
              </div>

              {/* Holographic Panel 3 — Bottom-Right Style Swatch Palette */}
              <div className="fitloom-auth-card-a absolute bottom-[22%] right-0 z-20 flex items-center gap-2 rounded-xl border border-purple-200/25 bg-white/[0.08] px-3 py-2 shadow-[0_12px_28px_rgba(10,3,24,0.45)] backdrop-blur-md xl:right-2">
                <span className="h-4 w-4 rounded-full bg-[#E9DDF5] ring-1 ring-white/40" />
                <span className="h-4 w-4 rounded-full bg-[#C084FC] ring-2 ring-white/80 shadow-[0_0_10px_rgba(192,132,252,0.85)]" />
                <span className="h-4 w-4 rounded-full bg-[#4C1D95] ring-1 ring-purple-300/50" />
              </div>

              {/* Floating 3D Garment Centerpiece */}
              <div className="fitloom-auth-garment relative z-20 -mt-6 flex h-[230px] w-[230px] items-center justify-center xl:h-[260px] xl:w-[260px]">
                <Image
                  src="/assets/hero/item-jacket.webp"
                  alt="FITLOOM 3D garment fit visualization"
                  width={260}
                  height={260}
                  priority
                  className="h-full w-full object-contain drop-shadow-[0_26px_38px_rgba(126,45,242,0.5)]"
                />
              </div>

              {/* Circular Glowing 3D Studio Podium */}
              <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2">
                <div className="relative h-12 w-64 xl:w-72">
                  {/* Top glowing ellipse */}
                  <div className="absolute inset-x-0 top-0 h-7 rounded-[100%] border border-purple-300/50 bg-[radial-gradient(ellipse_at_center,rgba(216,180,254,0.45)_0%,rgba(124,58,237,0.22)_50%,rgba(28,10,54,0.92)_100%)] shadow-[0_0_32px_rgba(168,85,247,0.65)]" />
                  {/* Podium cylindrical side */}
                  <div className="absolute inset-x-1 top-3.5 h-6 rounded-b-[100%] border-b border-purple-300/40 bg-gradient-to-b from-[#2A114B] to-[#120624] shadow-[0_14px_34px_rgba(126,45,242,0.55)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Studio Footer Caption */}
          <p className="text-[11px] font-medium tracking-wide text-purple-200/55">
            AI Fit Calibration · Body Profile · Personal Style Studio
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL — Clean White Authentication Form Surface */}
      <section className="flex flex-1 flex-col items-center justify-center bg-white px-5 py-8 sm:px-10 sm:py-10 lg:w-1/2 lg:px-14 lg:py-8">
        <div className="w-full max-w-[420px]">{children}</div>
      </section>
    </div>
  );
}
