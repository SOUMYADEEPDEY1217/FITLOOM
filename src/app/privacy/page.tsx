import type { Metadata } from "next";
import React from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FITLOOM handles Body Profile measurements, shopping activity, local try-on preview images, order snapshots, and Cookie Consent preferences.",
};
import { OpenCookieSettingsButton } from "@/components/public/OpenCookieSettingsButton";
import {
  PolicyPageLayout,
  PolicySection,
  type PolicyTocItem,
} from "@/components/public/PolicyPageLayout";

const PRIVACY_TOC: readonly PolicyTocItem[] = [
  { id: "introduction", title: "Introduction" },
  { id: "info-collected", title: "Information We May Collect" },
  { id: "account-info", title: "Account Information" },
  { id: "body-profile", title: "Body Profile and Measurement Information" },
  { id: "shopping-activity", title: "Product and Shopping Activity" },
  { id: "uploaded-images", title: "Uploaded Images" },
  { id: "virtual-try-on-info", title: "Virtual Try-On Information" },
  { id: "order-info", title: "Order Information" },
  { id: "how-used", title: "How Information May Be Used" },
  { id: "storage-security", title: "Data Storage and Security" },
  { id: "third-party", title: "Third-Party Services" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "data-retention", title: "Data Retention" },
  { id: "user-choices", title: "User Choices, Cookies & Rights" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "policy-updates", title: "Policy Updates" },
  { id: "privacy-contact", title: "Contact Information" },
] as const;

