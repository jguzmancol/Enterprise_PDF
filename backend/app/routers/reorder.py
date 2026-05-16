from fastapi import APIRouter, HTTPException

from app.schemas import ReorderRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import reorder_pages, get_page_count

router = APIRouter()


@router.post("/reorder", response_model=ResultResponse)
async def reorder_endpoint(req: ReorderRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    page_count = get_page_count(path)
    if sorted(req.order) != list(range(1, page_count + 1)):
        raise HTTPException(status_code=400, detail="Order must include all pages exactly once")

    download_id = generate_id()
    output_path = get_result_path(download_id)
    reorder_pages(path, req.order, output_path)
    return ResultResponse(download_id=download_id, filename="reordered.pdf")
