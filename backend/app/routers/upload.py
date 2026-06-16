import os
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas import UploadResponse, FileInfo
from app.config import MAX_UPLOAD_MB, MAX_FILES_PER_UPLOAD, SESSION_TTL_MINUTES
from app.services.file_service import save_upload, generate_id
from app.services.pdf_service import get_page_count

ALLOWED_EXTENSIONS = {".pdf"}

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: list[UploadFile] = File(...)):
    if len(files) > MAX_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_FILES_PER_UPLOAD} files per upload",
        )
    result = []
    for f in files:
        ext = os.path.splitext(f.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Only PDF files are allowed, got '{ext or 'unknown'}'",
            )

        content = await f.read()

        if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size of {MAX_UPLOAD_MB} MB",
            )

        file_id = generate_id()
        saved_path = save_upload(file_id, f.filename or "unnamed.pdf", content)
        try:
            page_count = get_page_count(saved_path)
        except Exception:
            os.remove(saved_path)
            raise HTTPException(
                status_code=400,
                detail="File is not a valid PDF",
            )
        result.append(
            FileInfo(
                id=file_id,
                original_name=f.filename or "unnamed.pdf",
                page_count=page_count,
                size_bytes=len(content),
            )
        )
    return UploadResponse(files=result, ttl_seconds=SESSION_TTL_MINUTES * 60)
