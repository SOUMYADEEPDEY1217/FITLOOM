"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const OUTFIT_ITEMS = [
  {
    id: "purple-jacket",
    label: "Purple Jacket",
    image: "/assets/hero/item-jacket.webp",
    width: 1312,
    height: 1199,
    scaleClass: "scale-100",
  },
  {
    id: "cream-sweater",
    label: "Cream Sweater",
    image: "/assets/hero/item-sweater.webp",
    width: 1199,
    height: 1312,
    scaleClass: "scale-[1.06]",
  },
  {
    id: "black-trousers",
    label: "Black Trousers",
    image: "/assets/hero/item-trousers.webp",
    width: 1024,
    height: 1536,
    scaleClass: "scale-[1.12]",
  },
  {
    id: "white-sneakers",
    label: "White Sneakers",
    image: "/assets/hero/item-sneakers.webp",
    width: 1774,
    height: 887,
    scaleClass: "scale-[1.04]",
  },
];

export function OutfitSelector() {
  const [selectedId, setSelectedId] = useState<string>("purple-jacket");

  return (
    <div
      aria-label="Outfit item selector"
      className="relative z-[15] mx-auto w-[90%] max-w-[335px] sm:max-w-[500px] lg:absolute lg:left-[61.4%] lg:top-[51.7%] lg:mx-0 lg:w-[33.0%] lg:max-w-none"
    >
      <div
        className="rounded-[22px] border border-white/85 bg-gradient-to-br from-white/78 via-[#F4E6FA]/62 to-[#E5CEF3]/55 p-2 shadow-[0_16px_42px_rgba(78,40,88,0.18)] backdrop-blur-md sm:rounded-[24px] sm:p-3 lg:rounded-[1.67cqi] lg:p-[0.84cqi]"
        style={{ transform: "skewX(-11deg)" }}
      >
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5 lg:gap-[0.72cqi]">
          {OUTFIT_ITEMS.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={`Select ${item.label}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "group relative aspect-[60/67] w-full cursor-pointer overflow-visible rounded-[16px] p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1] lg:rounded-[1.08cqi] lg:p-[0.48cqi]",
                  isSelected
                    ? "bg-gradient-to-b from-[#FCF9FD] via-[#F2CEFB] to-[#DD9FEF] ring-2 ring-white shadow-[0_8px_22px_rgba(135,60,193,0.32)]"
                    : "bg-[#FCF9FD]/85 hover:bg-white"
                )}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C2AE8] text-white shadow-sm lg:-right-[0.36cqi] lg:-top-[0.36cqi] lg:h-[1.44cqi] lg:w-[1.44cqi]"
                    style={{ transform: "skewX(11deg)" }}
                  >
                    <Check className="h-3 w-3 lg:h-[0.84cqi] lg:w-[0.84cqi]" strokeWidth={3} />
                  </span>
                )}
                <span className="flex h-full w-full items-center justify-center transition-transform group-hover:scale-105">
                  <img
                    src={item.image}
                    alt={item.label}
                    width={item.width}
                    height={item.height}
                    loading="eager"
                    decoding="async"
                    className={cn(
                      "block h-full w-full object-contain object-center drop-shadow-xs",
                      item.scaleClass
                    )}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
