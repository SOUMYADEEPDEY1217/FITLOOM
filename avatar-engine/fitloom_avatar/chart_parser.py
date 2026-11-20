import json, re
from fitloom_avatar.sizing import EASE_RULES

_ALIAS = {
    "size": "size", "sz": "size", "label": "size", "brand size": "size",
    "chest": "chest", "bust": "chest", "chest/bust": "chest",
    "waist": "waist", "hip": "hip", "hips": "hip",
    "shoulder": "shoulder", "across shoulder": "shoulder", "sh": "shoulder",
    "length": "length", "front length": "length", "len": "length",
    "sleeve": "sleeve", "sleeve length": "sleeve", "slv": "sleeve",
    "inseam": "inseam", "inside leg": "inseam", "ins": "inseam",
}

def _num(v):
    m = re.search(r"-?\d+(?:\.\d+)?", str(v or ""))
    return float(m.group(0)) if m else None

def _parse_rows(raw, gt):
    s = (raw or "").strip()
    if not s: return []
    if s.startswith("["): return json.loads(s)
    lines = [[c.strip() for c in re.split(r"[,\t|]+", ln) if c.strip()] for ln in s.splitlines() if ln.strip()]
    if not lines: return []
    mapped = [_ALIAS.get(c.lower(), "") for c in lines[0]]
    if any(k in mapped for k in ("chest", "waist", "hip", "length", "inseam")):
        cols, body = mapped, lines[1:]
    else:
        cols = ["size","waist","hip","inseam"] if gt == "trousers" else ["size","chest","length","shoulder","waist","hip","sleeve"]
        body = lines
    return [{cols[i]: r[i] for i in range(min(len(cols), len(r))) if cols[i]} for r in body if r]

def parse_custom_chart(raw, garment_type="tshirt", gender="male", unit="in", chart_type="garment"):
    gt = (garment_type or "tshirt").lower()
    fem = (gender or "").lower() == "female"
    scale = 2.54 if (unit or "in").lower().startswith("in") else 1.0
    is_body = (chart_type or "garment").lower() == "body"
    rules = EASE_RULES.get(gt, {})
    rows = _parse_rows(raw, gt)
    if not rows: return None
    out = []
    for idx, r in enumerate(rows):
        sz = str(r.get("size") or f"S{idx+1}").strip().upper()
        item = {"size": sz}
        for k, v in r.items():
            if k == "size": continue
            val = _num(v)
            if val is not None: item[k] = val * scale
        if is_body:
            for z, rl in rules.items():
                if z in item: item[z] += 0.5 * (rl[1] + rl[2])
        if gt == "trousers":
            w = item.setdefault("waist", 73.0 if fem else 78.0)
            item.setdefault("hip", w + (24.0 if fem else 20.0))
            item.setdefault("inseam", 74.0 if fem else 78.0)
        else:
            c = item.setdefault("chest", item["waist"] + (6.0 if fem else 4.0) if "waist" in item else (92.0 if fem else 98.0))
            item.setdefault("waist", c - (6.0 if fem else 4.0))
            item.setdefault("hip", c + (2.0 if fem else -1.0))
            item.setdefault("shoulder", (0.25 * c + 15.0) if fem else (0.34 * c + 10.2))
            item.setdefault("length", ((0.31 * c + 32.5) if fem else (0.42 * c + 26.8)) + (4.2 if gt == "shirt" else 0.0))
            item.setdefault("sleeve", (58.0 if fem else 62.0) if gt == "shirt" else (17.5 if fem else 20.5))
        out.append({k: (round(v, 1) if isinstance(v, float) else v) for k, v in item.items()})
    return out
