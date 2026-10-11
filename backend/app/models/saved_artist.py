from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User

class SavedArtist(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "saved_artists"
    __table_args__ = (
        UniqueConstraint("user_id", "artist_id", name="uq_saved_artist_user_artist"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    artist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="saved_artists")

    def __repr__(self) -> str:
        return f"<SavedArtist user={self.user_id} artist={self.artist_id}>"
