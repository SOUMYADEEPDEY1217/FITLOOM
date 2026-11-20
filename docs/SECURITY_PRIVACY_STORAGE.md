# FITLOOM — Security, Privacy, Storage & Error-Handling Strategy

- **Task Reference:** `FL-P1-007` (`03_DOCUMENTATION`: `DOC-018`, `DOC-019`, `DOC-020`, `DOC-021`)
- **Upstream Controls Mapped:** `auth-validation.ts`, `workspace-config.ts`, `try-on/page.tsx`, `cookie-banner.tsx`, `privacy/page.tsx`, `admin/orders/page.tsx`, `tailor/register/page.tsx`

---

## 1. Security Architecture & Multi-Role Authorization (`DOC-018`)

### 1.1 Current Frontend Showcase Guardrails (`frontend/src/` Verified Baseline)
- Zod input validation on Auth, Body Profile, Checkout, Seller Products, Tailor Profile/Registration, Admin Moderation, and Contact forms.
- Client upload filter in [try-on/page.tsx](../frontend/frontend/src/app/try-on/page.tsx#L40-L185): `ALLOWED_IMAGE_TYPES = {image/jpeg, image/png, image/webp}`, `MAX_IMAGE_SIZE_BYTES = 10 MB`.
- Explicit role separation via `WorkspaceRoleGuard` (never auto-switches role on route navigation) and suspended partner detection (`evaluatePartnerSuspension`).
- Currently zero `.env*` files and zero external secrets exist in the repository (`PH9-A` baseline).

### 1.2 Multi-Role Capability Model & API Permission Matrix (`P3` Planned `BE-003`, `BE-011`)
One authenticated Better Auth `users` account holds **additive capabilities** stored in `user_roles` (`customer` granted at registration; `seller` / `tailor` granted strictly upon Admin approval of linked `partners.owner_user_id`; `admin` provisioned out-of-band only). Client-side UI workspace switching changes **visual navigation state only** and never grants backend permissions.

| Account State / Capabilities | Customer APIs (`/body-profile`, `/cart`, `/orders*`, `/customfit`, `/vton/*`) | Seller APIs (`/seller/products*`, `/seller/orders*`) | Tailor APIs (`/tailor/orders*`, `/tailor/profile`) | Tailor Apply (`/tailor/register`) | Admin APIs (`/admin/*`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Unauthenticated (`guest`)** | `401 Unauthorized` | `401 Unauthorized` | `401 Unauthorized` | `401 Unauthorized` | `401 Unauthorized` |
| **Customer only (`[customer]`)** | **Allowed** (Own data) | `403 Forbidden` | `403 Forbidden` | **Allowed** -> creates `pending_review` (`409` if dup) | `403 Forbidden` |
| **Tailor App Pending / Rejected** | **Allowed** (Customer intact) | `403 Forbidden` | `403 Forbidden` | `409` (if pending) / Re-apply rules | `403 Forbidden` |
| **Approved Tailor (`[customer, tailor]`, Active)** | **Allowed** (Customer intact) | `403 Forbidden` | **Allowed** (Own CUSTOMFIT orders) | `409` (Already active partner) | `403 Forbidden` |
| **Approved Seller (`[customer, seller]`, Active)** | **Allowed** (Customer intact) | **Allowed** (Own products & standard orders) | `403 Forbidden` | **Allowed** (if separate `'tailor'` type permitted) | `403 Forbidden` |
| **Suspended Partner (`operational_status='suspended'`)** | **Allowed** *(Personal shopping intact unless account disabled)* | `403 PARTNER_SUSPENDED` | `403 PARTNER_SUSPENDED` | `403 PARTNER_SUSPENDED` | `403 Forbidden` |
| **Platform Admin (`[admin]`, Isolated)** | Scoped / Separate | `403` (Cannot mutate Seller ops) | `403` (Cannot mutate Tailor ops) | — | **Allowed** (Partner verify/suspend, Mod hide/restore, Read-only order oversight + audit note) |

### 1.3 Mandatory `P3`/`P4` Server Enforcement Rules
1. **Authentication & Sessions (`Better Auth`):** HTTP-only `Secure`, `SameSite=Lax` cookies; bcrypt/argon2 password hashing; never trust client-asserted `user.role`, `userId`, or `partnerId` payloads/headers.
2. **Tailor Onboarding Security Lifecycle:** Guest visitors must sign in/register as a `customer` first; `POST /api/tailor/register` binds `owner_user_id = session.user.id` and forces `verification_status = 'pending_review'`. Only Admin verification (`PATCH /api/admin/partners/[id]`) inserts `'tailor'` into `user_roles` and logs to `admin_audit_logs`.
3. **Seller Order Ownership & Cross-Seller Isolation:** Seller endpoints resolve `seller_partner_id` strictly from `partners.owner_user_id = session.user.id` (`type = 'seller'`, `verification_status = 'verified'`, `operational_status = 'active'`) and filter `orders.fulfillment_type = 'standard' AND orders.seller_partner_id = partnerId`. Seller A attempting access to Seller B's order/item returns `403 FORBIDDEN` without leaking Seller B's customer contact/shipping PII or financials.
4. **Admin Read-Only Order Oversight:** Admin reads across `checkout_groups` + `orders` and appends immutable `admin_audit_logs` notes, with **zero** endpoints allowing Admin to override Seller/Tailor order stages.
5. **Checkout, Pricing & Refund Integrity:** Checkout verifies eligible catalogue (`moderation_status = 'approved'`, `status = 'active'`, active Seller), cart qty `[1, 10]`, CUSTOMFIT `quote_approved = true`, recalculates prices strictly from DB inside `drizzle.transaction`, and binds one parent payment reference on `checkout_groups` with per-order `allocated_amount_inr` & `refunded_amount_inr` guards (`refunded <= total_inr`).

### 1.4 Environment Variable & Secret Management Rules (`DPY-002`)
- **Never commit `.env*` secrets to Git:** Ensure `.env`, `.env.local`, `.env.*.local`, and service keys remain `.gitignore`d cleanly.
- **Never expose secrets via `NEXT_PUBLIC_*`:** Only safe non-sensitive public URLs or feature flags may carry `NEXT_PUBLIC_` prefixes; `DATABASE_URL`, `BETTER_AUTH_SECRET`, object storage access keys, and `VTON_PROVIDER_API_KEY` are strictly server-only runtime variables.
- **Local vs. Production Environments:** `.env.local` is permitted for local developer workflows **only when Git-ignored**; deployed environments (`Vercel` in `P6`) inject secrets through encrypted platform Environment Variables.
- **Credential Rotation:** Immediately revoke and rotate any API key, DB credential, or signing secret if accidental disclosure occurs.

---

## 2. Private Object Storage, Upload Validation & Body-Data Privacy (`DOC-019`, `DOC-020`, `RSK-004`)

| Data Asset | Current State (`PH9` Frontend) | Planned `P3`/`P4` Private Storage & Privacy Controls | Open Governance Dependency |
| :--- | :--- | :--- | :--- |
| **User VTON Uploads & Outputs** | Browser `File` check (`JPEG`/`PNG`/`WebP`, `<= 10 MB`) + ephemeral `URL.createObjectURL` revoked on remove/unmount; zero external upload. | 1. **Private Object Bucket Only:** Never store user body photos or generated results on public permanent CDN URLs (`[TECHNICAL DECISION REQUIRED: Cloudflare R2 / AWS S3 / Vercel Blob private]`).<br>2. **Validation & Sanitization:** Verify binary magic bytes + MIME, enforce `<= 10 MB` (`413`) and JPEG/PNG/WebP (`415`), **strip EXIF metadata** (`AI-004`) before persistence.<br>3. **Non-Guessable Keys & Signed URLs:** Store under random UUID keys (`vton/raw/{uuid}`, `vton/out/{uuid}`). Serve results solely via **short-lived pre-signed URLs** verified against `session.user.id === vton_jobs.user_id`.<br>4. **Separate TTL Cleanup:** Auto-purge raw uploaded user photos promptly after inference completion/failure; purge generated output images independently per retention schedule. | `[OWNER INPUT REQUIRED: Legal Retention Schedule]` (explicit TTL windows for raw user uploads vs. generated VTON images) |
| **Body Measurements (`BodyProfile`) & `measurement_history`** | In-memory React state (`FitloomProvider`), plus 5-entry `{ date, chestCm, waistCm, note }` rolling log; wiped on hard reload/close. | Stored canonically in `cm` (`numeric(6,1)`) in Neon Postgres (TLS in transit + encryption at rest); scoped to authenticated owner; CUSTOMFIT `measurements_snapshot` visible solely to owning customer, assigned `tailor_partner_id`, and Admin oversight read view. | `[OWNER INPUT REQUIRED: Minimum Age Disclosure, Data Controller Entity, Grievance Officer Email]` |
| **Cookie Preferences** | Category-granular consent (`essential: true`, `analytics`, `personalization`) in `localStorage`, re-openable via Footer `COOKIE SETTINGS`. | No optional telemetry/analytics scripts load unless explicit opt-in consent is present. | `[OWNER INPUT REQUIRED: Approved Sub-Processor List]` |

---

## 3. Uniform Error-Handling & Resilience Strategy (`DOC-021`)

### 3.1 Verified UI Boundaries
- **404 Not Found ([not-found.tsx](../frontend/frontend/src/app/not-found.tsx)):** Branded recovery links `/` and `/shop` (verified HTTP `404` on unknown routes).
- **Runtime Boundary ([error.tsx](../frontend/frontend/src/app/error.tsx)):** Recoverable `reset()` retry + `/` home link without crashing root layout.
- **Invalid Detail Slugs (`BUG-003` Fixed):** `/shop/[id]`, `/orders/[id]`, `/tailor/orders/[id]` render dedicated inline Not Found recovery cards.

### 3.2 Standardized Backend API Error Envelope (`BE-011`)
All `P3`/`P4` Route Handlers must return structured, non-leaking JSON errors:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | PARTNER_SUSPENDED | PARTNER_APPLICATION_EXISTS | NOT_FOUND | CART_INVALID | QUOTE_UNAPPROVED | MIXED_CART_NOT_SUPPORTED | UNSUPPORTED_MEDIA_TYPE | PAYLOAD_TOO_LARGE | RATE_LIMITED | VTON_TIMEOUT | INTERNAL_ERROR",
    "message": "Human-readable action message for UI banner/toast",
    "fieldErrors": { "chestCm": "Chest must be between 70 and 150 cm" }
  }
}
```
