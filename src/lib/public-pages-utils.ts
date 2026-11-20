import { z } from "zod";

export const ENQUIRY_CATEGORIES = [
  "General Enquiry",
  "Customer Support",
  "Order Assistance",
  "Seller Partnership",
  "Tailor Partnership",
  "Technical Issue",
] as const;

export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];

export const ContactFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(80, "Full name must be 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address."),
  category: z.enum(ENQUIRY_CATEGORIES, {
    errorMap: () => ({ message: "Select a valid enquiry category." }),
  }),
  orderId: z
    .string()
    .trim()
    .max(32, "Order ID must be 32 characters or fewer.")
    .optional(),
  subject: z
    .string()
    .trim()
    .min(4, "Subject must be at least 4 characters.")
    .max(120, "Subject must be 120 characters or fewer."),
  message: z
    .string()
    .trim()
    .min(15, "Message must be at least 15 characters.")
    .max(1500, "Message must be 1,500 characters or fewer."),
});

export type ContactFormInput = z.input<typeof ContactFormSchema>;
export type ContactFormData = z.output<typeof ContactFormSchema>;

export const FAQ_CATEGORIES = [
  "All",
  "Account & Profile",
  "Shopping",
  "Fit Intelligence",
  "Virtual Try-On",
  "CUSTOMFIT",
  "Orders",
  "Sellers & Tailors",
  "Privacy & Policies",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqEntry {
  id: string;
  category: Exclude<FaqCategory, "All">;
  question: string;
  answer: string;
  links?: ReadonlyArray<{ label: string; href: string }>;
}

export const FITLOOM_FAQS: readonly FaqEntry[] = [
  {
    id: "acc-create",
    category: "Account & Profile",
    question: "How do I create an account?",
    answer:
      "Visit the Register page to start a local FITLOOM demo account by entering your name, email, password, and role preference. In this frontend-only build, accounts operate in browser session state without a live authentication server.",
    links: [{ label: "Create Demo Account", href: "/auth/register" }],
  },
  {
    id: "acc-profile-mandatory",
    category: "Account & Profile",
    question: "Is Body Profile mandatory?",
    answer:
      "No. Body Profile remains completely optional during registration and browsing. You can add or update your measurements at any point to unlock personalized sizing insights and CUSTOMFIT pre-fill.",
    links: [{ label: "Open Body Profile", href: "/body-profile" }],
  },
  {
    id: "acc-update-measurements",
    category: "Account & Profile",
    question: "Can I update or clear my measurements?",
    answer:
      "Yes. From Body Profile or Account settings, you can edit dimensions in centimetres or inches, change your fit preference (Slim, Regular, Relaxed, or Oversized), or clear your saved Body Profile at any time.",
  },
  {
    id: "shop-browse",
    category: "Shopping",
    question: "How do I browse products?",
    answer:
      "Open the Shop catalogue to filter garments by category, fit cut, occasion, size availability, or price range, and inspect chest and waist dimension tables on each Product Details page.",
    links: [{ label: "Browse Shop", href: "/shop" }],
  },
  {
    id: "shop-sizes",
    category: "Shopping",
    question: "How do product sizes work?",
    answer:
      "Each standard garment lists available sizes (such as S, M, L, XL) paired with explicit garment measurements in centimetres and inches. You must explicitly select an available size before adding any standard item to your shopping bag.",
  },
  {
    id: "shop-garment-measurement",
    category: "Shopping",
    question: "What does garment measurement mean?",
    answer:
      "Garment measurements represent the physical dimensions of the garment itself (for example, garment chest and waist width), not raw body circumference. Comparing garment dimensions against your Body Profile plus intended ease explains how closely a size will drape.",
  },
  {
    id: "fit-what-is",
    category: "Fit Intelligence",
    question: "What is Fit Intelligence?",
    answer:
      "FITLOOM Fit Intelligence is an explainable, measurement-based sizing engine that compares your saved Body Profile against garment size charts and fabric stretch notes to guide ready-to-wear size selection.",
    links: [{ label: "Try Fit Check", href: "/fit-check" }],
  },
  {
    id: "fit-how-generated",
    category: "Fit Intelligence",
    question: "How are fit recommendations generated?",
    answer:
      "Fit Intelligence compares your body measurements and fit ease preference (Slim, Regular, Relaxed, or Oversized) against per-size garment dimensions, fabric composition/stretch, and construction cut to explain chest and waist fit zones cleanly without fabricated percentages.",
  },
  {
    id: "fit-guarantee",
    category: "Fit Intelligence",
    question: "Does a fit recommendation guarantee a perfect fit?",
    answer:
      "No. Fit Intelligence provides advisory, calculation-based guidance from user-entered measurements and available garment charts. Real-world drape can still vary by posture, tailoring tolerance, and textile behavior.",
  },
  {
    id: "vton-what-is",
    category: "Virtual Try-On",
    question: "What is Virtual Try-On?",
    answer:
      "Virtual Try-On is FITLOOM's simulated Fitting Room preview where you can visually explore how garments pair together or appear alongside a local photo preview.",
    links: [{ label: "Open Try-On Demo", href: "/try-on" }],
  },
  {
    id: "vton-guarantee",
    category: "Virtual Try-On",
    question: "Does the preview guarantee how a garment will fit physically?",
    answer:
      "No. Virtual Try-On provides a visual simulation to explore styling and proportions. Exact dimensional fit verification is always handled separately by Fit Intelligence.",
  },
  {
    id: "vton-why-differ",
    category: "Virtual Try-On",
    question: "Why can visual results differ from actual garments?",
    answer:
      "Screen lighting, camera angle, fabric stiffness, tailoring seam allowances, and simulation rendering approximations mean a digital preview cannot reproduce physical garment tension or drape.",
  },
  {
    id: "cf-what-is",
    category: "CUSTOMFIT",
    question: "What is CUSTOMFIT?",
    answer:
      "CUSTOMFIT is FITLOOM's optional made-to-measure path when standard ready-to-wear sizes do not match your proportions. Standard ready-to-wear ordering remains the default experience.",
    links: [{ label: "Explore CUSTOMFIT", href: "/customfit" }],
  },
  {
    id: "cf-eligibility",
    category: "CUSTOMFIT",
    question: "Which products support CUSTOMFIT?",
    answer:
      "No garment receives CUSTOMFIT automatically—CUSTOMFIT is offered strictly on eligible products from participating sellers and partner tailors where sizing specifications and workshop capacity are configured.",
  },
  {
    id: "cf-quote-acceptance",
    category: "CUSTOMFIT",
    question: "How does the quotation and tailor acceptance process work?",
    answer:
      "After you submit your validated measurement snapshot, adjustment areas, and preferred tailor workshop, a demo quotation is prepared for review, and orders start in Pending Tailor Acceptance until the assigned workshop accepts cutting.",
  },
  {
    id: "cf-customer-approval",
    category: "CUSTOMFIT",
    question: "When does a customer approve the CUSTOMFIT order?",
    answer:
      "Customer quote approval is required explicitly inside the CUSTOMFIT workflow before the tailored item can be added to the shopping bag or confirmed at demo checkout.",
  },
  {
    id: "orders-view",
    category: "Orders",
    question: "How can I view my orders?",
    answer:
      "Sign in as a Customer and open Orders from your Customer Dashboard to inspect your session order history, selected sizes, and item summaries.",
    links: [{ label: "View Orders", href: "/orders" }],
  },
  {
    id: "orders-status",
    category: "Orders",
    question: "Where can I check order status?",
    answer:
      "Select any order in your Order History to open its dedicated tracking timeline showing standard retail fulfillment stages or Tailor CUSTOMFIT stitching milestones.",
  },
  {
    id: "orders-support",
    category: "Orders",
    question: "How do I contact support?",
    answer:
      "Use the Contact page and select Order Assistance along with your Order ID if available. Remember that in this frontend demo, submissions are recorded locally for preview rather than sent to a live helpdesk.",
    links: [
      { label: "Contact FITLOOM", href: "/contact" },
      { label: "Shipping Policy", href: "/shipping" },
      { label: "Return & Refund Policy", href: "/returns" },
    ],
  },
  {
    id: "partners-seller",
    category: "Sellers & Tailors",
    question: "How can I become a Seller?",
    answer:
      "You can explore the Seller workflow using the Account role switcher or by registering a demo account with the Seller role to test product creation, size specs, and standard order fulfillment.",
    links: [{ label: "Register Demo Account", href: "/auth/register" }],
  },
  {
    id: "partners-tailor",
    category: "Sellers & Tailors",
    question: "How can a Tailor register?",
    answer:
      "Use the Partner Tailor Application route to prepare a demo workshop onboarding draft with your workshop name, city, specialty, and weekly stitching capacity.",
    links: [{ label: "Tailor Application", href: "/tailor/register" }],
  },
  {
    id: "partners-verification",
    category: "Sellers & Tailors",
    question: "What does partner verification mean?",
    answer:
      "In this frontend prototype, Partner Verification ('Pending Demo Review', 'Verified (Demo)', or 'Rejected (Demo)') is an administrative session state demonstrating platform governance—it does not represent real-world legal or KYB verification.",
  },
  {
    id: "policy-privacy-how",
    category: "Privacy & Policies",
    question: "How is personal information handled?",
    answer:
      "In the current frontend-only build, Body Profile measurements, Saved Looks, Cart state, and mock orders stay in local browser React state (and Cookie Preferences in browser localStorage) rather than a live backend database.",
    links: [{ label: "Read Privacy Policy", href: "/privacy" }],
  },
  {
    id: "policy-privacy-link",
    category: "Privacy & Policies",
    question: "Where can I read the Privacy Policy?",
    answer:
      "The full Privacy Policy explaining Body Profile data, try-on preview images, cookie categories, and planned server-phase protections is available on the Privacy Policy page.",
    links: [{ label: "Privacy Policy", href: "/privacy" }],
  },
  {
    id: "policy-returns-link",
    category: "Privacy & Policies",
    question: "Where can I read the Return and Refund Policy?",
    answer:
      "You can review our informational Return & Refund overview (distinguishing interactive demo cancellations and return requests from future commercial commitments) on the Returns page.",
    links: [
      { label: "Return & Refund Policy", href: "/returns" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

export function filterFaqs(
  query: string,
  category: FaqCategory,
  items: readonly FaqEntry[] = FITLOOM_FAQS
): FaqEntry[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "All" && item.category !== category) {
      return false;
    }
    if (q) {
      const hay = `${item.category} ${item.question} ${item.answer}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
}

export const COOKIE_STORAGE_KEY = "fitloom_cookie_consent_v1";
export const OPEN_COOKIE_SETTINGS_EVENT = "fitloom:open-cookie-settings";

export interface CookiePreferences {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  updatedAt: string;
}

export const DEFAULT_COOKIE_PREFERENCES: Omit<CookiePreferences, "updatedAt"> = {
  essential: true,
  preferences: true,
  analytics: false,
};

export function parseStoredCookiePreferences(
  raw: string | null
): CookiePreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      essential: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()
          ? parsed.updatedAt
          : new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

export function triggerCookieSettingsModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}
