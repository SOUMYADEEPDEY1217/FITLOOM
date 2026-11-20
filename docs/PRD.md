# FITLOOM — Product Requirements Document (PRD) & MVP Scope

- **Task Reference:** `FL-P1-001` (`03_DOCUMENTATION`: `DOC-003`, `DOC-004`)
- **Governance Alignment:** `DEC-001`..`DEC-010` (`FITLOOM_MASTER_PROJECT_TRACKER.xlsx`)
- **Baseline Source of Truth:** Verified Next.js 15 Frontend Showcase (`PH3`–`PH9` completed, `40` routes)
- **Status:** P1 Documentation Deliverable (Frontend Implemented as Showcase Mock; Backend/AI Planned for `P3`–`P6`)

---

## 1. Product Vision & Problem Statement

**FITLOOM** is an AI Fashion Intelligence & Fit Calibration platform built by Team PARADOX to solve online apparel sizing uncertainty and avoidable return rates.

### Core Pain Points Addressed
1. **Inconsistent Brand Sizing:** Identical letter tags (`S`, `M`, `L`, `XL`) conceal major differences in chest/waist circumferences, garment ease, and fabric stretch.
2. **Opaque Visual Merchandising:** E-commerce photography depicts model fit rather than a shopper's unique body proportions.
3. **Guesswork & Bracket Buying:** Without transparent zone-by-zone clearance (`tight`, `ideal`, `loose`), customers over-order or avoid purchases.
4. **Disconnected Custom Tailoring:** Shoppers who fall outside standard garment grading (`> 12 cm` deviation from target ease) lack a streamlined transition from fit diagnostics to made-to-measure tailoring.

---

## 2. Target Users, Multi-Role Capability Model & Platform Scope

In the **current frontend demo (`FitloomProvider`)**, `/account` uses a single active `MockRole` UI preview switcher (`guest | customer | seller | tailor | admin`). In the **planned `P3` backend**, FITLOOM enforces an **additive multi-capability architecture** (`users` + `user_roles` + `partners`): one Better Auth user retains `'customer'` capabilities permanently upon Tailor/Seller approval and switches UI workspaces seamlessly across authorized capabilities without creating a second account, while Admin stays strictly isolated.

| Capability / Role | Code Enum | Core Purpose in Verified Frontend (`PH5`–`PH8`) & Planned `P3` Capability Rules |
| :--- | :--- | :--- |
| **Guest** | `guest` | Browse public marketing/policy pages, `/shop`, `/shop/[id]`, `/compare`, manage Cookie Consent, view access-guarded boundaries. |
| **Customer** | `customer` | Granted automatically at signup (`user_roles`). Auth showcase, calibrate 7-dimension Body Profile (`/body-profile`), run Fit Check (`/fit-check`), Try-On (`/try-on`), compose looks (`/studio`, `/saved-looks`), order standard/CUSTOMFIT items (`/cart`, `/checkout`, `/orders*`, `/customfit`). **Retained even after Partner approval, rejection, or suspension.** |
| **Seller** | `seller` | Dedicated `/seller*` portal: granted only via Admin approval of `partners(type='seller')`; manage merchant catalogue (`SellerCatalogProduct` CRUD + measurement specs), inventory statuses, and Seller-owned standard orders (`/seller/orders`). |
| **Partner Tailor** | `tailor` | Dedicated `/tailor*` portal & onboarding (`/tailor/register`): Customer submits `pending_review` application -> Admin verification grants `'tailor'` capability alongside retained `'customer'` access; inspect assigned CUSTOMFIT queue, measurement snapshots, accept/reject with reason, advance stages, edit workshop profile. |
| **Admin** | `admin` | Separately provisioned, isolated `/admin*` capability: verify/suspend partners, moderate/hide seller products (dynamically reflected on `/shop`), read-only oversight across both Standard & CUSTOMFIT orders, append-only audit logs. |

---

## 3. Core Product Value Pillars (Implemented Showcase vs. Planned P3–P4)

