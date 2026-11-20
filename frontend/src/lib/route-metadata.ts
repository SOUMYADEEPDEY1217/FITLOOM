import type { Metadata } from "next";

export function createRouteMetadata(
  title: string,
  description: string
): Metadata {
  const brandedTitle = title.endsWith("| FITLOOM") ? title : `${title} | FITLOOM`;
  return {
    title: {
      absolute: brandedTitle,
    },
    description,
  };
}

export const CLIENT_ROUTE_METADATA_MAP: Record<
  string,
  { title: string; description: string }
> = {
  shop: {
    title: "Shop Catalogue",
    description:
      "Browse FITLOOM ready-to-wear garments with transparent chest and waist measurements, fit cuts, and optional CUSTOMFIT availability.",
  },
  "shop/[id]": {
    title: "Product Details",
    description:
      "Inspect detailed garment dimensions, fabric specifications, fit architecture, explicit size selection, and CUSTOMFIT options.",
  },
  studio: {
    title: "Style Studio",
    description:
      "Compose multi-garment outfits interactively, save curated Saved Looks, and select explicit sizes before adding to bag.",
  },
  "fit-check": {
    title: "Fit Intelligence Check",
    description:
      "Compare your Body Profile measurements against garment size charts with transparent zone-by-zone ease analysis.",
  },
  "try-on": {
    title: "Virtual Try-On Demo",
    description:
      "Explore visual garment pairing and local photo preview in FITLOOM's simulated Fitting Room.",
  },
  customfit: {
    title: "CUSTOMFIT Tailoring",
    description:
      "Request optional made-to-measure tailoring on eligible garments with workshop quote review and explicit customer approval.",
  },
  "body-profile": {
    title: "Body Profile & Measurements",
    description:
      "Create or calibrate your optional 7-point anthropometric Body Profile in centimetres or inches with visual avatar guidance.",
  },
  cart: {
    title: "Shopping Bag",
    description:
      "Review selected garments, explicit sizes, quantities, and CUSTOMFIT details prior to demo checkout.",
  },
  checkout: {
    title: "Demo Checkout",
    description:
      "Complete validated customer delivery details and demo payment selection to record a session order.",
  },
  orders: {
    title: "Order History",
    description:
      "Inspect customer standard retail and CUSTOMFIT demo orders recorded in your active FITLOOM session.",
  },
  "orders/[id]": {
    title: "Order Tracking",
    description:
      "Follow standard fulfillment or CUSTOMFIT workshop stages, measurement snapshots, and cancellation/return controls.",
  },
  wishlist: {
    title: "Wishlist",
    description:
      "Review saved FITLOOM garments, choose explicit sizes to add to bag, or jump into garment comparison.",
  },
  compare: {
    title: "Compare Garments",
    description:
      "Compare up to three garments side-by-side across price, fabric, chest/waist measurements, and CUSTOMFIT eligibility.",
  },
  "saved-looks": {
    title: "Saved Looks Wardrobe",
    description:
      "Manage outfit combinations saved from Style Studio or Virtual Try-On and reopen them directly in Studio.",
  },
  dashboard: {
    title: "Customer Dashboard",
    description:
      "Access your personalized FITLOOM overview across Body Profile status, Saved Looks, Wishlist, and recent orders.",
  },
  account: {
    title: "Account & Role Switcher",
    description:
      "Update session profile details, adjust fit preference, clear Body Profile, or switch between demo platform roles.",
  },
  login: {
    title: "Member Sign In",
    description:
      "Sign in to your FITLOOM account to access AI Fashion Intelligence, Fit Calibration, and customized tailoring.",
  },
  signup: {
    title: "Member Registration",
    description:
      "Create your FITLOOM account to calibrate your Body Profile and explore AI Fashion Intelligence.",
  },
  "auth/login": {
    title: "Sign In",
    description:
      "Sign in to a FITLOOM frontend demo session across Customer, Seller, Partner Tailor, or Admin roles.",
  },
  "auth/register": {
    title: "Create Account",
    description:
      "Create a local FITLOOM demo account to calibrate your Body Profile or test Seller and Tailor onboarding.",
  },
  "auth/forgot-password": {
    title: "Password Recovery (Demo)",
    description:
      "Frontend demo password recovery workflow for FITLOOM session accounts.",
  },
  contact: {
    title: "Contact FITLOOM",
    description:
      "Prepare an enquiry across customer support, order assistance, seller partnerships, or tailor onboarding.",
  },
  faq: {
    title: "Help & FAQ",
    description:
      "Search frequently asked questions across Body Profiles, Fit Intelligence, Virtual Try-On, CUSTOMFIT, Orders, and Privacy.",
  },
  seller: {
    title: "Seller Overview",
    description:
      "Dedicated demo Seller Workspace dashboard summarizing merchant catalogue counts and standard retail orders.",
  },
  "seller/products": {
    title: "Seller Products",
    description:
      "Create, edit, filter, and manage availability and garment dimension charts for your Seller catalogue listings.",
  },
  "seller/orders": {
    title: "Seller Standard Orders",
    description:
      "Inspect and advance standard retail ready-to-wear fulfillment orders strictly separated from CUSTOMFIT tailoring.",
  },
  tailor: {
    title: "Tailor Dashboard",
    description:
      "Dedicated Partner Tailor Workspace showing assigned CUSTOMFIT orders and weekly stitching capacity.",
  },
  "tailor/orders": {
    title: "Tailor CUSTOMFIT Queue",
    description:
      "Filter and manage CUSTOMFIT made-to-measure orders routed to your active workshop.",
  },
  "tailor/orders/[id]": {
    title: "Tailor Order Detail",
    description:
      "Inspect submitted customer measurement snapshots, accept or reject CUSTOMFIT requests, and progress sequential stitching stages.",
  },
  "tailor/profile": {
    title: "Workshop Profile",
    description:
      "Configure workshop specialty, turnaround days, and validated numeric weekly stitching capacity.",
  },
  "tailor/register": {
    title: "Partner Tailor Application",
    description:
      "Preview Partner Tailor workshop onboarding for FITLOOM's CUSTOMFIT network without silent role switching.",
  },
  admin: {
    title: "Admin Platform Oversight",
    description:
      "Dedicated Admin Workspace overview summarizing session customers, partner verification queue, catalogue status, and orders.",
  },
  "admin/partners": {
    title: "Admin Partner Management",
    description:
      "Review demo Seller and Tailor partner records, verify or reject applications, and manage suspension/reactivation.",
  },
  "admin/catalogue": {
    title: "Admin Catalogue Moderation",
    description:
      "Audit and moderate Seller product listings while preserving seller ownership, pricing, and garment measurements.",
  },
  "admin/orders": {
    title: "Admin Order Oversight",
    description:
      "Inspect both standard retail and CUSTOMFIT orders with non-intrusive session governance audit logging.",
  },
};
