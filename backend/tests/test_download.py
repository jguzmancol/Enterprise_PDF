import os
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.services.file_service import SESSIONS_DIR

client = TestClient(app)


def _create_result(download_id: str, ext: str = "pdf", content: bytes | None = None):
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    path = os.path.join(SESSIONS_DIR, f"result_{download_id}.{ext}")
    with open(path, "wb") as f:
        f.write(content or b"%PDF-1.4 test content")
    return path


def test_download_pdf_no_filename():
    did = uuid.uuid4().hex
    _create_result(did)
    resp = client.get(f"/api/download/{did}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    cd = resp.headers["content-disposition"]
    assert "result.pdf" in cd


def test_download_with_custom_filename():
    did = uuid.uuid4().hex
    _create_result(did)
    resp = client.get(f"/api/download/{did}?filename=my_report.pdf")
    assert resp.status_code == 200
    cd = resp.headers["content-disposition"]
    assert "my_report.pdf" in cd


def test_download_appends_ext_when_missing():
    did = uuid.uuid4().hex
    _create_result(did)
    resp = client.get(f"/api/download/{did}?filename=my_report")
    assert resp.status_code == 200
    cd = resp.headers["content-disposition"]
    assert "my_report.pdf" in cd


def test_download_zip_no_filename():
    did = uuid.uuid4().hex
    _create_result(did, ext="zip", content=b"PK\x03\x04 test zip")
    resp = client.get(f"/api/download/{did}")
    assert resp.status_code == 200
    assert "application/zip" in resp.headers["content-type"]
    cd = resp.headers["content-disposition"]
    assert "result.zip" in cd


def test_download_zip_without_ext_in_filename():
    did = uuid.uuid4().hex
    _create_result(did, ext="zip", content=b"PK\x03\x04 test zip")
    resp = client.get(f"/api/download/{did}?filename=pages")
    assert resp.status_code == 200
    cd = resp.headers["content-disposition"]
    assert "pages.zip" in cd


def test_download_zip_with_wrong_ext():
    did = uuid.uuid4().hex
    _create_result(did, ext="zip", content=b"PK\x03\x04 test zip")
    resp = client.get(f"/api/download/{did}?filename=pages.txt")
    assert resp.status_code == 200
    cd = resp.headers["content-disposition"]
    assert "pages.txt" in cd


def test_download_not_found():
    resp = client.get(f"/api/download/{uuid.uuid4().hex}")
    assert resp.status_code == 404
