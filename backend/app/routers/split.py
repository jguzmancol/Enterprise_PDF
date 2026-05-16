from fastapi import APIRouter, HTTPException

from app.schemas import SplitRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import split_pdf

router = APIRouter()


@router.post("/split", response_model=ResultResponse)
async def split_endpoint(req: SplitRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    download_id = generate_id()
    output_path = get_result_path(download_id)
    split_pdf(path, req.ranges, output_path)
    return ResultResponse(download_id=download_id, filename=req.filename)
