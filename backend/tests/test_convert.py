import os
import tempfile
import time

import fitz
from app.services.convert_service import get_page_count, run_conversion


def _write_file(pdf_path, output_path):
    with open(output_path, "w") as f:
        f.write("ok")


def _hang(pdf_path, output_path):
    time.sleep(60)


def _fail(pdf_path, output_path):
    raise ValueError("boom")


def test_run_conversion_success():
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "out.txt")
        result = run_conversion(_write_file, "unused.pdf", out, timeout=30)
        assert result == out
        with open(out) as f:
            assert f.read() == "ok"


def test_run_conversion_timeout_kills_hung_process():
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "out.txt")
        start = time.monotonic()
        try:
            run_conversion(_hang, "unused.pdf", out, timeout=3)
            assert False, "expected TimeoutError"
        except TimeoutError:
            pass
        elapsed = time.monotonic() - start
        assert elapsed < 15, f"process was not killed promptly ({elapsed:.1f}s)"


def test_run_conversion_propagates_error():
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, "out.txt")
        try:
            run_conversion(_fail, "unused.pdf", out, timeout=30)
            assert False, "expected RuntimeError"
        except RuntimeError as e:
            assert "boom" in str(e)


def test_get_page_count():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "p.pdf")
        doc = fitz.open()
        for _ in range(3):
            doc.new_page()
        doc.save(path)
        doc.close()
        assert get_page_count(path) == 3
