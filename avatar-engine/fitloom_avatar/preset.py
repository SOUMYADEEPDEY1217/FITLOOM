import json, os
import numpy as np
from fitloom_avatar.geometry import build_smpl_poses, export_glb
from fitloom_avatar.measurements import compute_measurements
from fitloom_avatar.shape_optimizer import optimize_betas_to_measurements

def generate_preset_avatar(out_dir, model_path, lock=None, gender="female", height_cm=162.5, chest_cm=None, waist_cm=None, hip_cm=None, a_pose_deg=40.0):
    out_abs = os.path.abspath(out_dir)
    os.makedirs(out_abs, exist_ok=True)
    g = gender if gender in ("male", "female", "neutral") else "female"
    betas = np.zeros(10, dtype=np.float32)
    def _build():
        res = build_smpl_poses(betas, model_path, gender=g, a_pose_deg=a_pose_deg)
        rh = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
        sc = float(height_cm) / rh if rh > 1e-6 else 1.0
        b = betas
        if any(x is not None for x in (chest_cm, waist_cm, hip_cm)):
            cur = compute_measurements(res["tpose"]["verts"]*sc, res["tpose"]["joints"]*sc, res["apose"]["verts"]*sc, res["apose"]["joints"]*sc, res["faces"])
            b = optimize_betas_to_measurements(init_betas=b, model_path=model_path, gender=g, scale=sc, target_chest_cm=chest_cm, target_waist_cm=waist_cm, target_hip_cm=hip_cm, current_meas=cur)
            res = build_smpl_poses(b, model_path, gender=g, a_pose_deg=a_pose_deg)
            rh = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
            sc = float(height_cm) / rh if rh > 1e-6 else 1.0
        return res, b, sc
    if lock:
        with lock: res, betas, sc = _build()
    else:
        res, betas, sc = _build()
    for k in ("tpose", "apose"):
        res[k]["verts"] = res[k]["verts"] * sc
        res[k]["joints"] = res[k]["joints"] * sc
    export_glb(os.path.join(out_abs, "avatar_tpose.glb"), res["tpose"]["verts"], res["faces"])
    export_glb(os.path.join(out_abs, "avatar_apose.glb"), res["apose"]["verts"], res["faces"])
    meas = compute_measurements(res["tpose"]["verts"], res["tpose"]["joints"], res["apose"]["verts"], res["apose"]["joints"], res["faces"])
    meas.update({"input_mode": "preset", "gender": g, "height_calibrated": True, "customized": False, "scale_factor": round(sc, 4)})
    with open(os.path.join(out_abs, "measurements.json"), "w") as f: json.dump(meas, f, indent=2)
    np.savez_compressed(os.path.join(out_abs, "avatar_params.npz"), canonical_betas=betas, tpose_joints=res["tpose"]["joints"], apose_joints=res["apose"]["joints"], gender=np.array([g]))
    return meas
