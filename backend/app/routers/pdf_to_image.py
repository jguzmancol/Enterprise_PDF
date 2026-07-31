import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas import PdfToImageRequest, ResultResponse
from app.services.file_service import generate_id, get_result_path, get_upload_path
from app.services.pdf_service import pdf_to_images

router = APIRouter()


@router.post("/pdf-to-image", response_model=ResultResponse)
async def pdf_to_image_endpoint(req: PdfToImageRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    fmt = req.format.lower()
    if fmt not in ("png", "jpg", "jpeg"):
        raise HTTPException(status_code=400, detail="Format must be 'png' or 'jpg'")
    if not (50 <= req.dpi <= 400):
        raise HTTPException(status_code=400, detail="DPI must be 50-400")

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id, ext=".zip")
        await asyncio.to_thread(pdf_to_images, path, output_path, fmt=fmt, dpi=req.dpi)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF to image failed: {e}")

    return ResultResponse(download_id=download_id, filename="images.zip")
