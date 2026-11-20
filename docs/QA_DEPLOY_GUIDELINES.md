# FITLOOM — Testing Strategy, Deployment Plan, Risk Matrix & Coding Guidelines

- **Task Reference:** `FL-P1-008` (`03_DOCUMENTATION`: `DOC-022`, `DOC-023`, `DOC-024`, `DOC-025`)
- **Governance:** Aligns with `07_TESTING_QA` (`QA-001`..`QA-016`), `08_DEPLOYMENT` (`DPY-001`..`DPY-008`), `11_RISK_REGISTER` (`RSK-001`..`RSK-006`), and `DEC-002` (Ponytail minimal workflow).

---

## 1. Testing & QA Strategy (`DOC-022`)

### 1.1 Completed Frontend Baseline (`QA-012`–`QA-016` — Executed & Passed in PH9)
- Static gates: `tsc --noEmit` (`0` errors), `npm run lint` (`0` errors), `npm run build` (`41/41` routes).
- HTTP SSR verification: `verify_ph9_http.cjs` (`40/40` HTTP `200`, `40` unique titles/descriptions, `/icon.svg`, `/does-not-exist` HTTP `404`).
- Automated headless Chrome `157.0.8103.79` QA: `375x812`, `768x1024`, `1024x768`, `1440x900` overflow (`0px`), Customer/Seller/Tailor/Admin workflows, Cookie Consent persistence, validation/empty states, and Keyboard/Landmark A11y.

### 1.2 Planned Downstream Verification Pyramid (`P3`/`P5` — Not Yet Executed)
1. **Domain Unit Tests:** Deterministic test vectors for `evaluateGarmentFit` (`0.1 cm` rounding, Trousers vs Shirts, slim/regular/relaxed/oversized, `> 12 cm` escalation), `BodyProfileSchema`, `validateCartItems`, `evaluatePartnerSuspension`, and stage transition validators.
2. **API Integration & AuthZ Tests (`QA-001`–`QA-004`, `QA-009`):** Verify `401`/`403` guards across every route, multi-seller isolation, server-side price recalculation, atomic checkout rollback, and invalid upload MIME/magic-byte rejection (`400`/`413`/`415`).
3. **AI & Fallback Integration Tests (`QA-005`, `AI-009`):** Verify live VTON job completion telemetry (`P50`/`P95`), private signed URL expiry/TTL purge, and forced provider timeout/429 injection proving `mode: "fallback_demo"` labeling renders reliably without breaking UX.
4. **Full-Stack E2E & Performance Gate (`QA-006`–`QA-011`):** Reload-persistent Playwright/Chrome E2E tests covering Neon Postgres persistence (`page.reload()` after checkout, body profile, seller create, admin moderate), `< 2s` local TTFB / `< 300ms` Fit API P95, and full regression prior to `P6`.

### 1.3 Planned `P3`/`P5` Edge-Case Integration Test Matrix (`Planned — Not Executed`)

| Test ID | Target Scenario (`P3`/`P5` Scope) | Expected Verified Behavior |
| :--- | :--- | :--- |
| **`P3P5-T01`** | **Mixed standard + CUSTOMFIT cart (Option B)** | Checkout creates 1 `checkout_groups` parent + splits atomically into separate Seller `standard` (`Placed`) and Tailor `customfit` (`Pending Tailor Acceptance`) orders with independent lifecycle transitions and grouped `/orders` UI; full SQL rollback occurs if any item fails validation. |
| **`P3P5-T02`** | **Multi-seller standard checkout & independent cancel** | One checkout with items from Seller A and Seller B creates separate `standard` orders scoped per `seller_partner_id` sharing `checkout_group_id`; cancelling Seller A's order allocates refund only to Seller A's order without cancelling Seller B's sibling order. |
| **`P3P5-T03`** | **Seller A accessing Seller B's order item** | `GET`/`PATCH /api/seller/orders/[sellerBOrderId]` as Seller A returns `HTTP 403 FORBIDDEN` without exposing Seller B's customer PII or order financials. |
| **`P3P5-T04`** | **Product price change after order creation** | Updating `products.price_inr` via Seller API leaves previously placed `order_items.unit_price_inr` and `orders.total_inr` unchanged. |
| **`P3P5-T05`** | **Product archival with historical order preservation** | Attempting to delete a referenced product archives/deactivates it (`status='inactive'`) while historical `order_items` snapshots (`product_name_snapshot`, `seller_partner_id`, specs) remain intact in `/orders/[id]` and `/admin/orders`. |
| **`P3P5-T06`** | **Decimal garment measurements (`0.1 cm`)** | Seeded/stored `numeric(6,1)` garment specs (e.g. `100.5 cm`) persist without integer truncation and evaluate consistently across `POST /api/fit-check`, `evaluateGarmentFit`, and `round1` unit conversions. |
| **`P3P5-T07`** | **Tailor registration without authentication** | Unauthenticated `POST /api/tailor/register` returns `401 UNAUTHORIZED`; client-supplied `role: "tailor"` or `verification_status: "verified"` is rejected/ignored. Authenticated Customer submission creates `pending_review` record only. |
| **`P3P5-T08`** | **Duplicate tailor applications** | Authenticated user with an existing `pending_review` or `verified` partner record submitting `/api/tailor/register` again receives `409 PARTNER_APPLICATION_EXISTS`. |
| **`P3P5-T09`** | **Suspended partner attempting API operations** | Partner with `operational_status = 'suspended'` calling Seller product/order mutations or Tailor order stage mutations receives `403 PARTNER_SUSPENDED` and their products remain hidden on `/shop`. |
| **`P3P5-T10`** | **VTON signed URL expiry and TTL cleanup** | `vton_jobs` stores private UUID keys (`no` public permanent URL); expired signed URLs deny object access (`403`), and TTL worker deletes expired raw uploads & output images per separate schedules. |
| **`P3P5-T11`** | **Duplicate cart-item submissions** | Submitting identical `(productId, selectedSize, customfitRequestId)` increments quantity deterministically cleanly within `1..10` limit (rejecting `> 10` cleanly with `400 VALIDATION_ERROR`). |
| **`P3P5-T12`** | **CUSTOMFIT checkout without approved quote** | Attempting checkout with a CUSTOMFIT item whose `customfit_requests.quote_approved === false` returns `409 QUOTE_UNAPPROVED` and rolls back checkout cleanly without creating orders. |
| **`P3P5-T13`** | **Multi-role Customer + Tailor retention** | Approved Tailor (`user_roles: ['customer','tailor']`) successfully accesses both `/api/tailor/orders` AND personal `/api/body-profile` / `/api/orders` from a single authenticated session without client role spoofing. |
| **`P3P5-T14`** | **Suspended/rejected partner retains customer access** | Suspended partner (`operational_status='suspended'`) receives `403 PARTNER_SUSPENDED` on `/api/seller/*` or `/api/tailor/*`, while personal `customer` `/api/orders` and `/api/body-profile` remain accessible. |

