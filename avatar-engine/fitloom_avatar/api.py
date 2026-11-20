from fitloom_avatar.chart_parser import parse_custom_chart
import os, shutil, tempfile, uuid
from typing import Optional
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fitloom_avatar.engine import AvatarEngine
from fitloom_avatar.body_prior import fuse_pare_with_prior

AVATARS_ROOT = os.environ.get(
    "FITLOOM_AVATARS_DIR", "/home/krishu/FITLOOM-PRIVATE-AVATAR/outputs/api_avatars"
)
os.makedirs(AVATARS_ROOT, exist_ok=True)

app = FastAPI(title="FITLOOM 3D Avatar Service", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
engine = AvatarEngine()


@app.on_event("startup")
def _startup():
    engine.warmup()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_ready": engine.is_ready,
        "cuda_available": torch.cuda.is_available(),
    }


@app.post("/avatars/from-images")
def create_avatar_from_images(
    front: UploadFile = File(...),
    side: Optional[UploadFile] = File(None),
    gender: str = Form("neutral"),
    height_cm: Optional[float] = Form(None),
    weight_kg: Optional[float] = Form(None),
    clothing_fit: str = Form("regular"),
    build_type: str = Form("average"),
    a_pose_deg: float = Form(40.0),
):
    if gender not in ("neutral", "male", "female"):
        raise HTTPException(status_code=400, detail="gender must be neutral, male, or female")
    if clothing_fit not in ("fitted", "regular", "loose"):
        raise HTTPException(status_code=400, detail="clothing_fit must be fitted, regular, or loose")
    if build_type not in ("slim", "average", "athletic", "broad"):
        raise HTTPException(status_code=400, detail="build_type must be slim, average, athletic, or broad")

    if height_cm == 0:
        height_cm = None
    if weight_kg == 0:
        weight_kg = None
    if height_cm is not None and not (100.0 <= height_cm <= 240.0):
        raise HTTPException(status_code=400, detail="height_cm must be between 100 and 240")
    if weight_kg is not None and not (30.0 <= weight_kg <= 200.0):
        raise HTTPException(status_code=400, detail="weight_kg must be between 30 and 200")

    avatar_id = uuid.uuid4().hex[:12]
    out_dir = os.path.join(AVATARS_ROOT, avatar_id)
    upload_dir = tempfile.mkdtemp(prefix="fitloom_up_")
    calibration = {"applied": False}

    try:
        front_path = os.path.join(upload_dir, "front_upload")
        with open(front_path, "wb") as f:
            shutil.copyfileobj(front.file, f)

        side_path = None
        if side is not None and side.filename:
            side_path = os.path.join(upload_dir, "side_upload")
            with open(side_path, "wb") as f:
                shutil.copyfileobj(side.file, f)

        raw_meas = engine.generate_from_images(
            front_path=front_path,
            side_path=side_path,
            out_dir=out_dir,
            gender=gender,
            height_cm=height_cm,
            a_pose_deg=a_pose_deg,
        )

        meas = raw_meas
        targets, prior = fuse_pare_with_prior(
            pare_measurements=raw_meas,
            height_cm=height_cm,
            weight_kg=weight_kg,
            gender=gender,
            clothing_fit=clothing_fit,
            build_type=build_type,
        )
        if targets is not None:
            meas = engine.customize_avatar(
                avatar_id=avatar_id,
                out_dir=out_dir,
                height_cm=targets["height_cm"],
                chest_cm=targets["chest_cm"],
                waist_cm=targets["waist_cm"],
                hip_cm=targets["hip_cm"],
                a_pose_deg=a_pose_deg,
            )
            calibration = {
                "applied": True,
                "weight_kg": weight_kg,
                "clothing_fit": clothing_fit,
                "build_type": build_type,
                "raw_pare": {
                    "chest_cm": raw_meas.get("chest_cm"),
                    "waist_cm": raw_meas.get("waist_cm"),
                    "hip_cm": raw_meas.get("hip_cm"),
                },
                "prior": prior,
                "fused_targets": targets,
            }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar generation failed: {e}")
    finally:
        shutil.rmtree(upload_dir, ignore_errors=True)

    return {
        "avatar_id": avatar_id,
        "measurements": meas,
        "calibration": calibration,
        "assets": {
            "apose_glb": f"/avatars/{avatar_id}/apose.glb",
            "tpose_glb": f"/avatars/{avatar_id}/tpose.glb",
            "measurements_json": f"/avatars/{avatar_id}/measurements.json",
        },
    }


