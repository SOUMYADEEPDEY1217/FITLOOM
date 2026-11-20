import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS class names cleanly following shadcn/ui conventions. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

