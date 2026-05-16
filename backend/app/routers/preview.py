from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.file_service import get_upload_path
from app.services.pdf_service import render_page

router = APIRouter()


@router.get("/preview/{file_id}/{page}")
async def preview_page(file_id: str, page: int):
    path = get_upload_path(file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        png_data = render_page(path, page - 1)
        return Response(
            content=png_data,
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
