# FITLOOM — Functional & Non-Functional Requirements Specification

- **Task Reference:** `FL-P1-002` (`03_DOCUMENTATION`: `DOC-005`, `DOC-006`)
- **Upstream Baseline:** `docs/PRD.md`, Verified Frontend `frontend/src/lib/*`, `frontend/src/app/*`, `07_TESTING_QA`
- **Rule:** Every requirement maps directly to implemented frontend behavior (`[FE Implemented — Session Mock]`) and specifies the verifiable target for P3–P5 backend/AI wiring (`[BE/AI Planned]`).

---

## 1. Functional Requirements (FR)

### 1.1 Authentication, Session & Role Isolation
- **FR-001 — Account Registration & Sign-In Validation:**
  - *Rule (`frontend/src/lib/auth-validation.ts`):* `fullName` 2–50 trimmed chars, `email` valid format <= 80 chars, `password` 6–64 chars, OTP (forgot-password demo) strictly `/^\d{6}$/`.
  - *Acceptance Criterion:* Invalid inputs block submission with per-field inline errors; valid auth transitions session without console errors (`BE-003` will back this with hashed passwords & Better Auth HTTP-only cookies).
- **FR-002 — Multi-Role Capability Model & Partner Onboarding Lifecycle:**
  - *Rule (`frontend/src/lib/workspace-config.ts`, `frontend/src/app/tailor/register/page.tsx`):* Dedicated workspaces `/seller*` (`seller`), `/tailor*` (`tailor`), `/admin*` (`admin`), plus customer hubs (`/dashboard`, `/orders*`, `/account`). Roles **must never silently auto-switch** or grant unauthorized permissions on client request.
  - *Planned P3 Multi-Role Capability Architecture (`users`, `user_roles`, `partners`):* One Better Auth user account supports **multiple additive capabilities** in `user_roles`. Account signup assigns `'customer'`. Submitting `/api/tailor/register` requires an authenticated `'customer'` session (`401` if guest) and inserts `partners` (`owner_user_id = session.user.id`, `type = 'tailor'`, `verification_status = 'pending_review'`, unique `(owner_user_id, type)` blocking duplicates with `409`). Admin verification (`PATCH /api/admin/partners/[id]`) adds `'tailor'` to `user_roles` **while preserving `'customer'` capabilities** so one account seamlessly shops as a Customer and switches active workspace chrome to `/tailor*`. `admin` remains strictly separate and cannot be granted via partner onboarding or client UI switching.
  - *Acceptance Criterion:* Unauthorized capability access renders `WorkspaceAccessDenied` (`QA-014`) and returns `401`/`403`; approved Tailors retain `/body-profile`, `/cart`, and `/orders` access; rejected applications never gain partner capabilities.
- **FR-003 — Partner Suspension & Rejection Isolation:**
  - *Rule (`frontend/src/lib/admin-workspace-utils.ts` — `evaluatePartnerSuspension`):*
    - *Rejected Partner Application (`verification_status === 'rejected'`):* Partner role is never added; customer access remains unaffected; partner workspace APIs return `403 FORBIDDEN`.
    - *Suspended Partner (`operational_status === 'suspended'`):* Partner workspace mutations (`/api/seller/*`, `/api/tailor/*`) fail with `403 PARTNER_SUSPENDED`, suspended Seller products are hidden from `/shop`, and CUSTOMFIT intake pauses — **without** stripping personal `'customer'` shopping permissions (unless `users.account_status === 'disabled'`).
  - *Acceptance Criterion:* Suspension banner explains restriction clearly; partner APIs return `403 PARTNER_SUSPENDED` while user's own `/orders` & `/body-profile` remain accessible.

### 1.2 Body Profile & Measurement Calibration
- **FR-004 — Anthropometric Schema, Canonical Precision & Measurement History:**
  - *Rule (`frontend/src/lib/mock-data.ts` — `BodyProfileSchema`, `seller-workspace-utils.ts`):* All body and garment dimensions are stored canonically in **centimeters with 1 decimal place (`numeric(6,1)`)**. `BodyProfileSchema` enforces: Height `[130, 220]`, Chest `[70, 150]`, Waist `[55, 140]`, Hip `[75, 155]`, Shoulder `[34, 65]`, Sleeve `[50, 80]`, Inseam `[55, 105]`, Weight `[35, 180]` optional kg, `bodyType` optional enum (`hourglass | athletic | rectangle | pear | inverted-triangle`), `fitPreference` required enum (`slim | regular | relaxed | oversized`). Seller product form (`SizeDimensionMapSchema`) currently accepts whole integers `[50, 180] cm` in UI while `P3` `garment_measurements` (`chest_cm`, `waist_cm`, and future garment dimensions) supports `numeric(6,1)` (`[50.0, 180.0] cm`). All INR prices (`price_inr`, `unit_price_inr`, `tailoring_fee_inr`, `total_inr`) remain strict integers.
  - *Measurement History Rule (`FitloomProvider` vs Planned):* Implemented frontend records a rolling history of `{ date, chestCm, waistCm, note }` (capped at 5 entries in session state); storing full 7-dimension historical body snapshots is flagged as **Planned (P3 Optional Enhancement)**.
  - *Acceptance Criterion:* Out-of-range inputs (`e.g. -15`) fail Zod validation (`BUG-014` resolved); canonical decimal cm calculations (`round1`, `1 in = 2.54 cm`) match DB types (`BE-005`).