export default function PrivacyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Privacy & Data Transparency · Frontend Demo"
      title="Privacy Policy"
      description="How FITLOOM handles Body Profile measurements, styling activity, uploaded try-on photos, orders, and cookie consent choices in the current frontend demo versus planned production architecture."
      scopeNotice="Current Frontend Build Reality: This prototype does not connect to a production database, cloud object storage, or live AI inference API. Body Profile data, Saved Looks, Cart items, and Orders reside in browser session memory; Cookie Preferences persist locally in your browser's localStorage."
      ownerReviewNotice="Informational Demo Framework: Presented for the FITLOOM hackathon demonstration. Commercial Data Controller entity details, statutory retention schedules, and dedicated compliance contacts apply only upon live commercial release."
      toc={PRIVACY_TOC}
      currentHref="/privacy"
      headerActions={<OpenCookieSettingsButton />}
    >
      <PolicySection id="introduction" number={1} title="Introduction">
        <p>
          FITLOOM is committed to honest transparency around personal style,
          garment fit, and measurement privacy. Because FITLOOM is currently a
          frontend-only hackathon demonstration, this document distinguishes
          current local browser behavior from planned backend and AI
          infrastructure.
        </p>
        <p>
          <strong>Edition Status:</strong> FITLOOM Hackathon Demonstration
          (Team PARADOX, Hack N Pitch &apos;26) ·{" "}
          <strong>Policy Scope:</strong> Informational demo documentation (not a
          finalized commercial privacy notice).
        </p>
      </PolicySection>

      <PolicySection
        id="info-collected"
        number={2}
        title="Information We May Collect"
      >
        <p>
          Depending on which modules you explore, FITLOOM handles user-entered
          account fields, optional anthropometric Body Profile inputs, saved
          outfits, local try-on preview images, order snapshots, and cookie
          consent settings.
        </p>
      </PolicySection>

      <PolicySection id="account-info" number={3} title="Account Information">
        <p>
          When testing sign-in, registration, or role switching (Customer,
          Seller, Partner Tailor, Admin), fields such as name, email, city, and
          phone are held in local React state for the active demo session.
        </p>
      </PolicySection>

      <PolicySection
        id="body-profile"
        number={4}
        title="Body Profile and Measurement Information"
      >
        <p>
          Providing a Body Profile (height, weight, chest, waist, hip, shoulder,
          sleeve, inseam, and fit preference) is strictly optional. Clearing your
          Body Profile immediately marks it inactive so stale measurements are
          not presented as an active calibration or attached to future CUSTOMFIT
          requests.
        </p>
      </PolicySection>

      <PolicySection
        id="shopping-activity"
        number={5}
        title="Product and Shopping Activity"
      >
        <p>
          Saved Looks created in Style Studio, Wishlist items, Compare selections
          (up to 3 items), and Shopping Bag contents remain local to your active
          browser session in this demo.
        </p>
      </PolicySection>

      <PolicySection id="uploaded-images" number={6} title="Uploaded Images">
        <p>
          When you preview a photo inside Virtual Try-On in this frontend build,
          your browser creates a temporary local preview object URL (`URL.createObjectURL`)
          that is never uploaded to a remote server or stored permanently in any
          database or bucket.
        </p>
      </PolicySection>

      <PolicySection
        id="virtual-try-on-info"
        number={7}
        title="Virtual Try-On Information"
      >
        <p>
          The current Virtual Try-On interface is a frontend simulation. In
          planned future AI phases, any remote inference pipeline is intended to
          enforce explicit user consent, file validation, metadata stripping, and
          automatic temporary cleanup—not silent permanent archival.
        </p>
      </PolicySection>

      <PolicySection id="order-info" number={8} title="Order Information">
        <p>
          Demo orders store line items, delivery city/address inputs, selected
          payment method labels, and—for CUSTOMFIT orders—a snapshot of the
          validated body measurements used for tailoring. If no snapshot was
          provided, orders explicitly reflect that measurements are unavailable.
        </p>
      </PolicySection>

      <PolicySection
        id="how-used"
        number={9}
        title="How Information May Be Used"
      >
        <p>
          Session inputs are used solely to render interactive fit calculations,
          Style Studio previews, order tracking timelines, and role-isolated
          Seller, Tailor, and Admin workspace workflows during the demo.
        </p>
      </PolicySection>

      <PolicySection
        id="storage-security"
        number={10}
        title="Data Storage and Security"
      >
        <p>
          FITLOOM does not claim production encryption at rest, server-side
          database isolation, or enterprise authentication in this frontend-only
          build. Live database storage, encryption controls, and access logging
          belong to future backend implementation phases.
        </p>
      </PolicySection>

      <PolicySection
        id="third-party"
        number={11}
        title="Third-Party Services"
      >
        <p>
          No live third-party payment processors, shipping APIs, or external
          Virtual Try-On AI providers receive your data in the current frontend
          demo. Any future production integrations will be accompanied by
          finalized third-party sub-processor disclosures prior to live release.
        </p>
      </PolicySection>

      <PolicySection id="data-sharing" number={12} title="Data Sharing">
        <p>
          In the platform workflow model, Sellers only view standard retail
          order fulfillment details, while Partner Tailors receive CUSTOMFIT
          measurements strictly for orders routed to their workshop. Commercial
          data-sharing agreements apply prior to any live customer or partner
          onboarding.
        </p>
      </PolicySection>

      <PolicySection id="data-retention" number={13} title="Data Retention">
        <p>
          Session state clears automatically when the browser tab refreshes or
          closes, except for Cookie Consent preferences saved in{" "}
          <code>localStorage</code>. No long-term server-side storage is active
          in this demonstration build; formalized retention and deletion
          schedules belong to downstream production phases.
        </p>
      </PolicySection>

      <PolicySection
        id="user-choices"
        number={14}
        title="User Choices, Cookies & Rights"
      >
        <p>
          FITLOOM provides a Cookie Consent Banner and preference dialog stored
          under <code>fitloom_cookie_consent_v1</code> with three transparent
          categories:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Essential Session Storage (Required):</strong> Preserves
            consent choice and core interface navigation.
          </li>
          <li>
            <strong>Fit &amp; Unit Preferences (Optional):</strong> Remembers
            cm/in measurement display and fit preferences.
          </li>
          <li>
            <strong>Analytics &amp; Telemetry (Optional / Planned):</strong>{" "}
            Reserved consent toggle for future production analytics (inactive in
            this frontend build).
          </li>
        </ul>
        <div className="pt-2">
          <OpenCookieSettingsButton />
        </div>
        <p className="pt-1">
          Account-level export, deletion, and formal data-rights workflows apply
          to server-backed accounts in future backend phases rather than local
          demo session state.
        </p>
      </PolicySection>

      <PolicySection
        id="childrens-privacy"
        number={15}
        title="Children's Privacy"
      >
        <p>
          FITLOOM is not directed toward children under the applicable age of
          digital consent. Jurisdictional age thresholds and parental consent
          requirements apply prior to public commercial launch.
        </p>
      </PolicySection>

      <PolicySection id="policy-updates" number={16} title="Policy Updates">
        <p>
          This policy will be updated alongside backend, authentication, payment,
          and AI provider integrations prior to any public commercial release.
        </p>
      </PolicySection>

      <PolicySection
        id="privacy-contact"
        number={17}
        title="Contact Information"
      >
        <p>
          No dedicated privacy officer inbox is active for this hackathon
          demonstration build. You may preview general feedback via the{" "}
          <Link href="/contact" className="font-semibold text-[#6633EE] underline">
            Contact page
          </Link>
          ; official data-protection contact details apply only upon commercial
          launch.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
