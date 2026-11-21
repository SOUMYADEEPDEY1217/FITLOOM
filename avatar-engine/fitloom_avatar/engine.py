import json, os, shutil, sys, tempfile, threading
from types import SimpleNamespace
import numpy as np, torch
from PIL import Image, ImageOps
from fitloom_avatar.geometry import build_smpl_poses, export_glb
from fitloom_avatar.measurements import compute_measurements
from fitloom_avatar.config import PARE_DIR, MODEL_PATH


def _prep_image(src_path, dst_path):
    img = ImageOps.exif_transpose(Image.open(src_path)).convert("RGB")
    img.save(dst_path, quality=95)
    return np.array(img)


def _pare_args(out_dir):
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


class AvatarEngine:
    def __init__(
        self,
        pare_dir=None,
        model_path=None,
    ):
        self.pare_dir = os.path.abspath(pare_dir or PARE_DIR)
        self.model_path = os.path.abspath(model_path or MODEL_PATH)
        self._lock = threading.Lock()
        self._tester = None
        self._crop_fn = None

    def _ensure_loaded(self):
        if self._tester is not None:
            return
        if self.pare_dir not in sys.path:
            sys.path.insert(0, self.pare_dir)
        orig_cwd = os.getcwd()
        os.chdir(self.pare_dir)
        try:
            from pare.core.tester import PARETester, get_single_image_crop_demo
            self._tester = PARETester(_pare_args(tempfile.gettempdir()))
            self._crop_fn = get_single_image_crop_demo
        finally:
            os.chdir(orig_cwd)

    def warmup(self):
        with self._lock:
            self._ensure_loaded()

    @property
    def is_ready(self):
        return self._tester is not None

    def generate_from_images(
        self, front_path, side_path, out_dir,
        gender="neutral", height_cm=None, a_pose_deg=40.0, front_weight=0.6,
    ):
        front_abs = os.path.abspath(front_path)
        side_abs = os.path.abspath(side_path) if side_path else None
        out_abs = os.path.abspath(out_dir)
        os.makedirs(out_abs, exist_ok=True)

        tmp_dir = tempfile.mkdtemp(prefix="fitloom_api_")
        try:
            views = [("front", _prep_image(front_abs, os.path.join(tmp_dir, "000_front.jpg")))]
            if side_abs:
                views.append(("side", _prep_image(side_abs, os.path.join(tmp_dir, "001_side.jpg"))))

            with self._lock:
                self._ensure_loaded()
                orig_cwd = os.getcwd()
                os.chdir(self.pare_dir)
                try:
                    detections = self._tester.run_detector(tmp_dir)
                    img_res = self._tester.model_cfg.DATASET.IMG_RES
                    crops = []
                    for idx, (label, img_rgb) in enumerate(views):
                        dets = detections[idx]
                        if len(dets) < 1:
                            raise ValueError(f"No person detected in {label} image.")
                        best_bbox = max(dets, key=lambda d: float(d[2]) * float(d[3]))
                        norm_img, _, _ = self._crop_fn(
                            img_rgb, best_bbox, kp_2d=None, scale=1.0, crop_size=img_res
                        )
                        crops.append(norm_img.squeeze(0))

                    inp = torch.stack(crops, dim=0).float().to(self._tester.device)
                    with torch.no_grad():
                        out = self._tester.model(inp)
                    betas_views = out["pred_shape"].detach().cpu().numpy().astype(np.float32)
                    poses_views = out["pred_pose"].detach().cpu().numpy().astype(np.float32)
                finally:
                    os.chdir(orig_cwd)

                if len(betas_views) == 2:
                    w = float(np.clip(front_weight, 0.0, 1.0))
                    canonical_betas = (w * betas_views[0] + (1.0 - w) * betas_views[1]).astype(np.float32)
                else:
                    canonical_betas = betas_views[0]

                res = build_smpl_poses(
                    canonical_betas, self.model_path, gender=gender, a_pose_deg=a_pose_deg
                )
                raw_h_cm = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
                scale = float(height_cm) / raw_h_cm if height_cm else 1.0
                if scale != 1.0:
                    for k in ("tpose", "apose"):
                        res[k]["verts"] = res[k]["verts"] * scale
                        res[k]["joints"] = res[k]["joints"] * scale

            export_glb(os.path.join(out_abs, "avatar_tpose.glb"), res["tpose"]["verts"], res["faces"])
            export_glb(os.path.join(out_abs, "avatar_apose.glb"), res["apose"]["verts"], res["faces"])

            meas = compute_measurements(
                res["tpose"]["verts"], res["tpose"]["joints"],
                res["apose"]["verts"], res["apose"]["joints"],
                res["faces"],
            )
            meas.update({
                "input_mode": "front_side" if side_abs else "front_only",
                "gender": gender,
                "height_calibrated": height_cm is not None,
                "scale_factor": round(scale, 4),
            })
            with open(os.path.join(out_abs, "measurements.json"), "w") as f:
                json.dump(meas, f, indent=2)

            np.savez_compressed(
                os.path.join(out_abs, "avatar_params.npz"),
                gender=np.array([gender]),
                canonical_betas=canonical_betas,
                betas_per_view=betas_views,
                poses_per_view=poses_views,
                tpose_joints=res["tpose"]["joints"],
                apose_joints=res["apose"]["joints"],
            )
            return meas
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

    def customize_avatar(
        self,
        avatar_id,
        out_dir,
        height_cm=None,
        chest_cm=None,
        waist_cm=None,
        hip_cm=None,
        a_pose_deg=40.0,
    ):
        from fitloom_avatar.shape_optimizer import optimize_betas_to_measurements

        out_abs = os.path.abspath(out_dir)
        params_path = os.path.join(out_abs, "avatar_params.npz")
        meas_path = os.path.join(out_abs, "measurements.json")
        if not os.path.isfile(params_path) or not os.path.isfile(meas_path):
            raise FileNotFoundError(f"Avatar bundle not found for {avatar_id}")

        with open(meas_path, "r") as f:
            prev_meas = json.load(f)
        params = np.load(params_path)
        gender = str(params["gender"][0]) if "gender" in params else prev_meas.get("gender", "neutral")
        init_betas = params["canonical_betas"].astype(np.float32)

        target_h = float(height_cm) if height_cm is not None else float(prev_meas["height_cm"])

        with self._lock:
            base_res = build_smpl_poses(init_betas, self.model_path, gender=gender, a_pose_deg=a_pose_deg)
            raw_h_cm = float((base_res["tpose"]["verts"][:, 1].max() - base_res["tpose"]["verts"][:, 1].min()) * 100.0)
            scale = target_h / raw_h_cm if raw_h_cm > 1e-6 else 1.0

            new_betas = optimize_betas_to_measurements(
                init_betas=init_betas,
                model_path=self.model_path,
                gender=gender,
                scale=scale,
                target_chest_cm=chest_cm,
                target_waist_cm=waist_cm,
                target_hip_cm=hip_cm,
                current_meas=prev_meas,
            )

            res = build_smpl_poses(new_betas, self.model_path, gender=gender, a_pose_deg=a_pose_deg)
            raw_h_cm_opt = float((res["tpose"]["verts"][:, 1].max() - res["tpose"]["verts"][:, 1].min()) * 100.0)
            scale_opt = target_h / raw_h_cm_opt if raw_h_cm_opt > 1e-6 else 1.0
            for k in ("tpose", "apose"):
                res[k]["verts"] = res[k]["verts"] * scale_opt
                res[k]["joints"] = res[k]["joints"] * scale_opt

        export_glb(os.path.join(out_abs, "avatar_tpose.glb"), res["tpose"]["verts"], res["faces"])
        export_glb(os.path.join(out_abs, "avatar_apose.glb"), res["apose"]["verts"], res["faces"])

        meas = compute_measurements(
            res["tpose"]["verts"],
            res["tpose"]["joints"],
            res["apose"]["verts"],
            res["apose"]["joints"],
            res["faces"],
        )
        meas.update({
            "input_mode": prev_meas.get("input_mode", "front_side"),
            "gender": gender,
            "height_calibrated": True,
            "customized": True,
            "scale_factor": round(scale_opt, 4),
        })
        with open(meas_path, "w") as f:
            json.dump(meas, f, indent=2)

        save_kwargs = {k: params[k] for k in params.files}
        save_kwargs["canonical_betas"] = new_betas
        save_kwargs["tpose_joints"] = res["tpose"]["joints"]
        save_kwargs["apose_joints"] = res["apose"]["joints"]
        np.savez_compressed(params_path, **save_kwargs)
        return meas

