"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { getRouteCategory, isRouteAuthorized } from "@/lib/auth-routes";

export function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user } = useFitloom();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const category = getRouteCategory(pathname);
  const isPublic = category === "public";
  const authorized = isRouteAuthorized(pathname, user.role);

  useEffect(() => {
    if (!mounted) return;

    if (!authorized) {
      if (user.role === "guest") {
        const nextParam =
          pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${nextParam}`);
      } else {
        // Authenticated user attempting an unauthorized workspace (e.g. customer -> /admin)
        router.replace("/dashboard");
      }
    }
  }, [mounted, authorized, pathname, user.role, router]);

  // Public routes render unconditionally for immediate SSR & paint
  if (isPublic) {
    return <>{children}</>;
  }

  // Protected routes: if not authorized or before client mount, withhold private children
  if (!authorized || !mounted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center p-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#6633EE]">
          <Lock className="h-6 w-6 animate-pulse" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-950">
          Authentication Required
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Redirecting to FITLOOM member sign-in...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
