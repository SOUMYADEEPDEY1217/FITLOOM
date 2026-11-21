import os
import re
import tempfile
import pytest
from fitloom_avatar.config import AVATARS_DIR


def verify_safe_asset_logic(avatars_root: str, avatar_id: str, filename: str) -> str:
    """Mirrors the exact _safe_asset validation logic from fitloom_avatar/api.py."""
    if not re.fullmatch(r"^[a-f0-9]{8}$", avatar_id):
        raise ValueError("Invalid avatar_id")

    is_allowed = (
        filename in ("avatar_apose.glb", "avatar_tpose.glb", "measurements.json")
        or bool(re.fullmatch(r"^garment_[a-z0-9_]+\.glb$", filename))
    )
    if not is_allowed:
        raise ValueError("Invalid filename")

    root_abs = os.path.abspath(avatars_root)
    target_abs = os.path.abspath(os.path.join(root_abs, avatar_id, filename))

    try:
        common = os.path.commonpath([root_abs, target_abs])
        if common != root_abs or target_abs == root_abs:
            raise ValueError("Path traversal detected")
    except ValueError:
        raise ValueError("Invalid path")

    if not os.path.isfile(target_abs):
        raise FileNotFoundError("Asset not found")
    return target_abs


def test_safe_asset_accepts_valid_8char_hex():
    assert re.fullmatch(r"^[a-f0-9]{8}$", "a1b2c3d4") is not None
    assert re.fullmatch(r"^[a-f0-9]{8}$", "00000000") is not None
    assert re.fullmatch(r"^[a-f0-9]{8}$", "ffffffff") is not None


def test_safe_asset_rejects_invalid_avatar_ids():
    invalid_ids = [
        "a1b2c3d4e5f6",        # 12 hex chars (old format)
        "1234567",             # 7 hex chars
        "123456789",           # 9 hex chars
        "A1B2C3D4",            # Uppercase
        "../etc/passwd",       # Traversal
        "..%2F..",             # Encoded traversal
        "abc_defg",            # Underscore
        "1234-567",            # Dash
    ]
    for aid in invalid_ids:
        with pytest.raises(ValueError, match="Invalid avatar_id"):
            verify_safe_asset_logic(AVATARS_DIR, aid, "avatar_apose.glb")


def test_safe_asset_allow_list_filenames():
    allowed_filenames = [
        "avatar_apose.glb",
        "avatar_tpose.glb",
        "measurements.json",
        "garment_tshirt.glb",
        "garment_trousers.glb",
        "garment_hoodie_v1.glb",
    ]
    for fn in allowed_filenames:
        is_allowed = (
            fn in ("avatar_apose.glb", "avatar_tpose.glb", "measurements.json")
            or bool(re.fullmatch(r"^garment_[a-z0-9_]+\.glb$", fn))
        )
        assert is_allowed is True


def test_safe_asset_rejects_disallowed_filenames():
    disallowed_filenames = [
        "secrets.env",
        "../avatar_apose.glb",
        "config.py",
        "garment.glb",
        "avatar_apose.obj",
        "measurements.txt",
    ]
    for fn in disallowed_filenames:
        with pytest.raises(ValueError, match="Invalid filename"):
            verify_safe_asset_logic(AVATARS_DIR, "a1b2c3d4", fn)


def test_safe_asset_resolves_and_checks_existence():
    with tempfile.TemporaryDirectory() as tmp_root:
        avatar_dir = os.path.join(tmp_root, "a1b2c3d4")
        os.makedirs(avatar_dir, exist_ok=True)
        asset_file = os.path.join(avatar_dir, "avatar_apose.glb")
        with open(asset_file, "wb") as f:
            f.write(b"glb_binary_data")

        # 1. Existing valid asset returns absolute path
        resolved = verify_safe_asset_logic(tmp_root, "a1b2c3d4", "avatar_apose.glb")
        assert resolved == os.path.abspath(asset_file)

        # 2. Non-existent asset raises FileNotFoundError
        with pytest.raises(FileNotFoundError, match="Asset not found"):
            verify_safe_asset_logic(tmp_root, "a1b2c3d4", "avatar_tpose.glb")
