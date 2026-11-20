from typing import Dict, List, Optional, Tuple

_TK = ("size", "chest", "waist", "hip", "shoulder", "length", "sleeve")
_BK = ("size", "waist", "hip", "inseam")
_mk = lambda k, rows: [dict(zip(k, r)) for r in rows]

GARMENT_CHARTS: Dict[str, Dict[str, List[Dict[str, float]]]] = {
    "male": {
        "tshirt": _mk(_TK, [
            ("XS",92,88,91,41.5,65,19), ("S",98,94,97,43.5,68,20.5),
            ("M",104,100,103,45.5,71,22), ("L",110,106,109,47.5,73.5,23),
            ("XL",116,112,115,49.5,76,24), ("XXL",122,118,121,51.5,78,25),
        ]),
        "shirt": _mk(_TK, [
            ("XS",96,90,94,42,66.5,58), ("S",102,96,100,44,69,60),
            ("M",108,102,106,46,71.5,62), ("L",114,108,112,48,73.5,63.5),
            ("XL",120,114,118,50,75.5,65), ("XXL",126,120,124,52,77.5,66.5),
        ]),
        "trousers": _mk(_BK, [
            ("28",74,94,76), ("30",79,99,77.5), ("32",84,104,79),
            ("34",89,109,80), ("36",94,114,81), ("38",99,119,81.5),
        ]),
    },
    "female": {
        "tshirt": _mk(_TK, [
            ("XS",86,80,88,36.5,59,16.5), ("S",92,86,94,38,61,17.5),
            ("M",98,92,100,39.5,63,18.5), ("L",104,98,106,41,65,19.5),
            ("XL",112,106,114,43,67,20.5),
        ]),
        "shirt": _mk(_TK, [
            ("XS",90,82,92,37,63,56), ("S",96,88,98,38.5,65,57.5),
            ("M",102,94,104,40,67,59), ("L",108,100,110,41.5,69,60.5),
            ("XL",116,108,118,43.5,71,62),
        ]),
        "trousers": _mk(_BK, [
            ("26",68,92,72), ("28",73,97,73.5), ("30",78,102,75),
            ("32",83,107,76), ("34",88,112,77),
        ]),
    },
}


GARMENT_CHARTS["female"]["kurti"] = _mk(_TK, [
    ("XS",88,82,98,36.5,92,39), ("S",94,88,104,38,94,40),
    ("M",100,94,110,39.5,96,41), ("L",106,100,116,41,98,42),
    ("XL",114,108,124,43,100,43),
])
GARMENT_CHARTS["male"]["kurti"] = _mk(_TK, [
    ("S",102,98,104,44,94,60), ("M",108,104,110,46,96,61.5),
    ("L",114,110,116,48,98,63), ("XL",120,116,122,50,100,64),
])

GARMENT_CHARTS["female"]["kurti"] = _mk(_TK, [
    ("XS",88,82,98,36.5,92,39), ("S",94,88,104,38,94,40),
    ("M",100,94,110,39.5,96,41), ("L",106,100,116,41,98,42),
    ("XL",114,108,124,43,100,43),
])
GARMENT_CHARTS["male"]["kurti"] = _mk(_TK, [
    ("S",102,98,104,44,94,60), ("M",108,104,110,46,96,61.5),
    ("L",114,110,116,48,98,63), ("XL",120,116,122,50,100,64),
])
EASE_RULES = {
    "kurti": {"chest": (3,7,13,19,0.40), "waist": (5,11,22,32,0.15), "hip": (6,12,24,36,0.25), "shoulder": (-1.5,-0.5,1.5,3.5,0.20)},
    "kurti": {"chest": (3,7,13,19,0.40), "waist": (5,11,22,32,0.15), "hip": (6,12,24,36,0.25), "shoulder": (-1.5,-0.5,1.5,3.5,0.20)},
    "tshirt": {"chest": (1,5,11,16,0.45), "waist": (2,8,18,26,0.20), "hip": (1,4,12,18,0.10), "shoulder": (-2,-1,2,4.5,0.25)},
    "shirt":  {"chest": (4,8,14,20,0.40), "waist": (4,8,18,25,0.20), "hip": (2,5,13,19,0.10), "shoulder": (-1.5,-0.8,1.5,3.5,0.30)},
    "trousers": {"waist": (0.5,1.5,4.5,7.5,0.60), "hip": (2,5,11,16,0.40)},
}
FIT_SHIFT = {"slim": -2.5, "regular": 0.0, "relaxed": 3.5, "extended": 5.5}

