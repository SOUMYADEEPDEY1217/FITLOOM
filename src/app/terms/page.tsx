import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Draft Terms & Conditions governing FITLOOM's frontend demonstration platform, Fit Intelligence disclaimers, Virtual Try-On simulation notice, and CUSTOMFIT workflow.",
};
import {
  PolicyPageLayout,
  PolicySection,
  type PolicyTocItem,
} from "@/components/public/PolicyPageLayout";

const TERMS_TOC: readonly PolicyTocItem[] = [
  { id: "introduction", title: "Introduction" },
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "platform-description", title: "Platform Description" },
  { id: "user-accounts", title: "User Accounts" },
  { id: "account-responsibilities", title: "Account Responsibilities" },
  { id: "customer-responsibilities", title: "Customer Responsibilities" },
  { id: "seller-responsibilities", title: "Seller Responsibilities" },
  { id: "tailor-responsibilities", title: "Tailor Responsibilities" },
  { id: "product-listings", title: "Product Listings and Garment Information" },
  { id: "fit-intelligence", title: "Fit Intelligence Disclaimer" },
  { id: "virtual-try-on", title: "Virtual Try-On Disclaimer" },
  { id: "customfit-workflow", title: "CUSTOMFIT Workflow" },
  { id: "pricing-payment", title: "Pricing and Payment" },
  { id: "orders-fulfilment", title: "Orders and Fulfilment" },
  { id: "cancellations", title: "Cancellations" },
  { id: "returns-refunds", title: "Returns and Refunds" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "platform-availability", title: "Platform Availability" },
  { id: "limitation-liability", title: "Limitation of Liability" },
  { id: "changes-to-terms", title: "Changes to Terms" },
  { id: "contact-information", title: "Contact Information" },
] as const;

