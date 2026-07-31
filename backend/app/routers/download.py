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

    media_types = {
        ".pdf": "application/pdf",
        ".zip": "application/zip",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
    media_type = media_types.get(ext.lower(), "application/octet-stream")
    return FileResponse(path, media_type=media_type, filename=filename)
