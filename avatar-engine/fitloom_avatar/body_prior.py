from typing import Dict, Optional, Tuple
import numpy as np

# Average whole-body density (kg/L) used to check physical mesh volume
BODY_DENSITY_KG_PER_L = {
    "male": 1.03,
    "female": 0.99,
    "neutral": 1.01,
}

# Relative torso adjustments (cm) for optional user build hints
BUILD_OFFSETS_CM = {
    "slim": (-2.0, -2.5, -1.5),
    "average": (0.0, 0.0, 0.0),
    "athletic": (3.0, -2.5, -0.5),
    "broad": (3.5, 3.0, 2.5),
}

# (pare_weight, max_upward_cm_from_prior, max_downward_cm_from_prior)
# Loose clothing inflates silhouettes, so upward PARE drift is clamped tighter.
CLOTHING_TRUST = {
    "fitted": (0.55, 7.0, 7.0),
    "regular": (0.35, 4.5, 5.5),
    "loose": (0.15, 2.5, 4.5),
}


def compute_anthropometric_prior(
    height_cm: float,
    weight_kg: float,
    gender: str = "neutral",
    build_type: str = "average",
) -> Dict[str, float]:
    """Estimate baseline chest, waist, hip (cm) and target volume (L) from height + weight."""
    g = (gender or "neutral").lower()
    if g not in ("male", "female", "neutral"):
        g = "neutral"

    b = (build_type or "average").lower()
    dc, dw, dh = BUILD_OFFSETS_CM.get(b, (0.0, 0.0, 0.0))

    h = float(np.clip(height_cm, 120.0, 220.0))
    w = float(np.clip(weight_kg, 30.0, 180.0))

    male_c = 0.09 * h + 0.62 * w + 38.0
    male_w = -0.12 * h + 0.85 * w + 43.0
    male_h = 0.06 * h + 0.58 * w + 45.5

    fem_c = 0.04 * h + 0.65 * w + 44.0
    fem_w = -0.10 * h + 0.78 * w + 42.0
    fem_h = 0.05 * h + 0.68 * w + 48.0

    if g == "male":
        chest, waist, hip = male_c, male_w, male_h
    elif g == "female":
        chest, waist, hip = fem_c, fem_w, fem_h
    else:
        chest = 0.5 * (male_c + fem_c)
        waist = 0.5 * (male_w + fem_w)
        hip = 0.5 * (male_h + fem_h)

    chest = float(np.clip(chest + dc, 62.0, 150.0))
    waist = float(np.clip(waist + dw, 50.0, 145.0))
    hip = float(np.clip(hip + dh, 65.0, 155.0))

    bmi = w / ((h / 100.0) ** 2)
    target_volume_l = w / BODY_DENSITY_KG_PER_L[g]

    return {
        "height_cm": round(h, 2),
        "weight_kg": round(w, 2),
        "bmi": round(bmi, 2),
        "chest_cm": round(chest, 2),
        "waist_cm": round(waist, 2),
        "hip_cm": round(hip, 2),
        "target_volume_l": round(target_volume_l, 2),
    }


def fuse_pare_with_prior(
    pare_measurements: Dict[str, float],
    height_cm: Optional[float],
    weight_kg: Optional[float],
    gender: str = "neutral",
    clothing_fit: str = "regular",
    build_type: str = "average",
) -> Tuple[Optional[Dict[str, float]], Optional[Dict[str, float]]]:
    """
    Fuse raw PARE torso measurements with the height+weight anthropometric prior.
    Returns (target_measurements_for_optimizer, prior_info).
    If weight_kg is not provided, returns (None, None) so existing behavior stays unchanged.
    """
    if weight_kg is None or float(weight_kg) <= 0:
        return None, None

    h = float(height_cm) if (height_cm and float(height_cm) > 0) else float(pare_measurements.get("height_cm", 170.0))
    prior = compute_anthropometric_prior(h, float(weight_kg), gender=gender, build_type=build_type)

    fit_key = (clothing_fit or "regular").lower()
    pare_w, max_up, max_down = CLOTHING_TRUST.get(fit_key, CLOTHING_TRUST["regular"])
    prior_w = 1.0 - pare_w

    targets: Dict[str, float] = {"height_cm": round(h, 2)}
    for key in ("chest_cm", "waist_cm", "hip_cm"):
        p_val = prior[key]
        raw_val = pare_measurements.get(key)
        if raw_val is None:
            targets[key] = p_val
            continue
        blended = prior_w * p_val + pare_w * float(raw_val)
        clamped = float(np.clip(blended, p_val - max_down, p_val + max_up))
        targets[key] = round(clamped, 2)

    return targets, prior


def mesh_volume_liters(vertices: np.ndarray, faces: np.ndarray) -> float:
    """Compute closed-mesh volume in liters from SMPL vertices (meters) and triangle faces."""
    v = np.asarray(vertices, dtype=np.float64)
    f = np.asarray(faces, dtype=np.int64)
    v0 = v[f[:, 0]]
    v1 = v[f[:, 1]]
    v2 = v[f[:, 2]]
    signed_vol_m3 = np.sum(np.einsum("ij,ij->i", v0, np.cross(v1, v2))) / 6.0
    return round(float(abs(signed_vol_m3) * 1000.0), 2)


if __name__ == "__main__":
    # Quick sanity test using danish_front.jpeg's raw PARE output (5'4" / 162.6 cm, 55 kg, loose shirt)
    raw = {"height_cm": 162.6, "chest_cm": 97.0, "waist_cm": 77.5, "hip_cm": 90.9}
    targets, prior = fuse_pare_with_prior(raw, 162.6, 55.0, gender="male", clothing_fit="loose")
    print("Raw PARE (cm):  ", raw)
    print("Prior (cm):     ", prior)
    print("Fused target:   ", targets)
    print(
        "Fused (inches): ",
        {k: round(v / 2.54, 1) for k, v in targets.items() if k != "height_cm"},
    )
