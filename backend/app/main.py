import asyncio
import os
import time
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import SESSIONS_DIR, PREVIEWS_DIR, SESSION_TTL_MINUTES
from app.routers import upload, preview, merge, split, compress, rotate, reorder, download, image


def cleanup_old_files(directory: str, ttl_seconds: int):
    now = time.time()
    if not os.path.isdir(directory):
        return
    for entry in os.listdir(directory):
        path = os.path.join(directory, entry)
        try:
            if os.path.isfile(path) and now - os.path.getmtime(path) > ttl_seconds:
                os.remove(path)
            elif os.path.isdir(path) and now - os.path.getmtime(path) > ttl_seconds:
                shutil.rmtree(path, ignore_errors=True)
        except OSError:
            pass


async def cleanup_task():
    ttl = SESSION_TTL_MINUTES * 60
    while True:
        await asyncio.sleep(ttl)
        cleanup_old_files(SESSIONS_DIR, ttl)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(SESSIONS_DIR, exist_ok=True)
    os.makedirs(PREVIEWS_DIR, exist_ok=True)
    task = asyncio.create_task(cleanup_task())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(preview.router, prefix="/api", tags=["preview"])
app.include_router(merge.router, prefix="/api", tags=["merge"])
app.include_router(split.router, prefix="/api", tags=["split"])
app.include_router(compress.router, prefix="/api", tags=["compress"])
app.include_router(rotate.router, prefix="/api", tags=["rotate"])
app.include_router(reorder.router, prefix="/api", tags=["reorder"])
app.include_router(download.router, prefix="/api", tags=["download"])
app.include_router(image.router, prefix="/api", tags=["image"])
