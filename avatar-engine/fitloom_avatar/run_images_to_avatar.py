import argparse, json, os, shutil, sys, tempfile
from types import SimpleNamespace
import cv2, numpy as np, torch
from PIL import Image, ImageOps
from fitloom_avatar.geometry import build_smpl_poses, export_glb
from fitloom_avatar.measurements import compute_measurements


def _prep_image(src_path, dst_path):
    img = ImageOps.exif_transpose(Image.open(src_path)).convert("RGB")
    img.save(dst_path, quality=95)
    return np.array(img)


def _pare_args(pare_dir, out_dir):
    return SimpleNamespace(
        cfg="data/pare/checkpoints/pare_w_3dpw_config.yaml",
        ckpt="data/pare/checkpoints/pare_w_3dpw_checkpoint.ckpt",
        mode="folder", detector="yolo", yolo_img_size=416,
        tracker_batch_size=1, batch_size=2, no_render=True, no_save=True,
        smooth=False, min_cutoff=0.004, beta=1.0, save_obj=False,
        sideview=False, wireframe=False, draw_keypoints=False, display=False,
        smplify=False, exp="", output_folder=out_dir,
        tracking_method="bbox", staf_dir="", image_folder=None, vid_file=None,
    )


def main():
    ap = argparse.ArgumentParser(description="Front + side images -> FITLOOM 3D avatar bundle.")
    ap.add_argument("--front", required=True, help="Front full-body photo (.jpg/.png)")
    ap.add_argument("--side", default=None, help="Optional side full-body photo (.jpg/.png)")
    ap.add_argument("--out_dir", required=True, help="Output avatar bundle directory")
    ap.add_argument("--gender", default="neutral", choices=["neutral", "male", "female"])
    ap.add_argument("--height_cm", type=float, default=None, help="User height in cm for calibration")
    ap.add_argument("--front_weight", type=float, default=0.6, help="Front beta weight (0..1)")
    ap.add_argument("--a_pose_deg", type=float, default=40.0)
    ap.add_argument("--model_path", default="/home/krishu/FITLOOM-PRIVATE-AVATAR/data/body_models_300")
    ap.add_argument("--pare_dir", default="/home/krishu/FITLOOM-PRIVATE-AVATAR/PARE")
    args = ap.parse_args()

    front_abs = os.path.abspath(args.front)
    side_abs = os.path.abspath(args.side) if args.side else None
    out_dir = os.path.abspath(args.out_dir)
    model_path = os.path.abspath(args.model_path)
    pare_dir = os.path.abspath(args.pare_dir)
    os.makedirs(out_dir, exist_ok=True)

    tmp_dir = tempfile.mkdtemp(prefix="fitloom_imgs_")
    try:
        views = [("front", _prep_image(front_abs, os.path.join(tmp_dir, "000_front.jpg")))]
        if side_abs:
            views.append(("side", _prep_image(side_abs, os.path.join(tmp_dir, "001_side.jpg"))))

        orig_cwd = os.getcwd()
        sys.path.insert(0, pare_dir)
        os.chdir(pare_dir)
        try:
            from pare.core.tester import PARETester, get_single_image_crop_demo
            tester = PARETester(_pare_args(pare_dir, out_dir))
            detections = tester.run_detector(tmp_dir)
            img_res = tester.model_cfg.DATASET.IMG_RES

            crops = []
            for idx, (label, img_rgb) in enumerate(views):
                dets = detections[idx]
                if len(dets) < 1:
                    raise RuntimeError(f"No person detected in {label} image.")
                best_bbox = max(dets, key=lambda d: float(d[2]) * float(d[3]))
                norm_img, _, _ = get_single_image_crop_demo(
                    img_rgb, best_bbox, kp_2d=None, scale=1.0, crop_size=img_res
                )
                crops.append(norm_img.squeeze(0))

            inp = torch.stack(crops, dim=0).float().to(tester.device)
            with torch.no_grad():
                out = tester.model(inp)
            betas_views = out["pred_shape"].detach().cpu().numpy().astype(np.float32)
            poses_views = out["pred_pose"].detach().cpu().numpy().astype(np.float32)
        finally:
            os.chdir(orig_cwd)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    if len(betas_views) == 2:
        w = float(np.clip(args.front_weight, 0.0, 1.0))
        canonical_betas = (w * betas_views[0] + (1.0 - w) * betas_views[1]).astype(np.float32)
    else:
        canonical_betas = betas_views[0]

    res = build_smpl_poses(canonical_betas, model_path, gender=args.gender, a_pose_deg=args.a_pose_deg)
    raw_h_cm = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
    scale = float(args.height_cm) / raw_h_cm if args.height_cm else 1.0
    if scale != 1.0:
        for k in ("tpose", "apose"):
            res[k]["verts"] = res[k]["verts"] * scale
            res[k]["joints"] = res[k]["joints"] * scale

    export_glb(os.path.join(out_dir, "avatar_tpose.glb"), res["tpose"]["verts"], res["faces"])
    export_glb(os.path.join(out_dir, "avatar_apose.glb"), res["apose"]["verts"], res["faces"])

    meas = compute_measurements(
        res["tpose"]["verts"], res["tpose"]["joints"],
        res["apose"]["verts"], res["apose"]["joints"],
        res["faces"],
    )
    meas.update({
        "input_mode": "front_side" if side_abs else "front_only",
        "gender": args.gender,
        "height_calibrated": args.height_cm is not None,
        "scale_factor": round(scale, 4),
    })
    with open(os.path.join(out_dir, "measurements.json"), "w") as f:
        json.dump(meas, f, indent=2)

    np.savez_compressed(
        os.path.join(out_dir, "avatar_params.npz"),
        gender=np.array([args.gender]),
        canonical_betas=canonical_betas,
        betas_per_view=betas_views,
        poses_per_view=poses_views,
        tpose_joints=res["tpose"]["joints"],
        apose_joints=res["apose"]["joints"],
    )
    print(json.dumps(meas, indent=2))
    print("FITLOOM image-to-avatar bundle saved ->", out_dir)


if __name__ == "__main__":
    main()
