import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas import PageNumbersRequest, ResultResponse
from app.services.file_service import generate_id, get_result_path, get_upload_path
from app.services.pdf_service import add_page_numbers

router = APIRouter()

_VALID_POSITIONS = (
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
)


@router.post("/page-numbers", response_model=ResultResponse)
async def page_numbers_endpoint(req: PageNumbersRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if req.position not in _VALID_POSITIONS:
        raise HTTPException(
            status_code=400,
            detail="Position must be top/bottom + left/center/right",
        )
    if len(req.color) != 3:
        raise HTTPException(status_code=400, detail="Color must be [r, g, b]")
    if req.start_from < 1:
        raise HTTPException(status_code=400, detail="start_from must be >= 1")

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        await asyncio.to_thread(
            add_page_numbers,
            path,
            output_path,
            template=req.template,
            position=req.position,
            font_size=req.font_size,
            start_from=req.start_from,
            margin=req.margin,
            color=req.color,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Page numbers failed: {e}")
    return ResultResponse(download_id=download_id, filename="numbered.pdf")
