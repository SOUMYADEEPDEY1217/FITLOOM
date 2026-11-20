import React from "react";
import {
  CLIENT_ROUTE_METADATA_MAP,
  createRouteMetadata,
} from "@/lib/route-metadata";

const meta = CLIENT_ROUTE_METADATA_MAP["cart"];
export const metadata = createRouteMetadata(meta.title, meta.description);

export default function RouteMetadataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
