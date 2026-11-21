import os
from pathlib import Path
import pytest
from fitloom_avatar import config


def test_config_defaults():
    # Verify default relative paths exist and resolve under avatar-engine
    avatar_engine_dir = Path(__file__).resolve().parent.parent
    assert config.PARE_DIR == str(avatar_engine_dir / "PARE")
    assert config.MODEL_PATH == str(avatar_engine_dir / "data" / "body_models_300")
    assert config.AVATARS_DIR == str(avatar_engine_dir / "outputs" / "api_avatars")
    assert "http://localhost:3000" in config.ALLOWED_ORIGINS


def test_allowed_origins_parsing(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000, https://fitloom.com , https://app.fitloom.com")
    # Re-evaluate origins parsing
    origins = [
        o.strip()
        for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]
    assert origins == [
        "http://localhost:3000",
        "https://fitloom.com",
        "https://app.fitloom.com",
    ]


def test_avatar_service_token_env(monkeypatch):
    monkeypatch.setenv("AVATAR_SERVICE_TOKEN", "my-secret-token")
    token = os.environ.get("AVATAR_SERVICE_TOKEN", "").strip() or None
    assert token == "my-secret-token"

    monkeypatch.setenv("AVATAR_SERVICE_TOKEN", "   ")
    token_empty = os.environ.get("AVATAR_SERVICE_TOKEN", "").strip() or None
    assert token_empty is None


def test_fitloom_require_token_env(monkeypatch):
    assert config.FITLOOM_REQUIRE_TOKEN == "0"
    monkeypatch.setenv("FITLOOM_REQUIRE_TOKEN", "1")
    req = os.environ.get("FITLOOM_REQUIRE_TOKEN", "0").strip()
    assert req == "1"