---

## 2. Planned Deployment Architecture (`DOC-023`, `P6` Scope Only)

> Note: Deployment & GitHub push occur **only in Phase P6** after `P3`–`P5` pass and `DPY-001`–`DPY-008` are approved.

- **Hosting Target (`DEC-006`):** Vercel (Next.js 15 App Router frontend + serverless Route Handlers) connected to managed **Neon PostgreSQL**.
- **Environment & Secret Configuration (`DPY-002` — Future `P3`/`P6`):**
  - Currently zero `.env*` files exist in the repository (`PH9` frontend-only baseline).
  - For local development (`P3+`), `.env.local` is permitted **only when listed in `.gitignore`**. Never commit `.env*` files to Git and never expose credentials via `NEXT_PUBLIC_*`.
  - Production hosting uses server-side Vercel Environment Variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `VTON_PROVIDER_API_KEY`, private Object Storage credentials `[TECHNICAL DECISION REQUIRED]`). Rotate keys immediately if any credential is ever exposed.
- **Demo Seeding & Offline Venue Resilience (`DPY-004`, `DPY-007`, `RSK-005`):**
  - Idempotent seed script creates Customer (`riya.demo@fitloom.local`), Seller (`Verve Studio`), Tailor (`Atelier Arjun & Co.`), Admin demo accounts, curated products with `numeric(6,1)` measurement charts, and sample orders.
  - Pre-recorded local backup walkthrough + offline demo mode safeguard live Hack N Pitch judging against venue Wi-Fi outages.
- **Deferred Performance Hygiene (`BUG-010`):** Run offline lossless compression on large Hero/Footer raster files (`store-rack.jpg` `2.43 MB`, Hero PNGs `1.39`–`1.65 MB`, Footer PNGs `638`–`890 KB`) before public `P6` deploy while preserving visual transparency and locked `Hero`/`Footer` layout composition.

---

## 3. Active Risk Register Summary (`DOC-024`, Synced with `11_RISK_REGISTER`)

| Risk ID | Risk | Impact / Likelihood | Active Mitigation & Contingency |
| :--- | :--- | :--- | :--- |
| `RSK-001` | IDM-VTON cold starts, rate limits, or high latency | Critical / High | Evaluate providers in `P4` (`DEC-008`); enforce async timeout + explicitly labeled `fallback_demo` (`DEC-005`). |
| `RSK-002` | Hackathon schedule overrun on secondary features | Critical / High | Enforce `PRD.md` Section 4.1 MVP boundary; showcase already-verified frontend workspaces cleanly. |
| `RSK-003` | FE-to-BE DTO mismatch during `P5` integration | High / Medium | Mirror exact field names & Zod schemas from `frontend/src/lib/*` and `docs/DB_AND_API_CONTRACTS.md`. |
| `RSK-004` | Sensitive body photos/data mishandling | High / Medium | Enforce server MIME/magic-byte checks, EXIF stripping, private UUID keys + signed URLs, TTL cleanup, and anonymized demo models. |
| `RSK-005` | Venue Wi-Fi instability during live pitch | High / Medium | Local fallback mode + offline recorded walkthrough (`DPY-007`). |
| `RSK-006` | Unclear team ownership across P3–P6 | Medium / Medium | Assign concrete owners in `09_TEAM` & `DEC-007` before starting `P3`. |

---

## 4. Engineering & Ponytail Coding Guidelines (`DOC-025`, `DEC-002`)

1. **Frontend Is Source of Truth for Validation:** Share pure TypeScript validators & Zod schemas from `frontend/src/lib/*` between UI and `frontend/src/app/api/*`; never duplicate validation logic.
2. **Ponytail Minimalism (`DEC-002`):** Prefer platform primitives (`crypto.randomUUID()`, native `fetch`, Next Route Handlers, Drizzle typed queries) before adding npm packages. Zero `console.log` debug statements or silent `catch` blocks.
3. **Honest Error & AI States (`DEC-005`):** Always badge simulated/fallback responses honestly; preserve explicit Not Found & Role Guard states (`BUG-003`, `BUG-007`).
4. **Preserve Visual Locks (`DEC-003`, `DEC-004`):** Never alter approved Hero artwork/layout or Futuristic Footer composition during backend wiring.
5. **Preserve Owner & Governance Markers:** Keep `[OWNER INPUT REQUIRED]` and `[TECHNICAL DECISION REQUIRED]` explicit until resolved and approved in `FITLOOM_MASTER_PROJECT_TRACKER.xlsx`.
