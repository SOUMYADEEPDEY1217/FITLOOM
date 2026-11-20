# FITLOOM Project Roadmap

**Project:** FITLOOM — AI Fashion Intelligence & Fit Calibration Platform  
**Event:** Hack N Pitch — E-Summit '26, Jadavpur University  

---

## 1. Approved Sequential Execution Order (Phases 0–6)

All work must follow this exact sequence. No phase may begin until the previous phase passes its explicit review and approval gate.

1. **Phase 0 — README & Project Identity:** `README.md`, animated SVG banner, problem/vision, stack/architecture preview, team roster.
2. **Phase 1 — Complete Technical Documentation:** PRD, requirements, personas/journeys, IA, system/FE/BE/DB/AI/security/privacy/storage/deployment architecture, ER diagrams, API contracts, Fit Intelligence spec, QA/risk/dev guidelines.
3. **Phase 2 — Complete Frontend (Mock State Only):** All 20 frontend modules, `RadialBackground`, futuristic `Footer` with individual transparent 3D garment assets, responsive layouts, animations, and loading/empty/error states. **Zero real DB, auth, AI, or backend calls.**
4. **Phase 3 — Backend & Database:** DB setup, schema/migrations, auth, user & body profile persistence, product/garment measurements, deterministic Fit calculation service, Saved Looks, Cart, CUSTOMFIT APIs, validation & error handling.
5. **Phase 4 — AI Integration:** Provider evaluation, IDM-VTON feasibility & API integration, secure image handling, async status management, result storage/display, Fit+AI synergy, labeled fallback demo data, performance evaluation.
6. **Phase 5 — Integration & QA:** FE/BE/AI integration, API/functional/E2E/responsive/a11y/security/privacy/performance/browser testing, bug resolution, regression suite.
7. **Phase 6 — Deployment & Final Presentation:** Production config & DB, demo account/dataset, smoke tests, offline backup demo, pitch deck, script, rehearsals, final submission (and future-phase GitHub release).

---

## 2. 36-Hour Hackathon MVP Schedule (Planning Estimate)

> **Note:** These are editable planning targets, not actual completed hours.

| Bucket | Target Hours | Share | Mapped Phases & MVP Scope | Checkpoint |
| :--- | :---: | :---: | :--- | :--- |
| **Foundation** | 3.0 h | 8.3% | Phase 0 (`README.md`, SVG banner) + Phase 1 Core (PRD, Requirements) | T+03h: P0 Gate + PRD Sign-off |
| **UI and Setup** | 5.0 h | 13.9% | Phase 1 Architecture/Contracts + Phase 2 Design System (`RadialBackground`) & `Footer` | T+08h: P1 Gate + UI Shell |
| **Core Product** | 9.0 h | 25.0% | Phase 2 Core Frontend Modules (Mock State: Catalogue, Body Profile, Fit Check, Studio, VTON UI, Cart) | T+17h: P2 Frontend Gate |
| **AI Integration** | 6.0 h | 16.7% | Phase 4 IDM-VTON Feasibility, Secure Upload, Async Inference, Labeled Fallback | T+23h: P4 AI Gate |
| **Integration** | 5.0 h | 13.9% | Phase 3 Core BE/DB/Auth/Fit Engine + Phase 5 FE/BE/AI Wiring | T+28h: P3/P5 Integration Gate |
| **QA and Pitch** | 8.0 h | 22.2% | Phase 5 QA/Regression + Phase 6 Deploy, Backup Demo, Pitch Deck & 2x Rehearsal | T+36h: Final Submission |
| **TOTAL** | **36.0 h** | **100%** | **Hackathon MVP** | **E-Summit '26 Pitch** |

---

## 3. MVP vs. Post-Hackathon Full Product Roadmap

To protect the 36-hour deadline, non-essential polish and stretch features are separated from the MVP:

### Hackathon 36-Hour MVP (Must-Have)
- **Approved Stack (`DEC-006`):** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, GSAP, Lenis (targeted UX only); Next.js Route Handlers & Server Actions; Neon PostgreSQL + Drizzle ORM; Better Auth; Zod; IDM-VTON (provider TBD under `DEC-008`); Vercel.
- Phase 0 & Phase 1 core specs
- Phase 2 core customer journey: Homepage, Navigation, Mock Auth, Body Profile, Catalogue, Product Details, Fit Intelligence + Results, VTON UI, Style Studio, Saved Looks, Cart, `RadialBackground`, Futuristic `Footer`
- Phase 3 core APIs: Auth, Body Profile, Products/Measurements, Deterministic Fit Calculation, Saved Looks, Cart
- Phase 4: Real IDM-VTON inference + explicitly badged Fallback Demo
- Phase 5: Core E2E, API, security upload checks, responsive check
- Phase 6: Deployed demo + offline backup video + pitch deck

### Post-Hackathon Full Product Roadmap (Stretch / Future)
- Full **Tailor Dashboard** workflow & live order fulfillment notifications (`FL-P2-016`, `FL-P3-009`)
- Advanced **CUSTOMFIT** multi-garment pattern generation
- Full micro-interaction / animation polish (`FL-P2-019`)
- Multi-garment batch VTON & 3D body mesh reconstruction
- Automated CI/CD, full browser-matrix regression, and public GitHub open-source release (`FL-P6-006`)

