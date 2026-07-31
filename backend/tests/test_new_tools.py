import io
import os
import tempfile
import zipfile

import fitz
import pytest
from app.services.pdf_service import (
    add_image_watermark,
    add_page_numbers,
    add_text_watermark,
    needs_password,
    pdf_to_images,
    protect_pdf,
    unlock_pdf,
)
from PIL import Image


def _make_text_pdf(path: str, pages: int = 3) -> None:
    doc = fitz.open()
    for _ in range(pages):
        doc.new_page(width=595, height=842)
    doc.save(path)
    doc.close()


def _make_watermark_png() -> bytes:
    img = Image.new("RGBA", (100, 50), (255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_add_text_watermark_center():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_text_pdf(src)

        add_text_watermark(src, out, text="CONFIDENCIAL", position="center")

        doc = fitz.open(out)
        try:
            assert doc.page_count == 3
            text = doc[0].get_text()
            assert "CONFIDENCIAL" in text
        finally:
            doc.close()


def test_add_text_watermark_tile():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_text_pdf(src)

        add_text_watermark(src, out, text="COPY", position="tile")

        doc = fitz.open(out)
        try:
            assert doc.page_count == 3
            assert doc[0].get_text().count("COPY") >= 2
        finally:
            doc.close()


def test_add_image_watermark():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_text_pdf(src)

        add_image_watermark(src, out, _make_watermark_png(), position="tile")

        doc = fitz.open(out)
        try:
            assert doc.page_count == 3
            assert len(doc[0].get_images()) >= 1
        finally:
            doc.close()


def test_add_page_numbers():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "out.pdf")
        _make_text_pdf(src, pages=3)

        add_page_numbers(src, out, template="{n}/{total}", position="bottom-right")

        doc = fitz.open(out)
        try:
            text = doc[1].get_text()
            assert "2/3" in text
        finally:
            doc.close()


def test_protect_unlock_roundtrip():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        protected = os.path.join(tmp, "protected.pdf")
        unlocked = os.path.join(tmp, "unlocked.pdf")
        _make_text_pdf(src, pages=2)

        protect_pdf(src, protected, password="secreto")
        assert needs_password(protected)

        with pytest.raises(ValueError):
            unlock_pdf(protected, unlocked, password="incorrecta")

        unlock_pdf(protected, unlocked, password="secreto")
        doc = fitz.open(unlocked)
        try:
            assert doc.page_count == 2
            assert not doc.needs_pass
        finally:
            doc.close()


def test_pdf_to_images_png_zip():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "images.zip")
        _make_text_pdf(src, pages=2)

        pdf_to_images(src, out, fmt="png", dpi=72)

        with zipfile.ZipFile(out) as zf:
            names = sorted(zf.namelist())
            assert names == ["001.png", "002.png"]
            for name in names:
                data = zf.read(name)
                img = Image.open(io.BytesIO(data))
                assert img.format == "PNG"


def test_pdf_to_images_jpg_zip():
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "src.pdf")
        out = os.path.join(tmp, "images.zip")
        _make_text_pdf(src, pages=1)

        pdf_to_images(src, out, fmt="jpg", dpi=72)

        with zipfile.ZipFile(out) as zf:
            assert zf.namelist() == ["001.jpg"]
