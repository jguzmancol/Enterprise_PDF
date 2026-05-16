import os
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas import ResultResponse
from app.config import MAX_FILES_PER_UPLOAD
from app.services.file_service import (
    get_result_path,
    generate_id,
    SESSIONS_DIR,
)
from app.services.image_service import images_to_pdf

router = APIRouter()


@router.post("/to-pdf", response_model=ResultResponse)
async def to_pdf_endpoint(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No images provided")
    if len(files) > MAX_FILES_PER_UPLOAD:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_FILES_PER_UPLOAD} files per upload",
        )

    temp_paths = []
    for f in files:
        if not f.filename:
            continue
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format: {ext}",
            )
        fid = generate_id()
        path = os.path.join(SESSIONS_DIR, f"img_{fid}{ext}")
        content = await f.read()
        with open(path, "wb") as out:
            out.write(content)
        temp_paths.append(path)

    download_id = generate_id()
    output_path = get_result_path(download_id)
    try:
        images_to_pdf(temp_paths, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        for p in temp_paths:
            try:
                os.remove(p)
            except OSError:
                pass

    return ResultResponse(download_id=download_id, filename="converted.pdf")

