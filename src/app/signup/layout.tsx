import React, { Suspense } from "react";
import {
  CLIENT_ROUTE_METADATA_MAP,
  createRouteMetadata,
} from "@/lib/route-metadata";

const meta = CLIENT_ROUTE_METADATA_MAP["signup"];
export const metadata = createRouteMetadata(meta.title, meta.description);

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="min-h-screen" />}>{children}</Suspense>;
}