- **FR-005 — Metric/Imperial (`cm`/`in`) Dual-Unit Editing:**
  - *Rule (`frontend/src/lib/body-profile-utils.ts`):* Drafting state converts smoothly between `cm` and `in` (`1 in = 2.54 cm`) via `switchDraftUnit` without mid-keystroke cursor/rounding jitter, normalizing to canonical `cm` (`round1`) upon validation/save.
  - *Acceptance Criterion:* Unit toggle preserves user measurements cleanly across reloads once persisted in P3 (`QA-014`).

### 1.3 Catalogue, Product Details, Wishlist & Compare
- **FR-006 — Public Catalogue Synchronization & Moderation Filtering:**
  - *Rule (`frontend/src/lib/seller-workspace-utils.ts` — `isProductEligibleForCustomerCatalog`):* A garment appears on `/shop` **only if** seller listing `status === "active"` (or `"out_of_stock"` disabled badge rules per catalog), `moderationStatus === "approved"`, owning partner is not suspended, and `hasCompleteFitDimensions` is valid.
  - *Acceptance Criterion:* Seller listing creation (`status="active"`) appears on `/shop`; Admin `"Suspend / Hide"` immediately removes the listing from `/shop` (`QA-014` verified `21 -> 18 -> 21`).
- **FR-007 — Explicit Size Selection Guard & Invalid-ID Recovery:**
  - *Rule (`frontend/src/app/shop/[id]/page.tsx`, `BUG-003`):* Add to Bag requires an explicit user click on an available garment size (`selectedSize !== null`); no default auto-selected size is added implicitly. Invalid product/order slugs (`/shop/INVALID-999`, `/orders/INVALID-999`, `/tailor/orders/INVALID-999`) must render branded Not Found UI rather than item `[0]`.
  - *Acceptance Criterion:* Verified across all 3 dynamic routes (`verify_ph9_http.cjs` & Chrome QA `BUG-003`).
- **FR-008 — Wishlist & Multi-Garment Compare Caps:**
  - *Rule (`frontend/src/lib/compare-wishlist-utils.ts`):* Compare holds at most `MAX_COMPARE_ITEMS = 3`; Wishlist & Compare IDs are pruned against active eligible catalogue (`pruneInvalidWishlistRefs`, `pruneInvalidCompareRefs`). Deep links hydrate via `/fit-check?product=` and `/customfit?product=`.
  - *Acceptance Criterion:* Header Wishlist counter reflects valid saved items only; invalid IDs are excluded safely.

### 1.4 Deterministic Fit Intelligence Engine
- **FR-009 — Category-Aware Compatibility & Zero Guesswork:**
  - *Rule (`frontend/src/lib/fit-intelligence-utils.ts`):* Upper-body items (`Shirts`, `Outerwear`, `T-Shirts`, `Hoodies`) anchor on **chest** (with optional waist secondary check) and mark `Inseam` as `not_applicable`; `Trousers` anchor on **waist** and mark `Chest`/`Shoulder`/`Sleeve` as `not_applicable`.
  - *Acceptance Criterion:* Garments missing `primaryGarmentMap` return `missing_garment_measurements` cleanly without guessing; bodies deviation `> 12 cm` (`MAX_TARGET_DEVIATION_CM`) return `no_supported_recommendation` + `escalateToCustomFit = true` (`BE-007`).

