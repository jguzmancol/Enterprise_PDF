from fastapi import APIRouter, HTTPException

from app.schemas import MergeRequest, MergePagesRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import merge_pdfs, merge_specific_pages

router = APIRouter()


@router.post("/merge", response_model=ResultResponse)
async def merge_endpoint(req: MergeRequest):
    paths = []
    for fid in req.file_ids:
        p = get_upload_path(fid)
        if not p:
            raise HTTPException(status_code=404, detail=f"File {fid} not found")
        paths.append(p)

    download_id = generate_id()
    output_path = get_result_path(download_id)
    merge_pdfs(paths, output_path)
    return ResultResponse(download_id=download_id, filename="merged.pdf")


@router.post("/merge-pages", response_model=ResultResponse)
async def merge_pages_endpoint(req: MergePagesRequest):
    file_pages = []
    for fp in req.file_pages:
        path = get_upload_path(fp.file_id)
        if not path:
            raise HTTPException(status_code=404, detail=f"File {fp.file_id} not found")
        file_pages.append((path, fp.page))

    download_id = generate_id()
    output_path = get_result_path(download_id)
    merge_specific_pages(file_pages, output_path)
    return ResultResponse(download_id=download_id, filename="merged.pdf")
