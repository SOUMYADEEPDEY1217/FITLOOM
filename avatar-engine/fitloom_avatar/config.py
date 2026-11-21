import os
from pathlib import Path

# Base directory for avatar-engine (parent of fitloom_avatar package)
AVATAR_ENGINE_DIR = Path(__file__).resolve().parent.parent

# Env vars with defaults relative to avatar-engine/
PARE_DIR = os.environ.get(
    "FITLOOM_PARE_DIR",
    str(AVATAR_ENGINE_DIR / "PARE"),
)

MODEL_PATH = os.environ.get(
    "FITLOOM_MODEL_PATH",
    str(AVATAR_ENGINE_DIR / "data" / "body_models_300"),
)

AVATARS_DIR = os.environ.get(
    "FITLOOM_AVATARS_DIR",
    str(AVATAR_ENGINE_DIR / "outputs" / "api_avatars"),
)

AVATAR_SERVICE_TOKEN = os.environ.get("AVATAR_SERVICE_TOKEN", "").strip() or None

_allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _allowed_origins_raw.split(",")
    if origin.strip()
]
