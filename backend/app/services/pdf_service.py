import fitz  # PyMuPDF


def get_page_count(file_path: str) -> int:
    with fitz.open(file_path) as doc:
        return doc.page_count


def render_page(file_path: str, page_number: int, zoom: float = 2.0, width: int | None = None) -> bytes:
    with fitz.open(file_path) as doc:
        page = doc.load_page(page_number)
        if width is not None and width > 0:
            zoom = width / page.rect.width
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)
        return pix.tobytes("png")


def merge_pdfs(file_paths: list[str], output_path: str):
    result = fitz.open()
    for path in file_paths:
        with fitz.open(path) as src:
            result.insert_pdf(src)
    result.save(output_path, deflate=True, garbage=4, clean=True)
    result.close()


def split_pdf(file_path: str, ranges: list[list[int]], output_path: str):
    result = fitz.open()
    with fitz.open(file_path) as src:
        for start, end in ranges:
            result.insert_pdf(src, from_page=start - 1, to_page=end - 1)
    result.save(output_path, deflate=True, garbage=4, clean=True)
    result.close()


def compress_pdf(file_path: str, output_path: str, level: int = 2):
    """Recompress a PDF's images and clean unused objects. Level 0-3 (Min to Max).

    Level 0: quality 85, resample only very high-res images.
    Level 1: quality 75, resample high-res images.
    Level 2: quality 60, resample medium+ resolution images.
    Level 3: quality 45, resample most images.
    """
    settings = {
        0: {"quality": 85, "dpi_threshold": 200, "dpi_target": 192},
        1: {"quality": 75, "dpi_threshold": 150, "dpi_target": 144},
        2: {"quality": 60, "dpi_threshold": 96, "dpi_target": 72},
        3: {"quality": 45, "dpi_threshold": 72, "dpi_target": 50},
    }
    cfg = settings.get(level, settings[2])
    doc = fitz.open(file_path)
    if hasattr(doc, "rewrite_images"):
        doc.rewrite_images(
            dpi_threshold=cfg["dpi_threshold"],
            dpi_target=cfg["dpi_target"],
            quality=cfg["quality"],
        )
    # garbage=4 is required: rewrite_images leaves the old image streams as
    # unreferenced objects, and only full reconstruction removes them.
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()


def rotate_pages(file_path: str, pages: list[int], angle: int, output_path: str):
    doc = fitz.open(file_path)
    for p in pages:
        page = doc.load_page(p - 1)
        page.set_rotation(angle)
    doc.save(output_path, deflate=True, garbage=4, clean=True)
    doc.close()


def rotate_page_inplace(file_path: str, page: int):
    """Rotate a single page by 90° clockwise and save back to original file."""
    import os
    doc = fitz.open(file_path)
    page_obj = doc.load_page(page - 1)
    current = page_obj.rotation
    new_rotation = (current + 90) % 360
    page_obj.set_rotation(new_rotation)
    tmp = file_path + ".tmp"
    doc.save(tmp, deflate=True, garbage=4, clean=True)
    doc.close()
    os.replace(tmp, file_path)


def reorder_pages(file_path: str, order: list[int], output_path: str):
    result = fitz.open()
    with fitz.open(file_path) as src:
        total = src.page_count
        for p in order:
            if 1 <= p <= total:
                result.insert_pdf(src, from_page=p - 1, to_page=p - 1)
    result.save(output_path, deflate=True, garbage=4, clean=True)
    result.close()


def merge_specific_pages(file_pages: list[tuple[str, int]], output_path: str):
    """file_pages: list of (file_path, 1-based page_number)"""
    result = fitz.open()
    for file_path, page_num in file_pages:
        with fitz.open(file_path) as src:
            result.insert_pdf(src, from_page=page_num - 1, to_page=page_num - 1)
    result.save(output_path, deflate=True, garbage=4, clean=True)
    result.close()
