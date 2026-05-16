from fastapi import APIRouter, UploadFile, File

from app.schemas import UploadResponse, FileInfo
from app.services.file_service import save_upload, generate_id
from app.services.pdf_service import get_page_count

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: list[UploadFile] = File(...)):
    result = []
    for f in files:
        content = await f.read()
        file_id = generate_id()
        saved_path = save_upload(file_id, f.filename or "unnamed.pdf", content)
        page_count = get_page_count(saved_path)
        result.append(
            FileInfo(
                id=file_id,
                original_name=f.filename or "unnamed.pdf",
                page_count=page_count,
                size_bytes=len(content),
            )
        )
    return UploadResponse(files=result)
