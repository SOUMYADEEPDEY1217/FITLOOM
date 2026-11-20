import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline"
  | "info"
  | "neutral"
  | "amber";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-violet-200 bg-[#EDE9FE] text-[#4C1D95]",
  secondary: "border-slate-200 bg-slate-100 text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  destructive: "border-red-200 bg-red-50 text-red-800",
  outline: "border-slate-300 bg-white/90 text-slate-800",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  neutral: "border-slate-200 bg-slate-100 text-slate-800",
  amber: "border-amber-300 bg-amber-50 text-amber-900",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  const resolvedVariant = variantStyles[variant] ?? variantStyles.default;
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center justify-center gap-1.5 rounded-full border font-semibold leading-tight whitespace-normal break-words transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0",
        resolvedVariant,
        resolvedSize,
        className
      )}
      {...props}
    />
  );
}