### 1.5 Virtual Try-On & Style Studio
- **FR-010 — Upload Guardrails & AI Honesty Compliance (`DEC-005`):**
  - *Rule (`frontend/src/app/try-on/page.tsx`, `AI-003`..`AI-008`):* Accept only `image/jpeg`, `image/png`, `image/webp` up to `10 MB` (`MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024`). Current frontend explicitly displays `Visual Simulation (Mock)`; P4 live inference must label results as `Live IDM-VTON Inference` vs. `Fallback Demo (Simulated Preview)` on timeout/failure.
  - *Acceptance Criterion:* Disallowed MIME/oversized uploads are rejected with validation feedback; Fallback never impersonates live AI inference.
- **FR-011 — Style Studio Look Composition & Persistence:**
  - *Rule (`frontend/src/lib/studio-utils.ts`):* Combine tops, bottoms, outerwear and save titled outfits into `/saved-looks` with `?look=` edit round-trip.
  - *Acceptance Criterion:* Saved looks preserve garment lists and metadata (P3 backed by `BE-008`).

### 1.6 Cart Integrity, Mixed-Cart Checkout Splitting, Orders & Ownership
- **FR-012 — Cart Deduplication, Quantity Limits & Authoritative Checkout Validation:**
  - *Rule (`fitloom-provider.tsx` `addToCart`, `checkout-utils.ts` `validateCartItems`):* Cart deduplicates identical items `(productId, selectedSize, customFitNotes, serializedMeasurements)` and clamps quantity per line item to **`1..10`** (`Math.min(10, qty + delta)`). Empty or invalid carts cannot enter Checkout order creation. Checkout validates `CheckoutCustomerSchema` (`fullName`, `email`, `phone`, `street`, `city`, `state`, `pincode`), re-validates live catalogue eligibility (`moderationStatus = 'approved'`, `status = 'active'`, active owning partner, inventory, and `quote_approved = true` for CUSTOMFIT items) and recalculates all INR prices strictly server-side in `P3`.
  - *Mixed Standard + CUSTOMFIT & Multi-Seller Checkout Architecture (`Option B` Recommended — `[OWNER INPUT REQUIRED / TECHNICAL DECISION REQUIRED: Option B Auto-Split vs. Option A Disallow Mixed Carts]`):* In the current FE session demo (`buildValidatedMockOrder`), one checkout yields one `MockOrder` with simulated payment label. Under `P3` **Option B**, one checkout creates a `checkout_groups` parent (capturing shipping & combined `grand_total_inr` / parent payment intent) and splits atomically inside `drizzle.transaction` into independent Seller `standard` `orders` and Tailor `customfit` `orders`, with per-order `allocated_amount_inr` and independent `refunded_amount_inr` on cancellation/rejection, grouped cleanly in Customer `/orders` and Admin `/admin/orders`. Any SQL/validation failure rolls back the full transaction cleanly. Commercial payment gateway settlement & split payouts remain **Out of MVP Scope** (`[TECHNICAL DECISION REQUIRED: Payment Gateway]`).
  - *Acceptance Criterion:* Zero empty-cart phantom orders; invalid fields or unapproved CUSTOMFIT quotes block submission; historical `order_items` snapshots remain immutable even if a Seller edits pricing or archives the product later (`QA-014`, `QA-015`).
- **FR-013 — CUSTOMFIT Quote Gate, Seller Ownership & Admin Read-Only Oversight:**
  - *Rule (`customfit-utils.ts`, `seller-workspace-utils.ts`, `tailor-workspace-utils.ts`, `admin/orders/page.tsx`):*
    - CUSTOMFIT requests enforce explicit quote approval (`pending_quote -> quote_ready -> quote_approved -> added_to_bag`) before checkout.
    - **Seller Scoping (`P3`):** Seller APIs strictly scope to `fulfillment_type = 'standard' AND seller_partner_id = session.partnerId`, derived via authenticated `partners.owner_user_id`; attempts by Seller A to access/mutate Seller B's order or CUSTOMFIT orders return `403 FORBIDDEN` without exposing Seller B's customer data.
    - **Tailor Scoping:** Tailor APIs strictly scope to `fulfillment_type = 'customfit' AND tailor_partner_id = session.partnerId`.
    - **Admin Governance:** Admin (`/admin/orders`) has cross-platform **read-only oversight** across all Standard and CUSTOMFIT orders and appends immutable governance notes (`admin_audit_logs`), **without** advancing or overriding Seller/Tailor operational fulfillment stages.
  - *Acceptance Criterion:* Sellers cannot view/modify other sellers' items or CUSTOMFIT orders; Tailors see assigned CUSTOMFIT orders only; Admin notes log cleanly without mutating fulfillment stages.

