<p align="center">
  <img src="assets/fitloom-banner.svg" alt="FITLOOM – AI Fashion Intelligence & Fit Calibration" width="100%" />
</p>

<h1 align="center">FITLOOM</h1>

<p align="center">
  <strong>AI Fashion Intelligence & 3D Fit Calibration Platform</strong><br />
  <em>Find Your Fit. Define Your Style. Calibrated for You.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-Hack%20N%20Pitch%20%7C%20E--Summit%20'26-5B3A4A?style=for-the-badge" alt="Hack N Pitch – E-Summit '26" />
  <img src="https://img.shields.io/badge/Team-PARADOX-4E354F?style=for-the-badge" alt="Team PARADOX" />
  <img src="https://img.shields.io/badge/Platform-Full%20Stack%20Fashion%20Tech-D2B3A7?style=for-the-badge" alt="Full Stack Fashion Tech" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-00E599?logo=postgresql" alt="Neon Postgres" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-C5F74F?logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Auth-Better%20Auth-black?logo=auth0" alt="Better Auth" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Testing-Vitest%20(86%20tests)-729B1B?logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/Python-FastAPI%20Engine-009688?logo=fastapi" alt="FastAPI Avatar Engine" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready%20MVP-6633EE" alt="Production Ready MVP" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem We Solve](#-the-problem-we-solve)
- [System Architecture](#-system-architecture)
- [Key Capabilities & Features](#-key-capabilities--features)
  - [1. Anthropometric Body Profile & Fit Calibration](#1-anthropometric-body-profile--fit-calibration)
  - [2. Explainable Fit Intelligence Engine](#2-explainable-fit-intelligence-engine)
  - [3. 3D Avatar Engine & Asset Streaming Proxy](#3-3d-avatar-engine--asset-streaming-proxy)
  - [4. Fashion Marketplace & Eligible Catalogue](#4-fashion-marketplace--eligible-catalogue)
  - [5. Cart & Option B Atomic Checkout Orders](#5-cart--option-b-atomic-checkout-orders)
  - [6. Multi-Role Capability Workspaces (Customer, Seller, Tailor, Admin)](#6-multi-role-capability-workspaces)
  - [7. Style Studio & CUSTOMFIT Made-to-Measure](#7-style-studio--customfit-made-to-measure)
- [Database & API Design](#-database--api-design)
  - [Relational Schema (Drizzle ORM + Neon Postgres)](#relational-schema-drizzle-orm--neon-postgres)
  - [Uniform Response & Error Contracts](#uniform-response--error-contracts)
- [Security, Privacy & Performance](#-security-privacy--performance)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Production Deployment (Vercel + Neon + Tunnel)](#-production-deployment-vercel--neon--tunnel)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Repository Structure](#-repository-structure)
- [Team PARADOX](#-team-paradox)

---

## 🌟 Overview

**FITLOOM** is an AI-powered fashion intelligence, 3D avatar calibration, and bespoke apparel commerce platform built to eliminate sizing guesswork, reduce fashion e-commerce return rates, and bridge the gap between ready-to-wear retail and made-to-measure tailoring.

Unlike traditional platforms that rely on arbitrary S/M/L vanity sizing labels, FITLOOM treats fit as an **exact, explainable geometric science**:
1. It maps a customer's canonical anthropometric body measurements (`0.1 cm` precision).
2. It cross-examines target ease (+5 cm to +15 cm) against garment construction specs and fabric stretch.
3. It visualizes the customer's proportions through an accelerated **3D Avatar Engine** streaming interactive GLB meshes.
4. It enables multi-seller, multi-partner commerce with **Option B atomic split checkouts** powered by Neon PostgreSQL and Drizzle ORM.

---

## ⚡ The Problem We Solve

- **The Vanity Sizing Trap:** A size "M" from Brand A often measures smaller than a size "S" from Brand B, leading to massive customer sizing uncertainty.
- **The E-Commerce Return Crisis:** 30% to 40% of apparel purchased online is returned, primarily due to improper fit and proportion mismatches, creating massive reverse-logistics carbon footprints and inventory depreciation.
- **Static Model Photography:** Conventional product imagery depicts clothes on professional fashion models with pinned backs, providing zero indication of how fabric drapes on real human bodies.
- **Bespoke Disconnect:** Customers whose proportions fall outside standard sizing bell-curves have no clear, verified path to bespoke tailoring.

---

## 🏗️ System Architecture

FITLOOM combines a modern **Next.js 15 App Router** frontend, a type-safe **Neon Serverless PostgreSQL** backend, **Better Auth** session security, and a private **Python FastAPI 3D Avatar Engine** daemon connected through secure tunnels.

```mermaid
flowchart TD
    subgraph Browser["Browser Client (React 19 / Next.js 15)"]
        UI["Tailwind CSS 4 + GSAP + Three.js\nInteractive 3D Avatar & Sizing Canvas"]
        STORE["FitloomProvider Client State\nCart, Sizing & Active Workspace Context"]
    end

    subgraph EdgeBackend["Next.js Route Handlers (Edge / Serverless)"]
        HANDLER["createApiHandler Engine\nCSRF Origin Check · Rate Limiter · 1MB Payload Cap"]
        AUTH_ROUTER["Better Auth Engine\nMulti-Role Capability Engine · HttpOnly Secure Cookies"]
        API_ROUTES["/api/products · /api/fit-check\n/api/cart · /api/orders\n/api/avatar/* (Streaming Proxy)"]
    end

    subgraph DataLayer["Relational Data Layer (Neon Serverless PostgreSQL)"]
        POOL["@neondatabase/serverless Pool\nAtomic Multi-Statement Checkout Transactions"]
        HTTP_DB["Drizzle ORM (neon-http)\n22-Table Type-Safe Relational Schema"]
    end

    subgraph AvatarDaemon["Local GPU Host / Laptop Daemon (Port 8010)"]
        TUNNEL["Cloudflare Tunnel / ngrok\nHTTPS Secure Ingress"]
        FASTAPI["FastAPI 3D Engine\nMesh Deformations · A-Pose / T-Pose GLB Exporter"]
    end

    Browser -->|HTTPS Requests + Cookies| EdgeBackend
    HANDLER --> AUTH_ROUTER
    HANDLER --> API_ROUTES
    API_ROUTES -->|Pooled Transactions| POOL
    API_ROUTES -->|Queries & Mutations| HTTP_DB
    API_ROUTES -->|Authenticated Token Proxy| TUNNEL
    TUNNEL --> FASTAPI
```

---

## 🎯 Key Capabilities & Features

### 1. Anthropometric Body Profile & Fit Calibration
- **Canonical Metric Precision:** Stores body measurements in metric centimeters at `numeric(6,1)` (`0.1 cm` precision) for height, weight, chest, waist, hips, shoulders, sleeve, and inseam.
- **Fit Preference Calibration:** Customizes ease according to shopper preference (`slim`, `regular`, `relaxed`, `oversized`).
- **Audit History:** Logs historical measurement changes for longitudinal tracking and tailoring consultations.

### 2. Explainable Fit Intelligence Engine
- **Algorithmic Ease Calculation:** Evaluates target ease across garment categories (T-Shirts: +5 cm; Regular Shirts: +8 cm; Relaxed/Jackets: +12 cm; Oversized: +15 cm).
- **Zone-by-Zone Verdicts:** Generates clear, non-leaking fit verdicts (`Snug`, `Good fit`, `Slightly loose`) for each critical body zone (chest, waist, shoulders).
- **Confidence Scoring:** Emits a deterministic match score (0–100%) and highlights the recommended size label.

### 3. 3D Avatar Engine & Asset Streaming Proxy
- **Bespoke 3D Deformation:** Generates personal digital avatars based on saved body profiles using a Python FastAPI engine daemon.
- **Streaming Proxy (`/api/avatar/assets/[avatarId]/[file]`):** Next.js acts as an authenticated security proxy streaming GLB assets (`apose.glb`, `tpose.glb`, `measurements.json`) to the Three.js viewport.
- **Ownership Isolation:** Strict ownership validation ensures customers cannot enumerate or view other shoppers' 3D avatars (returns HTTP `404`).
- **Resilient Fallback:** When the engine is offline, `/api/avatar/status` honestly reports HTTP `503`, allowing the frontend to fall back to standard charts gracefully.

### 4. Fashion Marketplace & Eligible Catalogue
- **Verified Garment Catalogue:** 14 seeded products with granular fabric specifications, stretch characteristics, and garment measurement tables (`garment_measurements`).
- **Moderation & Availability:** Active/approved status filtering ensures customers only browse purchasable inventory.
- **Side-by-Side Comparison:** Compare up to 4 garments across fabric composition, stretch ratings, and size dimensions.

### 5. Cart & Option B Atomic Checkout Orders
- **Server-Derived Pricing:** Prices and totals are computed strictly from the database. Client-sent prices are completely ignored.
- **Deterministic Cart Upsert:** Merges matching product+size combinations, clamping quantities strictly between 1 and 10.
- **Option B Multi-Seller Split Orders:** Single customer checkout creates:
  1. One parent `checkout_groups` record linking payment and shipping details.
  2. One child `orders` row per distinct seller partner (`fulfillment_type = 'standard'`).
  3. Immutable historical snapshots in `order_items` (capturing product name, selected size, garment dimensions, and unit price).
- **Atomic SQL Transactions:** Executed inside a single transaction using `@neondatabase/serverless` `Pool` + `drizzle-orm/neon-serverless`. Any failure triggers an automatic rollback with zero orphan rows.
- **Order Lifecycle Management:** Customers can cancel orders in early stages (`Placed`, `Cutting`) with automatic refund allocation, or request returns for `Delivered` orders.

### 6. Multi-Role Capability Workspaces
FITLOOM utilizes an **additive capability model** (`user_roles`) rather than rigid account partitions:
- **Customer Workspace:** Shopping, body profile calibration, order tracking, and virtual fitting.
- **Seller Workspace (`/seller`):** Inventory management, product listing creation, and standard order dispatch.
- **Tailor Workspace (`/tailor`):** Workshop capacity management, custom tailoring quote approvals, and made-to-measure stage advancement.
- **Admin Workspace (`/admin`):** Cross-platform partner verification, catalogue moderation audit logs, and order oversight.

### 7. Style Studio & CUSTOMFIT Made-to-Measure
- **Style Studio (`/studio`):** Mix and match tops, bottoms, and outerwear into unified looks and save them to your personal wardrobe.
- **CUSTOMFIT:** Connects shoppers requiring alterations directly with certified master tailors for bespoke garment crafting.

---

## 🗄️ Database & API Design

### Relational Schema (Drizzle ORM + Neon Postgres)

The platform is backed by a 22-table relational schema structured in `frontend/src/server/db/schema/`:

| Domain | Tables | Key Constraints & Responsibilities |
| :--- | :--- | :--- |
| **Identity & Roles** | `users`, `sessions`, `accounts`, `user_roles` | Better Auth core tables; composite PK `(user_id, role)` for additive multi-capability access. |
| **Partners** | `partners`, `tailor_profiles` | Partner registry; unique `(owner_user_id, type)`; verification lifecycle (`pending_review` -> `verified`). |
| **Body & Sizing** | `body_profiles`, `measurement_history`, `garment_measurements` | Canonical metric dimensions (`numeric(6,1)`); unique `(product_id, size)`. |
| **Catalogue** | `products`, `wishlist_items`, `saved_looks` | Seller-owned catalogue items; moderation status checks; soft-archiving support. |
| **Commerce** | `cart_items`, `checkout_groups`, `orders`, `order_items` | Quantity bounds `[1, 10]`; atomic multi-seller order splitting; check constraints enforcing seller vs tailor fulfillment partitioning. |
| **3D & AI Engine** | `avatars`, `vton_jobs` | User-owned avatar records; random UUID keys; ephemeral TTL cleanup. |
| **Governance** | `admin_audit_logs`, `contact_inquiries` | Append-only governance audit logs for partner approvals and moderation actions. |

### Uniform Response & Error Contracts

All Route Handlers wrap responses in a standardized envelope:

**Success Envelope (`HTTP 200 / 201`):**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error Envelope (`HTTP 4xx / 5xx`):**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR | CART_INVALID | PRODUCT_UNAVAILABLE | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | RATE_LIMITED | SERVICE_UNAVAILABLE | INTERNAL_ERROR",
    "message": "Human-readable explanation for UI banners/toasts",
    "fieldErrors": { "pincode": "Valid 6-digit PIN code required" }
  }
}
```

---

## 🛡️ Security, Privacy & Performance

1. **CSRF & Same-Origin Enforcement:** Every mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) verifies the `Origin` / `Referer` header against `ALLOWED_ORIGINS`.
2. **HttpOnly Secure Session Cookies:** Better Auth cookies enforce `HttpOnly`, `SameSite=Lax`, and `Secure` over HTTPS.
3. **Payload Sanitization & Size Caps:** `createApiHandler` enforces a strict 1MB payload ceiling (`MAX_BODY_BYTES`) before JSON parsing, mitigating memory exhaustion exploits.
4. **Zero-Secret Next.js Build Invariant:** Environment variables are accessed lazily through runtime getters. Running `npm run build` with zero environment variables compiles cleanly with no missing-secret errors.
5. **ID Enumeration Prevention:** Accessing resources owned by another user (e.g. `GET /api/orders/[id]`, `/api/avatar/assets/[avatarId]/[file]`) returns HTTP `404 Not Found` rather than `403 Forbidden`, preventing attacker probing.
6. **Hardened HTTP Response Headers:** Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and Content Security Policy report-only mode.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS recommended)
- **npm:** `v10.x` or later
- **Python:** `3.10+` (optional, only needed for local 3D avatar engine)
- **Neon Account:** A free Neon serverless PostgreSQL branch

### 1. Clone & Enter Frontend Workspace
```bash
git clone https://github.com/mddanish-31/FITLOOM.git
cd FITLOOM/frontend
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Configure Local Environment (`frontend/.env.local`)
Create `frontend/.env.local` (this file is `.gitignore`d):
```bash
# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql://user:password@ep-your-dev-branch-pooler.region.neon.tech/fitloom?sslmode=require"

# Better Auth Configuration (minimum 32 characters)
BETTER_AUTH_SECRET="your-super-secret-random-32-character-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# CORS / CSRF Origin Whitelist
ALLOWED_ORIGINS="http://localhost:3000"

# 3D Avatar Engine Daemon Configuration
AVATAR_SERVICE_URL="http://127.0.0.1:8010"
AVATAR_SERVICE_TOKEN=""
AVATAR_SERVICE_TIMEOUT_MS="5000"
```

### 4. Push Schema & Seed Initial Catalogue
```bash
# Push Drizzle schema to your Neon database
npm run db:push

# Seed verified catalogue products, size charts, and demo partners
npm run db:seed
```

*(To seed only catalogue and partner records without test users in production, use `SEED_CATALOGUE_ONLY=1 npm run db:seed`)*

### 5. Launch the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Production Deployment (Vercel + Neon + Tunnel)

FITLOOM is optimized for deployment on **Vercel** with **Neon Serverless PostgreSQL**.

For the complete deployment guide, environment variable checklist, and 3D avatar tunnel runbook, see:
👉 **[docs/DEPLOY.md](docs/DEPLOY.md)**

### Quick Verification via Smoke Script
Once deployed, run our automated smoke test script from your terminal:
```powershell
./scripts/smoke-deploy.ps1 -BaseUrl "https://your-deployment.vercel.app"
```

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive Vitest suite covering unit logic, route handlers, error boundaries, and database contracts:

```bash
# Run the complete automated test suite
npm run test

# Run TypeScript typechecks
npm run typecheck

# Run Next.js ESLint checks
npm run lint

# Verify zero-secret production build
npm run build
```

**Test Coverage Highlights (86 passing tests):**
- ✅ `tests/cart-orders.test.ts`: Cart upsert, quantity clamping, DB pricing, Option B split transactions, rollback verification, cross-user 404s.
- ✅ `tests/catalogue-fitcheck.test.ts`: Product filtering, category searches, ease calculations, sizing verdicts.
- ✅ `tests/avatar-integration.test.ts`: Avatar generation, sizing endpoints, asset proxy ownership isolation.
- ✅ `tests/handler-errors.test.ts`: 400, 401, 403, 413, 415, 429, 500 status code verification.
- ✅ `tests/origin-csrf.test.ts`: CSRF mutating request blocking and allowed origin verification.
- ✅ `tests/rate-limiter.test.ts`: Sliding-window rate limit thresholding.

---

## 📂 Repository Structure

```text
FITLOOM/
├── assets/                     # Brand logos, banners, and vector assets
├── avatar-engine/              # Python FastAPI 3D Avatar Engine daemon (port 8010)
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint and security headers
│   │   ├── generator.py        # 3D parametric avatar deformation
│   │   └── sizing.py           # Avatar-based garment ease evaluator
│   └── requirements.txt        # Python engine dependencies
├── docs/                       # Architectural specifications & deployment manuals
│   ├── DB_AND_API_CONTRACTS.md # Drizzle ER diagram and REST API contracts
│   ├── DEPLOY.md               # Production Vercel + Neon + Tunnel deployment guide
│   ├── SECURITY_PRIVACY_STORAGE.md # Storage policies, privacy, and error codes
│   └── SYSTEM_ARCHITECTURE.md  # High-level architecture and subsystem boundaries
├── scripts/                    # Automation and deployment verification scripts
│   └── smoke-deploy.ps1        # PowerShell automated deployment smoke test
├── frontend/                   # Next.js 15 App Router application
│   ├── scripts/
│   │   └── seed.ts             # Idempotent database seed (supports SEED_CATALOGUE_ONLY=1)
│   ├── src/
│   │   ├── app/                # App Router pages and API routes
│   │   │   ├── api/            # Server Route Handlers
│   │   │   │   ├── auth/       # Better Auth wildcard handler
│   │   │   │   ├── avatar/     # Avatar status, preset, sizing, dress & streaming proxy
│   │   │   │   ├── body-profile/# Anthropometric customer profile
│   │   │   │   ├── cart/       # /api/cart & /api/cart/[itemId]
│   │   │   │   ├── fit-check/  # /api/fit-check
│   │   │   │   ├── health/     # /api/health
│   │   │   │   ├── orders/     # /api/orders & /api/orders/[id]
│   │   │   │   ├── products/   # /api/products & /api/products/[id]
│   │   │   │   └── users/      # /api/users/me
│   │   │   ├── shop/           # Marketplace catalogue & detail pages
│   │   │   ├── fit-check/      # Interactive fit calibration experience
│   │   │   ├── try-on/         # Virtual try-on room
│   │   │   ├── orders/         # Order tracking timeline
│   │   │   └── seller|tailor|admin # Role workspaces
│   │   ├── components/         # Reusable React UI components
│   │   ├── lib/                # Utility functions, shop calculations, and API client
│   │   └── server/             # Server-only modules
│   │       ├── api/            # createApiHandler, rate limiting & Zod schemas
│   │       ├── auth/           # Better Auth instance and session lifecycle hooks
│   │       ├── avatar/         # Avatar engine client and error mappers
│   │       └── db/             # Drizzle ORM client, transaction runner & schema
│   │           ├── index.ts    # Lazy neon-http database instance
│   │           ├── transaction.ts # Lazy Pool checkout transaction runner
│   │           └── schema/     # Drizzle relational tables (auth, commerce, partners, body, vton)
│   ├── tests/                  # Vitest automated test suite (86 tests)
│   ├── next.config.ts          # Next.js security headers & image optimization
│   └── package.json            # Node.js dependencies and scripts
└── README.md                   # Repository documentation
```

---

## 👥 Team PARADOX

Built with passion for **Hack N Pitch — E-Summit '26, Jadavpur University** by **Team PARADOX**:

- **MD Danish Raza**
- **Soumyadeep Dey**
- **Harshit Raj**
- **Krishnendu Das**

---

<p align="center">
  <strong>FITLOOM</strong> — <em>Find Your Fit. Define Your Style. Calibrated for You.</em>
</p>
