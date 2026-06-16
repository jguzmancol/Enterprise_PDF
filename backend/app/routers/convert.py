from fastapi import APIRouter, HTTPException

from app.schemas import FileIdRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.convert_service import pdf_to_docx, pdf_to_xlsx

router = APIRouter()


@router.post("/to-docx", response_model=ResultResponse)
async def to_docx_endpoint(req: FileIdRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        download_id = generate_id()
        output_path = get_result_path(download_id, ext=".docx")
        pdf_to_docx(path, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX conversion failed: {e}")
    return ResultResponse(download_id=download_id, filename="converted.docx")


@router.post("/to-xlsx", response_model=ResultResponse)
async def to_xlsx_endpoint(req: FileIdRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        download_id = generate_id()
        output_path = get_result_path(download_id, ext=".xlsx")
        pdf_to_xlsx(path, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"XLSX conversion failed: {e}")
    return ResultResponse(download_id=download_id, filename="converted.xlsx")