def _safe_asset(avatar_id: str, filename: str) -> str:
    if not avatar_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid avatar_id")
    path = os.path.join(AVATARS_ROOT, avatar_id, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Asset not found")
    return path


@app.get("/avatars/{avatar_id}/apose.glb")
def get_apose(avatar_id: str):
    return FileResponse(_safe_asset(avatar_id, "avatar_apose.glb"), media_type="model/gltf-binary")


@app.get("/avatars/{avatar_id}/tpose.glb")
def get_tpose(avatar_id: str):
    return FileResponse(_safe_asset(avatar_id, "avatar_tpose.glb"), media_type="model/gltf-binary")


@app.get("/avatars/{avatar_id}/measurements.json")
def get_measurements(avatar_id: str):
    return FileResponse(_safe_asset(avatar_id, "measurements.json"), media_type="application/json")


@app.post("/avatars/{avatar_id}/customize")
def customize_avatar(
    avatar_id: str,
    height_cm: Optional[float] = Form(None),
    chest_cm: Optional[float] = Form(None),
    waist_cm: Optional[float] = Form(None),
    hip_cm: Optional[float] = Form(None),
    a_pose_deg: float = Form(40.0),
):
    if not avatar_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid avatar_id")
    out_dir = os.path.join(AVATARS_ROOT, avatar_id)
    if not os.path.isdir(out_dir):
        raise HTTPException(status_code=404, detail="Avatar not found")

    for name, val in [("height_cm", height_cm), ("chest_cm", chest_cm), ("waist_cm", waist_cm), ("hip_cm", hip_cm)]:
        if val is not None and val == 0:
            val = None
        if name == "height_cm" and val is not None and not (100.0 <= val <= 240.0):
            raise HTTPException(status_code=400, detail="height_cm must be between 100 and 240")
        if name in ("chest_cm", "waist_cm", "hip_cm") and val is not None and not (35.0 <= val <= 220.0):
            raise HTTPException(status_code=400, detail=f"{name} must be between 35 and 220")

    h_val = None if (height_cm is None or height_cm == 0) else height_cm
    c_val = None if (chest_cm is None or chest_cm == 0) else chest_cm
    w_val = None if (waist_cm is None or waist_cm == 0) else waist_cm
    p_val = None if (hip_cm is None or hip_cm == 0) else hip_cm

    try:
        meas = engine.customize_avatar(
            avatar_id=avatar_id,
            out_dir=out_dir,
            height_cm=h_val,
            chest_cm=c_val,
            waist_cm=w_val,
            hip_cm=p_val,
            a_pose_deg=a_pose_deg,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Avatar bundle not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar customization failed: {e}")

    return {
        "avatar_id": avatar_id,
        "measurements": meas,
        "assets": {
            "apose_glb": f"/avatars/{avatar_id}/apose.glb",
            "tpose_glb": f"/avatars/{avatar_id}/tpose.glb",
            "measurements_json": f"/avatars/{avatar_id}/measurements.json",
        },
    }


@app.get("/demo", include_in_schema=False)
def demo_ui():
    demo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo.html")
    if not os.path.isfile(demo_path):
        raise HTTPException(status_code=404, detail="demo.html not found")
    return FileResponse(demo_path, media_type="text/html")


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/demo")

import json, re
from fitloom_avatar.sizing import evaluate_garment_sizes
from fitloom_avatar.garments import generate_garment_glb

@app.get("/avatars/{avatar_id}/sizing")
def get_sizing(avatar_id: str, garment_type: str = "tshirt", fit_preference: str = "regular"):
    with open(_safe_asset(avatar_id, "measurements.json")) as f:
        meas = json.load(f)
    try:
        return evaluate_garment_sizes(meas, garment_type, meas.get("gender", "male"), fit_preference)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/avatars/{avatar_id}/sizing")
def post_sizing(avatar_id: str, garment_type: str = Form("tshirt"), fit_preference: str = Form("regular"), custom_chart: str = Form(""), chart_unit: str = Form("in"), chart_type: str = Form("garment")):
    with open(_safe_asset(avatar_id, "measurements.json")) as f: meas = json.load(f)
    try:
        cc = parse_custom_chart(custom_chart, garment_type, meas.get("gender", "male"), chart_unit, chart_type)
        return evaluate_garment_sizes(meas, garment_type, meas.get("gender", "male"), fit_preference, custom_chart=cc)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))

@app.post("/avatars/{avatar_id}/dress")
def dress_avatar(avatar_id: str, garment_type: str = Form("tshirt"), size: Optional[str] = Form(None), fit_preference: str = Form("regular"), view_mode: str = Form("fabric"), color_hex: str = Form("#2563eb"), custom_chart: str = Form(""), chart_unit: str = Form("in"), chart_type: str = Form("garment")):
    if not avatar_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid avatar_id")
    out_dir = os.path.join(AVATARS_ROOT, avatar_id)
    if not os.path.isdir(out_dir):
        raise HTTPException(status_code=404, detail="Avatar not found")
    gt = garment_type.lower()
    fname = f"garment_{gt}.glb"
    try:
        meas = json.load(open(os.path.join(out_dir, "measurements.json"))); cc = parse_custom_chart(custom_chart, gt, meas.get("gender", "male"), chart_unit, chart_type); res = generate_garment_glb(out_dir, gt, size or None, fit_preference, view_mode, color_hex, os.path.join(out_dir, fname), custom_chart=cc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"avatar_id": avatar_id, "garment_type": gt, "slot": "bottom" if gt == "trousers" else "top", "glb_url": f"/avatars/{avatar_id}/garment/{fname}", "selected": res["selected"], "sizing": res["sizing"]}

@app.get("/avatars/{avatar_id}/garment/{filename}")
def get_garment_glb(avatar_id: str, filename: str):
    if not re.fullmatch(r"garment_[a-z0-9_]+\.glb", filename):
        raise HTTPException(status_code=400, detail="Invalid garment filename")
    return FileResponse(_safe_asset(avatar_id, filename), media_type="model/gltf-binary")

@app.post("/avatars/preset")
def create_preset_avatar(
    gender: str = Form("female"),
    height_cm: float = Form(162.5),
    chest_cm: Optional[float] = Form(None),
    waist_cm: Optional[float] = Form(None),
    hip_cm: Optional[float] = Form(None),
    a_pose_deg: float = Form(40.0),
):
    import uuid
    from fitloom_avatar.preset import generate_preset_avatar
    aid = uuid.uuid4().hex[:8]
    out_dir = os.path.join(AVATARS_ROOT, aid)
    meas = generate_preset_avatar(out_dir, engine.model_path, engine._lock, gender, height_cm, chest_cm or None, waist_cm or None, hip_cm or None, a_pose_deg)
    return {"avatar_id": aid, "measurements": meas, "apose_url": f"/avatars/{aid}/apose.glb", "tpose_url": f"/avatars/{aid}/tpose.glb"}
