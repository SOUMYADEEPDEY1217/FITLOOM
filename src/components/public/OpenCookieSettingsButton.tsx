"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerCookieSettingsModal } from "@/lib/public-pages-utils";

export function OpenCookieSettingsButton({
  size = "sm",
  variant = "outline",
}: {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => triggerCookieSettingsModal()}
    >
      <Settings2 className="h-4 w-4" aria-hidden="true" />
      Manage Cookie Preferences
    </Button>
  );
}
