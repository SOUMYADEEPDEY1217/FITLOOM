# FITLOOM Master Tracker Guide

**Central Live Tracker (Google Sheets):** https://docs.google.com/spreadsheets/d/14kKDELhpmE3QM5h9-ZSIoSWaSsmW2Yc86xPTvliwwIA/edit  
**Local Backup Workbook:** [FITLOOM_MASTER_PROJECT_TRACKER.xlsx](./FITLOOM_MASTER_PROJECT_TRACKER.xlsx)  
**Project:** FITLOOM (AI Fashion Intelligence & Fit Calibration Platform)  
**Team:** PARADOX | **Event:** Hack N Pitch — E-Summit '26, Jadavpur University  

---

## 1. Purpose
The native Google Sheets file **FITLOOM — MASTER PROJECT TRACKER** is the central live source of truth for planning, executing, reviewing, and approving all FITLOOM workstreams across Phases 0–6 (for the approved `DEC-006` stack: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, GSAP, Lenis, Next.js Route Handlers/Server Actions, Neon PostgreSQL, Drizzle ORM, Better Auth, Zod, IDM-VTON [provider TBD under `DEC-008`], and Vercel). `FITLOOM_MASTER_PROJECT_TRACKER.xlsx` in the local `FITLOOM` folder is retained as the offline backup.

---

## 2. Sheet-by-Sheet Reference

| Sheet | Purpose | How to Use |
| :--- | :--- | :--- |
| `00_DASHBOARD` | Executive KPI & health summary | **Read-only.** All counts, percentages, team workload, priority distribution, and health status update automatically via formulas. |
| `01_MASTER_TASKS` | Central task backlog (61 tasks, P0–P6) | Update `Owner`, `Status`, `Start Date`, `Due Date`, `Actual Hours`, `Evidence`, `Reviewer`, `Review Status`, and `Completion Date`. |
| `02_PHASE_TRACKER` | Phase-level progress & approval gates | `Total Tasks`, `Completed Tasks`, `Progress`, and `Blockers` auto-calculate. Update `Approval Status`, `Approved By`, and `Approval Date` only after gate review. |
| `03_DOCUMENTATION` | Phase 0 & Phase 1 document register (25 docs) | Track `Owner`, `Status`, `Review Status`, `Version`, `Evidence`, and `Approval Date`. |
| `04_FRONTEND` | Phase 2 granular module tracker (20 modules) | Track UI layout, components, states, accessibility, `RadialBackground`, and `Footer` assets. Mock state only. |
| `05_BACKEND` | Phase 3 API, DB & service tracker | Track schema, migrations, auth, Fit engine, and API endpoints. |
| `06_AI_ML` | Phase 4 IDM-VTON & AI safety tracker | Track provider evaluation, upload validation, inference, fallback, and performance. |
| `07_TESTING_QA` | Phase 5 test case execution log | Record `Actual Result`, `Status`, `Tester`, `Evidence`, and `Resolution`. |
| `08_DEPLOYMENT` | Phase 6 production & future GitHub tasks | Execute only in Phase 6 after Phase 5 approval. |
| `09_TEAM` | Team PARADOX roster & workload | `Assigned Tasks`, `Completed Tasks`, `Estimated Hours`, `Actual Hours`, and `Completion %` auto-calculate from `01_MASTER_TASKS`. |
| `10_DEPENDENCIES` | Predecessor/successor & critical path map | Review before starting or re-prioritizing tasks. |
| `11_RISK_REGISTER` | Project, AI, schedule & demo risks | Update `Status` (`Open`, `Mitigated`, `Closed`) and review mitigations at each phase gate. |
| `12_DECISION_LOG` | Architecture & governance decisions | Record alternatives, rationale, owner, and `Approval Status`. |
| `13_BUG_TRACKER` | Defect log for Phase 5 QA | Log reproduction steps, expected/actual behavior, severity, and resolution. |
| `14_DEMO_PITCH` | Hack N Pitch demo, deck & rehearsal tracker | Track demo scenarios, slides, script, backup video, and rehearsals. |

---

## 3. Standard Operating Procedures

### Updating Tasks (`01_MASTER_TASKS`)
1. Assign an `Owner` from the dropdown (`MD Danish Raza`, `Soumyadeep Dey`, `Harshit Raj`, `Krishnendu Das`, or `TBD`).
2. Move `Status` to `In Progress` when work begins.
3. Log `Actual Hours` honestly as work progresses.
4. Before setting `Status` to `In Review`, ensure the `Deliverable` exists and satisfies `Acceptance Criteria`.
5. Attach verifiable `Evidence` (file path, test output, screenshot, or review note).
6. A task may only be marked `Completed` after `Evidence` is recorded and `Review Status` is `Approved` (where review is required).

### Calculating Progress
- **Task Progress:** Driven by `Status = "Completed"` in `01_MASTER_TASKS`.
- **Phase Progress:** Calculated in `02_PHASE_TRACKER` as `Completed Tasks / Total Tasks`.
- **Overall Progress:** Calculated on `00_DASHBOARD` as `Completed / Total Tasks`.
- Never overwrite formula cells with hardcoded numbers.

### Recording Blockers
1. Set the task `Status` to `Blocked` in `01_MASTER_TASKS`.
2. Document the blocker cause and next action in `Remarks` and in `10_DEPENDENCIES` (`Blocker Notes`).
3. If the blocker introduces a schedule or technical risk, log it in `11_RISK_REGISTER`.
4. `00_DASHBOARD` will automatically flip `Project Health` to `AT RISK` whenever any task is `Blocked`.

### Reviewing Tasks & Approving Phases
- Reviewers must verify the deliverable against `Acceptance Criteria` and `Evidence` before changing `Review Status` to `Approved`.
- Phase approval in `02_PHASE_TRACKER` requires all exit criteria in `PHASE_APPROVAL_CHECKLIST.md` to be satisfied.

### Maintaining Project History
- Never delete completed task rows or approved decisions; mark superseded items in `Remarks` or `12_DECISION_LOG`.
- Update `PROJECT_STATUS.md` at every phase transition.

