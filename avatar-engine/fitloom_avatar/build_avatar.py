import argparse, json, os
import joblib, numpy as np
from fitloom_avatar.geometry import build_smpl_poses, export_glb
from fitloom_avatar.measurements import compute_measurements
from fitloom_avatar.config import MODEL_PATH


def select_primary_track(pare_dict):
    best_id, best_score = None, -1.0
    for tid, data in pare_dict.items():
        bboxes = data.get("bboxes")
        if bboxes is None or len(bboxes) == 0:
            continue
        area = float(np.mean(np.maximum(bboxes[:, 2], 0) * np.maximum(bboxes[:, 3], 0)))
        score = len(data.get("frame_ids", bboxes)) * area
        if score > best_score:
            best_id, best_score = tid, score
    if best_id is None:
        raise ValueError("No valid tracklets found in pare_output.pkl")
    return best_id


def main():
    ap = argparse.ArgumentParser(description="Build modular FITLOOM 3D avatar bundle from PARE output.")
    ap.add_argument("--pkl", required=True, help="Path to pare_output.pkl")
    ap.add_argument("--out_dir", required=True, help="Output avatar bundle folder")
    ap.add_argument("--model_path", default=MODEL_PATH)
    ap.add_argument("--gender", default="neutral", choices=["neutral", "male", "female"])
    ap.add_argument("--track_id", type=int, default=None)
    ap.add_argument("--a_pose_deg", type=float, default=40.0)
    ap.add_argument("--height_cm", type=float, default=None, help="Optional user height in cm for scale calibration")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    pare_dict = joblib.load(args.pkl)
    tid = args.track_id if args.track_id is not None else select_primary_track(pare_dict)
    t = pare_dict[tid]

    betas_pf = np.asarray(t["betas"], dtype=np.float32)
    canonical_betas = np.median(betas_pf, axis=0).astype(np.float32)

    res = build_smpl_poses(canonical_betas, args.model_path, gender=args.gender, a_pose_deg=args.a_pose_deg)
    raw_h_cm = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
    scale = float(args.height_cm) / raw_h_cm if args.height_cm else 1.0
    if scale != 1.0:
        for k in ("tpose", "apose"):
            res[k]["verts"] = res[k]["verts"] * scale
            res[k]["joints"] = res[k]["joints"] * scale
    export_glb(os.path.join(args.out_dir, "avatar_tpose.glb"), res["tpose"]["verts"], res["faces"])
    export_glb(os.path.join(args.out_dir, "avatar_apose.glb"), res["apose"]["verts"], res["faces"])

    meas = compute_measurements(
        res["tpose"]["verts"], res["tpose"]["joints"],
        res["apose"]["verts"], res["apose"]["joints"],
        res["faces"],
    )
    meas.update({"track_id": int(tid), "gender": args.gender, "num_frames": int(len(t["frame_ids"])), "height_calibrated": args.height_cm is not None, "scale_factor": round(scale, 4)})
    with open(os.path.join(args.out_dir, "measurements.json"), "w") as f:
        json.dump(meas, f, indent=2)

    np.savez_compressed(
        os.path.join(args.out_dir, "avatar_params.npz"),
        track_id=np.array([tid]),
        gender=np.array([args.gender]),
        frame_ids=np.asarray(t["frame_ids"]),
        pose=np.asarray(t["pose"], dtype=np.float32),
        betas_per_frame=betas_pf,
        canonical_betas=canonical_betas,
        tpose_joints=res["tpose"]["joints"],
        apose_joints=res["apose"]["joints"],
    )
    print(json.dumps(meas, indent=2))
    print("FITLOOM avatar bundle saved ->", args.out_dir)


if __name__ == "__main__":
    main()
