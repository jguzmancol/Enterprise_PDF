import os
import uuid
from pathlib import Path

from app.config import SESSIONS_DIR


def save_upload(file_id: str, filename: str, content: bytes) -> str:
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    path = os.path.join(SESSIONS_DIR, file_id)
    Path(path).write_bytes(content)
    return path


def get_upload_path(file_id: str) -> str | None:
    path = os.path.join(SESSIONS_DIR, file_id)
    return path if os.path.isfile(path) else None


def get_preview_path(file_id: str, page: int) -> str:
    dir_path = os.path.join(SESSIONS_DIR, "previews", file_id)
    os.makedirs(dir_path, exist_ok=True)
    return os.path.join(dir_path, f"{page}.png")


def get_result_path(download_id: str) -> str:
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    return os.path.join(SESSIONS_DIR, f"result_{download_id}.pdf")


def get_result_path_for_id(download_id: str) -> str | None:
    path = os.path.join(SESSIONS_DIR, f"result_{download_id}.pdf")
    return path if os.path.isfile(path) else None


def generate_id() -> str:
    return uuid.uuid4().hex
