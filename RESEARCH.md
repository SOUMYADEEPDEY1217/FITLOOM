# FITLOOM — Research & Methodology Specification: Fit Intelligence Engine

**Author / Owner:** Soumyadeep Dey (`TM-002`)  
**Project:** FITLOOM — AI Fashion Intelligence & Fit Calibration Platform  
**Team:** PARADOX | Hack N Pitch — E-Summit '26, Jadavpur University  
**Target Module:** Fit Intelligence Engine (Deterministic Calibration, Size Recommendation, Garment Ease Modelling & Anthropometric Analysis)  
**Status:** Living Research Document (`RESEARCH.md`)

---

## Executive Summary & Problem Formulation

In contemporary e-commerce fashion retail, **over 35–40% of returns are driven by sizing and fit failure**, creating immense logistics overhead, inventory depreciation, and carbon waste. The core failure stems from three systemic flaws:

1. **Size Label Inflation & Inconsistency (Vanity Sizing):** A size `M` in one brand differs by up to $6\text{ cm}$ from another brand's size `M`.
2. **Body vs. Garment Geometry Mismatch:** Size charts typically report either arbitrary body ranges (e.g., "fits chest 96–100 cm") or flat garment dimensions (e.g., "half-chest 53 cm") without stating pattern ease, fabric mechanical elasticity, or grade rules.
3. **Black-Box Arbitrary Percentages:** Existing "fit predictor" widgets show opaque numbers like *"87% Match"* or *"Size L recommended"* without physical justification, causing shopper distrust.

### The Non-Negotiable Research Mandate
> **Core Restriction:** The Fit Score **must never** be an arbitrary percentage or black-box heuristic. All size selections, zone classifications, and fit verdicts must be **deterministic, anthropometrically grounded, and explainable** through explicit physical ease formulas, garment dimension deltas, and pattern tolerances.

---

## 1. Anthropometric & Garment Standardization Schema

To achieve universal interoperability across diverse apparel categories, we establish a standardized coordinate system across the human body and garment geometry.

### 1.1 Human Body Measurement Points (ISO 8559-1 Aligned)

All measurements are stored in canonical units: **centimeters ($\text{cm}$)** at **$0.1\text{ cm}$ precision** (`numeric(6,1)`).

| Field Key | Anatomical Landmark | Description / Measurement Protocol |
| :--- | :--- | :--- |
| `heightCm` | Vertex to Soles | Total vertical body stature without footwear |
| `weightKg` | Mass | Body mass in kilograms (used for volumetric/BMI estimation) |
| `chestCm` | Mesosternale / Bust Apex | Maximum horizontal circumference taken across the widest point of the chest/bust during normal exhalation |
| `waistCm` | Natural Waist | Narrowest torso circumference located midway between lowest rib and iliac crest |
| `hipsCm` | Trochanterion / Maximum Buttocks | Maximum horizontal circumference around the widest part of the buttocks and hip joints |
| `shoulderCm` | Biacromial Diameter | Arc length from left acromion bone across cervicale (C7 vertebra) to right acromion bone |
| `sleeveCm` | Acromion to Stylion | Distance from shoulder acromion along bent elbow to wrist bone |
| `inseamCm` | Perineum to Sphyrion | Vertical inside distance from groin crotch point to bottom edge of medial malleolus (ankle) |

### 1.2 Garment Category Dimension Mapping

