<p align="center">
  <img src="assets/fitloom-banner.svg" alt="FITLOOM – AI Fashion Intelligence & Fit Calibration" width="100%" />
</p>

<h1 align="center">FITLOOM</h1>

<p align="center">
  <strong>AI Fashion Intelligence & Fit Calibration Platform</strong><br />
  <em>Find Your Fit. Define Your Style.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-Hack%20N%20Pitch%20%7C%20E--Summit%20'26-5B3A4A?style=for-the-badge" alt="Hack N Pitch – E-Summit '26" />
  <img src="https://img.shields.io/badge/Team-PARADOX-4E354F?style=for-the-badge" alt="Team PARADOX" />
  <img src="https://img.shields.io/badge/Platform-Fashion%20Tech-D2B3A7?style=for-the-badge" alt="Fashion Tech" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/GSAP-Animation-88CE02?logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/Status-Hackathon%20Prototype-6633EE" alt="Hackathon prototype" />
</p>

---

## Overview

**FITLOOM** is an AI-powered fashion intelligence and fit-calibration platform designed to make online apparel shopping more personal, transparent, and confidence-driven.

Choosing clothes online should be about more than selecting a size label. Different brands use different sizing standards, garments behave differently depending on their construction and fabric, and product photographs rarely explain how an item will fit an individual.

FITLOOM brings together **measurement-based Fit Intelligence**, **AI-assisted Virtual Try-On**, and **personalized fashion discovery** in one connected experience. It helps shoppers understand how a garment may fit, explore how it could look, discover styles that suit them, and move from standard sizing towards customization.

> **Our idea:** combine visual fashion exploration with explainable, measurement-grounded fit guidance—so shoppers can make more informed decisions before they buy.

---

## The Problem

Online fashion shopping still leaves customers answering important questions with guesswork:

- **Unreliable size labels:** A medium in one brand may fit very differently from a medium in another.
- **Limited fit information:** Product images show a garment on a model, but do not explain how it may fit a shopper's own proportions.
- **Uncertain purchase decisions:** Customers often order multiple sizes, abandon purchases, or return products because the fit was not what they expected.
- **Limited personalization:** Generic recommendations rarely account for body measurements, preferred ease, garment dimensions, or fabric behaviour.
- **The gap between ready-made and made-to-measure:** Shoppers who do not fit standard size charts need a clearer path to customization and tailoring.

---

## Our Solution

FITLOOM connects a shopper's body profile, garment information, fit preferences, and visual exploration into a unified fashion experience:

1. **Measure:** Build a structured body profile using key measurements and preferred fit.
2. **Understand fit:** Compare body measurements with garment dimensions, cut, and fabric-related ease to generate a size recommendation with zone-level guidance.
3. **Visualize:** Explore an AI-assisted virtual try-on experience to get a visual reference for an outfit.
4. **Discover:** Explore products, compare garments, create outfits, and save looks.
5. **Customize:** Move beyond standard size labels with CUSTOMFIT and a tailor-oriented workflow.

---

## Core Features

### 1. Body Profile & Fit Calibration

Create a structured body profile with measurements such as:

- Height & weight
- Chest, Waist, Hips
- Shoulder width
- Sleeve & inseam length
- Preferred fit and ease (`slim`, `regular`, `relaxed`, `oversized`)

The interface supports centimetre/inch (`cm` / `in`) measurement units, Smart Estimate helpers, and guided measurement entry. Input validation is handled with Zod.

### 2. Fit Intelligence Engine

FITLOOM's central differentiator is its measurement-grounded approach to garment fit.

Instead of relying only on a generic S/M/L label, the Fit Intelligence experience is designed to compare a shopper's measurements with garment-specific size information and fit characteristics.

It provides:

- Recommended garment size
- Fit-confidence and verdict indication
- Zone-wise fit guidance for areas such as chest and waist
- Tight, ideal, or loose fit observations (`Snug`, `Good fit`, `Slightly loose`)
- Fit context informed by garment dimensions, cut, fabric behaviour, and the shopper's preferred ease

### 3. AI-Assisted Virtual Try-On

The Virtual Try-On experience is designed to help shoppers visually explore how an outfit may look on them:

- Guided image-upload interface
- Virtual fitting-room workflow
- Preview experience with clear demo-state disclosure
- Architecture intended to support an IDM-VTON-based inference integration

