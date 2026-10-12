from __future__ import annotations

from app.schemas.common import ApiModel

class UploadResponse(ApiModel):

    url: str
    filename: str
    size: int
    content_type: str