### 1.7 Public Pages, Compliance & Feedback
- **FR-014 — Cookie Consent Preferences & Public Compliance UI:**
  - *Rule (`frontend/src/components/layout/cookie-banner.tsx`):* Essential cookies fixed ON; optional categories toggleable via modal and persisted in `localStorage`; re-openable via Footer `COOKIE SETTINGS`. `/contact` enforces Zod field validation and preserves `[OWNER INPUT REQUIRED]` until supplied.
  - *Acceptance Criterion:* Cookie banner stays dismissed on reload after saving (`QA-016`).
- **FR-015 — Global Accessible Toasts & Empty/Error States:**
  - *Rule (`frontend/src/components/ui/toast.tsx`, `frontend/src/app/not-found.tsx`, `frontend/src/app/error.tsx`):* All mutations display actionable toast/status feedback; empty filtered views render recovery CTAs; unknown routes serve HTTP `404`.
  - *Acceptance Criterion:* Zero silent failures or unstyled crash screens (`QA-013`, `QA-015`).

---

## 2. Non-Functional Requirements (NFR)

| ID | Category | Target / Constraint | Source / Enforcement Strategy |
| :--- | :--- | :--- | :--- |
| **NFR-001** | **Responsive Layout Integrity** | `0px` unintended horizontal page overflow (`scrollWidth <= innerWidth`) across `375px`, `768px`, `1024px`, and `1440px+` viewports; tables & carousels scroll only inside local `overflow-x-auto` containers. | Verified in Chrome across `40` desktop + `106` responsive checks (`QA-012`). |
| **NFR-002** | **CPU-Friendly Lean Architecture (`DEC-002`)** | Keep client runtime minimal (`next/image` AVIF/WebP, native CSS/Tailwind utilities, zero heavy UI telemetry bloat, GSAP/Lenis confined cleanly to Hero/Footer & smooth scroll with cleanup). | `next.config.ts` formats `["image/avif", "image/webp"]`; timer/animation cleanups verified (`BUG-015`). |
| **NFR-003** | **Page & Fit API Performance Targets** | Local/SSR page response `< 2s`; deterministic Fit Check (`POST /api/fit-check`) & Catalogue APIs P95 `< 300ms` (`QA-010`); async VTON job polling with explicit `[TECHNICAL DECISION REQUIRED]` timeout threshold (e.g. `30s`–`45s`) triggering Fallback Demo (`DEC-005`). | Verified HTTP SSR baseline (`verify_ph9_http.cjs`); API benchmarking in `P5` (`QA-010`). |
| **NFR-004** | **Accessibility (WCAG AA Intent)** | Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), non-empty `alt` text on informative `<img>`, associated labels on inputs, keyboard `Tab` reachability, `Escape` dismissal for drawers/dialogs, visible `focus-visible` rings, `prefers-reduced-motion` safety. | Verified across `/shop`, `/contact`, `/body-profile`, mobile drawer (`QA-015`, `PH9-J`). |
| **NFR-005** | **Privacy, Private Storage & Secrets Hygiene** | Client validates JPEG/PNG/WebP `<= 10 MB`; P3/P4 server **must** inspect magic bytes, strip EXIF (`AI-004`), store photos in **private object storage** under non-guessable UUID keys served only via **short-lived signed URLs** (never permanent public URLs), auto-purge originals & outputs separately (`[OWNER INPUT REQUIRED: Legal Retention Schedule]`), keep `.env.local` strictly `.gitignore`d locally and secrets out of `NEXT_PUBLIC_*` / Git. | Planned security/privacy architecture in `docs/SECURITY_PRIVACY_STORAGE.md`. |
| **NFR-006** | **SEO Metadata & Error Recovery** | Every frontend/public/app route exports unique `<title>` + `<meta name="description">` (`40/40` verified) + `/icon.svg` + branded `404` & recoverable `error.tsx`. | Verified by `verify_ph8.cjs` & `verify_ph9_http.cjs`. |
| **NFR-007** | **Hero & Footer Visual Lock (`DEC-003`, `DEC-004`)** | Preserve `RadialBackground`, Hero artwork composition (`FitloomHero`), and Futuristic Footer (`footer.tsx`) across future backend integration phases (`BUG-010` offline asset optimization only via lossless/format-safe asset replacement if approved). | Enforced in code reviews & build gates (`FL-PH9-006`). |
| **NFR-008** | **Zero-Trust Server Validation (`BE-011`)** | Client Zod schemas improve UX only; all `P3` Route Handlers/Server Actions re-validate inputs with shared Zod schemas, verify session roles server-side, and never trust client totals/prices (`priceInr` resolved server-side). | Planned in `docs/DB_AND_API_CONTRACTS.md`. |
