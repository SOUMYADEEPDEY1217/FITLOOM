import json, os
import numpy as np
import trimesh
from fitloom_avatar.sizing import evaluate_garment_sizes

def _align_joints(V, J):
    J = np.asarray(J, dtype=np.float64).reshape(-1, 3).copy()
    vmin, vmax = V.min(0), V.max(0)
    vh = max(float(vmax[1] - vmin[1]), 1e-6)
    ank_y = min(float(J[7, 1]), float(J[8, 1]))
    if abs((ank_y - vmin[1]) / vh - 0.052) > 0.035 or not (vmin[0] <= J[0, 0] <= vmax[0]):
        J[:, 0] += 0.5 * (vmin[0] + vmax[0]) - J[0, 0]
        J[:, 2] += 0.5 * (vmin[2] + vmax[2]) - J[0, 2]
        J[:, 1] += (vmin[1] + 0.052 * vh) - ank_y
    return J

def _seg_dist(P, A, B):
    ab = B - A; L = float(np.linalg.norm(ab)); u = ab / max(L, 1e-8)
    proj = np.einsum("ij,j->i", P - A, u)
    c = A + np.clip(proj, 0.0, L)[:, None] * u
    return np.linalg.norm(P - c, axis=1), proj, c, L

def _smooth_taubin(V, F, iters=14, lam=0.45):
    v, n = V.copy(), len(V)
    if n == 0 or len(F) == 0: return v
    e = np.vstack([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    s, d = np.concatenate([e[:, 0], e[:, 1]]), np.concatenate([e[:, 1], e[:, 0]])
    deg = np.maximum(np.bincount(s, minlength=n).astype(float), 1.0)[:, None]
    for _ in range(iters):
        a = np.zeros_like(v); np.add.at(a, s, v[d]); v = v + lam * (a / deg - v)
        b = np.zeros_like(v); np.add.at(b, s, v[d]); v = v - (lam * 0.92) * (b / deg - v)
    return v

def _tension_rgba(t):
    xp = np.array([-1.0, -0.45, 0.0, 0.55, 1.0])
    cols = np.array([[239,68,68],[245,158,11],[34,197,94],[56,189,248],[59,130,246]], float)
    rgb = np.column_stack([np.interp(np.clip(t, -1.0, 1.0), xp, cols[:, c]) for c in range(3)])
    return np.hstack([rgb, np.full((len(t), 1), 255.0)]).astype(np.uint8)

def _hex_rgba(hx):
    h = (hx or "#2563eb").lstrip("#"); h = h if len(h) == 6 else "2563eb"
    return np.array([int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), 255], np.uint8)

def _arm_info(V, sh, el, wr, pel):
    u1 = (el - sh) / max(float(np.linalg.norm(el - sh)), 1e-8)
    u2 = (wr - el) / max(float(np.linalg.norm(wr - el)), 1e-8)
    d1, p1, c1, L1 = _seg_dist(V, sh, el)
    d2, p2, c2, L2 = _seg_dist(V, el, wr)
    d3, p3, c3, _ = _seg_dist(V, wr, wr + 0.28 * u2)
    u3 = (d3 < d2) & (d3 < d1) & (p3 > -0.02)
    k2 = (~u3) & (d2 < d1) & (p2 > -0.02)
    d = np.where(u3, d3, np.where(k2, d2, d1))
    c = np.where(u3[:, None], c3, np.where(k2[:, None], c2, c1))
    ud = np.where((k2 | u3)[:, None], u2[None, :], u1[None, :])
    al = np.where(u3, L1 + L2 + np.maximum(p3, 0.0), np.where(k2, L1 + np.maximum(p2, 0.0), p1))
    ok = ((V[:, 0] - pel[0]) * np.sign(sh[0] - pel[0])) > (0.85 * abs(float(sh[0] - pel[0])))
    return ok & (d < np.where(u3, 0.18, 0.115)) & (al > 0.01), al, c, L1 + L2, ud

def _boundary_edges(F):
    ec = {}
    for a, b, c in F:
        for u, v in ((a, b), (b, c), (c, a)):
            k = (u, v) if u < v else (v, u); ec[k] = ec.get(k, 0) + 1
    return [(u, v) for a, b, c in F for u, v in ((a, b), (b, c), (c, a)) if ec[(u, v) if u < v else (v, u)] == 1]

def _smooth_loop(V, be, vset, iters=3, lock_y=False):
    adj = {}
    for u, v in be:
        if u in vset and v in vset:
            adj.setdefault(u, []).append(v); adj.setdefault(v, []).append(u)
    for _ in range(iters):
        upd = {}
        for u, nb in adj.items():
            if nb:
                p = 0.5 * V[u] + 0.5 * np.mean(V[nb], axis=0)
                if lock_y: p[1] = V[u, 1]
                upd[u] = p
        for u, p in upd.items(): V[u] = p

def _find_crotch_y(V, pel, hip_y):
    for y in np.linspace(hip_y, hip_y - 0.16, 26):
        if not np.any((np.abs(V[:, 1] - y) < 0.008) & (np.abs(V[:, 0] - pel[0]) < 0.022)):
            return float(y)
    return float(hip_y - 0.065)

def _add_lip(V, F, T, be, vset, inset=0.0045, dy=0.0015):
    edges = [(u, v) for u, v in be if u in vset and v in vset]
    if not edges: return V, F, T
    N = np.asarray(trimesh.Trimesh(vertices=V, faces=F, process=False).vertex_normals, float)
    vs = sorted({x for e in edges for x in e})
    Vl, Tl, Fl, mp = list(V), list(T), list(F), {}
    for v in vs:
        p = V[v] - N[v] * inset; p[1] += dy
        mp[v] = len(Vl); Vl.append(p); Tl.append(T[v])
    for u, v in edges:
        Fl.append([v, u, mp[u]]); Fl.append([v, mp[u], mp[v]])
    return np.asarray(Vl, float), np.asarray(Fl, np.int64), np.asarray(Tl, float)

def _extrude_hem(Vg, Fn, tens, oa, pel, ty, hy, steps=4, V_body=None, flare=0.018):
    be = [(u, v) for u, v in _boundary_edges(Fn) if not oa[u] and not oa[v] and Vg[u, 1] < ty + 0.045 and Vg[v, 1] < ty + 0.045]
    if not be: return Vg, Fn, tens
    rv = sorted({x for e in be for x in e})
    cx, cz = float(pel[0]), float(np.mean(Vg[rv, 2]))
    Vl, Tl, Fl, prev = list(Vg), list(tens), list(Fn), {v: v for v in rv}
    for s in range(1, steps + 1):
        fr, cur = s / float(steps), {}
        for v in rv:
            p = Vg[v].copy()
            p[0] = cx + (p[0] - cx) * (1 + flare * fr)
            p[2] = cz + (p[2] - cz) * (1 + flare * fr)
            p[1] = (1 - fr) * p[1] + fr * hy
            cur[v] = len(Vl); Vl.append(p); Tl.append(tens[v])
        for u, v in be:
            Fl.append([prev[v], prev[u], cur[u]]); Fl.append([prev[v], cur[u], cur[v]])
        prev = cur
    Va = np.asarray(Vl, float)
    if V_body is not None and len(Va) > len(Vg):
        loc = V_body[(V_body[:, 1] >= hy - 0.04) & (V_body[:, 1] <= ty + 0.04)]
        if len(loc):
            for i in range(len(Vg), len(Va)):
                d = float(np.min(np.linalg.norm(loc - Va[i], axis=1)))
                if d < 0.011:
                    dx, dz = Va[i, 0] - cx, Va[i, 2] - cz
                    r = max(float(np.hypot(dx, dz)), 1e-6)
                    Va[i, 0] += (dx / r) * (0.011 - d)
                    Va[i, 2] += (dz / r) * (0.011 - d)
    return Va, np.asarray(Fl, np.int64), np.asarray(Tl, float)

def _top_mask(V, J, spec, is_shirt, fem=False):
    pel, neck = J[0], J[12]
    sh_y, hps_y = 0.5 * (J[16, 1] + J[17, 1]), neck[1] + 0.035
    cy, wy, hy0 = sh_y - 0.07, 0.5 * (J[3, 1] + J[6, 1]), 0.5 * (J[1, 1] + J[2, 1])
    hem_y = hps_y - spec["length"] / 100.0
    ty = max(hem_y, _find_crotch_y(V, pel, hy0) + 0.025)
    ol, al, cl, ll, ul = _arm_info(V, J[16], J[18], J[20], pel)
    or_, ar, cr, lr, ur = _arm_info(V, J[17], J[19], J[21], pel)
    oa, cs = ol | or_, min(spec.get("sleeve", 20.5) / 100.0, min(ll, lr) + 0.01)
    fs = 1.0 if (J[10, 2] - J[7, 2]) >= 0 else -1.0
    fa = np.clip(((V[:, 2] - neck[2]) * fs + 0.02) / 0.09, 0.0, 1.0)
    cly = (neck[1] + (0.052 if is_shirt else 0.042)) - (0.060 if is_shirt else (0.084 if fem else 0.068)) * fa
    nr = np.hypot(V[:, 0] - neck[0], V[:, 2] - neck[2])
    m = (V[:, 1] <= neck[1] + 0.06) & ~((nr < (0.102 if fem else 0.088)) & (V[:, 1] > cly)) & ((V[:, 1] >= ty) | oa) & ((~oa) | (ol & (al <= cs)) | (or_ & (ar <= cs)))
    return m, oa, np.where(ol, al, ar), np.where(ol[:, None], cl, cr), np.where(ol[:, None], ul, ur), (pel, hps_y, cy, wy, hy0, ty, hem_y, cs)

def _build_top(V, N, J, spec, zones, is_shirt, fem=False, fit_pref="regular"):
    m, oa, ala, ca, ua, (pel, hps_y, cy, wy, hy0, ty, hem_y, cs) = _top_mask(V, J, spec, is_shirt, fem)
    ps = {"slim": 0.72, "regular": 1.0, "relaxed": 1.22, "extended": 1.38}.get((fit_pref or "regular").lower(), 1.0); rc = float(np.clip((zones["chest"]["ease_cm"] * ps) / (200 * np.pi), 0.004, 0.062))
    rw = float(np.clip((zones["waist"]["ease_cm"] * ps) / (200 * np.pi), 0.004, 0.068))
    rh = float(np.clip((zones["hip"]["ease_cm"] * ps) / (200 * np.pi), 0.004, 0.062))
    rs = float(np.clip(zones["shoulder"]["ease_cm"] / 200.0 + 0.009, 0.007, 0.032))
    ry = np.interp(V[:, 1], [hy0, wy, cy, hps_y], [rh, rw, rc, rs]) + 0.002 * np.clip((cy - V[:, 1]) / max(cy - hy0, 0.1), 0, 1)
    nh = np.column_stack([N[:, 0], N[:, 1] * 0.35, N[:, 2]])
    nh /= np.maximum(np.linalg.norm(nh, axis=1, keepdims=True), 1e-8)
    disp = nh * ry[:, None]
    ar = V - ca; ar /= np.maximum(np.linalg.norm(ar, axis=1, keepdims=True), 1e-8)
    taper = 1.0 - 0.45 * np.clip(ala[oa] / max(cs, 0.15), 0.0, 1.0)
    disp[oa] = ar[oa] * (float(np.clip(rc * 0.75 + 0.006, 0.009, 0.024)) * taper[:, None])
    tc, tw, th, ts = (zones[k]["tension"] for k in ("chest", "waist", "hip", "shoulder"))
    tens = np.interp(V[:, 1], [hy0, wy, cy, hps_y], [th, tw, tc, ts]); tens[oa] = 0.6 * ts + 0.4 * tc
    return m, V + disp, tens, oa, ala, ua, pel, cy, ty, hem_y, cs

def _build_trousers(V, N, J, spec, zones, fem=False, fit_pref="regular"):
    pel = J[0]; wy, hy0 = pel[1] + (0.096 if fem else 0.062), 0.5 * (J[1, 1] + J[2, 1])
    cr = _find_crotch_y(V, pel, hy0)
    hem_y = max(float(V[:, 1].min()) + 0.032, cr - spec["inseam"] / 100.0)
    m = (V[:, 1] <= wy) & (V[:, 1] >= hem_y) & (~_arm_info(V, J[16], J[18], J[20], pel)[0]) & (~_arm_info(V, J[17], J[19], J[21], pel)[0])
    ts = {"slim": 0.75, "regular": 1.0, "relaxed": 1.20, "extended": 1.35}.get((fit_pref or "regular").lower(), 1.0); rw = float(np.clip((zones["waist"]["ease_cm"] * ts) / (200 * np.pi), 0.004, 0.050))
    rh = float(np.clip((zones["hip"]["ease_cm"] * ts) / (200 * np.pi), 0.005, 0.056))
    rl = float(np.clip(rh * 0.95 + 0.011, 0.014, 0.036))
    ry = np.interp(V[:, 1], [hem_y, cr, hy0, wy], [rl * 1.15, rl, rh, rw])
    nh = np.column_stack([N[:, 0], N[:, 1] * 0.25, N[:, 2]])
    nh /= np.maximum(np.linalg.norm(nh, axis=1, keepdims=True), 1e-8)
    disp = nh * ry[:, None]
    dl1, _, cl1, _ = _seg_dist(V, J[1], J[4]); dl2, _, cl2, _ = _seg_dist(V, J[4], J[7])
    dr1, _, cr1, _ = _seg_dist(V, J[2], J[5]); dr2, _, cr2, _ = _seg_dist(V, J[5], J[8])
    cL = np.where((dl2 < dl1)[:, None], cl2, cl1); cR = np.where((dr2 < dr1)[:, None], cr2, cr1)
    lr = V - np.where((np.minimum(dl1, dl2) < np.minimum(dr1, dr2))[:, None], cL, cR)
    lr[:, 1] *= 0.15; lr /= np.maximum(np.linalg.norm(lr, axis=1, keepdims=True), 1e-8)
    il = V[:, 1] < cr; disp[il] = lr[il] * ry[il, None]
    tens = np.interp(V[:, 1], [cr, hy0, wy], [zones["hip"]["tension"], zones["hip"]["tension"], zones["waist"]["tension"]])
    return m, V + disp, tens, wy, hem_y

def _fin_top(V, F, N, J, spec, zones, is_shirt, fem=False, is_kurti=False, fit_pref="regular"):
    m, Vd, tens, oa0, al0, ua0, pel, cy, ty, hy, cs = _build_top(V, N, J, spec, zones, is_shirt, fem, fit_pref)
    u, inv = np.unique(F[m[F].all(1)], return_inverse=True); Fn = inv.reshape(-1, 3)
    Vg = _smooth_taubin(Vd[u], Fn, 14, 0.45); Vb, Nb = V[u], N[u]
    mc = 0.005 + 0.006 * np.clip((pel[1] + 0.08 - Vb[:, 1]) / 0.14, 0.0, 1.0)
    Vg += np.maximum(0.0, mc - np.einsum("ij,ij->i", Vg - Vb, Nb))[:, None] * Nb
    Tg, oa, al, ua = tens[u], oa0[u], al0[u], ua0[u]
    be = _boundary_edges(Fn); bv = {x for e in be for x in e}
    cv = {v for v in bv if oa[v] and al[v] > cs - 0.05}
    for v in cv: Vg[v] += np.clip(cs - al[v], -0.025, 0.025) * ua[v]
    _smooth_loop(Vg, be, cv, 3); _smooth_loop(Vg, be, {v for v in bv if not oa[v] and Vg[v, 1] > cy}, 4)
    if hy < ty - 0.012: Vg, Fn, Tg = _extrude_hem(Vg, Fn, Tg, oa, pel, ty, hy, steps=7 if is_kurti else 4, V_body=V, flare=0.24 if is_kurti else 0.018)
    else:
        hv = {v for v in bv if not oa[v] and Vg[v, 1] < ty + 0.045}
        for v in hv: Vg[v, 1] = hy
        _smooth_loop(Vg, be, hv, 3, True)
    b2 = _boundary_edges(Fn)
    hv2 = {x for e in b2 for x in e if (x >= len(oa) or not oa[x]) and Vg[x, 1] < hy + 0.022}
    Vg, Fn, Tg = _add_lip(Vg, Fn, Tg, b2, hv2, 0.0045, 0.0015)
    return _add_lip(Vg, Fn, Tg, b2, cv, 0.003, 0.0)

def _fin_trousers(V, F, N, J, spec, zones, fem=False, fit_pref="regular"):
    m, Vd, tens, wy, hy = _build_trousers(V, N, J, spec, zones, fem, fit_pref)
    u, inv = np.unique(F[m[F].all(1)], return_inverse=True); Fn = inv.reshape(-1, 3)
    Vg = _smooth_taubin(Vd[u], Fn, 16, 0.45); Vb, Nb = V[u], N[u]
    Vg += np.maximum(0.0, 0.0055 - np.einsum("ij,ij->i", Vg - Vb, Nb))[:, None] * Nb
    Tg, be = tens[u], _boundary_edges(Fn); bv = {x for e in be for x in e}
    av = {v for v in bv if Vg[v, 1] < hy + 0.065}
    for v in av: Vg[v] += 0.0025 * Nb[v]; Vg[v, 1] = hy
    _smooth_loop(Vg, be, av, 4, True)
    wv = {v for v in bv if Vg[v, 1] > wy - 0.055}
    for v in wv: Vg[v, 1] = wy
    _smooth_loop(Vg, be, wv, 4, True)
    Vg, Fn, Tg = _add_lip(Vg, Fn, Tg, be, av, 0.004, 0.002)
    b_top = _boundary_edges(Fn)
    wv2 = {x for e in b_top for x in e if Vg[x, 1] > wy - 0.02}
    return _add_lip(Vg, Fn, Tg, b_top, wv2, 0.0025, 0.0008)

def generate_garment_glb(avatar_dir, garment_type="tshirt", size=None, fit_preference="regular", view_mode="fabric", color_hex="#2563eb", out_path=None, custom_chart=None):
    with open(os.path.join(avatar_dir, "measurements.json")) as f: meas = json.load(f)
    sizing = evaluate_garment_sizes(meas, garment_type, meas.get("gender", "male"), fit_preference, custom_chart=custom_chart)
    pick = size or sizing["recommended_size"]
    entry = next((s for s in sizing["sizes"] if s["size"].upper() == str(pick).upper()), None)
    if entry is None: raise ValueError(f"Unknown size '{pick}' for {garment_type}")
    body = trimesh.load(os.path.join(avatar_dir, "avatar_apose.glb"), force="mesh")
    V, F, N = np.asarray(body.vertices, float), np.asarray(body.faces, np.int64), np.asarray(body.vertex_normals, float)
    J = _align_joints(V, np.load(os.path.join(avatar_dir, "avatar_params.npz"))["apose_joints"])
    gt = garment_type.lower(); fem = (meas.get('gender','male') or 'male').lower() == 'female'
    if gt in ("tshirt", "shirt", "kurti"): Vg, Fn, Tg = _fin_top(V, F, N, J, entry["garment_spec_cm"], entry["zones"], gt == "shirt", fem, gt == "kurti", fit_preference)
    elif gt == "trousers": Vg, Fn, Tg = _fin_trousers(V, F, N, J, entry["garment_spec_cm"], entry["zones"], fem, fit_preference)
    else: raise ValueError(f"Unsupported garment_type: {gt}")
    vc = _tension_rgba(Tg) if (view_mode or "fabric").lower() == "heatmap" else np.tile(_hex_rgba(color_hex), (len(Vg), 1))
    gm = trimesh.Trimesh(vertices=Vg, faces=Fn, process=False); _ = gm.vertex_normals; gm.visual.vertex_colors = vc
    out_path = out_path or os.path.join(avatar_dir, f"garment_{gt}.glb"); gm.export(out_path)
    return {"glb_path": out_path, "verts": len(Vg), "faces": len(Fn), "selected": entry, "sizing": sizing}
