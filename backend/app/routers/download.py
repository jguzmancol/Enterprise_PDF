import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.file_service import get_result_path_for_id

router = APIRouter()


@router.get("/download/{download_id}")
async def download_result(download_id: str, filename: str = "result.pdf"):
    path = get_result_path_for_id(download_id)
    if not path:
        raise HTTPException(status_code=404, detail="Result not found")

    _, ext = os.path.splitext(path)
    base, user_ext = os.path.splitext(filename)
    if not user_ext and ext:
        filename = f"{filename}{ext}"

    return FileResponse(path, media_type="application/pdf", filename=filename)