**Prototype transparency:** the current repository includes a simulated preview workflow. It does not claim that live AI inference is running in the current demo.

### 4. Fashion Discovery & Customer Marketplace

Explore a fashion catalogue through an authenticated Marketplace experience (`/shop`) with an on-demand left navigation drawer:

- Product catalogue and protected product detail pages (`/shop/[id]`)
- Live search, category filters (`Shirts`, `Outerwear`, `Trousers`, `T-Shirts`), and fit-type filters
- Garment specifications and size-chart presentation
- Side-by-side product comparison (`/compare`)
- Wishlist and saved-product interactions

### 5. Style Studio & Saved Looks

Build and organize outfit combinations in one place:

- Combine outfit categories such as tops, bottoms, and outerwear
- Explore coordinated looks
- Save outfit combinations
- Revisit saved looks through a dedicated gallery (`/saved-looks`)

### 6. CUSTOMFIT & Multi-Role Workspaces

FITLOOM extends the shopping journey towards made-to-measure fashion and partner operations:

- **CUSTOMFIT (`/customfit`):** Made-to-measure request and configuration experience with customer measurement snapshots.
- **Tailor Workspace (`/tailor*`):** Order queue, customer measurement specs, stage progression, and workshop profile management.
- **Seller Workspace (`/seller*`):** Product catalogue management and standard order fulfillment.
- **Admin Workspace (`/admin*`):** Partner oversight, catalogue moderation, and order monitoring.

### 7. Customer Shopping & Authentication Experience

