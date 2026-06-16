import os
import uuid
from pathlib import Path

from app.config import SESSIONS_DIR


def _safe_id(id_value: str) -> bool:
    return not (".." in id_value or "/" in id_value or "\\" in id_value)


def save_upload(file_id: str, filename: str, content: bytes) -> str:
    if not _safe_id(file_id):
        raise ValueError("Invalid file_id")
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    path = os.path.join(SESSIONS_DIR, file_id)
    Path(path).write_bytes(content)
    return path


def get_upload_path(file_id: str) -> str | None:
    if not _safe_id(file_id):
        return None
    path = os.path.join(SESSIONS_DIR, file_id)
    return path if os.path.isfile(path) else None


def get_preview_path(file_id: str, page: int) -> str:
    if not _safe_id(file_id):
        raise ValueError("Invalid file_id")
    dir_path = os.path.join(SESSIONS_DIR, "previews", file_id)
    os.makedirs(dir_path, exist_ok=True)
    return os.path.join(dir_path, f"{page}.png")


def get_result_path(download_id: str, ext: str = ".pdf") -> str:
    if not _safe_id(download_id):
        raise ValueError("Invalid download_id")
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    return os.path.join(SESSIONS_DIR, f"result_{download_id}{ext}")


def get_result_path_for_id(download_id: str) -> str | None:
    if not _safe_id(download_id):
        return None
    for fname in os.listdir(SESSIONS_DIR):
        if fname.startswith(f"result_{download_id}."):
            return os.path.join(SESSIONS_DIR, fname)
    return None


def generate_id() -> str:
    return uuid.uuid4().hex
