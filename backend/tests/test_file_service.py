import os
import uuid
import tempfile
from app.services.file_service import (
    get_result_path,
    get_result_path_for_id,
    get_media_type,
    SESSIONS_DIR,
)


def test_get_result_path_default_pdf():
    did = uuid.uuid4().hex
    path = get_result_path(did)
    assert path.endswith(".pdf")
    assert f"result_{did}" in path


def test_get_result_path_custom_ext():
    did = uuid.uuid4().hex
    path = get_result_path(did, ext="zip")
    assert path.endswith(".zip")
    assert f"result_{did}" in path


def test_get_result_path_for_id_finds_any_ext():
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    did = uuid.uuid4().hex
    path = os.path.join(SESSIONS_DIR, f"result_{did}.zip")
    with open(path, "w") as f:
        f.write("test")
    try:
        found = get_result_path_for_id(did)
        assert found == path
    finally:
        os.remove(path)


def test_get_result_path_for_id_returns_none_when_missing():
    did = uuid.uuid4().hex
    assert get_result_path_for_id(did) is None


def test_get_media_type_pdf():
    assert get_media_type("/tmp/foo.pdf") == "application/pdf"


def test_get_media_type_zip():
    assert get_media_type("/tmp/foo.zip") == "application/zip"


def test_get_media_type_unknown():
    assert get_media_type("/tmp/foo.xyz") == "application/octet-stream"
