import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Informational Return & Refund overview for standard retail and CUSTOMFIT demo orders on FITLOOM, distinguishing prototype workflows from future commercial policies.",
};
import {
  PolicyPageLayout,
  PolicySection,
  type PolicyTocItem,
} from "@/components/public/PolicyPageLayout";

const RETURNS_TOC: readonly PolicyTocItem[] = [
  { id: "introduction", title: "Introduction" },
  { id: "return-eligibility", title: "Return Eligibility" },
  { id: "product-condition", title: "Product Condition" },
  { id: "damaged-incorrect", title: "Damaged or Incorrect Products" },
  { id: "customfit-orders", title: "CUSTOMFIT Orders" },
  { id: "cancellation", title: "Cancellation" },
  { id: "return-process", title: "Return Request Process" },
  { id: "refund-processing", title: "Refund Processing" },
  { id: "non-eligible", title: "Non-Eligible Items" },
  { id: "support-contact", title: "Support Contact" },
] as const;

export default function ReturnsPolicyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Returns Overview · Hackathon Demo Scope"
      title="Return & Refund Policy"
      description="Informational return, cancellation, and refund overview for ready-to-wear retail orders and made-to-measure CUSTOMFIT items in the FITLOOM demonstration."
      scopeNotice="Frontend Demo Notice: No real financial charges, live returns logistics, or automated refunds are processed in the current frontend demo."
      ownerReviewNotice="Informational Demo Framework: Specific commercial return windows, refund timelines, restocking terms, and CUSTOMFIT return rules are intentionally left unfinalized in this prototype and do not represent binding commercial guarantees."
      toc={RETURNS_TOC}
      currentHref="/returns"
    >
      <PolicySection id="introduction" number={1} title="Introduction">
        <p>
          This Return &amp; Refund overview outlines the conceptual workflow for
          handling cancellations, returns, exchanges, and refunds on FITLOOM.
          Because this build is a hackathon demonstration without live
          commerce, no active commercial return or refund commitment applies.
        </p>
      </PolicySection>

      <PolicySection
        id="return-eligibility"
        number={2}
        title="Return Eligibility"
      >
        <p>
          In a live marketplace release, standard ready-to-wear purchases are
          designed to be evaluated for return or exchange based on verified
          order records and category eligibility rules. Specific return-window
          day counts are omitted in demo mode rather than fabricated.
        </p>
      </PolicySection>

      <PolicySection
        id="product-condition"
        number={3}
        title="Product Condition"
      >
        <p>
          Inspection criteria for commercial returns (such as unworn, unwashed
          condition with original tags and packaging intact) apply only once
          live merchant operations and fulfillment agreements are active.
        </p>
      </PolicySection>

      <PolicySection
        id="damaged-incorrect"
        number={4}
        title="Damaged or Incorrect Products"
      >
        <p>
          The conceptual platform workflow supports reporting damaged,
          defective, or mismatched orders against confirmed order details.
          Formal replacement SLAs and photo-evidence windows are reserved for
          commercial deployment.
        </p>
      </PolicySection>

      <PolicySection id="customfit-orders" number={5} title="CUSTOMFIT Orders">
        <p>
          Because CUSTOMFIT garments are tailored to customer-submitted body
          measurements and workshop specifications, alteration, remake, or
          discrepancy handling follows dedicated workshop review flows distinct
          from ready-to-wear retail returns. Final commercial CUSTOMFIT policies
          apply only in production.
        </p>
      </PolicySection>

      <PolicySection id="cancellation" number={6} title="Cancellation">
        <p>
          In the current frontend demo, customers may test session cancellation on
          newly placed orders (<code>Placed</code> /{" "}
          <code>Pending Tailor Acceptance</code>) with a documented reason.
          Binding production cancellation windows and tailor cut-stage locks
          apply only to future live orders.
        </p>
      </PolicySection>

      <PolicySection
        id="return-process"
        number={7}
        title="Return Request Process"
      >
        <p>
          In the demo UI, delivered customer orders display a simulated return
          request form capturing a reason in browser session state. Live
          reverse-pickup scheduling and warehouse inspection workflows are
          reserved for downstream backend and logistics phases.
        </p>
      </PolicySection>

      <PolicySection
        id="refund-processing"
        number={8}
        title="Refund Processing"
      >
        <p>
          Because no live payments are collected or settled in this prototype,
          no real refunds are triggered. Actual refund processing timelines and
          payment reversal rules belong to future payment-gateway integration.
        </p>
      </PolicySection>

      <PolicySection
        id="non-eligible"
        number={9}
        title="Non-Eligible Items"
      >
        <p>
          Commercial exclusions—such as final-sale goods, altered garments, or
          hygiene-restricted categories—will be published clearly per catalog
          category prior to live commercial checkout.
        </p>
      </PolicySection>

      <PolicySection id="support-contact" number={10} title="Support Contact">
        <p>
          For questions regarding demo return or cancellation behavior, preview
          the enquiry form on the{" "}
          <Link href="/contact" className="font-semibold text-[#6633EE] underline">
            Contact page
          </Link>{" "}
          or review{" "}
          <Link href="/faq" className="font-semibold text-[#6633EE] underline">
            Help &amp; FAQ
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
