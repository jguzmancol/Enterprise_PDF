import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ["PYTHONPATH"] = os.path.join(os.path.dirname(__file__), "..", "backend")

from fastapi.testclient import TestClient
from app.main import app
from app.services.file_service import get_result_path, SESSIONS_DIR

client = TestClient(app)

# Minimal valid PDF (1 empty page)
MINIMAL_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
)

# 1. Upload
files = [("files", ("test.pdf", MINIMAL_PDF, "application/pdf"))]
resp = client.post("/api/upload", files=files)
assert resp.status_code == 200, resp.text
upload = resp.json()
fid = upload["files"][0]["id"]
print("Uploaded:", fid)

# 2. Merge pages
resp = client.post(
    "/api/merge-pages", json={"file_pages": [{"file_id": fid, "page": 1}]}
)
assert resp.status_code == 200, resp.text
merge_result = resp.json()
did = merge_result["download_id"]
print("Merged:", did, "filename=", merge_result["filename"])

# 3. Default download (no filename param)
resp = client.get(f"/api/download/{did}")
assert resp.status_code == 200
cd = resp.headers["content-disposition"]
print("Default CD:", cd)
assert "result.pdf" in cd
print("  PASS: default filename has .pdf extension")

# 4. Custom filename WITH extension
resp = client.get(f"/api/download/{did}?filename=my_report.pdf")
assert resp.status_code == 200
cd = resp.headers["content-disposition"]
print("With ext CD:", cd)
assert "my_report.pdf" in cd
print("  PASS: custom filename with ext")

# 5. Custom filename WITHOUT extension — THE REPORTED BUG
resp = client.get(f"/api/download/{did}?filename=my_report")
assert resp.status_code == 200
cd = resp.headers["content-disposition"]
print("No ext CD:", cd)
assert "my_report.pdf" in cd
print("  PASS: extension appended when missing")

# 6. Content-Type
resp = client.get(f"/api/download/{did}")
ct = resp.headers["content-type"]
print("Content-Type:", ct)
assert "application/pdf" in ct
print("  PASS: correct media type")

# 7. Frontend simulation: what downloadUrl would produce
def download_url(download_id, filename=None, ext=None):
    base = f"/api/download/{download_id}"
    if filename:
        final_name = filename
        if ext and "." not in filename:
            final_name = f"{filename}.{ext}"
        return f"{base}?filename={final_name}"
    return base

# Test 7a: User typed "my_report", expect .pdf appended
url = download_url(did, "my_report", "pdf")
assert "?filename=my_report.pdf" in url
print("Frontend: my_report ->", url)
print("  PASS: frontend appends .pdf")

# Test 7b: User typed "my_report.pdf", keep as-is
url = download_url(did, "my_report.pdf", "pdf")
assert "?filename=my_report.pdf" in url
print("Frontend: my_report.pdf ->", url)
print("  PASS: frontend keeps .pdf")

# Test 7c: User typed nothing
url = download_url(did)
assert "?" not in url
print("Frontend: empty ->", url)
print("  PASS: frontend no query param")

print("\nALL CHECKS PASSED")
