from fastapi import APIRouter, HTTPException

from app.schemas import SplitRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import split_pdf, get_page_count

router = APIRouter()


@router.post("/split", response_model=ResultResponse)
async def split_endpoint(req: SplitRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    page_count = get_page_count(path)
    for r in req.ranges:
        if len(r) != 2:
            raise HTTPException(status_code=400, detail="Each range must have start and end")
        start, end = r
        if start < 1 or end < 1 or start > end:
            raise HTTPException(status_code=400, detail=f"Invalid range [{start}, {end}]")
        if start > page_count or end > page_count:
            raise HTTPException(
                status_code=400,
                detail=f"Range [{start}, {end}] out of bounds (1-{page_count})",
            )

    download_id = generate_id()
    output_path = get_result_path(download_id)
    split_pdf(path, req.ranges, output_path)
    return ResultResponse(download_id=download_id, filename=req.filename)
