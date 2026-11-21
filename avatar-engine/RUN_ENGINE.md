# FITLOOM Avatar Engine

The FITLOOM Avatar Engine is an end-to-end 3D body estimation, parametric anthropometric avatar generator, and virtual try-on sizing engine based on PARE and SMPL.

---

## 1. Quickstart

Run the FastAPI service using Uvicorn (within your conda/python environment with PARE and PyTorch dependencies):

```bash
cd avatar-engine
uvicorn fitloom_avatar.api:app --host 127.0.0.1 --port 8010
```

Verify service readiness:
```bash
curl http://127.0.0.1:8010/health
```

---

## 2. Real Required Model Weights & Checkpoints

The avatar engine requires pretrained neural network checkpoints and SMPL parametric mesh assets. Because model weights are excluded from Git version control, place them in the following paths relative to `avatar-engine/`:

### A. PARE 3DPW Checkpoint & Config
- **Weights Checkpoint:** `PARE/data/pare/checkpoints/pare_w_3dpw_checkpoint.ckpt`
- **Config YAML:** `PARE/data/pare/checkpoints/pare_w_3dpw_config.yaml`
- **Detector & Tracking Assets:** `PARE/data/` (including YOLO bounding box detector weights and tracking support assets)

### B. SMPL 300-Shape Body Models
- **SMPL Models Directory:** `data/body_models_300/`
  Contains the SMPL gender models with 300 shape components (`SMPL_NEUTRAL.pkl`, `SMPL_MALE.pkl`, `SMPL_FEMALE.pkl`) loaded by `smplx.create`.

### C. Packaging & Distribution (Tar Commands)
To archive the required model weights from an existing setup:
```bash
# From repository root or source storage:
tar -czvf fitloom_avatar_weights.tar.gz data/body_models_300 PARE/data
```

To extract and deploy into `avatar-engine/`:
```bash
# Extract into avatar-engine:
tar -xzvf fitloom_avatar_weights.tar.gz -C avatar-engine/
```

---

## 3. Configuration & Environment Variables

All filesystem paths and service security settings are configurable via environment variables in `fitloom_avatar/config.py`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `FITLOOM_PARE_DIR` | `<avatar-engine>/PARE` | Root directory of the PARE submodule/repository containing `pare/core/tester.py` and `scripts/demo.py`. |
| `FITLOOM_MODEL_PATH` | `<avatar-engine>/data/body_models_300` | Directory containing SMPL 300-shape `.pkl` model definitions. |
| `FITLOOM_AVATARS_DIR` | `<avatar-engine>/outputs/api_avatars` | Filesystem directory where generated avatar bundles (`avatar_apose.glb`, `avatar_tpose.glb`, `measurements.json`) are stored. |
| `AVATAR_SERVICE_TOKEN` | *None* (optional) | Shared secret bearer token. When set, all HTTP endpoints except `/health` and `OPTIONS` require header `Authorization: Bearer <token>`. Missing or invalid tokens return `401 Unauthorized` JSON. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed CORS origins (e.g., `http://localhost:3000,https://fitloom.com`). |

---

## 4. API Endpoints Overview

- `GET /health` - Service status and model readiness (unauthenticated, CORS enabled).
- `POST /avatars/from-images` - Upload front (and optional side) photos to reconstruct 3D mesh and body measurements.
- `POST /avatars/preset` - Instantly instantiate canonical parametric body profile by gender/height/measurements.
- `GET /avatars/{avatar_id}/apose.glb` - Download 3D A-pose mesh asset (hardened against path traversal).
- `GET /avatars/{avatar_id}/tpose.glb` - Download 3D T-pose mesh asset.
- `GET /avatars/{avatar_id}/measurements.json` - Retrieve extracted anthropometric measurements.
- `POST /avatars/{avatar_id}/customize` - Recalibrate shape parameters to match tailor/user centimeter measurements.
- `POST /avatars/{avatar_id}/dress` - Generate 3D garment mesh on avatar for virtual try-on.
