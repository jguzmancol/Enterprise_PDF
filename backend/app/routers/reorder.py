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
    if len(req.order) == 0:
        raise HTTPException(status_code=400, detail="At least one page required")
    if len(set(req.order)) != len(req.order):
        raise HTTPException(status_code=400, detail="Duplicate pages in order")
    for p in req.order:
        if p < 1 or p > page_count:
            raise HTTPException(
                status_code=400,
                detail=f"Page {p} out of range (1-{page_count})",
            )

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        reorder_pages(path, req.order, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reorder failed: {e}")
    return ResultResponse(download_id=download_id, filename="reordered.pdf")