- Split-screen 3D animated `/login` and `/signup` pages with `?next=` destination preservation
- Route-level access protection (`AuthRouteGuard`) restricting product details, cart, wishlist, and workspaces to authenticated sessions
- Separate Customer Dashboard (`/dashboard`), Cart, Checkout, and Order Timeline (`/orders`, `/orders/[id]`)
- Public informational and policy pages (`/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, `/returns`, `/shipping`)

---

## What Makes FITLOOM Different?

| Typical online fashion experience | FITLOOM approach |
| --- | --- |
| Depends heavily on standard size labels | Uses body measurements and garment-specific dimensions |
| Shows product images without personalized fit context | Connects visual exploration with fit guidance |
| Gives limited explanation for size choices | Aims to provide zone-level, explainable fit observations |
| Offers generic product discovery | Connects discovery with personal fit preferences and saved outfits |
| Treats customization as a separate journey | Connects fit needs to a CUSTOMFIT and tailor workflow |

---

## Frontend Visual Architecture

### Application Shell & Rendering Model

The application uses **Next.js 15 App Router** with two distinct rendering shells that wrap every authenticated route and workspace.

```
┌─────────────────────────────────────────────────────────────┐
│                    RootLayout (layout.tsx)                   │
│         LenisProvider  ·  FitloomProvider (global state)    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   AuthRouteGuard                       │  │
│  │  ┌──────────────────────┐  ┌────────────────────────┐  │  │
│  │  │   Landing Shell      │  │  Customer App Shell    │  │  │
│  │  │  HeroNavbar          │  │  Navbar + Sidebar      │  │  │
│  │  │  FitloomHero         │  │  customer-app-shell    │  │  │
│  │  │  Home sections       │  │  /shop  /dashboard     │  │  │
│  │  │  Footer              │  │  /cart  /fit-check …   │  │  │
│  │  └──────────────────────┘  └────────────────────────┘  │  │
│  │  ┌──────────────────────┐  ┌────────────────────────┐  │  │
│  │  │   Auth Shell         │  │  Workspace Shell       │  │  │
│  │  │  AuthSplitShowcase   │  │  WorkspaceShell        │  │  │
│  │  │  /login  /signup     │  │  WorkspaceSubnav       │  │  │
│  │  │  /auth/*             │  │  /seller  /tailor      │  │  │
│  │  └──────────────────────┘  │  /admin                │  │  │
│  │                            └────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### Page Route Map (42 Pages)

```
frontend/src/app/
│
├── page.tsx                         /           ← Landing page
│
├── shop/
│   ├── page.tsx                     /shop        ← Product catalogue (public list)
│   └── [id]/page.tsx                /shop/[id]   ← Product detail (auth required)
│
├── body-profile/page.tsx            /body-profile
├── fit-check/page.tsx               /fit-check
├── try-on/page.tsx                  /try-on
├── studio/page.tsx                  /studio
├── customfit/page.tsx               /customfit
├── saved-looks/page.tsx             /saved-looks
├── compare/page.tsx                 /compare
├── wishlist/page.tsx                /wishlist
│
├── dashboard/page.tsx               /dashboard
├── cart/page.tsx                    /cart
├── checkout/page.tsx                /checkout
├── account/page.tsx                 /account
├── orders/
│   ├── page.tsx                     /orders
│   └── [id]/page.tsx                /orders/[id]
│
├── login/page.tsx                   /login       ← Legacy login
├── signup/page.tsx                  /signup      ← Legacy signup
├── auth/
│   ├── login/page.tsx               /auth/login
│   ├── register/page.tsx            /auth/register
│   └── forgot-password/page.tsx     /auth/forgot-password
│
├── seller/
│   ├── page.tsx                     /seller
│   ├── products/page.tsx            /seller/products
│   └── orders/page.tsx              /seller/orders
│
├── tailor/
│   ├── page.tsx                     /tailor
│   ├── register/page.tsx            /tailor/register  ← Public
│   ├── orders/
│   │   ├── page.tsx                 /tailor/orders
│   │   └── [id]/page.tsx            /tailor/orders/[id]
│   └── profile/page.tsx             /tailor/profile
│
├── admin/
│   ├── page.tsx                     /admin
│   ├── catalogue/page.tsx           /admin/catalogue
│   ├── orders/page.tsx              /admin/orders
│   └── partners/page.tsx            /admin/partners
│
├── about/page.tsx                   /about
├── how-it-works/page.tsx            /how-it-works
├── faq/page.tsx                     /faq
├── contact/page.tsx                 /contact
├── privacy/page.tsx                 /privacy
├── terms/page.tsx                   /terms
├── returns/page.tsx                 /returns
└── shipping/page.tsx                /shipping
```

---

### Role-Based Access Control (RBAC) Model

Five user roles control every route, enforced client-side by `AuthRouteGuard` via `auth-routes.ts`:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FITLOOM Role Matrix                         │
├──────────┬──────────────────────────────────────────────────────────┤
│  ROLE    │  ACCESSIBLE ROUTE CATEGORIES                             │
├──────────┼──────────────────────────────────────────────────────────┤
│  guest   │  Public only: / · /shop · /login · /signup · /auth/*    │
│          │  /about · /how-it-works · /faq · /contact · /privacy    │
│          │  /terms · /returns · /shipping · /tailor/register        │
├──────────┼──────────────────────────────────────────────────────────┤
│ customer │  Public  +  Customer hub: /dashboard · /account          │
│          │  /body-profile · /fit-check · /try-on · /studio          │
│          │  /customfit · /cart · /checkout · /wishlist · /compare   │
│          │  /saved-looks · /orders · /orders/[id] · /shop/[id]      │
├──────────┼──────────────────────────────────────────────────────────┤
│  seller  │  Public  +  Customer hub  +  Seller workspace:           │
│          │  /seller · /seller/products · /seller/orders             │
├──────────┼──────────────────────────────────────────────────────────┤
│  tailor  │  Public  +  Customer hub  +  Tailor workspace:           │
│          │  /tailor · /tailor/orders · /tailor/orders/[id]          │
│          │  /tailor/profile                                          │
├──────────┼──────────────────────────────────────────────────────────┤
│  admin   │  ALL routes — full platform oversight                     │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

### Component Architecture

```
frontend/src/components/
│
├── providers/                 Global runtime providers
│   ├── fitloom-provider.tsx   FitloomContext — in-memory state (role, cart, wishlist…)
│   └── lenis-provider.tsx     Smooth scroll (Lenis)
│
├── auth/                      Authentication UI
│   ├── AuthRouteGuard.tsx     Route protection — reads role, redirects unauthorised
│   ├── AuthShell.tsx          Wrapper for auth form pages
│   ├── AuthSplitShowcase.tsx  Split-screen animated login/signup layout
│   └── PasswordInput.tsx      Reusable password field with reveal toggle
│
├── hero/                      Landing page hero section
│   ├── FitloomHero.tsx        Root hero orchestrator (GSAP scroll-driven)
│   ├── HeroNavbar.tsx         Landing-only transparent nav
│   ├── BrandBackdrop.tsx      Parallax editorial background
│   ├── HeroContent.tsx        Headline, tagline, CTA block
│   ├── HeroActions.tsx        Primary/secondary CTA buttons
│   ├── HeroModels.tsx         Fashion model imagery
│   ├── HeroFeatureStrip.tsx   Feature pills strip
│   └── OutfitSelector.tsx     Interactive outfit picker overlay
│
├── home/                      Home page marketing sections
│   ├── BrandIntroSection.tsx
│   ├── FitIntelligenceSection.tsx
│   ├── BodyProfileSection.tsx
│   ├── VirtualTryOnSection.tsx
│   ├── DiscoveryCarouselSection.tsx
│   ├── CustomFitSection.tsx
│   ├── HowItWorksSection.tsx
│   ├── TrustVerificationSection.tsx
│   ├── FaqPreviewSection.tsx
│   └── FinalCtaSection.tsx
│
├── layout/                    Persistent shell & navigation
│   ├── main-shell.tsx         Root layout wrapper
│   ├── navbar.tsx             Authenticated top navigation bar
│   ├── customer-app-shell.tsx Sidebar + content area for customer routes
│   ├── footer.tsx             Global footer
│   ├── nav-config.ts          Navigation link configuration
│   ├── mobile-nav-drawer.tsx  Slide-out mobile nav (authenticated)
│   ├── landing-mobile-drawer.tsx  Landing page mobile menu
│   └── cookie-banner.tsx      GDPR-style cookie consent banner
│
├── body-profile/
│   └── DigitalAvatarPreview.tsx  Measurement avatar visualisation
│
├── shop/
│   └── ProductCard.tsx        Reusable product listing card
│
├── workspace/                 Shared partner workspace primitives
│   ├── WorkspaceShell.tsx     Workspace page container
│   ├── WorkspaceSubnav.tsx    Workspace-level navigation tabs
│   ├── WorkspaceRoleGuard.tsx Role enforcement within workspace
│   ├── WorkspaceConfirmDialog.tsx Destructive action confirmation modal
│   └── WorkspaceAccessDenied.tsx  403 denial screen
│
├── public/                    Reusable public page components
│   ├── PublicPageHero.tsx     Shared hero for informational pages
│   ├── PolicyPageLayout.tsx   Legal/policy page wrapper
│   ├── TrustTransparencySection.tsx  Trust signals block
│   └── OpenCookieSettingsButton.tsx  Cookie settings trigger
│
└── ui/                        Design-system primitives (shadcn-style)
    ├── button.tsx
    ├── badge.tsx
    ├── card.tsx
    ├── input.tsx
    ├── tabs.tsx
    ├── toast.tsx
    └── segmented-control.tsx
```

---

### Data & State Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     FitloomProvider                          │
│               (React Context — in-memory state)              │
│                                                              │
│  mockRole: guest | customer | seller | tailor | admin        │
│  cart: CartItem[]          wishlist: Product[]               │
│  bodyProfile: Measurements savedLooks: Outfit[]              │
│  fitCheckResult: FitResult orders: Order[]                   │
│  customfitRequest: Request notifications: Notification[]     │
└──────────────┬───────────────────────────────────────────────┘
               │  consumed by any client component via useContext
               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Utility Libraries  (frontend/src/lib/)  │
├─────────────────────────┬────────────────────────────────────┤
│  auth-routes.ts         │  Route classification & RBAC logic │
│  workspace-config.ts    │  Workspace definitions (nav, roles)│
│  mock-data.ts           │  Products, orders, users (fixtures)│
│  shop-utils.ts          │  Filter, search, sort helpers      │
│  fit-intelligence-utils │  Fit scoring & zone verdict logic  │
│  body-profile-utils     │  Measurement conversion & validate │
│  checkout-utils         │  Cart totals & order assembly      │
│  studio-utils           │  Outfit combination helpers        │
│  customfit-utils        │  CUSTOMFIT request builders        │
│  compare-wishlist-utils │  Product comparison helpers        │
│  seller-workspace-utils │  Seller dashboard helpers          │
│  tailor-workspace-utils │  Tailor order & stage helpers      │
│  admin-workspace-utils  │  Admin oversight helpers           │
│  public-pages-utils     │  Informational page content        │
│  route-metadata.ts      │  Page titles & SEO metadata        │
│  utils.ts               │  cn() and shared utilities         │
└─────────────────────────┴────────────────────────────────────┘
               │
               │  mock data (no live DB in prototype)
               ▼
┌──────────────────────────────────────────────────────────────┐
│               Planned Production Data Layer                  │
│  Neon PostgreSQL  ·  Drizzle ORM  ·  Better Auth            │
│         Next.js Route Handlers  ·  Server Actions            │
└──────────────────────────────────────────────────────────────┘
```

---

### High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Browser — Next.js 15 App Router"]
        LP["Landing Page\n/ (page.tsx)"]
        AUTH["Auth Pages\n/login · /signup · /auth/*"]
        CUST["Customer Experience\n/shop · /dashboard · /cart\n/body-profile · /fit-check\n/try-on · /studio · /customfit"]
        WS["Partner Workspaces\n/seller* · /tailor* · /admin*"]
        PUB["Public Pages\n/about · /faq · /how-it-works\n/privacy · /terms · …"]
    end

    subgraph Providers["Global Providers (layout.tsx)"]
        FP["FitloomProvider\nIn-memory state"]
        LP2["LenisProvider\nSmooth scroll"]
        ARG["AuthRouteGuard\nRBAC enforcement"]
    end

    subgraph LibLayer["frontend/src/lib/ — Utility & Logic Layer"]
        AR["auth-routes.ts"]
        WC["workspace-config.ts"]
        MD["mock-data.ts"]
        FI["fit-intelligence-utils.ts"]
        SH["shop-utils.ts"]
    end

    subgraph PlannedBackend["Planned Backend (not yet connected)"]
        RH["Next.js Route Handlers\n& Server Actions"]
        DB[("Neon PostgreSQL\n+ Drizzle ORM")]
        BA["Better Auth\nSession management"]
        AI["IDM-VTON\nVirtual try-on inference"]
    end

    Client --> Providers
    Providers --> LibLayer
    LibLayer --> MD

    CUST -. "Intended" .-> RH
    WS -. "Intended" .-> RH
    RH -. "Intended" .-> DB
    RH -. "Intended" .-> BA
    CUST -. "Intended AI" .-> AI
```

---

### Landing Page Composition

The home page (`/`) is composed of layered sections assembled in `page.tsx`:

```mermaid
flowchart TD
    ROOT["page.tsx (/)"]
    ROOT --> H["FitloomHero\n(GSAP scroll-driven)"]
    ROOT --> BI["BrandIntroSection"]
    ROOT --> FIS["FitIntelligenceSection"]
    ROOT --> BP["BodyProfileSection"]
    ROOT --> VTO["VirtualTryOnSection"]
    ROOT --> DC["DiscoveryCarouselSection"]
    ROOT --> CF["CustomFitSection"]
    ROOT --> HIW["HowItWorksSection"]
    ROOT --> TV["TrustVerificationSection"]
    ROOT --> FAQ["FaqPreviewSection"]
    ROOT --> CTA["FinalCtaSection"]

    H --> HN["HeroNavbar"]
    H --> BB["BrandBackdrop"]
    H --> HC["HeroContent"]
    H --> HA["HeroActions"]
    H --> HM["HeroModels"]
    H --> HFS["HeroFeatureStrip"]
    H --> OS["OutfitSelector"]
```

---

### User Journey Flow

```mermaid
flowchart LR
    GUEST["Guest\nVisitor"]
    GUEST -->|browse| LAND["Landing /"]
    GUEST -->|sign up| AUTH["Auth Flow\n/login · /signup"]
    AUTH -->|authenticated| CUST_HUB["Customer Hub"]

    CUST_HUB --> SHOP["/shop\nBrowse catalogue"]
    CUST_HUB --> BP["/body-profile\nEnter measurements"]
    SHOP --> PDP["/shop/[id]\nProduct detail"]
    BP --> FC["/fit-check\nFit Intelligence"]
    FC --> TRY["/try-on\nVirtual Try-On"]
    TRY --> STU["/studio\nStyle Studio"]
    STU --> SL["/saved-looks\nSaved outfits"]
    PDP --> CART["/cart"]
    CART --> CHK["/checkout"]
    CHK --> ORD["/orders/[id]\nOrder timeline"]
    PDP --> CF["/customfit\nMade-to-measure"]
    CF -->|routed to| TW["Tailor Workspace\n/tailor/orders/[id]"]

    GUEST -->|partner sign-up| TR["/tailor/register"]
    TR -->|approved| TW

    AUTH -->|seller login| SW["Seller Workspace\n/seller"]
    AUTH -->|admin login| AW["Admin Workspace\n/admin"]
```

---

### Technology Stack

#### Frontend (live in prototype)

| Technology | Version | Purpose |
| --- | --- | --- |
| [Next.js](https://nextjs.org/) | 15 | App Router, SSR/RSC framework |
| [React](https://react.dev/) | 19 | Component model |
| [TypeScript](https://www.typescriptlang.org/) | 5.7 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [GSAP](https://gsap.com/) | 3.12 | Scroll-driven animation (hero) |
| [Lenis](https://lenis.darkroom.engineering/) | 1.1 | Smooth inertia scrolling |
| [Lucide React](https://lucide.dev/) | — | Icon system |
| [Zod](https://zod.dev/) | 3.24 | Schema & form validation |
| [class-variance-authority](https://cva.style/) | 0.7 | Component variant API |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | Conflict-free utility classes |

#### Planned Service Integrations (not yet connected)

| Technology | Intended purpose |
| --- | --- |
| Next.js Route Handlers & Server Actions | Application APIs and server-side operations |
| [Neon PostgreSQL](https://neon.tech/) | Managed relational database |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database layer |
| [Better Auth](https://www.better-auth.com/) | Authentication & session management |
| IDM-VTON | Virtual try-on inference engine |
| [Vercel](https://vercel.com/) | Hosting & deployment |

---

## Application Routes

The current frontend contains **42 App Router pages**:

| Area | Routes |
| --- | --- |
| **Landing** | `/` |
| **Discovery & Shopping** | `/shop`, `/shop/[id]`, `/compare`, `/wishlist` |
| **Fit & Personalization** | `/body-profile`, `/fit-check`, `/studio`, `/try-on`, `/saved-looks`, `/customfit` |
| **Customer Hub** | `/dashboard`, `/cart`, `/checkout`, `/orders`, `/orders/[id]`, `/account` |
| **Authentication** | `/login`, `/signup`, `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| **Tailor Workspace** | `/tailor`, `/tailor/register`, `/tailor/orders`, `/tailor/orders/[id]`, `/tailor/profile` |
| **Seller Workspace** | `/seller`, `/seller/products`, `/seller/orders` |
| **Admin Workspace** | `/admin`, `/admin/catalogue`, `/admin/orders`, `/admin/partners` |
| **Public Information** | `/about`, `/how-it-works`, `/faq`, `/contact`, `/privacy`, `/terms`, `/returns`, `/shipping` |

---

## Current Prototype Status

To keep the project transparent, the current implementation should be understood as a **frontend prototype**, not a fully deployed production platform:

- The 42-page Next.js interface is implemented in the repository.
- Product, account, order, and other demonstration data are supplied through local mock fixtures (`frontend/src/lib/mock-data.ts`).
- `FitloomProvider` manages client-side in-memory state for the demo experience.
- `AuthRouteGuard` enforces client-side route boundaries across guest, customer, seller, tailor, and admin demo roles.
- Zod is used for relevant data and form validation.
- Persistent database storage, production authentication, live backend APIs, and live IDM-VTON inference are not yet connected.

This distinction is intentional: the interface demonstrates the product journey while planned integrations remain clearly identified as future engineering work.

---

## Repository Structure

```text
FITLOOM_updated/
├── assets/
│   └── fitloom-banner.svg
├── backend/                  ← Reserved for planned backend APIs & DB layer
├── ai-ml/                    ← Reserved for planned VTON & fit inference services
├── avatar-engine/            ← Reserved for planned 3D avatar engine integration
├── docs/
│   ├── AI_AND_FIT_SPEC.md
│   ├── DB_AND_API_CONTRACTS.md
│   ├── PRD.md
│   ├── QA_DEPLOY_GUIDELINES.md
│   ├── REQUIREMENTS.md
│   ├── SECURITY_PRIVACY_STORAGE.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── UX_IA_SPEC.md
├── planning/
│   ├── DECISIONS.md
│   ├── EXECUTION_RULES.md
│   ├── MASTER_TRACKER_GUIDE.md
│   ├── PHASE_APPROVAL_CHECKLIST.md
│   ├── PROJECT_ROADMAP.md
│   ├── PROJECT_STATUS.md
│   └── TEAM_RESPONSIBILITIES.md
├── Research/
│   ├── Fit_Intelligence_Research.md
│   ├── Fit_Scoring_Methodology.md
│   ├── MODEL_COMPARISON.md
│   ├── PERFORMANCE_ANALYSIS.md
│   ├── Test_Cases.md
│   ├── VTON_RESEARCH.md
│   └── measurement_Schema.md
├── frontend/                 ← Standalone Next.js 15 frontend application
│   ├── public/
│   │   └── assets/
│   │       ├── hero/
│   │       ├── footer/
│   │       └── products/
│   ├── src/
│   │   ├── app/              ← 42 Next.js App Router pages
│   │   │   ├── page.tsx      ← Landing
│   │   │   ├── shop/
│   │   │   ├── body-profile/
│   │   │   ├── fit-check/
│   │   │   ├── try-on/
│   │   │   ├── studio/
│   │   │   ├── customfit/
│   │   │   ├── dashboard/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── wishlist/
│   │   │   ├── compare/
│   │   │   ├── saved-looks/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── auth/
│   │   │   ├── seller/
│   │   │   ├── tailor/
│   │   │   ├── admin/
│   │   │   └── about|faq|how-it-works|contact|privacy|terms|…
│   │   ├── components/       ← UI component library
│   │   │   ├── auth/
│   │   │   ├── hero/
│   │   │   ├── home/
│   │   │   ├── layout/
│   │   │   ├── providers/
│   │   │   ├── body-profile/
│   │   │   ├── shop/
│   │   │   ├── workspace/
│   │   │   ├── public/
│   │   │   └── ui/
│   │   └── lib/              ← Utility, logic & mock-data layer
│   │       ├── auth-routes.ts
│   │       ├── workspace-config.ts
│   │       ├── mock-data.ts
│   │       ├── fit-intelligence-utils.ts
│   │       ├── body-profile-utils.ts
│   │       ├── shop-utils.ts
│   │       ├── studio-utils.ts
│   │       ├── customfit-utils.ts
│   │       ├── checkout-utils.ts
│   │       ├── compare-wishlist-utils.ts
│   │       ├── seller-workspace-utils.ts
│   │       ├── tailor-workspace-utils.ts
│   │       ├── admin-workspace-utils.ts
│   │       ├── public-pages-utils.ts
│   │       ├── route-metadata.ts
│   │       └── utils.ts
│   ├── next.config.ts
│   ├── components.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- Git

### 1. Clone the repository & enter the frontend workspace

```bash
git clone <YOUR_REPOSITORY_URL>
cd FITLOOM_updated/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts (run inside `frontend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint checks |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |

> **Environment variables:** the current frontend prototype does not require database credentials, authentication secrets, or AI provider API keys to run.

---

## Team PARADOX

FITLOOM is developed by **Team PARADOX** for **Hack N Pitch — E-Summit '26, Jadavpur University**.

| Team Member |
| --- |
| **MD Danish Raza** |
| **Soumyadeep Dey** |
| **Harshit Raj** |
| **Krishnendu Das** |

---

## Vision

We envision a fashion-shopping experience where customers do not have to guess their size, rely only on generic recommendations, or compromise because standard sizing does not reflect their body.

FITLOOM aims to bring **fit intelligence, visual confidence, personal style, and made-to-measure possibilities** into one connected platform.

**Find Your Fit. Define Your Style.**

---

## Acknowledgements

Built for **Hack N Pitch — E-Summit '26, Jadavpur University** by Team PARADOX.

We acknowledge the open-source communities and projects that support the FITLOOM prototype, including Next.js, React, TypeScript, Tailwind CSS, GSAP, Lenis, Lucide, and Zod, along with the research community behind virtual try-on technologies such as IDM-VTON.

## License

No open-source license has been assigned to this repository yet. All rights remain with the project authors unless a license is added.
