from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from pydantic import EmailStr, Field, field_validator

from app.core.sanitize import CleanTextOptional
from app.schemas.common import ApiModel

if TYPE_CHECKING:
    from app.schemas.artist import ArtistProfileRead

USERNAME_PATTERN = r"^[a-zA-Z0-9_]+$"

class RegisterRequest(ApiModel):

    email: EmailStr
    username: str = Field(min_length=3, max_length=30, pattern=USERNAME_PATTERN)
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)
    is_artist: bool = False

    @field_validator("password")
    @classmethod
    def _password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value

class LoginRequest(ApiModel):

    email: EmailStr
    password: str

class UserUpdate(ApiModel):

    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    bio: CleanTextOptional = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=500)
    age_verified: bool | None = None

class UserRead(ApiModel):

    id: str
    email: EmailStr
    username: str
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    is_artist: bool
    is_admin: bool
    age_verified: bool
    created_at: datetime
    last_active_at: datetime | None = None

class UserPublic(ApiModel):

    id: str
    username: str
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    is_artist: bool
    created_at: datetime

class UserWithProfile(UserRead):

    artist_profile: ArtistProfileRead | None = None

class AuthResponse(ApiModel):

    user: UserRead
    access_token: str
    token_type: str = "bearer"

class PreferencesRead(ApiModel):

    preferred_style_tags: list[str] = Field(default_factory=list)
    preferred_content_tags: list[str] = Field(default_factory=list)
    excluded_content_tags: list[str] = Field(default_factory=list)
    preferred_commission_types: list[str] = Field(default_factory=list)
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    show_restricted: bool = False

class PreferencesUpdate(ApiModel):

    preferred_style_tags: list[str] | None = None
    preferred_content_tags: list[str] | None = None
    excluded_content_tags: list[str] | None = None
    preferred_commission_types: list[str] | None = None
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    show_restricted: bool | None = None

class SavedArtistRead(ApiModel):

    id: str
    artist_id: str
    handle: str
    display_name: str
    avatar_url: str | None = None
    price_min: Decimal
    price_max: Decimal
    is_open: bool
    rating_avg: Decimal
    created_at: datetime

class SavedArtistCreate(ApiModel):

    artist_handle: str = Field(min_length=1, max_length=50)
