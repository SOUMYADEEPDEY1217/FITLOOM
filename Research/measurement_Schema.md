# FITLOOM — Unified Measurement & Dimension Specification

**Document Reference:** `FL-SPEC-MEASURE-001`  
**Target Module:** Fit Intelligence Engine, Body Calibration, Seller Catalog, CUSTOMFIT Tailoring  
**Repository Path:** `Research/measurement_Schema.md`  
**Author / Engineering Lead:** Soumyadeep Dey (`TM-002`)  
**Project:** FITLOOM (Hack N Pitch — E-Summit '26, Jadavpur University)  
**Status:** Canonical Engineering Specification (`MEASUREMENT_SCHEMA.md`)

---

## 1. Architectural Principles & Precision Standards

FITLOOM’s Fit Intelligence system connects human biological anatomy with manufactured apparel pattern dimensions. To prevent compounding inaccuracies, all mathematical operations and persistent data models strictly follow these non-negotiable standards:

1. **Canonical Metric Storage:**
   - All physical dimensions are stored in **centimeters ($\text{cm}$)**.
   - Database storage format: **PostgreSQL `numeric(6,1)`** ($0.1\text{ cm}$ or $1\text{ mm}$ physical resolution).
   - Body mass is stored in **kilograms ($\text{kg}$)** as `numeric(5,1)`.
2. **Reversible Imperial Projection:**
   - Inches ($\text{in}$) are purely presentation-layer projections.
   - Exact conversion factor: $1\text{ in} = 2.54\text{ cm}$.
   - Conversion arithmetic:
     $$\text{Value}_{\text{in}} = \text{round}_1\left(\frac{\text{Value}_{\text{cm}}}{2.54}\right), \quad \text{Value}_{\text{cm}} = \text{round}_1\left(\text{Value}_{\text{in}} \times 2.54\right)$$
     $$\text{where } \text{round}_1(x) = \frac{\lfloor 10x + 0.5 \rfloor}{10}$$
3. **No Arbitrary Estimation:**
   - Missing garment measurements are never hallucinated or filled with statistical averages.
   - If a garment lacks verified chest or waist dimensions, the engine outputs an explicit `missing_garment_measurements` status.

---

## 2. Anthropometric Human Body Profile Schema

Corresponds to the client schema in `src/lib/body-profile-utils.ts` and the planned PostgreSQL `body_profiles` table (`docs/DB_AND_API_CONTRACTS.md`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HUMAN BODY ANCHOR POINTS                        │
│                                                                        │
│                      [Height] (Vertex -> Soles)                        │
│                                │                                       │
│                    [Shoulder] (Biacromial)                             │
│                      ├───┬───────────┬───┤                             │
│                      │   │  [Chest]  │   │                             │
│                      │   │           │   │  [Sleeve] (Shoulder->Wrist) │
│                      │   │  [Waist]  │   │                             │
│                      │   └───┬───┬───┘   │                             │
│                              │[Hip]│                                   │
│                              │   │                                     │
│                              │   │  [Inseam] (Perineum -> Ankle)       │
│                              │   │                                     │
│                             ─┴─ ─┴─                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Complete Field Definitions & Biomechanical Bounds

| Field Key | Anatomical Name | Min ($\text{cm}$) | Max ($\text{cm}$) | Min ($\text{in}$) | Max ($\text{in}$) | Measurement Protocol & Biomechanics |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `heightCm` | Stature | $130.0$ | $220.0$ | $51.2$ | $86.6$ | Total vertical height barefoot against a flat wall, eyes level (Frankfort horizontal plane). |
| `weightKg` | Body Mass | $35.0$ | $180.0$ | $77.2\text{ lb}$ | $396.8\text{ lb}$ | Calibrated scale mass in undergarments. Used for volumetric BMI calibration. |
| `chestCm` | Bust / Torso Apex | $70.0$ | $150.0$ | $27.6$ | $59.1$ | Maximum horizontal circumference taken across the fullest part of the chest (nipple line) during resting tidal exhalation. |
| `waistCm` | Natural Waistline | $55.0$ | $140.0$ | $21.7$ | $55.1$ | Narrowest circumference between lower costal border and top of iliac crest (above navel). Tape snug but uncompressed. |
| `hipCm` | Maximum Seat / Hips | $75.0$ | $155.0$ | $29.5$ | $61.0$ | Maximum horizontal perimeter over trochanters and widest buttocks contour, feet parallel. |
| `shoulderCm` | Biacromial Arc | $34.0$ | $65.0$ | $13.4$ | $25.6$ | Arc distance over cervicale (C7 bony vertebra) between the lateral tips of the acromion processes. |
| `sleeveCm` | Total Arm Length | $50.0$ | $80.0$ | $19.7$ | $31.5$ | Length from acromion point along elbow flexed at 90° down to the prominent wrist styloid process. |
| `inseamCm` | Inside Leg Length | $60.0$ | $105.0$ | $23.6$ | $41.3$ | Vertical drop along inside medial leg from the crotch perineum down to the bottom of the ankle bone. |

### 2.2 Discrete Categorical Enums

#### Body Shape Types (`bodyType`)
- `athletic`: Broad biacromial diameter, high chest-to-waist drop ratio ($> 18\text{ cm}$).
- `rectangular`: Balanced shoulder, chest, and waist contours (drop $< 8\text{ cm}$).
- `pear`: Hip circumference significantly exceeds chest circumference ($H - C > 10\text{ cm}$).
- `hourglass`: Curvaceous silhouette with well-defined waist depression ($C \approx H$, $W \le C - 18\text{ cm}$).
- `inverted_triangle`: Shoulders and chest distinctly wider than hips and pelvis.
- `round`: Central abdominal prominence where waist measurement equals or exceeds chest measurement.

#### User Fit Preferences (`fitPreference`)
- `slim`: Contoured silhouette, minimum excess drape ($E_{\text{target}} = +5.0\text{ cm}$).
- `regular`: Balanced standard drape, comfortable dynamic ease ($E_{\text{target}} = +8.0\text{ cm}$).
- `relaxed`: Generous drape, loose movement clearance ($E_{\text{target}} = +12.0\text{ cm}$).
- `oversized`: Extended dropped-shoulder, architectural volume ($E_{\text{target}} = +15.0\text{ cm}$).

---

## 3. Garment Product Dimension Schema

Defines how apparel dimensions are cataloged by sellers, normalized from size charts, and consumed by the calculation engine.

### 3.1 Supported Sizing Systems
- **Alpha Sizes:** `XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`
- **Numeric Trouser Waist (Inches):** `28`, `30`, `32`, `34`, `36`, `38`, `40`, `42`

### 3.2 Category-to-Dimension Mapping Matrix

| Garment Category | Primary Anchor Zone | Secondary Evaluation Zone | Required Dimensions | Inactive / Excluded Dimensions |
| :--- | :--- | :--- | :--- | :--- |
| **Shirts** | `chestMapCm` | `waistMapCm` | Chest, Waist | Inseam (`not_applicable`) |
| **T-Shirts** | `chestMapCm` | `waistMapCm` (optional) | Chest | Inseam (`not_applicable`) |
| **Outerwear / Jackets**| `chestMapCm` | `waistMapCm`, `shoulderMapCm` | Chest, Waist | Inseam (`not_applicable`) |
| **Hoodies / Sweaters** | `chestMapCm` | `waistMapCm` | Chest | Inseam (`not_applicable`) |
| **Trousers / Jeans** | `waistMapCm` | `inseamMapCm`, `hipMapCm` | Waist | Chest, Shoulder, Sleeve (`not_applicable`) |
| **Shorts** | `waistMapCm` | `hipMapCm` | Waist | Chest, Shoulder, Sleeve, Inseam |

### 3.3 Flat vs. Circumference Harmonization Formula

Garment specification sheets typically provide half-measurements ("flat garment laid out on a table"). The schema enforces automated transformation into full 3D perimeters prior to evaluation:

$$G_{\text{circumference}}(\text{zone}) = 2 \times G_{\text{flat}}(\text{zone})$$

*Example:* A shirt with a flat armpit-to-armpit measurement of $53.0\text{ cm}$ maps canonically to:
$$G_{\text{chest}} = 2 \times 53.0\text{ cm} = 106.0\text{ cm}$$

---

## 4. Formal JSON Schemas (Zod & JSON-Schema)

### 4.1 Body Profile Validation Schema (TypeScript / Zod)

```typescript
import { z } from "zod";

export const BodyProfileSchema = z.object({
  heightCm: z.number().min(130.0, "Minimum height is 130 cm").max(220.0, "Maximum height is 220 cm"),
  weightKg: z.number().min(35.0, "Minimum weight is 35 kg").max(180.0, "Maximum weight is 180 kg").nullable().optional(),
  chestCm: z.number().min(70.0, "Minimum chest is 70 cm").max(150.0, "Maximum chest is 150 cm"),
  waistCm: z.number().min(55.0, "Minimum waist is 55 cm").max(140.0, "Maximum waist is 140 cm"),
  hipCm: z.number().min(75.0, "Minimum hip is 75 cm").max(155.0, "Maximum hip is 155 cm").nullable().optional(),
  shoulderCm: z.number().min(34.0, "Minimum shoulder is 34 cm").max(65.0, "Maximum shoulder is 65 cm").nullable().optional(),
  sleeveCm: z.number().min(50.0, "Minimum sleeve is 50 cm").max(80.0, "Maximum sleeve is 80 cm").nullable().optional(),
  inseamCm: z.number().min(60.0, "Minimum inseam is 60 cm").max(105.0, "Maximum inseam is 105 cm").nullable().optional(),
  bodyType: z.enum(["athletic", "rectangular", "pear", "hourglass", "inverted_triangle", "round"]).nullable().optional(),
  fitPreference: z.enum(["slim", "regular", "relaxed", "oversized"]).default("regular"),
});

export type BodyProfile = z.infer<typeof BodyProfileSchema>;
```

### 4.2 Garment Dimension Specification Schema (TypeScript / Zod)

```typescript
import { z } from "zod";

export const GarmentSizeEnum = z.enum(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
export type GarmentSize = z.infer<typeof GarmentSizeEnum>;

export const GarmentMeasurementMapSchema = z.record(
  GarmentSizeEnum,
  z.number().positive("Garment measurement must be positive").min(40.0).max(180.0)
);

export const ProductGarmentSpecSchema = z.object({
  productId: z.string().uuid(),
  category: z.enum(["Shirts", "Outerwear", "Trousers", "T-Shirts", "Hoodies"]),
  sizes: z.array(GarmentSizeEnum).min(1, "At least one size must be offered"),
  chestMapCm: GarmentMeasurementMapSchema.optional(),
  waistMapCm: GarmentMeasurementMapSchema.optional(),
  hipMapCm: GarmentMeasurementMapSchema.optional(),
  shoulderMapCm: GarmentMeasurementMapSchema.optional(),
  sleeveMapCm: GarmentMeasurementMapSchema.optional(),
  inseamMapCm: GarmentMeasurementMapSchema.optional(),
  fabricElasticity: z.enum(["rigid", "slight_stretch", "high_stretch"]).default("rigid"),
});

export type ProductGarmentSpec = z.infer<typeof ProductGarmentSpecSchema>;
```

---

## 5. Relational Database Tables (PostgreSQL DDL)

Matches the planned production architecture in `docs/DB_AND_API_CONTRACTS.md`:

```sql
-- 1. Canonical User Body Profiles
CREATE TABLE body_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm NUMERIC(6, 1) NOT NULL CHECK (height_cm BETWEEN 130.0 AND 220.0),
    weight_kg NUMERIC(5, 1) CHECK (weight_kg BETWEEN 35.0 AND 180.0),
    body_type VARCHAR(32) CHECK (body_type IN ('athletic', 'rectangular', 'pear', 'hourglass', 'inverted_triangle', 'round')),
    chest_cm NUMERIC(6, 1) NOT NULL CHECK (chest_cm BETWEEN 70.0 AND 150.0),
    waist_cm NUMERIC(6, 1) NOT NULL CHECK (waist_cm BETWEEN 55.0 AND 140.0),
    hip_cm NUMERIC(6, 1) CHECK (hip_cm BETWEEN 75.0 AND 155.0),
    shoulder_cm NUMERIC(6, 1) CHECK (shoulder_cm BETWEEN 34.0 AND 65.0),
    sleeve_cm NUMERIC(6, 1) CHECK (sleeve_cm BETWEEN 50.0 AND 80.0),
    inseam_cm NUMERIC(6, 1) CHECK (inseam_cm BETWEEN 60.0 AND 105.0),
    fit_preference VARCHAR(16) NOT NULL DEFAULT 'regular' CHECK (fit_preference IN ('slim', 'regular', 'relaxed', 'oversized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Per-Size Garment Measurements
CREATE TABLE garment_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(8) NOT NULL,
    chest_cm NUMERIC(6, 1) CHECK (chest_cm BETWEEN 50.0 AND 180.0),
    waist_cm NUMERIC(6, 1) CHECK (waist_cm BETWEEN 40.0 AND 170.0),
    hip_cm NUMERIC(6, 1) CHECK (hip_cm BETWEEN 50.0 AND 180.0),
    shoulder_cm NUMERIC(6, 1) CHECK (shoulder_cm BETWEEN 25.0 AND 75.0),
    sleeve_cm NUMERIC(6, 1) CHECK (sleeve_cm BETWEEN 40.0 AND 95.0),
    inseam_cm NUMERIC(6, 1) CHECK (inseam_cm BETWEEN 45.0 AND 115.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_size UNIQUE (product_id, size)
);

CREATE INDEX idx_garment_measurements_lookup ON garment_measurements(product_id, size);
```

---

## 6. Immutable Snapshot Contract for Orders & CUSTOMFIT

When a customer checks out or requests made-to-measure tailoring, their measurements must be **permanently frozen**. Future edits to their `body_profiles` must not corrupt existing production work orders.

### 6.1 Order Item Dimension Snapshot Structure
Stored as a `jsonb` payload in `order_items.garment_dimensions_snapshot`:

```json
{
  "unit": "cm",
  "evaluatedSize": "M",
  "garmentDimensions": {
    "chestCm": 104.0,
    "waistCm": 94.0,
    "shoulderCm": 44.5,
    "sleeveCm": 65.0
  },
  "customerBodySnapshot": {
    "chestCm": 96.0,
    "waistCm": 82.0,
    "fitPreference": "regular"
  },
  "computedEase": {
    "chestEaseCm": 8.0,
    "waistEaseCm": 12.0
  },
  "timestamp": "2026-11-21T00:25:00.000Z"
}
```

---

## 7. Schema Validation & Audit Checklist

- [x] **Unit Consistency:** Storage is 100% metric centimeters (`numeric(6,1)`), presentation supports zero-loss imperial conversion.
- [x] **Topological Safety:** Upper dimensions on lower garments (and vice-versa) cleanly resolve to `not_applicable` instead of falsifying comparisons.
- [x] **Boundary Enforcement:** Strict physiological limits prevent negative numbers, zeros, or unrealistically large values ($>220\text{ cm}$).
- [x] **Zero Fabrication:** Missing catalog measurements remain `unavailable_garment_spec` and never invent numbers.
- [x] **Historical Immutability:** Work orders snapshot all dimensions at the exact moment of order placement.

---

*This document is the official schema specification for all anthropometric and garment measurement processing across the FITLOOM platform.*
