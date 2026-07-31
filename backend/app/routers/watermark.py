import asyncio
import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import MAX_UPLOAD_MB
from app.schemas import ResultResponse, TextWatermarkRequest
from app.services.file_service import generate_id, get_result_path, get_upload_path
from app.services.pdf_service import add_image_watermark, add_text_watermark

router = APIRouter()

_VALID_POSITIONS = ("center", "tile")


@router.post("/watermark-text", response_model=ResultResponse)
async def watermark_text_endpoint(req: TextWatermarkRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if req.position not in _VALID_POSITIONS:
        raise HTTPException(status_code=400, detail="Position must be 'center' or 'tile'")
    if not (0.0 <= req.opacity <= 1.0):
        raise HTTPException(status_code=400, detail="Opacity must be 0-1")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if len(req.color) != 3:
        raise HTTPException(status_code=400, detail="Color must be [r, g, b]")

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        await asyncio.to_thread(
            add_text_watermark,
            path,
            output_path,
            text=req.text,
            opacity=req.opacity,
            font_size=req.font_size,
            color=req.color,
            rotation=req.rotation,
            position=req.position,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Watermark failed: {e}")
    return ResultResponse(download_id=download_id, filename="watermarked.pdf")


@router.post("/watermark-image", response_model=ResultResponse)
async def watermark_image_endpoint(
    file_id: str = Form(...),
    opacity: float = Form(0.5),
    position: str = Form("tile"),
    image: UploadFile = File(...),
):
    path = get_upload_path(file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if position not in _VALID_POSITIONS:
        raise HTTPException(status_code=400, detail="Position must be 'center' or 'tile'")
    if not (0.0 <= opacity <= 1.0):
        raise HTTPException(status_code=400, detail="Opacity must be 0-1")

    ext = os.path.splitext(image.filename or "")[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"):
        raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")

    content = await image.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Image exceeds maximum size of {MAX_UPLOAD_MB} MB",
        )

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        await asyncio.to_thread(
            add_image_watermark,
            path,
            output_path,
            content,
            opacity=opacity,
            position=position,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Watermark failed: {e}")
    return ResultResponse(download_id=download_id, filename="watermarked.pdf")
