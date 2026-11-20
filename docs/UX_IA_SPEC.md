# FITLOOM — User Personas, Journeys & Information Architecture

- **Task Reference:** `FL-P1-003` (`03_DOCUMENTATION`: `DOC-007`, `DOC-008`, `DOC-009`)
- **Verified Codebase Sitemap:** All `40` Next.js App Router pages (`frontend/src/app/**/page.tsx`) + `not-found.tsx` + `error.tsx`

---

## 1. User Personas

| Persona | Primary Role (`MockRole`) | Goals & Motivation | Key Friction Without FITLOOM | Primary Routes Used |
| :--- | :--- | :--- | :--- | :--- |
| **1. Online Shopper ("Riya")** | `customer` | Buy shirts, bombers, trousers, and tees confidently on the first try without bracket-buying multiple sizes. | Brand tags disagree; returns waste time. | `/`, `/shop`, `/shop/[id]`, `/body-profile`, `/fit-check`, `/try-on`, `/studio`, `/compare`, `/wishlist`, `/saved-looks`, `/cart`, `/checkout`, `/orders/[id]` |
| **2. Custom-Fit Buyer** | `customer` | Commission tailored shirts/trousers calibrated to non-standard proportions (`> 12 cm` target ease gap or bespoke alterations). | Unclear tailor pricing/turnaround; difficulty conveying body measurements accurately. | `/fit-check` (escalation), `/customfit`, `/body-profile`, `/cart`, `/checkout`, `/orders/[id]` |
| **3. Partner Tailor ("Atelier Arjun & Co.")** | `tailor` | Receive clean, pre-validated CUSTOMFIT orders with customer body measurement snapshots, accept/reject transparently, and track studio workload. | Incomplete measurement notes in chats; manual status updates; mixed standard retail orders. | `/tailor`, `/tailor/register`, `/tailor/orders`, `/tailor/orders/[id]`, `/tailor/profile` |
| **4. Seller / Brand ("Verve Studio")** | `seller` | Publish ready-to-wear garments with chest/waist dimension charts (`cm`), manage stock status, and fulfill standard orders cleanly. | Listings lack fit metrics; moderation status unclear when flagged. | `/seller`, `/seller/products`, `/seller/orders` |
| **5. Platform Admin** | `admin` | Verify partner onboarding applications, suspend abusive accounts, hide unverified products from `/shop`, monitor dual Standard + CUSTOMFIT orders, review audit log. | No single governance trail separating Seller vs. Tailor fulfillment accountability. | `/admin`, `/admin/partners`, `/admin/catalogue`, `/admin/orders` |

---

## 2. Core End-to-End User Journeys (1:1 Screen Mapping)

### Journey A — Customer Calibration, Fit Check, Try-On & Purchase (Implemented Mock Session)
1. **Entry & Discovery:** Lands on `/` -> browses Feature Strip / Discovery Carousel -> clicks `/shop` (or `/auth/register` -> auto-redirects to `/body-profile`).
2. **Body Profile Calibration (`/body-profile`):** Enters or adjusts 7 anthropometric measurements (`cm` or `in`), selects Fit Preference (`slim`/`regular`/`relaxed`/`oversized`), saves profile.
3. **Product Fit Evaluation (`/shop` -> `/shop/[id]` -> `/fit-check?product=`):** Inspects chest/waist specs & size chart; launches `/fit-check?product=<id>` for deterministic zone-by-zone compatibility breakdown.
4. **Visual Try-On & Styling (`/try-on?product=` -> `/studio` -> `/saved-looks`):** Uploads full-body photo (`<= 10 MB`, JPEG/PNG/WebP), runs simulated preview (planned `P4` IDM-VTON), saves look (`?look=` edit loop).
5. **Size-Guarded Cart & 3-Step Checkout (`/shop/[id]` -> `/cart` -> `/checkout` -> `/orders/[id]`):** Selects explicit size (`S|M|L|XL`) -> Add to Bag (deduped up to max `10` units/line) -> Adjusts qty -> Shipping -> Payment -> Review & Confirm (`FT-xxxx`) -> views order timeline. *(Note: In current FE session showcase, 1 checkout emits 1 `MockOrder`; under recommended `P3` Option B, mixed Seller/CUSTOMFIT carts split transparently under a shared checkout group and display all linked `FT-xxxx` orders in `/orders`.)*

### Journey B — CUSTOMFIT Escalation to Tailor Production
1. **Trigger:** Customer encounters `no_supported_recommendation` (`> 12 cm` variance) on `/fit-check` or chooses **CUSTOMFIT** on `/shop/[id]` / `/customfit`.
2. **Request & Quote Gate (`/customfit`):** Selects garment + verified tailor (`Atelier Arjun & Co.`, etc.) + adjustment zones -> `Submit CUSTOMFIT Request (Pending Quote)` -> reviews issued quote (`garmentBasePriceInr + tailoringFeeInr`) -> approves quote -> `Add Approved CUSTOMFIT to Bag` -> checks out via `/checkout`.
3. **Tailor Execution (`/tailor/orders` -> `/tailor/orders/[id]`):** Authenticated & verified Tailor inspects `measurementsSnapshot` (with missing-spec warning banner if incomplete), **Accepts** or **Rejects (with reason)**, and advances production stages (`Cutting -> Stitching in Progress -> Quality Check -> Out for Delivery -> Delivered`).

