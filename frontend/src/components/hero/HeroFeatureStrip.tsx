import React from "react";

interface FeatureItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const HERO_FEATURES: FeatureItem[] = [
  {
    title: "Virtual Try-On",
    subtitle: "See how it looks on you.",
    icon: (
      <svg
        viewBox="0 0 44 36"
        className="h-9 w-11 shrink-0 text-[#4E2858] lg:h-[2.4cqi] lg:w-[2.9cqi]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 10.5 C22 7.5 19.8 6 19.8 4.2 C19.8 2.4 21.3 1.5 22.8 1.5 C24.6 1.5 26 2.8 26 4.5 C26 6.2 22 7.2 22 10.5 Z" />
        <path d="M22 10.5 L4.5 23.2 C3.1 24.2 3.8 26.5 5.6 26.5 H38.4 C40.2 26.5 40.9 24.2 39.5 23.2 L22 10.5 Z" />
      </svg>
    ),
  },
  {
    title: "Smart Fit",
    subtitle: "Get the right size, always.",
    icon: (
      <svg
        viewBox="0 0 44 36"
        className="h-9 w-11 shrink-0 text-[#4E2858] lg:h-[2.4cqi] lg:w-[2.9cqi]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <ellipse cx="16.5" cy="14" rx="10.5" ry="5.2" />
        <ellipse cx="16.5" cy="14" rx="4.2" ry="1.9" />
        <path d="M6 14 V23 C6 26 10.7 28.2 16.5 28.2 H36.5 V20 H27" />
        <path d="M27 14 V20" />
        <path d="M30.5 28 V24.5 M34 28 V24.5" />
      </svg>
    ),
  },
  {
    title: "Style Discovery",
    subtitle: "Find styles that match you.",
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0 text-[#4E2858] lg:h-[2.4cqi] lg:w-[2.4cqi]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 4 Q21.5 18.5 36 20 Q21.5 21.5 20 36 Q18.5 21.5 4 20 Q18.5 18.5 20 4 Z" />
      </svg>
    ),
  },
  {
    title: "Shop Confidently",
    subtitle: "Choose what fits and feels right.",
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0 text-[#4E2858] lg:h-[2.4cqi] lg:w-[2.4cqi]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.5 13 H29.5 L31.5 32.5 C31.6 33.6 30.7 34.5 29.6 34.5 H10.4 C9.3 34.5 8.4 33.6 8.5 32.5 L10.5 13 Z" />
        <path d="M14.5 13 V10 C14.5 6.8 16.9 4.5 20 4.5 C23.1 4.5 25.5 6.8 25.5 10 V13" />
      </svg>
    ),
  },
];

export function HeroFeatureStrip() {
  return (
    <div
      aria-label="FITLOOM key platform capabilities"
      className="relative z-20 mx-auto w-full rounded-[26px] border border-white/95 bg-gradient-to-b from-[#FCF9FD] via-[#F7EBFC] to-[#F3E1FA] shadow-[0_14px_34px_rgba(78,40,88,0.14)] backdrop-blur-md lg:absolute lg:left-[5.08%] lg:right-[5.08%] lg:top-[82.52%] lg:flex lg:min-h-[5.98cqi] lg:w-auto lg:items-center lg:rounded-full"
    >
      <div className="grid w-full grid-cols-1 divide-y divide-[#4E2858]/15 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-[#4E2858]/18">
        {HERO_FEATURES.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-start gap-3 px-5 py-4 lg:justify-center lg:gap-[0.95cqi] lg:px-[1.5cqi] lg:py-[1.35cqi]"
          >
            {item.icon}
            <div className="min-w-0">
              <p className="text-[14px] font-bold tracking-tight text-[#1E0C25] lg:text-[clamp(0.8125rem,1.08cqi,1.125rem)]">
                {item.title}
              </p>
              <p className="text-[12px] font-medium text-[#4E2858] lg:text-[clamp(0.6875rem,0.87cqi,0.90625rem)]">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