Garments are split into distinct physical topologies. Each topology evaluates only relevant body dimensions and explicitly flags irrelevancies as `not_applicable`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GARMENT TOPOLOGY MATRIX                           │
├─────────────────────┬──────────────────┬─────────────────┬─────────────┤
│ Category            │ Primary Anchor   │ Secondary Zone  │ Excluded    │
├─────────────────────┼──────────────────┼─────────────────┼─────────────┤
│ Shirts, T-Shirts    │ Chest (bust)     │ Waist           │ Inseam      │
│ Outerwear, Hoodies  │ Chest (bust)     │ Waist, Shoulder │ Inseam      │
│ Trousers, Jeans     │ Natural Waist    │ Hips, Inseam    │ Chest, Arm  │
│ Shorts              │ Natural Waist    │ Hips            │ Chest, Inseam│
│ Dresses, Jumpsuits  │ Bust / Chest     │ Waist, Hips     │ —           │
└─────────────────────┴──────────────────┴─────────────────┴─────────────┘
```

---

## 2. Multi-Brand Size Chart Normalization Parser

Brand size charts come in three fundamentally incompatible formats:
1. **Body-Target Charts:** "Size M fits chest 94–98 cm" (specifies human body intervals).
2. **Flat Garment Spec Charts (Half-Measure):** "Size M pit-to-pit = 52 cm" (specifies 2D flat garment width).
3. **Full Circumference Garment Specs:** "Size M chest = 104 cm" (specifies 3D total perimeter).

### 2.1 Canonical Parser Mathematical Specification

The normalization engine processes raw brand charts into canonical full-circumference maps ($G_{\text{dim}}$) according to the transformation rule:

$$\begin{aligned}
G_{\text{circumference}} &= \begin{cases}
2 \times G_{\text{flat}}, & \text{if input is Flat / Pit-to-Pit} \\
G_{\text{full}}, & \text{if input is Full Circumference} \\
\frac{B_{\text{min}} + B_{\text{max}}}{2} + E_{\text{std}}(\text{category}), & \text{if input is Body Fit Range}
\end{cases}
\end{aligned}$$

#### Imperial ↔ Metric Conversion Protocol
- All raw inputs in inches are converted using the exact scalar: $1\text{ in} = 2.54\text{ cm}$.
- Rounding rule: $\text{round}_1(x) = \frac{\lfloor 10x + 0.5 \rfloor}{10}$ (half-up to $0.1\text{ cm}$).
- Reversibility: No internal calculation operates on imperial units. Imperial conversions are purely render-time projections.

---

## 3. Garment Ease & Anthropometric Modeling

### 3.1 Definition of Ease

Garment Ease ($E$) represents the dimensional differential between the finished garment circumference ($G$) and the wearer’s uncompressed body circumference ($B$):

$$E = G - B$$

Ease consists of two distinct components:
1. **Dynamic / Movement Ease ($E_{\text{dynamic}}$):** Minimum clearance required for chest expansion during breathing ($\approx +2\text{ cm}$ to $+4\text{ cm}$), sitting, reaching, and joint movement.
2. **Style / Drape Ease ($E_{\text{style}}$):** Intentional aesthetic surplus determined by the garment silhouette (`slim`, `regular`, `relaxed`, `oversized`).

### 3.2 FITLOOM Target Ease Constants ($E_{\text{target}}$)

These ease targets are derived from classical pattern making (Birkett, Aldrich) and empirical fit studies:

| Fit Preference | Target Ease ($E_{\text{target}}$) | Physical / Tailoring Intent |
| :--- | :---: | :--- |
| **Slim** (`slim`) | $+5.0\text{ cm}$ | Contoured torso; minimal breathing margin above baseline dynamics |
| **Regular** (`regular`) | $+8.0\text{ cm}$ | Classical drape; comfortable breathing and movement clearance |
| **Relaxed** (`relaxed`) | $+12.0\text{ cm}$ | Roomy clearance; drop-shoulder; casual drape without pulling |
| **Oversized** (`oversized`) | $+15.0\text{ cm}$ | Volumetric, architectural silhouette; maximum ease |

### 3.3 Fabric Mechanics & Stretch Modifiers

Knits and fabrics with elastane/spandex accommodate negative or zero ease. We define the Effective Stretch Factor ($S_f \ge 1.0$):

$$E_{\text{effective}} = E_{\text{geometric}} + \Delta E_{\text{fabric}}$$

Where:
- **Rigid Woven (100% Cotton, Denim, Wool):** $\Delta E_{\text{fabric}} = 0\text{ cm}$ (requires full geometric ease).
- **Slight Stretch (98% Cotton / 2% Elastane):** $\Delta E_{\text{fabric}} = +2.0\text{ cm}$ virtual tolerance.
- **Jersey / Ribbed Knit (T-Shirts, Sweaters):** $\Delta E_{\text{fabric}} = +4.0\text{ cm}$ virtual tolerance.

---

## 4. Deterministic Size Recommendation Algorithm

### 4.1 Step-by-Step Selection Pipeline

```
  Body Measurements [B_primary, B_secondary]
                   │
                   ▼
  Target Desired Circumference: G_desired = B_primary + E_target
                   │
                   ▼
  Iterate candidate sizes s ∈ {XS, S, M, L, XL, XXL}:
    ├── Calculate Primary Ease:    E_1(s) = G_1(s) - B_primary
    ├── Calculate Secondary Ease:  E_2(s) = G_2(s) - B_secondary
    └── Calculate Target Delta:    Δ(s)   = |G_1(s) - G_desired|
                   │
                   ▼
  Physical Wearability Filter:
    wearable(s) ⟺ (E_1(s) ≥ 0) ∧ (E_2(s) is null ∨ E_2(s) ≥ 0)
                   │
                   ├── [No wearable sizes] ───────────────► Trigger CUSTOMFIT
                   │
                   ▼
  Deterministic Ranking:
    Sort wearable candidates by:
      1. Ascending Target Delta Δ(s)
      2. Tie-Breaker: Descending Primary Ease E_1(s) (prefer roomier comfort)
                   │
                   ▼
  Deviation Gate Check (Δ_best ≤ 12 cm):
    ├── Pass  ──► Output recommendedSize = s_best
    └── Fail  ──► Trigger CUSTOMFIT (Escalation)