### Journey C — Seller Catalogue Lifecycle, Multi-Role Onboarding & Admin Governance
1. **Multi-Role Tailor Onboarding (`/tailor/register`):** Current FE demo allows filling onboarding form + `"Switch Demo Session"` preview; planned `P3` requires signed-in Customer authentication first -> creates `pending_review` record (`owner_user_id`) -> Admin approval grants `'tailor'` capability **while retaining Customer shopping access**, letting one account toggle seamlessly between `/shop` and `/tailor*` workspaces without creating a second account.
2. **Seller Publishing (`/seller/products`):** Seller creates listing with per-size chest/waist `cm` measurements (`[50, 180]` integer UI validation in FE; `numeric(6,1)` canonical cm DB in `P3`) and image; if `status === "active"` and partner is active + Admin status is `approved`, product automatically surfaces in `/shop`.
3. **Standard Fulfillment (`/seller/orders`):** Seller views **Standard orders owned by their `seller_partner_id` only** and advances standard stages (`Placed -> Cutting -> Quality Check -> Out for Delivery -> Delivered`) or cancels from `Placed` with reason.
4. **Admin Oversight (`/admin/*`):** Admin uses an isolated capability (`admin` role) — never granted via partner onboarding — to verify/suspend partners (`customer` access unaffected), suspend/restore catalogue items (`suspended` hides from `/shop`), and inspect Standard + CUSTOMFIT `checkout_groups` & `orders` **read-only** with append-only oversight audit notes.

---

## 3. Information Architecture & Complete `40`-Route Sitemap

All `40` verified `frontend/src/app/**/page.tsx` routes map cleanly into 5 top-level zones:

| Zone | Routes | Nav / Guard Surface | State / Persistence (`PH9` Baseline -> `P3` Plan) |
| :--- | :--- | :--- | :--- |
| **1. Public Marketing & Trust (9)** | `/`, `/about`, `/how-it-works`, `/contact`, `/faq`, `/terms`, `/privacy`, `/returns`, `/shipping` | Top `HeroNavbar` (`/`), `Navbar` (other routes), `MobileNavDrawer`, Footer links | Static/Client UI; Cookie Consent in `localStorage`; `[OWNER INPUT REQUIRED]` markers preserved until Owner input |
| **2. Shopping & Comparison (4)** | `/shop`, `/shop/[id]`, `/compare`, `/wishlist` | Primary Nav `Shop` & Wishlist heart icon | Derived live from `sellerProducts` via `selectEligibleCustomerGarments`; `BUG-003` invalid ID UI verified |
| **3. Fit Intelligence & Studio (5)** | `/body-profile`, `/fit-check`, `/try-on`, `/studio`, `/saved-looks` | Primary Nav (`Fit Check`, `Try-On`, `Style Studio`, `CUSTOMFIT` nearby) | Zod-validated `BodyProfile` + deterministic `evaluateGarmentFit`; mock VTON upload guard -> `P4` IDM-VTON |
| **4. Commerce, Orders & Account (10)** | `/customfit`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/dashboard`, `/account`, `/auth/login`, `/auth/register`, `/auth/forgot-password` | Primary Nav (`CUSTOMFIT`, `Cart`, `Dashboard`) & Account CTAs | 3-step Checkout guard (`validateCartItems`); Customer Hub + Role Switcher showcase (`/account`) |
| **5a. Seller Workspace (3)** | `/seller`, `/seller/products`, `/seller/orders` | `WorkspaceShell` (`DEC-010`), `WorkspaceRoleGuard(seller)` | Dedicated seller product CRUD + Standard order workflow |
| **5b. Tailor Workspace (5)** | `/tailor`, `/tailor/orders`, `/tailor/orders/[id]`, `/tailor/profile`, `/tailor/register` | Primary Nav `For Tailors` + `WorkspaceShell`, `WorkspaceRoleGuard(tailor)` | Workshop metrics, CUSTOMFIT-only orders + detail specs, onboarding form |
| **5c. Admin Workspace (4)** | `/admin`, `/admin/partners`, `/admin/catalogue`, `/admin/orders` | `WorkspaceShell`, `WorkspaceRoleGuard(admin)` | Partner status governance, Catalogue moderation -> `/shop` sync, Dual Order audit log |
| **System Boundaries (Non-page)** | `/does-not-exist` (`not-found.tsx`), runtime (`error.tsx`), `/icon.svg` | Next.js App Router fallback boundaries | HTTP `404` recovery (`/` & `/shop`) and Client error reset boundary |