| Pillar | Currently Implemented in Frontend Showcase (`PH5`–`PH9`) | Planned Live Backend / AI (`P3`–`P4`) |
| :--- | :--- | :--- |
| **1. Body Profile & Calibration** | Zod-validated 7 length dimensions (`height`, `chest`, `waist`, `hip`, `shoulder`, `sleeve`, `inseam`), optional weight & body type, `cm`/`in` unit conversion, Smart Estimate helper, Fit Preference ease target (`slim` +5, `regular` +8, `relaxed` +12, `oversized` +15 cm), interactive `DigitalAvatarPreview`, and 5-entry chest/waist `measurementHistory` (`{ date, chestCm, waistCm, note }`). Stored in React session memory (`FitloomProvider`). | Persistent user profile & `measurement_history` (`{ date, chest_cm, waist_cm, note }` matching FE, plus planned optional 7-dimension snapshot expansion) stored in Neon PostgreSQL (`body_profiles`, `measurement_history`) via authenticated `GET/PUT /api/body-profile` (`BE-005`). |
| **2. Explainable Fit Intelligence** | Deterministic client engine (`evaluateGarmentFit` in `frontend/src/lib/fit-intelligence-utils.ts`) comparing Body Profile against per-size garment chest/waist specs (`MOCK_GARMENTS` / eligible seller catalogue), outputting recommended size, size breakdown, ease verdicts, missing-spec honesty notices, and >12 cm CUSTOMFIT escalation. | Server-side calculation & auditable fit evaluation endpoint `POST /api/fit-check` (`BE-007`) backed by PostgreSQL `numeric(6,1)` garment measurement charts. |
| **3. AI Virtual Try-On** | Upload UI (`/try-on`) with client validation (`JPEG/PNG/WebP`, `<= 10 MB`), `?product=` hydration, preset garment swap, simulated async preview labeled explicitly as `Visual Simulation (Mock)` (`DEC-005`), and save-to-looks workflow. | Live hosted IDM-VTON inference (`AI-001`..`AI-009`), private object storage (UUID keys, EXIF strip, signed expiring URLs, separate upload/output TTL purge), async polling, and explicitly labeled Fallback Demo on timeout. |
| **4. Style Studio & Saved Looks** | Interactive garment pairing (`/studio`) + look saving into `/saved-looks` with `?look=` round-trip deep linking and invalid-reference pruning. | Persistent user outfits in PostgreSQL (`saved_looks`) via `CRUD /api/saved-looks` (`BE-008`). |
| **5. E-Commerce & CUSTOMFIT** | Eligible catalogue sync from `sellerProducts`, Wishlist/Compare (max 3), size-guarded Add to Bag, Cart dedupe & quantity clamping (`1..10`), validated 3-step Checkout (`/checkout` producing one `MockOrder` per checkout submission in demo with simulated payment labels), Order history/detail (`/orders/[id]`), and CUSTOMFIT quote gate -> Tailor queue handoff. | Persistent `cart_items`, `checkout_groups` (parent customer transaction/payment reference), `orders`, `order_items`, `customfit_requests`; **Recommended Option B** atomic split into independent per-Seller `standard` orders & per-Tailor `customfit` orders linked via `checkout_group_id` with independent lifecycles and per-order refund tracking (`[OWNER INPUT REQUIRED / TECHNICAL DECISION REQUIRED: Option B Auto-Split vs. Option A Prohibit Mixed Carts]`); live payments remain **Out of Hackathon MVP Scope** until `[TECHNICAL DECISION REQUIRED: Commercial Payment Gateway]` is approved. |
| **6. Trust, Compliance & Workspaces** | Complete public site (`/about`, `/how-it-works`, `/contact`, `/faq`, `/terms`, `/privacy`, `/returns`, `/shipping`), Cookie Consent (`localStorage`), Role-Guarded Seller/Tailor/Admin workspaces (`DEC-010`), Admin read-only order oversight with audit notes, and `/tailor/register` demo application + explicit demo session switcher. | Owner-supplied legal/contact copy (`[OWNER INPUT REQUIRED]`), real contact inquiry ticketing, Better Auth RBAC middleware (`BE-003`, `BE-011`: authenticated Customer required to submit Tailor application; Admin verification grants `tailor` role), Seller order scoping by `seller_partner_id`, and server-persisted append-only Admin audit log (read-only oversight; no Admin stage overrides). |

---

## 4. Scope Boundary: MVP (Hackathon Execution P3–P6) vs. Post-Hackathon

### 4.1 Hackathon P3–P6 Core MVP Scope (Must Have for End-to-End Demo)
1. **Authentication & User Profile (`BE-003`, `BE-004`):** Better Auth session management (`customer`, `seller`, `tailor`, `admin`), protected API routes, signed demo account seeding (`DPY-004`).
2. **PostgreSQL Catalogue & Body Profile (`BE-001`, `BE-002`, `BE-005`, `BE-006`):** Real Drizzle schema seeding curated catalogue (`6+` verified garments with per-size chest/waist cm specs) + user body profile CRUD.
3. **Deterministic Fit Intelligence API (`BE-007`):** Server-enforced anthropometric scoring matching client math in `fit-intelligence-utils.ts`.
4. **Real IDM-VTON Pipeline with Labeled Fallback (`AI-001`..`AI-009`):** Validated image upload, async inference via chosen provider (`DEC-008`), timeout handling, and strict UI badging distinguishing Live AI vs. Fallback Demo (`DEC-005`).
5. **Core Customer Commerce Loop (`BE-008`, `BE-009`, `BE-010`):** Persist Saved Looks, Cart items, Standard Checkout orders, and baseline CUSTOMFIT tailor request submission + Tailor stage advancement.

### 4.2 Implemented in Frontend Showcase — Full Persistence & Advanced Operations (`P3` / Post-Hackathon Staging)
- Full self-serve **Seller portal** (`/seller/products` image upload & full analytics) & **Partner Tailor onboarding verification review pipeline** (`/tailor/register` -> `/admin/partners` approval -> active workshop allocation).
- Full **Admin Audit Trail querying/export**, dispute resolution workflows, and **automated courier/payment webhook integrations**.
- Automated email/SMS transactional notifications, shipping carrier tracking APIs, and commercial payment settlement.

### 4.3 Explicit Non-Goals (Out of Scope for MVP & Frontend Showcase)
- Real-time computer vision body measurement scanning from webcam/smartphone camera (deferred; manual anthropometric input + validated bounds used intentionally).
- Real payment card processing, UPI collection, tax invoicing, or automated payouts in demo mode (checkout intentionally stays payment-sandbox/demo only until `[OWNER INPUT REQUIRED]` & `[TECHNICAL DECISION REQUIRED: Payment Provider]` are resolved).
- Real 3D cloth physics simulation / WebGL avatar rigging (2D proportional `DigitalAvatarPreview` + 2D VTON composite used for CPU efficiency under `DEC-002`).
- Deleting or redesigning locked `PH3` Hero (`frontend/src/components/hero/*`) or `PH3` Futuristic Footer (`frontend/src/components/layout/footer.tsx`, `DEC-004`).
