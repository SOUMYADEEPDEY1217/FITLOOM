import React from "react";

export function BrandBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Base Off-White to Soft Lavender Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(85% 95% at 15% 15%, #FCF9FD 0%, #F7ECFC 45%, #E9DDF5 80%, #DEC6EE 100%)",
        }}
      />

      {/* Ambient Soft Lavender Geometric Curves & Giant Slanted FITLOOM F */}
      <svg
        viewBox="0 44 1024 532"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 z-0 h-full w-full"
      >
        <defs>
          <linearGradient id="hero-f-plum" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9A367F" />
            <stop offset="48%" stopColor="#772162" />
            <stop offset="100%" stopColor="#4E2858" />
          </linearGradient>

          <linearGradient id="hero-lav-curve" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E6FB" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D8C3EA" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="hero-right-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EFE0FA" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#D8BBE9" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Soft vertical pill wash behind hero couple left side */}
        <path
          d="M 425 44 C 380 185 375 340 345 480 L 580 480 L 580 44 Z"
          fill="url(#hero-lav-curve)"
          opacity="0.52"
        />

        {/* Subtle lower-left lavender wave silhouette behind dark silk wave */}
        <path
          d="M 0 385 Q 115 335 245 415 Q 370 495 540 435 L 540 576 L 0 576 Z"
          fill="#EBD7F6"
          opacity="0.72"
        />

        {/* Right outer sweeping lavender shape behind store rack */}
        <path
          d="M 964 119 C 925 202 894 278 866 326 C 824 384 720 420 620 440 L 1024 440 L 1024 119 Z"
          fill="url(#hero-right-arc)"
          className="hidden lg:block"
        />

        {/* Oversized Deep-Plum FITLOOM F Monogram */}
        <path
          d="M 702 63
             H 989
             A 5 5 0 0 1 993.5 70
             L 968 119
             A 8 8 0 0 1 960.5 124
             H 788
             C 766 124 748 138 740 158
             L 727 190
             H 883
             A 9 9 0 0 1 891 203
             L 864 242
             A 12 12 0 0 1 853 248
             H 716
             C 694 248 676 265 668 290
             L 648 348
             H 556
             L 585 162
             C 596 105 636 63 702 63 Z"
          fill="url(#hero-f-plum)"
          className="hidden lg:block"
        />

        {/* Crisp soft white inner contour along the F cutout notch */}
        <path
          d="M 964 124 H 788 C 766 124 748 138 740 158 L 727 190 H 883 A 9 9 0 0 1 891 203 L 864 242 A 12 12 0 0 1 853 248 H 716 C 694 248 676 265 668 290"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="hidden lg:block"
        />

        {/* Lower subtle diagonal satin highlight band behind center/bottom-left */}
        <path
          d="M 0 532 Q 280 502 580 518 Q 820 532 1024 468 L 1024 576 L 0 576 Z"
          fill="#E5C8F0"
          opacity="0.62"
        />
      </svg>

      {/* Clothing Rack & Garments (1536x1024 transparent WebP, unclipped above F & right-arc, behind models & selector) */}
      <img
        src="/assets/hero/store-rack.webp"
        alt=""
        width={1536}
        height={1024}
        loading="eager"
        decoding="async"
        className="pointer-events-none hidden lg:block absolute left-[66.2%] top-[12.2%] z-[4] aspect-[1536/1024] w-[35.6%] object-contain object-center"
      />

      {/* Authentic Extracted Lower Flowing Plum Satin Ribbons (Native aspect ratios, shared 0.254x stage scale) */}
      <img
        src="/assets/hero/hero-fabric-left.webp"
        alt=""
        width={2172}
        height={724}
        loading="eager"
        decoding="async"
        className="pointer-events-none hidden lg:block absolute left-0 top-[63.41%] z-[2] aspect-[2172/724] w-[53.92%] object-contain object-left-top"
      />
      <img
        src="/assets/hero/hero-fabric-right.webp"
        alt=""
        width={1562}
        height={1007}
        loading="eager"
        decoding="async"
        className="pointer-events-none hidden lg:block absolute left-[61.04%] top-[51.88%] z-[2] aspect-[1562/1007] w-[38.96%] object-contain object-left-top"
      />

      {/* Mobile & Tablet Bottom Plum Silk Wave Fallback */}
      <svg
        viewBox="0 0 768 140"
        preserveAspectRatio="none"
        className="lg:hidden absolute bottom-0 left-0 h-28 w-full sm:h-36"
      >
        <defs>
          <linearGradient id="mob-wave-plum" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9E4898" />
            <stop offset="50%" stopColor="#5D2258" />
            <stop offset="100%" stopColor="#8A3B86" />
          </linearGradient>
        </defs>
        <path
          d="M0,45 C180,5 320,95 520,55 C640,30 720,15 768,5 L768,140 L0,140 Z"
          fill="url(#mob-wave-plum)"
          opacity="0.92"
        />
      </svg>
    </div>
  );
}
