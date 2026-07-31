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


def _normalize_color(color: list[int] | tuple[int, ...]) -> tuple[float, ...]:
    """Accept RGB as 0-255 ints or 0-1 floats, return 0-1 floats for PyMuPDF."""
    c = tuple(float(v) for v in color)
    if max(c) > 1.0:
        c = tuple(v / 255.0 for v in c)
    return c


def add_text_watermark(
    file_path: str,
    output_path: str,
    text: str = "CONFIDENCIAL",
    opacity: float = 0.3,
    font_size: int = 60,
    color: list[int] = (128, 128, 128),
    rotation: int = 45,
    position: str = "center",
):
    """Add a text watermark to every page. position: 'center' | 'tile'."""
    doc = fitz.open(file_path)
    rgb = _normalize_color(color)
    for page in doc:
        rect = page.rect
        if position == "tile":
            step_x = max(font_size * 4, 1)
            step_y = max(font_size * 4, 1)
            y = -step_y
            while y < rect.height + step_y:
                x = -step_x
                while x < rect.width + step_x:
                    page.insert_text(
                        fitz.Point(x, y),
                        text,
                        fontsize=font_size,
                        fontname="helv",
                        color=rgb,
                        fill_opacity=opacity,
                        overlay=True,
                    )
                    x += step_x
                y += step_y
        else:
            center = fitz.Point(rect.width / 2, rect.height / 2)
            page.insert_text(
                center,
                text,
                fontsize=font_size,
                fontname="helv",
                color=rgb,
                fill_opacity=opacity,
                overlay=True,
                morph=(center, fitz.Matrix(rotation)),
            )
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()


def add_image_watermark(
    file_path: str,
    output_path: str,
    image_bytes: bytes,
    opacity: float = 0.5,
    position: str = "tile",
):
    """Add an image watermark to every page. position: 'center' | 'tile'.

    Opacity is applied via the image alpha channel (RGBA PNG), since
    PyMuPDF's insert_image has no opacity parameter.
    """
    import io

    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    r, g, b, a = img.split()
    a = a.point(lambda v: int(v * opacity))
    img = Image.merge("RGBA", (r, g, b, a))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    doc = fitz.open(file_path)
    for page in doc:
        rect = page.rect
        if position == "center":
            w = rect.width * 0.6
            h = w * (img.height / img.width)
            if h > rect.height * 0.6:
                h = rect.height * 0.6
                w = h * (img.width / img.height)
            target = fitz.Rect(
                (rect.width - w) / 2,
                (rect.height - h) / 2,
                (rect.width + w) / 2,
                (rect.height + h) / 2,
            )
            page.insert_image(target, stream=png_bytes, overlay=True, keep_proportion=True)
        else:
            tile_w = rect.width * 0.25
            tile_h = tile_w * (img.height / img.width)
            x = 0.0
            while x < rect.width:
                y = 0.0
                while y < rect.height:
                    page.insert_image(
                        fitz.Rect(x, y, x + tile_w, y + tile_h),
                        stream=png_bytes,
                        overlay=True,
                        keep_proportion=True,
                    )
                    y += tile_h
                x += tile_w
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()


def add_page_numbers(
    file_path: str,
    output_path: str,
    template: str = "Page {n} of {total}",
    position: str = "bottom-center",
    font_size: int = 10,
    start_from: int = 1,
    margin: int = 40,
    color: list[int] = (0, 0, 0),
):
    """Add page numbers. position: top/bottom + left/center/right."""
    doc = fitz.open(file_path)
    total = doc.page_count
    rgb = _normalize_color(color)
    for i, page in enumerate(doc):
        n = i + start_from
        text = template.replace("{n}", str(n)).replace("{total}", str(total))
        rect = page.rect
        if position.startswith("top"):
            y0 = margin
        else:
            y0 = rect.height - margin - font_size * 2
        x0, x1 = 40, rect.width - 40
        align = fitz.TEXT_ALIGN_CENTER
        if position.endswith("left"):
            align = fitz.TEXT_ALIGN_LEFT
        elif position.endswith("right"):
            align = fitz.TEXT_ALIGN_RIGHT
        page.insert_textbox(
            fitz.Rect(x0, y0, x1, y0 + font_size * 2),
            text,
            fontsize=font_size,
            fontname="helv",
            color=rgb,
            align=align,
            overlay=True,
        )
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()


def protect_pdf(
    file_path: str,
    output_path: str,
    password: str,
    allow_print: bool = True,
    allow_copy: bool = True,
    allow_modify: bool = True,
):
    doc = fitz.open(file_path)
    permissions = 0
    if allow_print:
        permissions |= fitz.PDF_PERM_PRINT
    if allow_copy:
        permissions |= fitz.PDF_PERM_COPY
    if allow_modify:
        permissions |= fitz.PDF_PERM_MODIFY | fitz.PDF_PERM_ANNOTATE
    doc.save(
        output_path,
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw=password,
        owner_pw=password,
        permissions=permissions,
    )
    doc.close()


def needs_password(file_path: str) -> bool:
    doc = fitz.open(file_path)
    try:
        return bool(doc.needs_pass)
    finally:
        doc.close()


def unlock_pdf(file_path: str, output_path: str, password: str):
    doc = fitz.open(file_path)
    if doc.needs_pass and not doc.authenticate(password):
        doc.close()
        raise ValueError("Incorrect password")
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()


def pdf_to_images(file_path: str, output_path: str, fmt: str = "png", dpi: int = 150):
    import zipfile

    fmt = "jpg" if fmt.lower() in ("jpeg", "jpg") else "png"
    doc = fitz.open(file_path)
    try:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=dpi)
                if fmt == "png":
                    data = pix.tobytes("png")
                else:
                    data = pix.tobytes("jpeg", jpg_quality=85)
                zf.writestr(f"{i + 1:03d}.{fmt}", data)
    finally:
        doc.close()