def _zone_fit(ease: float, rule: Tuple[float, ...], shift: float) -> Dict:
    min_ok, lo, hi, loose, _ = rule
    lo_s, hi_s = lo + shift, hi + shift
    mid, span = 0.5 * (lo_s + hi_s), max(0.5 * (hi_s - lo_s), 1.5)
    if ease < min_ok:
        lbl, t, pen = "Too Tight", -1.0, 3.0 + (min_ok - ease) * 0.65
    elif ease < lo_s:
        lbl, t, pen = "Snug", -0.35 - 0.55 * (lo_s - ease) / max(lo_s - min_ok, 1.0), 0.6 + (lo_s - ease) * 0.25
    elif ease <= hi_s:
        lbl, t, pen = "Ideal", ((ease - mid) / span) * 0.25, abs(ease - mid) / span * 0.35
    elif ease <= loose + max(shift, 0.0):
        lbl, t, pen = "Relaxed", 0.35 + 0.35 * (ease - hi_s) / max((loose + max(shift, 0.0)) - hi_s, 1.0), 0.5 + (ease - hi_s) * 0.16
    else:
        lbl, t, pen = "Loose", min(1.0, 0.75 + (ease - loose) * 0.05), 1.6 + (ease - loose) * 0.22
    return {
        "ease_cm": round(ease, 1), "ease_in": round(ease / 2.54, 1),
        "label": lbl, "tension": round(max(-1.0, min(1.0, t)), 3), "penalty": round(pen, 3),
    }

def evaluate_garment_sizes(measurements: Dict[str, float], garment_type: str = "tshirt", gender: str = "male", fit_preference: str = "regular", custom_chart: Optional[List[Dict[str, float]]] = None) -> Dict:
    g = "female" if (gender or "").lower() == "female" else "male"
    gt = (garment_type or "tshirt").lower()
    if gt not in EASE_RULES:
        raise ValueError(f"Unsupported garment_type: {gt}")
    pref = (fit_preference or "regular").lower()
    shift = FIT_SHIFT.get(pref, 0.0)
    chart, rules = custom_chart or GARMENT_CHARTS[g][gt], EASE_RULES[gt]
    h = float(measurements.get("height_cm", 170.0))
    body = {
        "chest": float(measurements.get("chest_cm", 96.0)),
        "waist": float(measurements.get("waist_cm", 80.0)),
        "hip": float(measurements.get("hip_cm", 96.0)),
        "shoulder": float(measurements.get("shoulder_width_cm", h * 0.26)),
        "inseam": float(measurements.get("inseam_cm", h * 0.44)),
        "ideal_top_len": h * (0.57 if gt == "kurti" else (0.38 if g == "female" else 0.405)),
    }
    results = []
    for row in chart:
        zones, w_pen, tot_w = {}, 0.0, 0.0
        for z, rule in rules.items():
            if z not in row:
                continue
            zf = _zone_fit(float(row[z]) - body[z], rule, shift if z != "shoulder" else shift * 0.25)
            zf.update({"garment_cm": float(row[z]), "body_cm": round(body[z], 1)})
            zones[z] = zf
            w_pen += zf["penalty"] * rule[4]
            tot_w += rule[4]
        score = max(0, min(100, int(round(100.0 / (1.0 + 0.55 * (w_pen / max(tot_w, 1e-6)))))))
        notes = []
        if "length" in row:
            d = float(row["length"]) - body["ideal_top_len"]
            notes.append(f"Hem ~{d/2.54:.1f} in long" if d > 3.5 else (f"Hem ~{abs(d)/2.54:.1f} in cropped" if d < -3.5 else "Hem hits cleanly at mid-fly"))
        if "inseam" in row:
            d = float(row["inseam"]) - body["inseam"]
            notes.append(f"Inseam ~{d/2.54:.1f} in long (hemming)" if d > 3.0 else (f"Ankle-cropped (~{abs(d)/2.54:.1f} in)" if d < -2.5 else "Clean full-length leg break"))
        tight = [k for k, v in zones.items() if v["label"] == "Too Tight"]
        overall = f"Too Tight ({', '.join(tight)})" if tight else ("Best Match" if score >= 82 else ("Good Fit" if score >= 65 else "Off-Size"))
        results.append({"size": row["size"], "fit_score": score, "overall": overall, "garment_spec_cm": {k: float(v) for k, v in row.items() if k != "size"}, "zones": zones, "notes": notes})
    best = max(results, key=lambda r: r["fit_score"])
    return {"garment_type": gt, "gender": g, "fit_preference": pref, "recommended_size": best["size"], "recommended_score": best["fit_score"], "sizes": results}

if __name__ == "__main__":
    danish = {"height_cm": 162.6, "chest_cm": 92.5, "waist_cm": 71.4, "hip_cm": 89.0, "shoulder_width_cm": 44.0, "inseam_cm": 71.1}
    for gt in ("tshirt", "shirt", "trousers"):
        res = evaluate_garment_sizes(danish, gt, "male", "regular")
        print(f"{gt.upper()} -> Best: {res['recommended_size']} ({res['recommended_score']}/100)")
        for s in res["sizes"]:
            z_str = ", ".join(f"{k}:{v['label']}({v['ease_in']:+.1f}\")" for k, v in s["zones"].items())
            print(f"  {s['size']:>3} [{s['fit_score']:3d}] {z_str} | {'; '.join(s['notes'])}")
