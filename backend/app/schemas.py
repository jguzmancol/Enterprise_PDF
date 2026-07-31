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


class TextWatermarkRequest(BaseModel):
    file_id: str
    text: str = "CONFIDENCIAL"
    opacity: float = 0.3
    font_size: int = 60
    color: list[int] = (128, 128, 128)
    rotation: int = 45
    position: str = "center"  # 'center' | 'tile'


class PageNumbersRequest(BaseModel):
    file_id: str
    template: str = "Page {n} of {total}"
    position: str = "bottom-center"  # top/bottom + left/center/right
    font_size: int = 10
    start_from: int = 1
    margin: int = 40
    color: list[int] = (0, 0, 0)


class ProtectRequest(BaseModel):
    file_id: str
    password: str = "12345"
    allow_print: bool = True
    allow_copy: bool = True
    allow_modify: bool = True


class UnlockRequest(BaseModel):
    file_id: str
    password: str


class PdfToImageRequest(BaseModel):
    file_id: str
    format: str = "png"  # 'png' | 'jpg'
    dpi: int = 150
