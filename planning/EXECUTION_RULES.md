# FITLOOM Execution Rules

These rules are mandatory for all phases of FITLOOM development.

---

## 1. Local-First & Repository Governance
1. All work remains on the user's local desktop (`c:\Users\mddan\Desktop\FITLOOM`).
2. **Do not** create a GitHub repository, initialize Git prematurely, or push code until explicitly authorized in Phase 6 (`FL-P6-006`).
3. **Do not** publish or deploy anything before Phase 6 (`08_DEPLOYMENT`).
4. **Do not** install unnecessary packages; follow the **Ponytail Workflow** (minimalist, standard-library-first, CPU-friendly, no bloat).

## 2. Sequential Phase Discipline
5. Follow the approved execution order strictly: **Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6**.
6. **Never** skip a phase or begin the next phase before the current phase passes its explicit review and approval gate.
7. During **Phase 2 (Frontend)**, use mock data and local frontend state **only**. Do not integrate real databases, authentication services, AI APIs, or backend services.

## 3. Evidence & Integrity Rules
8. **Never** mark a task `Completed` without:
   - Existing deliverable
   - Satisfied acceptance criteria
   - Recorded evidence in `01_MASTER_TASKS`
   - Passed review (`Review Status = Approved`) where required
9. **Never** invent actual completion, approval, or work-hour data.
10. **Never** represent a mock or fallback AI result as real AI inference; always badge fallback outputs clearly.
11. Unknown assignments must remain `TBD` until confirmed.

## 4. Tracker Maintenance
12. All dates, estimated hours, and assignments in `FITLOOM_MASTER_PROJECT_TRACKER.xlsx` are editable.
13. Never overwrite formula cells on `00_DASHBOARD`, `02_PHASE_TRACKER`, or `09_TEAM`.

