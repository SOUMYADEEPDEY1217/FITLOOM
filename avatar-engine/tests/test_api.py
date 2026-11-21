import os
import re
import tempfile
from unittest.mock import MagicMock, patch
import pytest

# Requirement 7:
# "If torch or PARE cannot be imported in this environment, say so and skip honestly, do not fake a pass."
try:
    import torch
except ImportError:
    torch = None

if torch is None:
    pytest.skip(
        "torch is not installed in this environment; skipping API TestClient tests honestly as instructed",
        allow_module_level=True,
    )

from starlette.testclient import TestClient

# Mock AvatarEngine before importing api so warmup doesn't attempt to load missing weights
with patch("fitloom_avatar.engine.AvatarEngine") as mock_engine_cls:
    mock_engine = MagicMock()
    mock_engine.is_ready = True
    mock_engine_cls.return_value = mock_engine

    from fitloom_avatar.api import app, _safe_asset, AVATARS_ROOT
    import fitloom_avatar.config as config


@pytest.fixture
def client():
    with patch("fitloom_avatar.api.engine") as mock_engine:
        mock_engine.is_ready = True
        with TestClient(app) as test_client:
            yield test_client


def test_health_endpoint_is_open_without_token(client, monkeypatch):
    # Even if AVATAR_SERVICE_TOKEN is set, /health must be accessible without token
    monkeypatch.setattr(config, "AVATAR_SERVICE_TOKEN", "super-secret-token")
    res = client.get("/health")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["status"] == "ok"


def test_auth_token_enforcement(client, monkeypatch):
    monkeypatch.setattr(config, "AVATAR_SERVICE_TOKEN", "secret-token-12345")

    # 1. Unauthenticated request to protected route returns 401 JSON
    res_no_auth = client.get("/demo")
    assert res_no_auth.status_code == 401
    assert res_no_auth.json() == {"detail": "Unauthorized"}

    # Protected API asset route without token returns 401
    res_api_no_auth = client.get("/avatars/abcd1234/apose.glb")
    assert res_api_no_auth.status_code == 401
    assert res_api_no_auth.json() == {"detail": "Unauthorized"}

    # 2. Invalid bearer token returns 401 JSON
    res_bad_auth = client.get(
        "/demo", headers={"Authorization": "Bearer invalid-wrong-token"}
    )
    assert res_bad_auth.status_code == 401
    assert res_bad_auth.json() == {"detail": "Unauthorized"}

    res_api_bad_auth = client.get(
        "/avatars/abcd1234/apose.glb",
        headers={"Authorization": "Bearer invalid-wrong-token"},
    )
    assert res_api_bad_auth.status_code == 401
    assert res_api_bad_auth.json() == {"detail": "Unauthorized"}

    # 3. Valid bearer token passes through middleware
    res_valid_auth = client.get(
        "/demo", headers={"Authorization": "Bearer secret-token-12345"}
    )
    # /demo is an existing static HTML file or redirect, so it returns 200
    assert res_valid_auth.status_code == 200

    # Protected API asset route with valid token passes auth (returns 404 because file not found, not 401)
    res_api_valid_auth = client.get(
        "/avatars/abcd1234/apose.glb",
        headers={"Authorization": "Bearer secret-token-12345"},
    )
    assert res_api_valid_auth.status_code == 404
    assert res_api_valid_auth.status_code != 401


def test_options_preflight_bypasses_auth(client, monkeypatch):
    monkeypatch.setattr(config, "AVATAR_SERVICE_TOKEN", "secret-token-12345")
    # OPTIONS request should not require Authorization header
    res = client.options(
        "/avatars/12345678/apose.glb",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200


def test_path_traversal_and_safe_asset(client, monkeypatch):
    monkeypatch.setattr(config, "AVATAR_SERVICE_TOKEN", None)

    # 1. Path traversal in avatar_id returns 400
    res_traversal = client.get("/avatars/..%2F..%2Fetc/apose.glb")
    assert res_traversal.status_code in (400, 404)

    # 2. Invalid avatar_id format (must be 8 hex chars ^[a-f0-9]{8}$) returns 400
    res_bad_id = client.get("/avatars/not-an-8char-hex/apose.glb")
    assert res_bad_id.status_code == 400
    assert "Invalid avatar_id" in res_bad_id.json().get("detail", "")

    # 3. Disallowed filename returns 400
    with pytest.raises(Exception) as exc_info:
        _safe_asset("12345678", "unauthorized_file.txt")
    assert "Invalid filename" in str(exc_info.value.detail)

    # 4. Valid avatar_id and valid filename, but file does not exist on disk returns 404
    res_not_found = client.get("/avatars/a1b2c3d4/apose.glb")
    assert res_not_found.status_code == 404
    assert "Asset not found" in res_not_found.json().get("detail", "")
