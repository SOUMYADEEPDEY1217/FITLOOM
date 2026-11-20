"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { isCustomerAppRoute } from "@/lib/auth-routes";
import { CustomerAppShell } from "@/components/layout/customer-app-shell";

const AUTH_FULLSCREEN_ROUTES = new Set(["/login", "/signup"]);

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { user } = useFitloom();

  if (user.role === "customer" && isCustomerAppRoute(pathname)) {
    return <CustomerAppShell>{children}</CustomerAppShell>;
  }

  const isFullBleed =
    pathname === "/" ||
    pathname === "/shop" ||
    AUTH_FULLSCREEN_ROUTES.has(pathname);

  if (isFullBleed) {
    return <main className="w-full min-w-0 flex-1">{children}</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      {children}
    </main>
  );
}

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (AUTH_FULLSCREEN_ROUTES.has(pathname)) {
    return null;
  }
  return <>{children}</>;
}
