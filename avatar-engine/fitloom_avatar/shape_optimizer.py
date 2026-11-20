import numpy as np
import smplx
import torch


def _find_ring_indices(verts_np, y_target, max_abs_x=0.28, band=0.014):
    """Find ordered vertex indices forming a horizontal torso/hip ring."""
    mask = (np.abs(verts_np[:, 1] - y_target) < band) & (np.abs(verts_np[:, 0]) < max_abs_x)
    idx = np.where(mask)[0]
    if len(idx) < 12:
        mask = (np.abs(verts_np[:, 1] - y_target) < band * 2.0) & (np.abs(verts_np[:, 0]) < max_abs_x)
        idx = np.where(mask)[0]
    pts = verts_np[idx]
    cx, cz = pts[:, 0].mean(), pts[:, 2].mean()
    angles = np.arctan2(pts[:, 2] - cz, pts[:, 0] - cx)
    return idx[np.argsort(angles)]


def _ring_perimeter_cm(verts_t, ring_idx, scale):
    pts = verts_t[ring_idx] * scale
    nxt = torch.roll(pts, shifts=-1, dims=0)
    diffs = nxt - pts
    # Horizontal circumference in cm
    return torch.sqrt((diffs[:, 0] ** 2) + (diffs[:, 2] ** 2) + 1e-8).sum() * 100.0


def optimize_betas_to_measurements(
    init_betas,
    model_path,
    gender="neutral",
    scale=1.0,
    target_chest_cm=None,
    target_waist_cm=None,
    target_hip_cm=None,
    current_meas=None,
    steps=80,
    lr=0.15,
):
    """Optimize SMPL-300 betas so chest, waist, and hip match customer targets."""
    targets = {
        "chest_cm": target_chest_cm,
        "waist_cm": target_waist_cm,
        "hip_cm": target_hip_cm,
    }
    active = {k: float(v) for k, v in targets.items() if v is not None}
    if not active:
        return np.asarray(init_betas, dtype=np.float32)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = smplx.create(
        model_path, model_type="smpl", gender=gender, num_betas=300
    ).to(device)

    betas_full = np.zeros((1, 300), dtype=np.float32)
    b_in = np.asarray(init_betas, dtype=np.float32).reshape(-1)
    betas_full[0, : len(b_in)] = b_in[:300]

    with torch.no_grad():
        init_t = torch.from_numpy(betas_full).to(device)
        out0 = model(betas=init_t)
        v0 = out0.vertices[0].detach().cpu().numpy()
        j0 = out0.joints[0].detach().cpu().numpy()

    # Ground y-coordinates to match measurements.py levels
    y_min = v0[:, 1].min()
    y_max = v0[:, 1].max()
    h = y_max - y_min

    # Approximate anatomical slice heights (chest, waist, hip)
    y_levels = {
        "chest_cm": y_min + 0.72 * h,
        "waist_cm": y_min + 0.61 * h,
        "hip_cm": y_min + 0.51 * h,
    }
    rings = {k: _find_ring_indices(v0, y_levels[k]) for k in active}

    # Calibrate ring perimeter against current_meas so optimization matches measurements.py
    calib = {}
    v0_t = torch.from_numpy(v0).to(device)
    for k in active:
        raw_p = float(_ring_perimeter_cm(v0_t, rings[k], scale).item())
        if current_meas and k in current_meas and raw_p > 1e-3:
            calib[k] = float(current_meas[k]) / raw_p
        else:
            calib[k] = 1.0

    # Optimize first 16 shape components (cleanest anatomical control)
    n_opt = 16
    delta = torch.zeros((1, n_opt), device=device, requires_grad=True)
    base_betas = torch.from_numpy(betas_full).to(device)
    opt = torch.optim.Adam([delta], lr=lr)

    for _ in range(steps):
        opt.zero_grad()
        cur_betas = base_betas.clone()
        cur_betas[:, :n_opt] = base_betas[:, :n_opt] + delta
        verts = model(betas=cur_betas).vertices[0]

        loss = torch.tensor(0.0, device=device)
        for k, target_val in active.items():
            pred_cm = _ring_perimeter_cm(verts, rings[k], scale) * calib[k]
            loss = loss + (pred_cm - target_val) ** 2

        # Keep body proportions natural
        reg = 0.05 * (delta ** 2).sum()
        (loss + reg).backward()
        opt.step()

    final_betas = base_betas.detach().clone()
    final_betas[:, :n_opt] = base_betas[:, :n_opt] + delta.detach()
    return final_betas[0, : len(b_in)].cpu().numpy().astype(np.float32)
