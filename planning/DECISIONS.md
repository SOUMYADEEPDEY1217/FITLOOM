# FITLOOM Architecture & Governance Decisions

Synced with `12_DECISION_LOG` in [FITLOOM_MASTER_PROJECT_TRACKER.xlsx](file:///c:/Users/mddan/Desktop/FITLOOM/FITLOOM_MASTER_PROJECT_TRACKER.xlsx).

---

## 1. Approved Decisions

| ID | Topic | Selected Approach | Rationale |
| :--- | :--- | :--- | :--- |
| `DEC-001` | Execution Strategy | Strict Sequential Phases (`P0 -> P6`) with explicit review gates | Prevents premature backend coupling and enforces architectural clarity. |
| `DEC-002` | Workflow Philosophy | Ponytail Workflow (minimalist, stdlib-first, CPU-friendly) | Maximizes delivery speed and maintainability within 36 hours. |
| `DEC-003` | Global Background | `RadialBackground` at `components/ui/light-theme-tailwind-css-background-snippet.tsx` (white radial gradient, `#6633EE` violet accent, shadcn + `cn()`) | Pre-selected brand design decision. |
| `DEC-004` | Footer Design | Futuristic fashion-tech footer: white-to-lavender/purple gradient, oversized black `FITLOOM` wordmark, floating 3D jacket/T-shirt/cap/trousers (individual transparent assets, not flattened), glowing violet orbit trails, flowing purple bottom waves, nav/social/legal links, responsive | Pre-selected brand design decision. |
| `DEC-005` | AI Honesty Policy | Never represent mock/fallback output as real AI inference; always badge fallback | Preserves technical integrity and judge trust. |
| `DEC-006` | Technology Stack (Approved by Project Owner, 2026-11-17) | **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui; **Animation:** GSAP, Lenis (only where improving UX); **Backend:** Next.js Route Handlers, Server Actions where appropriate; **Database:** Neon PostgreSQL, Drizzle ORM; **Auth:** Better Auth; **Validation:** Zod; **AI VTON:** IDM-VTON (hosted provider TBD under `DEC-008`); **Deployment:** Vercel | Unified TypeScript ecosystem, maintainability, rapid development, and suitability for the FITLOOM product architecture. |

---

## 2. Pending Decisions Requiring User / Team Approval

| ID | Topic | Options / Action Needed | Impacted Phases |
| :--- | :--- | :--- | :--- |
| `DEC-007` | **Team Role Assignments** | Assign primary ownership for MD Danish Raza, Soumyadeep Dey, Harshit Raj, and Krishnendu Das (`09_TEAM` & `01_MASTER_TASKS`). | All Phases (`P0`–`P6`) |
| `DEC-008` | **IDM-VTON Provider & Hosting** | Evaluate and finalize hosted inference provider for IDM-VTON (pricing, hosting, and API availability are NOT finalized). | Phase 4, Phase 6 |