```

### 4.2 Tie-Breaking Rationale
When two sizes are equidistant from the target ease (e.g., Size `M` provides $+6\text{ cm}$ ease [$\Delta = 2\text{ cm}$] and Size `L` provides $+10\text{ cm}$ ease [$\Delta = 2\text{ cm}$] for an $8\text{ cm}$ regular target):
- **Decision:** Select **Size `L`** (Descending $E_1(s)$).
- **Physical Justification:** A garment slightly looser than desired preserves movement and comfort, whereas a garment too snug causes fabric tension, seam stress, and return risk.

---

## 5. Explainable Zone-Wise Classification

Instead of an opaque score, every anatomical zone is evaluated independently and assigned an explainable verdict label and semantic badge variant.

Let $\delta = \text{round}_1(E_z(s) - E_{\text{target}})$ be the zone ease discrepancy:

| Primary Ease Condition ($E$) | Deviation Delta ($\delta$) | Verdict Label | Badge Variant | Physical Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| $E < 0\text{ cm}$ | — | **Tighter than body** | `destructive` | Fabric cannot close or causes severe constriction ($G < B$) |
| $0 \le E < 2\text{ cm}$ | — | **Very snug** | `warning` | Minimal breathing room; dynamic movement restricted |
| $E \ge 2\text{ cm}$ | $|\delta| \le 3\text{ cm}$ | **Matches preference** | `success` | Optimal alignment with target ease ($E \approx E_{\text{target}}$) |
| $E \ge 2\text{ cm}$ | $\delta < -3\text{ cm}$ | **Closer than target** | `amber` | Wearable with positive ease, but closer fit than requested |
| $E \ge 2\text{ cm}$ | $3 < \delta \le 7\text{ cm}$ | **Roomier drape** | `info` | Relaxed, loose drape exceeding target ease |
| $E \ge 2\text{ cm}$ | $\delta > 7\text{ cm}$ | **Noticeably loose** | `warning` | Surplus volume; excessive sagging or shoulder drop |

---

## 6. Mathematical Formulation: Explainable Fit Index (EFI)

To prevent arbitrary percentage generation while still providing an overall scalar index for ranking, we formulate the **Explainable Fit Index (EFI)** $\Phi \in [0.0, 1.0]$.

$$\Phi = 1.0 - \left[ w_1 \cdot \min\left(1, \frac{|\delta_1|}{\Delta_{\text{max}}}\right) + w_2 \cdot \min\left(1, \frac{|\delta_2|}{\Delta_{\text{max}}}\right) \right] - P_{\text{penalty}}$$

Where:
- $\delta_1 = E_1(s) - E_{\text{target}}$ (Primary anchor deviation)
- $\delta_2 = E_2(s) - E_{\text{target}}$ (Secondary anchor deviation, if recorded)
- $\Delta_{\text{max}} = 12.0\text{ cm}$ (Normalizing maximum allowable deviation)
- $w_1 = 0.70$, $w_2 = 0.30$ (Anchor weighting; $w_1 = 1.0$ if no secondary anchor)
- **Constraint Enforcement:** If $E_1(s) < 0$ or $E_2(s) < 0$, $\Phi \equiv 0.0$ (Strict physical wearability gate).
- $P_{\text{penalty}} = 0.15$ if $0 \le E_1(s) < 2.0\text{ cm}$ (Snug penalty).

### Explanation Output Structure
Every score output includes its exact decomposition:
```json
{
  "explainableFitIndex": 0.92,
  "fitScoreFormula": "1.0 - (0.70 * |8.0 - 8.0|/12.0) - (0.30 * |7.0 - 8.0|/12.0)",
  "verdict": "Matches preference",
  "zoneBreakdown": {
    "chest": { "easeCm": 8.0, "targetEaseCm": 8.0, "status": "Matches preference" },
    "waist": { "easeCm": 7.0, "targetEaseCm": 8.0, "status": "Matches preference" }
  }
}
```

---

## 7. Edge Cases & Handling Protocols

| ID | Edge Case Scenario | Mathematical Condition | Engine Behavior & Safety Action |
| :--- | :--- | :--- | :--- |
| **EC-01** | **Athletic / Inverted Triangle Body** | Chest is Size `XL` ($108\text{ cm}$), Waist is Size `S` ($76\text{ cm}$) | Recommends `XL` based on chest wearability gate. Explains: *"Chest matches regular fit; waist will have +18 cm surplus drape."* |
| **EC-02** | **Central Adiposity / Apple Shape** | Chest is Size `M` ($96\text{ cm}$), Waist is Size `XL` ($98\text{ cm}$) | Wearability filter rejects `M` because waist ease $E_2(\text{M}) < 0$. Selects `XL`. Alerts: *"Sized up to ensure waist clearance."* |
| **EC-03** | **Boundary / Equidistant Candidate** | $|G_1(s_A) - G_{\text{des}}| = |G_1(s_B) - G_{\text{des}}|$ | Deterministic tie-breaker selects larger size (higher ease $E_1$). |
| **EC-04** | **Extreme Proportions Outside Range** | $E_1(s) < 0$ across all sizes OR $\Delta(s_{\text{best}}) > 12\text{ cm}$ | `status = "no_supported_recommendation"`. `recommendedSize = null`. Immediate handoff to `CUSTOMFIT` tailoring. |
| **EC-05** | **Missing Garment Specs in Catalog** | $G_{\text{primary}}$ is null or zero in brand size map | Never fabricate. Returns `status = "missing_garment_measurements"`. |
| **EC-06** | **Missing Body Dimension** | User hasn't measured required anchor | Returns `status = "incomplete_body_measurements"` with exact prompt identifying missing field. |

---

## 8. Verification & Test Suite Matrix

The engine must pass 100% of the following unit test suites prior to deployment:

```
Test Matrix:
├── Category 1: Upper Body (Shirts, T-Shirts, Outerwear)
│   ├── Case U1: Exact match on chest target ease -> Expected: Matches preference (Success)
│   ├── Case U2: Equidistant M (+6cm) vs L (+10cm) -> Expected: L selected (Tie-breaker)
│   ├── Case U3: High drop (Athletic) -> Expected: Chest-anchored with waist advisory
│   └── Case U4: Low chest, large waist -> Expected: Sized up for waist clearance
│
├── Category 2: Lower Body (Trousers)
│   ├── Case L1: Primary anchor switches to Waist -> Expected: Chest ignored as Not Applicable
│   ├── Case L2: Inseam comparison -> Expected: Checked against length tolerance
│   └── Case L3: Waist ease < 0 -> Expected: Rejected as Tighter than body
│
├── Category 3: Fallbacks & Safety Escapes
│   ├── Case F1: Empty body profile -> Expected: missing_body_profile
│   ├── Case F2: Incomplete body profile -> Expected: incomplete_body_measurements
│   ├── Case F3: Out of bound dimensions -> Expected: escalateToCustomFit = true
│   └── Case F4: Garment spec missing -> Expected: missing_garment_measurements
```

---

## 9. Integration Roadmap for Soumyadeep (`TM-002`)

- [x] **Deliverable 1: Garment & Anthropometric Schema** (`src/lib/body-profile-utils.ts`, `docs/RESEARCH.md`)
- [x] **Deliverable 2: Deterministic Fit Calculation Core** (`src/lib/fit-intelligence-utils.ts`)
- [ ] **Deliverable 3: Standalone Universal Size Chart Normalizer Utility** (`src/lib/size-chart-parser.ts`)
- [ ] **Deliverable 4: Jest/Vitest Automated Test Suite** (`src/__tests__/fit-intelligence.test.ts`)
- [ ] **Deliverable 5: Live API Integration (`POST /api/fit-check`)** (`src/app/api/fit-check/route.ts`)

---

*This document serves as the formal mathematical and engineering foundation for the FITLOOM Fit Intelligence Engine, ensuring complete transparency, auditability, and zero arbitrary guesswork.*
