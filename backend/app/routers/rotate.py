from fastapi import APIRouter, HTTPException

from app.schemas import RotateRequest, RotatePageRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import rotate_pages, rotate_page_inplace

router = APIRouter()


@router.post("/rotate", response_model=ResultResponse)
async def rotate_endpoint(req: RotateRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if req.angle not in (90, 180, 270):
        raise HTTPException(status_code=400, detail="Angle must be 90, 180, or 270")

    download_id = generate_id()
    output_path = get_result_path(download_id)
    rotate_pages(path, req.pages, req.angle, output_path)
    return ResultResponse(download_id=download_id, filename="rotated.pdf")


@router.post("/rotate-page")
async def rotate_page_endpoint(req: RotatePageRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    rotate_page_inplace(path, req.page)
    return {"success": True}