export default function TermsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Legal & Platform Governance · Demo Scope"
      title="Terms & Conditions"
      description="Terms governing access to FITLOOM's frontend demonstration platform, including explicit simulation disclosures for Fit Intelligence, Virtual Try-On, and CUSTOMFIT."
      scopeNotice="Current Frontend Build Scope: FITLOOM is presently a frontend demonstration application running in browser session state. No live payments, shipping dispatches, or binding commercial contracts occur on this demo build. Not legal advice or finalized commercial legal text."
      ownerReviewNotice="Informational Demo Framework: These terms explain the intended platform rules and simulation boundaries for the FITLOOM hackathon demonstration. Commercial entity details, governing law, and binding purchase terms apply only upon live commercial release."
      toc={TERMS_TOC}
      currentHref="/terms"
    >
      <PolicySection id="introduction" number={1} title="Introduction">
        <p>
          Welcome to FITLOOM (&ldquo;Your Body. Your Fit. Your Style.&rdquo;).
          These Terms &amp; Conditions describe the informational platform rules
          and simulation boundaries governing the FITLOOM hackathon demonstration
          built by Team PARADOX (Hack N Pitch, E-Summit &apos;26).
        </p>
        <p>
          <strong>Edition Scope:</strong> Hackathon Demonstration Build
          (Informational preview; does not create live commercial obligations).
        </p>
      </PolicySection>

      <PolicySection id="acceptance" number={2} title="Acceptance of Terms">
        <p>
          By browsing or interacting with FITLOOM in its demonstration
          environment, you acknowledge the frontend-only demo limitations stated
          across the platform. Formal contractual acceptance applies only once
          live user accounts and commercial terms are published in production.
        </p>
      </PolicySection>

      <PolicySection
        id="platform-description"
        number={3}
        title="Platform Description"
      >
        <p>
          FITLOOM is a personalized fashion discovery and fit-exploration
          platform providing Body Profile management, measurement-based Fit
          Intelligence guidance, simulated Virtual Try-On previews, Style Studio
          outfit composition, and optional CUSTOMFIT partner tailoring
          workflows.
        </p>
      </PolicySection>

      <PolicySection id="user-accounts" number={4} title="User Accounts">
        <p>
          Role views (Customer, Seller, Partner Tailor, and Admin) operate on
          local session state in the current demo without persistent server
          authentication. Production account verification and security rules
          will govern live accounts once backend authentication is active.
        </p>
      </PolicySection>

      <PolicySection
        id="account-responsibilities"
        number={5}
        title="Account Responsibilities"
      >
        <p>
          Users must provide accurate information when configuring profiles or
          testing onboarding workflows and must not misuse role tools or attempt
          unauthorized access to another participant&apos;s workspace data.
        </p>
      </PolicySection>

      <PolicySection
        id="customer-responsibilities"
        number={6}
        title="Customer Responsibilities"
      >
        <p>
          Customers are responsible for entering accurate Body Profile
          measurements when using Fit Check or CUSTOMFIT, reviewing selected
          garment sizes explicitly before adding items to the shopping bag, and
          checking order details prior to submission.
        </p>
      </PolicySection>

      <PolicySection
        id="seller-responsibilities"
        number={7}
        title="Seller Responsibilities"
      >
        <p>
          Sellers are responsible for the accuracy of garment descriptions,
          pricing, available sizes, garment measurement charts (chest and waist
          dimensions), fabric notes, and stock status declared in their
          listings.
        </p>
      </PolicySection>

      <PolicySection
        id="tailor-responsibilities"
        number={8}
        title="Tailor Responsibilities"
      >
        <p>
          Partner Tailors are responsible for reviewing incoming CUSTOMFIT
          order measurements truthfully, accepting only orders within workshop
          capacity, and updating production milestones accurately. Workshop
          onboarding drafts and demo verification badges do not constitute
          real-world legal certification.
        </p>
      </PolicySection>

      <PolicySection
        id="product-listings"
        number={9}
        title="Product Listings and Garment Information"
      >
        <p>
          Catalogue prices, stock counts, and size availability reflect current
          merchant or seeded session records. Where inventory quantities are
          not specified on base demo listings, FITLOOM displays that status
          explicitly rather than inventing unit counts.
        </p>
      </PolicySection>

      <PolicySection
        id="fit-intelligence"
        number={10}
        title="Fit Intelligence Disclaimer"
      >
        <p>
          Fit Intelligence recommendations are strictly advisory informational
          guidance calculated from user-supplied measurements, selected fit
          ease preferences, and declared garment dimensions. Fit Intelligence
          does not guarantee a physical fit or replace personal judgment.
        </p>
      </PolicySection>

      <PolicySection
        id="virtual-try-on"
        number={11}
        title="Virtual Try-On Disclaimer"
      >
        <p>
          Virtual Try-On is a visual simulation intended solely for visual
          exploration of garments and styling combinations. Digital previews do
          not represent exact textile stretch, drape, seam behavior, or physical
          garment fit.
        </p>
      </PolicySection>

      <PolicySection id="customfit-workflow" number={12} title="CUSTOMFIT Workflow">
        <p>
          CUSTOMFIT is optional and applies only to eligible garments where
          workshop parameters are supported. A CUSTOMFIT request requires
          validated customer measurements, a quotation review, tailor workshop
          acceptance, and explicit customer approval before order confirmation.
        </p>
      </PolicySection>

      <PolicySection
        id="pricing-payment"
        number={13}
        title="Pricing and Payment"
      >
        <p>
          Displayed prices are shown in INR for demonstration purposes.{" "}
          <strong>
            No live payment gateway is active in this frontend build
          </strong>{" "}
          — demo checkout simulates order recording locally without charging
          any payment instrument. Final billing, tax, and settlement terms
          apply only to commercial releases.
        </p>
      </PolicySection>

      <PolicySection
        id="orders-fulfilment"
        number={14}
        title="Orders and Fulfilment"
      >
        <p>
          Orders created in the demo are recorded in browser session state for
          demonstration of Customer, Seller, Tailor, and Admin timelines.
          Standard retail fulfillment and CUSTOMFIT tailoring paths shown are
          illustrative prototype workflows, as explained in the informational{" "}
          <Link href="/shipping" className="font-semibold text-[#6633EE] underline">
            Shipping &amp; Delivery Policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection id="cancellations" number={15} title="Cancellations">
        <p>
          In the current demo workflow, customers and sellers may cancel eligible
          newly placed orders with a documented reason prior to production
          progression. Binding commercial cancellation windows and cutoff rules
          apply only to future live orders.
        </p>
      </PolicySection>

      <PolicySection
        id="returns-refunds"
        number={16}
        title="Returns and Refunds"
      >
        <p>
          Conceptual return requests, eligibility paths, and CUSTOMFIT workflows
          are outlined on the informational{" "}
          <Link href="/returns" className="font-semibold text-[#6633EE] underline">
            Return &amp; Refund Policy
          </Link>{" "}
          page, distinguishing session demo behavior from unfinalized commercial
          terms.
        </p>
      </PolicySection>

      <PolicySection
        id="intellectual-property"
        number={17}
        title="Intellectual Property"
      >
        <p>
          FITLOOM brand marks, interface layouts, design assets, and prototype
          software are presented solely for project demonstration and evaluation
          purposes without granting commercial licensing rights.
        </p>
      </PolicySection>

      <PolicySection
        id="platform-availability"
        number={18}
        title="Platform Availability"
      >
        <p>
          Because the current build runs client-side in browser memory without
          production servers, session state resets on page reload or browser
          closure. Uptime guarantees do not apply to demonstration builds.
        </p>
      </PolicySection>

      <PolicySection
        id="limitation-liability"
        number={19}
        title="Limitation of Liability"
      >
        <p>
          During frontend demonstration, the platform is provided on an
          informational &ldquo;as-is&rdquo; basis with no warranties of
          merchantability, uptime, or physical fit guarantee. Applicable
          governing law and commercial liability provisions apply only upon
          live commercial launch.
        </p>
      </PolicySection>

      <PolicySection id="changes-to-terms" number={20} title="Changes to Terms">
        <p>
          FITLOOM may update this informational framework ahead of downstream
          backend, AI, and commercial phases.
        </p>
      </PolicySection>

      <PolicySection
        id="contact-information"
        number={21}
        title="Contact Information"
      >
        <p>
          No dedicated legal desk or registered office address is active during
          this hackathon demonstration. For prototype enquiries or feedback, use
          the interactive preview form on the{" "}
          <Link href="/contact" className="font-semibold text-[#6633EE] underline">
            Contact page
          </Link>
          .
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
