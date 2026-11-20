import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description:
    "Informational Shipping & Delivery overview covering ready-to-wear fulfillment and CUSTOMFIT tailoring paths in the FITLOOM hackathon demonstration.",
};
import {
  PolicyPageLayout,
  PolicySection,
  type PolicyTocItem,
} from "@/components/public/PolicyPageLayout";

const SHIPPING_TOC: readonly PolicyTocItem[] = [
  { id: "shipping-overview", title: "Shipping Overview" },
  { id: "delivery-coverage", title: "Delivery Coverage" },
  { id: "order-processing", title: "Order Processing" },
  { id: "dispatch", title: "Dispatch" },
  { id: "estimated-delivery", title: "Estimated Delivery" },
  { id: "delivery-charges", title: "Delivery Charges" },
  { id: "tracking", title: "Tracking" },
  { id: "failed-delivery", title: "Failed Delivery" },
  { id: "delays-exceptions", title: "Delays and Exceptions" },
  { id: "customfit-delivery", title: "CUSTOMFIT Delivery" },
  { id: "shipping-contact", title: "Contact and Support" },
] as const;

export default function ShippingPolicyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Logistics Overview · Hackathon Demo Scope"
      title="Shipping & Delivery Policy"
      description="Informational logistics overview distinguishing ready-to-wear dispatch from made-to-measure CUSTOMFIT workshop production in the FITLOOM demo."
      scopeNotice="Frontend Demo Notice: FITLOOM does not operate live courier integrations, parcel tracking feeds, or physical shipping dispatches in this frontend prototype."
      ownerReviewNotice="Informational Demo Framework: Delivery regions, carrier partners, shipping fees, and binding turnaround SLAs apply only to future production deployments and are intentionally omitted rather than fabricated."
      toc={SHIPPING_TOC}
      currentHref="/shipping"
    >
      <PolicySection
        id="shipping-overview"
        number={1}
        title="Shipping Overview"
      >
        <p>
          FITLOOM coordinates two distinct fulfilment paths: standard
          ready-to-wear orders managed by merchant Sellers, and optional
          made-to-measure CUSTOMFIT orders produced by Partner Tailors. Actual
          carrier agreements and operational dispatch SLAs apply only upon live
          commercial launch.
        </p>
      </PolicySection>

      <PolicySection
        id="delivery-coverage"
        number={2}
        title="Delivery Coverage"
      >
        <p>
          Serviceable regions, postal pin codes, and domestic or international
          shipping availability will be published upon live merchant and courier
          onboarding. No real-world serviceability guarantees are implied by
          demo records.
        </p>
      </PolicySection>

      <PolicySection id="order-processing" number={3} title="Order Processing">
        <p>
          In the prototype workflow, ready-to-wear orders pass through Seller
          preparation while CUSTOMFIT orders progress through Tailor workshop
          stages. Commercial handling times and dispatch cutoffs belong to live
          operations.
        </p>
      </PolicySection>

      <PolicySection id="dispatch" number={4} title="Dispatch">
        <p>
          No external courier providers or carrier dispatch webhooks are
          connected in this frontend demonstration. Approved third-party
          logistics integrations belong to future backend phases.
        </p>
      </PolicySection>

      <PolicySection
        id="estimated-delivery"
        number={5}
        title="Estimated Delivery"
      >
        <p>
          Transit durations naturally depend on origin city, destination, and
          fulfilment mode. FITLOOM intentionally avoids displaying fabricated
          delivery day guarantees or synthetic ETA promises in demo mode.
        </p>
      </PolicySection>

      <PolicySection id="delivery-charges" number={6} title="Delivery Charges">
        <p>
          Shipping fee schedules, distance pricing, and free-shipping
          thresholds apply solely to live commercial checkout and will be shown
          transparently prior to purchase once backend pricing rules are active.
        </p>
      </PolicySection>

      <PolicySection id="tracking" number={7} title="Tracking">
        <p>
          Within the current frontend demo, customers can inspect simulated
          stage milestones (<code>Placed</code> → <code>Cutting</code> →{" "}
          <code>Quality Check</code> → <code>Out for Delivery</code> →{" "}
          <code>Delivered</code>) on the{" "}
          <Link href="/orders" className="font-semibold text-[#6633EE] underline">
            Orders page
          </Link>
          . Live carrier airway-bill tracking is reserved for production
          integration.
        </p>
      </PolicySection>

      <PolicySection id="failed-delivery" number={8} title="Failed Delivery">
        <p>
          Delivery re-attempt counts, address correction workflows, and
          return-to-origin rules follow the operating policies of confirmed
          courier partners in a live commercial launch.
        </p>
      </PolicySection>

      <PolicySection
        id="delays-exceptions"
        number={9}
        title="Delays and Exceptions"
      >
        <p>
          Weather disruptions, regional holidays, or inventory exceptions in
          live orders will be governed by commercial customer-notice standards
          published at launch.
        </p>
      </PolicySection>

      <PolicySection
        id="customfit-delivery"
        number={10}
        title="CUSTOMFIT Delivery"
      >
        <p>
          CUSTOMFIT orders begin in workshop acceptance and progress through
          bespoke cutting, stitching, and quality inspection before dispatch.
          Illustrative turnaround estimates displayed in Tailor demo seeds are
          non-binding demonstration values.
        </p>
      </PolicySection>

      <PolicySection
        id="shipping-contact"
        number={11}
        title="Contact and Support"
      >
        <p>
          Shipping workflow questions about the prototype can be previewed via
          the{" "}
          <Link href="/contact" className="font-semibold text-[#6633EE] underline">
            Contact page
          </Link>{" "}
          or reviewed in{" "}
          <Link href="/faq" className="font-semibold text-[#6633EE] underline">
            Help &amp; FAQ
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
