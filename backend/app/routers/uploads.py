from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, status

from app.config import settings
from app.core.errors import PayloadTooLargeError, UnsupportedMediaTypeError
from app.core.security import CurrentUser
from app.schemas.common import ERROR_RESPONSES
from app.schemas.upload import UploadResponse

router = APIRouter(tags=["uploads"], responses=ERROR_RESPONSES)

CHUNK_SIZE = 64 * 1024

def _sniff(head: bytes) -> tuple[str, str] | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    if head.startswith(b"GIF87a") or head.startswith(b"GIF89a"):
        return "image/gif", ".gif"
    if head.startswith(b"RIFF") and head[8:12] == b"WEBP":
        return "image/webp", ".webp"
    return None

def _upload_dir() -> Path:
    directory = Path(settings.UPLOAD_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    return directory

@router.post(
    "/uploads",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image",
)
async def upload_image(user: CurrentUser, file: UploadFile = File(...)) -> UploadResponse:
    head = await file.read(12)
    sniffed = _sniff(head)
    if sniffed is None:
        while await file.read(CHUNK_SIZE):
            pass
        await file.close()
        raise UnsupportedMediaTypeError(
            "Only JPEG, PNG, WebP and GIF images are accepted",
            code="unsupported_image_type",
        )
    content_type, extension = sniffed

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = _upload_dir() / filename
    limit = settings.max_upload_bytes
    written = 0

    try:
        with destination.open("wb") as out:
            out.write(head)
            written += len(head)
            while chunk := await file.read(CHUNK_SIZE):
                written += len(chunk)
                if written > limit:
                    raise PayloadTooLargeError(
                        f"File exceeds the {settings.MAX_UPLOAD_MB}MB limit",
                        code="file_too_large",
                    )
                out.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    return _persist(filename, written, content_type)

def _persist(filename: str, size: int, content_type: str) -> UploadResponse:
    return UploadResponse(
        url=f"/uploads/{filename}",
        filename=filename,
        size=size,
        content_type=content_type,
    )
