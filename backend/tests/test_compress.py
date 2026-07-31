import os
import tempfile

import fitz
from app.services.pdf_service import compress_pdf


def _make_image_pdf(path: str, pages: int = 3, size: int = 800) -> None:
    """Build a PDF with a textured (non-trivial) image so quality levels matter."""
    w = h = size
    buf = bytearray(w * h * 3)
    for y in range(h):
        for x in range(w):
            off = (y * w + x) * 3
            buf[off] = (x * 7 + y * 13) % 256
            buf[off + 1] = (x * 3 + y * 29) % 256
            buf[off + 2] = (x * 5 + y * 11) % 256
    pix = fitz.Pixmap(fitz.csRGB, w, h, bytes(buf), False)
    jpg = pix.tobytes("jpeg", jpg_quality=90)
    doc = fitz.open()
    for _ in range(pages):
        page = doc.new_page(width=595, height=842)
        page.insert_image(fitz.Rect(0, 0, 595, 842), stream=jpg)
    doc.save(path)
    doc.close()


def test_compress_pdf_reduces_size():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_image_pdf(src)
        orig = os.path.getsize(src)

        compress_pdf(src, out, level=2)
        compressed = os.path.getsize(out)

        assert compressed < orig, f"compressed {compressed} >= original {orig}"


def test_compress_pdf_max_smaller_than_min():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        _make_image_pdf(src)
        min_out = os.path.join(tmp, "min.pdf")
        max_out = os.path.join(tmp, "max.pdf")

        compress_pdf(src, min_out, level=0)
        compress_pdf(src, max_out, level=3)

        assert os.path.getsize(max_out) < os.path.getsize(min_out)


def test_compress_pdf_output_is_valid():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_image_pdf(src)

        compress_pdf(src, out, level=2)

        doc = fitz.open(out)
        try:
            assert doc.page_count == 3
        finally:
            doc.close()
