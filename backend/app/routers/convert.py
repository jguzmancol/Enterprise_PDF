import asyncio

from fastapi import APIRouter, HTTPException

from app.config import MAX_CONVERT_PAGES
from app.schemas import FileIdRequest, ResultResponse
from app.services.convert_service import (
    get_page_count,
    pdf_to_docx,
    pdf_to_xlsx,
    run_conversion,
)
from app.services.file_service import generate_id, get_result_path, get_upload_path

router = APIRouter()


def _check_page_limit(path: str):
    page_count = get_page_count(path)
    if page_count > MAX_CONVERT_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many pages for conversion (max {MAX_CONVERT_PAGES})",
        )


@router.post("/to-docx", response_model=ResultResponse)
async def to_docx_endpoint(req: FileIdRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    _check_page_limit(path)
    try:
        download_id = generate_id()
        output_path = get_result_path(download_id, ext=".docx")
        await asyncio.to_thread(run_conversion, pdf_to_docx, path, output_path)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX conversion failed: {e}")
    return ResultResponse(download_id=download_id, filename="converted.docx")


@router.post("/to-xlsx", response_model=ResultResponse)
async def to_xlsx_endpoint(req: FileIdRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    _check_page_limit(path)
    try:
        download_id = generate_id()
        output_path = get_result_path(download_id, ext=".xlsx")
        await asyncio.to_thread(run_conversion, pdf_to_xlsx, path, output_path)
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"XLSX conversion failed: {e}")
    return ResultResponse(download_id=download_id, filename="converted.xlsx")
