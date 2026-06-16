from fastapi import APIRouter, HTTPException

from app.schemas import MergeRequest, MergePagesRequest, ResultResponse
from app.services.file_service import get_upload_path, get_result_path, generate_id
from app.services.pdf_service import merge_pdfs, merge_specific_pages, get_page_count

router = APIRouter()


@router.post("/merge", response_model=ResultResponse)
async def merge_endpoint(req: MergeRequest):
    paths = []
    for fid in req.file_ids:
        p = get_upload_path(fid)
        if not p:
            raise HTTPException(status_code=404, detail=f"File {fid} not found")
        paths.append(p)

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        merge_pdfs(paths, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Merge failed: {e}")
    return ResultResponse(download_id=download_id, filename="merged.pdf")


@router.post("/merge-pages", response_model=ResultResponse)
async def merge_pages_endpoint(req: MergePagesRequest):
    file_pages = []
    for fp in req.file_pages:
        path = get_upload_path(fp.file_id)
        if not path:
            raise HTTPException(status_code=404, detail=f"File {fp.file_id} not found")
        if fp.page < 1:
            raise HTTPException(status_code=400, detail="Page must be >= 1")
        page_count = get_page_count(path)
        if fp.page > page_count:
            raise HTTPException(
                status_code=400,
                detail=f"Page {fp.page} out of range (1-{page_count}) for file {fp.file_id}",
            )
        file_pages.append((path, fp.page))

    try:
        download_id = generate_id()
        output_path = get_result_path(download_id)
        merge_specific_pages(file_pages, output_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Merge failed: {e}")
    return ResultResponse(download_id=download_id, filename="merged.pdf")
