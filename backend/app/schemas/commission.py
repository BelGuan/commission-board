from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.core.sanitize import CleanText, CleanTextOptional
from app.models.enums import CommissionStatus
from app.schemas.common import ApiModel
from app.schemas.user import UserPublic

class CommissionCreate(ApiModel):

    artist_handle: str = Field(min_length=1, max_length=50)
    offering_id: str | None = None
    title: CleanText = Field(min_length=3, max_length=200)
    message: CleanTextOptional = Field(default=None, max_length=5000)
    proposed_price: Decimal | None = Field(default=None, ge=0, le=Decimal("99999999.99"))

class CommissionStatusUpdate(ApiModel):

    status: CommissionStatus
    agreed_price: Decimal | None = Field(default=None, ge=0, le=Decimal("99999999.99"))

class CommissionRead(ApiModel):

    id: str
    artist_id: str
    artist_handle: str
    client_id: str
    offering_id: str | None = None
    title: str
    brief: str | None = None
    status: CommissionStatus
    agreed_price: Decimal | None = None
    requested_at: datetime
    completed_at: datetime | None = None
    created_at: datetime

    artist_user: UserPublic | None = None
    client: UserPublic | None = None
    reviewed_by_me: bool = False
