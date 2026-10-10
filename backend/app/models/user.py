from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile
    from app.models.commission import Commission
    from app.models.preferences import UserPreferences
    from app.models.review import Review
    from app.models.saved_artist import SavedArtist

class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_artist: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    age_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    last_active_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    artist_profile: Mapped[ArtistProfile | None] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        passive_deletes=True,
    )
    preferences: Mapped[UserPreferences | None] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        passive_deletes=True,
    )
    saved_artists: Mapped[list[SavedArtist]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    commissions_as_client: Mapped[list[Commission]] = relationship(
        back_populates="client",
        foreign_keys="Commission.client_id",
    )
    reviews_written: Mapped[list[Review]] = relationship(
        back_populates="author",
        foreign_keys="Review.author_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews_received: Mapped[list[Review]] = relationship(
        back_populates="subject_user",
        foreign_keys="Review.subject_user_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<User {self.username!r}>"
