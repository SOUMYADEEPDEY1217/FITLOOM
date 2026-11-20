import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, HelpCircle, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <div
        role="region"
        aria-labelledby="fitloom-404-heading"
        className="space-y-6 rounded-3xl border border-violet-200/80 bg-white/95 p-6 text-center shadow-xs sm:p-10"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-[#6633EE]">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <Badge variant="default" size="sm">
            404 · Route Not Found
          </Badge>
          <h1
            id="fitloom-404-heading"
            className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            This FITLOOM Page Could Not Be Found
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            The route you requested does not exist or may have moved. Choose a
            verified FITLOOM destination below to continue exploring.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 pt-1">
          <Link href="/">
            <Button size="sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Return Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="sm" variant="outline">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Browse Shop
            </Button>
          </Link>
          <Link href="/faq">
            <Button size="sm" variant="ghost">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help &amp; FAQ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
