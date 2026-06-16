from pydantic import BaseModel


class FileInfo(BaseModel):
    id: str
    original_name: str
    page_count: int
    size_bytes: int


class UploadResponse(BaseModel):
    files: list[FileInfo]
    ttl_seconds: int


class MergeRequest(BaseModel):
    file_ids: list[str]


class SplitRequest(BaseModel):
    file_id: str
    ranges: list[list[int]]
    filename: str = "split.pdf"


class CompressRequest(BaseModel):
    file_id: str
    level: int = 2


class RotateRequest(BaseModel):
    file_id: str
    pages: list[int]
    angle: int  # 90, 180, 270


class RotatePageRequest(BaseModel):
    file_id: str
    page: int  # 1-based, rotated 90° in-place


class ReorderRequest(BaseModel):
    file_id: str
    order: list[int]


class FilePage(BaseModel):
    file_id: str
    page: int  # 1-based


class MergePagesRequest(BaseModel):
    file_pages: list[FilePage]


class FileIdRequest(BaseModel):
    file_id: str


class ResultResponse(BaseModel):
    download_id: str
    filename: str
