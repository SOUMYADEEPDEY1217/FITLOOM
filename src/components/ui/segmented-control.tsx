"use client";

import React, { forwardRef, useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
  href?: string;
}

export interface SegmentedControlProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onValueChange"> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onValueChange?: (value: T) => void;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  variant?: "default" | "premium";
  asLinks?: boolean;
}

function SegmentedControlImpl<T extends string = string>(
  {
    options,
    value,
    onValueChange,
    orientation = "horizontal",
    fullWidth = false,
    variant = "default",
    asLinks,
    className,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...props
  }: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const generatedId = useId();
  const groupId = `segmented-control-${generatedId}`;
  const isPremium = variant === "premium";

  // Use native Next.js Link when explicitly requested or when values are URL paths
  const shouldUseLinks =
    asLinks ?? options.every((o) => typeof o.value === "string" && o.value.startsWith("/"));

  const containerClasses = cn(
    "relative inline-flex items-center rounded-full p-1 transition-colors backdrop-blur-sm",
    isPremium &&
      "border border-[#E9DDF5]/80 bg-gradient-to-b from-[#FCF9FD]/95 to-[#F7EBFC]/95 shadow-[0_2px_8px_rgba(78,40,88,0.06)]",
    !isPremium && "border border-slate-200 bg-slate-100/70",
    orientation === "vertical" && "flex-col rounded-2xl",
    fullWidth && "w-full",
    className
  );

  const buttonBase =
    "relative z-10 flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-[0.01em] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#873CC1]/60 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 xl:px-3.5 xl:text-[13px]";

  const activeClasses = isPremium
    ? "bg-white font-bold text-[#1D0B24] shadow-[0_2px_6px_rgba(78,40,88,0.12)] border border-[#E9DDF5]/80"
    : "bg-white font-bold text-[#6633EE] shadow-xs border border-slate-200/80";

  const inactiveClasses = isPremium
    ? "border border-transparent text-[#3B1E48]/85 hover:text-[#873CC1] hover:bg-white/50"
    : "border border-transparent text-slate-700 hover:text-[#6633EE] hover:bg-white/50";

  return (
    <div
      ref={ref}
      id={groupId}
      role={shouldUseLinks ? "navigation" : "radiogroup"}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={containerClasses}
      {...props}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const itemClass = cn(
          buttonBase,
          isActive ? activeClasses : inactiveClasses,
          option.disabled && "cursor-not-allowed pointer-events-none opacity-40",
          orientation === "vertical" && "w-full justify-start rounded-xl",
          fullWidth && orientation === "horizontal" && "flex-1"
        );

        if (shouldUseLinks) {
          const href = option.href || option.value;
          return (
            <Link
              key={option.value}
              href={href}
              prefetch={true}
              aria-current={isActive ? "page" : undefined}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => onValueChange?.(option.value)}
              className={itemClass}
            >
              {option.label}
            </Link>
          );
        }

        return (
          <button
            key={option.value}
            data-value={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={option.disabled}
            disabled={option.disabled}
            tabIndex={isActive ? 0 : -1}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => !option.disabled && onValueChange?.(option.value)}
            className={itemClass}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlImpl) as <
  T extends string = string
>(
  props: SegmentedControlProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;
