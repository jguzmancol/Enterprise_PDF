import os
import uuid
from app.services.file_service import (
    get_result_path,
    get_result_path_for_id,
    SESSIONS_DIR,
)


def test_get_result_path_default():
    did = uuid.uuid4().hex
    path = get_result_path(did)
    assert path.endswith(".pdf")
    assert f"result_{did}" in path


def test_get_result_path_for_id_finds():
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    did = uuid.uuid4().hex
    path = os.path.join(SESSIONS_DIR, f"result_{did}.pdf")
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


def test_get_result_path_for_id_rejects_path_traversal():
    assert get_result_path_for_id("../evil") is None
    assert get_result_path_for_id("foo/bar") is None
    assert get_result_path_for_id("foo\\bar") is None
