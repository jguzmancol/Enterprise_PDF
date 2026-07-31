import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas import ProtectRequest, ResultResponse, UnlockRequest
from app.services.file_service import generate_id, get_result_path, get_upload_path
from app.services.pdf_service import needs_password, protect_pdf, unlock_pdf

router = APIRouter()


@router.post("/protect", response_model=ResultResponse)
async def protect_endpoint(req: ProtectRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        await asyncio.to_thread(
            protect_pdf,
            path,
            output_path,
            password=req.password,
            allow_print=req.allow_print,
            allow_copy=req.allow_copy,
            allow_modify=req.allow_modify,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Protect failed: {e}")
    return ResultResponse(download_id=download_id, filename="protected.pdf")


@router.post("/unlock", response_model=ResultResponse)
async def unlock_endpoint(req: UnlockRequest):
    path = get_upload_path(req.file_id)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")

    if not req.password:
        raise HTTPException(status_code=400, detail="Password is required")

    try:
        if not await asyncio.to_thread(needs_password, path):
            raise HTTPException(status_code=400, detail="File is not password protected")
        download_id = generate_id()
        output_path = get_result_path(download_id)
        await asyncio.to_thread(unlock_pdf, path, output_path, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unlock failed: {e}")
    return ResultResponse(download_id=download_id, filename="unlocked.pdf")
