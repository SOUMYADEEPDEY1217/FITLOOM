"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { triggerCookieSettingsModal } from "@/lib/public-pages-utils";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_COLUMNS = [
  {
    heading: "PRODUCTS",
    links: [
      { label: "VIRTUAL TRY-ON", href: "/try-on" },
      { label: "FIT INTELLIGENCE", href: "/fit-check" },
      { label: "STYLE DNA", href: "/studio" },
      { label: "WARDROBE AI", href: "/saved-looks" },
    ],
  },
  {
    heading: "MISSION AREAS",
    links: [
      { label: "FASHION AI", href: "/how-it-works#fashion-ai" },
      { label: "PERSONAL STYLING", href: "/how-it-works#styling" },
      { label: "SIZE & FIT TECH", href: "/how-it-works#fit-tech" },
      { label: "SUSTAINABLE FASHION", href: "/how-it-works#sustainability" },
    ],
  },
  {
    heading: "COMPANY",
    links: [
      { label: "ABOUT", href: "/about" },
      { label: "CAREERS", href: "/about#careers" },
      { label: "NEWS", href: "/about#news" },
      { label: "CONTACT", href: "/contact" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "LINKEDIN", href: "/contact#socials" },
  { label: "X", href: "/contact#socials" },
  { label: "INSTAGRAM", href: "/contact#socials" },
  { label: "YOUTUBE", href: "/contact#socials" },
];

export function Footer() {
  const footerRef = useRef<HTMLElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const capRef = useRef<HTMLDivElement | null>(null);
  const jacketRef = useRef<HTMLDivElement | null>(null);
  const tshirtRef = useRef<HTMLDivElement | null>(null);
  const trousersRef = useRef<HTMLDivElement | null>(null);
  const wave1Ref = useRef<SVGPathElement | null>(null);
  const wave2Ref = useRef<SVGPathElement | null>(null);
  const wave3Ref = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Wordmark subtle one-time viewport entrance
      if (wordmarkRef.current) {
        gsap.from(wordmarkRef.current, {
          y: 26,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerEl,
            start: "top 88%",
            once: true,
          },
        });
      }

      // Independent garment floating & subtle tilt
      if (capRef.current) {
        gsap.to(capRef.current, {
          y: -9,
          rotation: 3.5,
          duration: 4.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (jacketRef.current) {
        gsap.to(jacketRef.current, {
          y: -12,
          rotation: -2.2,
          duration: 5.2,
          delay: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (tshirtRef.current) {
        gsap.to(tshirtRef.current, {
          y: -10,
          rotation: -3.5,
          duration: 4.8,
          delay: 0.75,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (trousersRef.current) {
        gsap.to(trousersRef.current, {
          y: -10,
          rotation: 3,
          duration: 5.8,
          delay: 1.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Natural orbital sway (no excessive spinning)
      gsap.utils.toArray<SVGElement>(".footer-orbit").forEach((orbit, idx) => {
        gsap.to(orbit, {
          rotation: idx % 2 === 0 ? 10 : -10,
          scale: 1.03,
          transformOrigin: "50% 50%",
          duration: 5.5 + idx * 0.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // Subtle continuous layered bottom wave drift
      if (wave1Ref.current) {
        gsap.to(wave1Ref.current, {
          x: -22,
          duration: 7.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (wave2Ref.current) {
        gsap.to(wave2Ref.current, {
          x: 22,
          duration: 8.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (wave3Ref.current) {
        gsap.to(wave3Ref.current, {
          x: -14,
          duration: 6.0,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Restrained desktop pointer parallax (zero React state updates)
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) {
        const garmentEls = [
          { el: capRef.current, factor: 10 },
          { el: jacketRef.current, factor: 14 },
          { el: tshirtRef.current, factor: 12 },
          { el: trousersRef.current, factor: 10 },
        ].filter((g) => g.el !== null);

        const quickX = garmentEls.map((g) =>
          gsap.quickTo(g.el!, "x", { duration: 0.65, ease: "power2.out" })
        );

        const onPointerMove = (e: PointerEvent) => {
          const rect = footerEl.getBoundingClientRect();
          const normX = (e.clientX - rect.left) / rect.width - 0.5;
          garmentEls.forEach((g, i) => quickX[i](normX * g.factor));
        };

        footerEl.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        return () => {
          footerEl.removeEventListener("pointermove", onPointerMove);
        };
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      aria-label="Site footer"
      className="relative mt-24 w-full overflow-hidden border-t border-violet-100/80 pt-20"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, #F5ECFF 22%, #DFC3FF 54%, #BE8CFF 82%, #9353F4 100%)",
      }}
    >
      {/* 1. Spacious Navigation & Social Region */}
      <div className="relative z-30 mx-auto max-w-[1380px] px-5 sm:px-10">
        <div className="flex flex-col justify-between gap-12 lg:flex-row lg:items-start">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16 lg:gap-24">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="space-y-3.5">
                <h2 className="text-[11px] font-bold tracking-[0.16em] text-slate-900">
                  {col.heading}
                </h2>
                <ul className="space-y-2.5">
                  {col.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-[11px] font-medium tracking-[0.09em] text-slate-700 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-8 sm:gap-14 lg:gap-20">
            {SOCIAL_LINKS.map((soc) => (
              <Link
                key={soc.label}
                href={soc.href}
                className="text-[11px] font-bold tracking-[0.16em] text-slate-900 transition-colors hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded"
              >
                {soc.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 2. Legal & Compliance Region */}
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-violet-400/35 pt-6 text-[10px] font-semibold tracking-[0.12em] text-slate-800 lg:flex-row lg:items-center">
          <p>
            © {new Date().getFullYear()} FITLOOM TECHNOLOGIES. ALL RIGHTS
            RESERVED.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link href="/faq" className="hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded">
              FAQ
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/shipping" className="hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded">
              SHIPPING
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/returns" className="hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded">
              RETURNS &amp; REFUNDS
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/terms" className="hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded">
              TERMS &amp; CONDITIONS
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/privacy" className="hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE] rounded">
              PRIVACY POLICY
            </Link>
            <span aria-hidden="true">|</span>
            <button
              type="button"
              onClick={() => triggerCookieSettingsModal()}
              className="cursor-pointer rounded tracking-[0.12em] hover:text-[#6633EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
            >
              COOKIE SETTINGS
            </button>
          </div>
        </div>
      </div>

      {/* 3. Almost Full-Width Editorial Wordmark & Suspended 3D Apparel Stage */}
      <div className="relative mt-20 w-full select-none px-0.5 pb-10 pt-14 sm:mt-24 sm:pb-16 sm:pt-16">
        {/* Massive Edge-to-Edge Black FITLOOM Wordmark */}
        <div
          ref={wordmarkRef}
          className="relative z-10 flex items-center justify-center"
        >
          <svg
            viewBox="28 250 972.3 159"
            className="h-auto w-full"
            role="img"
            aria-label="FITLOOM wordmark"
          >
            {/* F — R30 outer top-left arc, R4.5 terminal corners, R5 inner fillets */}
            <path
              d="M 28.8 283.5 A 30 30 0 0 1 58.8 253.5 H 151.2 A 4.5 4.5 0 0 1 155.7 258 V 282.3 A 4.5 4.5 0 0 1 151.2 286.8 H 67.9 A 5 5 0 0 0 62.9 291.8 V 306.3 A 5 5 0 0 0 67.9 311.3 H 135.1 A 4.5 4.5 0 0 1 139.6 315.8 V 340.3 A 4.5 4.5 0 0 1 135.1 344.8 H 67.9 A 5 5 0 0 0 62.9 349.8 V 401 A 4.5 4.5 0 0 1 58.4 405.5 H 33.3 A 4.5 4.5 0 0 1 28.8 401 Z"
              fill="#050505"
            />

            {/* I — Full 152px cap-height heavy vertical stem with R4.5 corners */}
            <rect
              x="166.8"
              y="253.5"
              width="33.7"
              height="152"
              rx="4.5"
              fill="#050505"
            />

            {/* T — Broad top bar, R4.5 terminal corners & R4.5 armpit fillets */}
            <path
              d="M 216.5 253.5 H 319.3 A 4.5 4.5 0 0 1 323.8 258 V 282.3 A 4.5 4.5 0 0 1 319.3 286.8 H 289.5 A 4.5 4.5 0 0 0 285 291.3 V 401 A 4.5 4.5 0 0 1 280.5 405.5 H 255.9 A 4.5 4.5 0 0 1 251.4 401 V 291.3 A 4.5 4.5 0 0 0 246.9 286.8 H 216.5 A 4.5 4.5 0 0 1 212 282.3 V 258 A 4.5 4.5 0 0 1 216.5 253.5 Z"
              fill="#050505"
            />

            {/* L — R32 outer bottom-left curve, R4.5 terminal corners & R5.5 inner fillet */}
            <path
              d="M 339.9 253.5 H 365.7 A 4.5 4.5 0 0 1 370.2 258 V 365.6 A 5.5 5.5 0 0 0 375.7 371.1 H 477.7 A 4.5 4.5 0 0 1 482.2 375.6 V 401 A 4.5 4.5 0 0 1 477.7 405.5 H 367.4 A 32 32 0 0 1 335.4 373.5 V 258 A 4.5 4.5 0 0 1 339.9 253.5 Z"
              fill="#050505"
            />

            {/* First O — Exact R63 outer / R32 inner rounded-square geometry */}
            <path
              fillRule="evenodd"
              d="M 550.3 253.5 H 582.4 A 63 63 0 0 1 645.4 316.5 V 342.3 A 63 63 0 0 1 582.4 405.3 H 550.3 A 63 63 0 0 1 487.3 342.3 V 316.5 A 63 63 0 0 1 550.3 253.5 Z M 552.6 286.6 A 32 32 0 0 0 520.6 318.6 V 338.8 A 32 32 0 0 0 552.6 370.8 H 579.6 A 32 32 0 0 0 611.6 338.8 V 318.6 A 32 32 0 0 0 579.6 286.6 Z"
              fill="#050505"
            />

            {/* Second O — Exact R63 outer / R32 inner rounded-square geometry */}
            <path
              fillRule="evenodd"
              d="M 716.4 253.5 H 749.4 A 63 63 0 0 1 812.4 316.5 V 342.3 A 63 63 0 0 1 749.4 405.3 H 716.4 A 63 63 0 0 1 653.4 342.3 V 316.5 A 63 63 0 0 1 716.4 253.5 Z M 719.5 286.6 A 32 32 0 0 0 687.5 318.6 V 338.8 A 32 32 0 0 0 719.5 370.8 H 746.3 A 32 32 0 0 0 778.3 338.8 V 318.6 A 32 32 0 0 0 746.3 286.6 Z"
              fill="#050505"
            />

            {/* Second O Center — 4-point concave sparkle matched to sub-pixel curve */}
            <path
              d="M 732.9 312.4 Q 734.9 325.5 747.5 327 Q 734.9 328.5 732.9 341.6 Q 730.9 328.5 718.3 327 Q 730.9 325.5 732.9 312.4 Z"
              fill="#050505"
            />

            {/* M — Broad 176px × 152px geometric M with R4.5 corners & 45-degree V diagonals */}
            <path
              d="M 828 253.5 H 856.2 Q 858.6 253.5 860.4 255.3 L 910.4 306.5 Q 911.5 307.6 912.6 306.5 L 964.4 255.3 Q 966.2 253.5 968.6 253.5 H 995 A 4.5 4.5 0 0 1 999.5 258 V 401 A 4.5 4.5 0 0 1 995 405.5 H 968.7 A 4.5 4.5 0 0 1 964.2 401 V 303.5 L 913.6 353.8 Q 911.5 355.9 909.4 353.8 L 859.4 303.5 V 401 A 4.5 4.5 0 0 1 854.9 405.5 H 828 A 4.5 4.5 0 0 1 823.5 401 V 258 A 4.5 4.5 0 0 1 828 253.5 Z"
              fill="#050505"
            />
          </svg>
        </div>

        {/* 1. Cap: Prominent on left near F/I */}
        <div
          ref={capRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[8%] left-[10%] z-20 w-[17%] sm:bottom-[10%] sm:left-[12%] sm:w-[13.5%]"
        >
          <svg
            viewBox="0 0 160 80"
            className="footer-orbit absolute -inset-x-3 bottom-1 w-[125%] opacity-85 drop-shadow-[0_0_10px_rgba(243,232,255,0.85)]"
          >
            <ellipse
              cx="80"
              cy="40"
              rx="68"
              ry="17"
              fill="none"
              stroke="#F3E8FF"
              strokeWidth="1.8"
              transform="rotate(-12 80 40)"
            />
          </svg>
          <img
            src="/assets/footer/cap.webp"
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full drop-shadow-2xl"
          />
        </div>

        {/* 2. Technical Jacket: Prominent center-left overlapping T/L */}
        <div
          ref={jacketRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[16%] left-[27%] z-30 w-[25%] sm:bottom-[18%] sm:left-[28%] sm:w-[21%]"
        >
          <svg
            viewBox="0 0 200 100"
            className="footer-orbit absolute -inset-x-4 bottom-2 w-[122%] opacity-90 drop-shadow-[0_0_12px_rgba(243,232,255,0.9)]"
          >
            <ellipse
              cx="100"
              cy="50"
              rx="86"
              ry="22"
              fill="none"
              stroke="#F3E8FF"
              strokeWidth="2"
              transform="rotate(14 100 50)"
            />
          </svg>
          <img
            src="/assets/footer/jacket.webp"
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full drop-shadow-[0_22px_28px_rgba(30,27,75,0.35)]"
          />
        </div>

        {/* 3. Purple T-Shirt: Intentionally suspended above wordmark (zero overlap with Legal row) */}
        <div
          ref={tshirtRef}
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 right-[28%] z-20 w-[16%] sm:-top-6 sm:right-[30%] sm:w-[13%]"
        >
          <svg
            viewBox="0 0 180 90"
            className="footer-orbit absolute -inset-x-4 top-6 w-[124%] opacity-85 drop-shadow-[0_0_10px_rgba(243,232,255,0.85)]"
          >
            <ellipse
              cx="90"
              cy="45"
              rx="76"
              ry="17"
              fill="none"
              stroke="#F3E8FF"
              strokeWidth="1.8"
              transform="rotate(-10 90 45)"
            />
          </svg>
          <img
            src="/assets/footer/tshirt.webp"
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full drop-shadow-2xl"
          />
        </div>

        {/* 4. Cargo Trousers: Prominent on right overlapping M */}
        <div
          ref={trousersRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[6%] right-[4%] z-20 w-[18%] sm:bottom-[8%] sm:right-[6%] sm:w-[14.5%]"
        >
          <svg
            viewBox="0 0 180 90"
            className="footer-orbit absolute -inset-x-3 bottom-3 w-[120%] opacity-85 drop-shadow-[0_0_10px_rgba(243,232,255,0.85)]"
          >
            <ellipse
              cx="90"
              cy="45"
              rx="74"
              ry="19"
              fill="none"
              stroke="#F3E8FF"
              strokeWidth="1.8"
              transform="rotate(15 90 45)"
            />
          </svg>
          <img
            src="/assets/footer/trousers.webp"
            alt=""
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="relative h-auto w-full drop-shadow-2xl"
          />
        </div>
      </div>

      {/* 4. Richer Flowing Layered Purple Bottom Waves */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-[-4%] z-10 h-16 w-[108%] sm:h-28"
      >
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          ref={wave1Ref}
          d="M0,44 C260,112 480,10 760,56 C1040,102 1260,18 1440,58 L1440,140 L0,140 Z"
          fill="url(#wave-grad-1)"
        />
        <path
          ref={wave2Ref}
          d="M0,74 C300,20 580,116 900,66 C1180,26 1320,90 1440,70 L1440,140 L0,140 Z"
          fill="url(#wave-grad-2)"
        />
        <path
          ref={wave3Ref}
          d="M0,104 C280,82 540,124 840,98 C1120,76 1300,114 1440,96 L1440,140 L0,140 Z"
          fill="#6D28D9"
          fillOpacity="0.45"
        />
      </svg>
    </footer>
  );
}
