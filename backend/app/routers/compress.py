from fastapi import APIRouter, HTTPException

from app.schemas import CompressRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import compress_pdf

router = APIRouter()


@router.post("/compress", response_model=ResultResponse)
async def compress_endpoint(req: CompressRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if req.level < 0 or req.level > 3:
        raise HTTPException(status_code=400, detail="Level must be 0-3")

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        compress_pdf(path, output_path, level=req.level)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Compression failed: {e}")
    return ResultResponse(download_id=download_id, filename="compressed.pdf")
