from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile

class SheetImage(UUIDPrimaryKeyMixin, TimestampMixin, Base):

    __tablename__ = "sheet_images"

    artist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    artist: Mapped[ArtistProfile] = relationship(back_populates="sheet_images")

    def __repr__(self) -> str:
        return f"<SheetImage {self.id} order={self.sort_order}>"

class PortfolioImage(UUIDPrimaryKeyMixin, TimestampMixin, Base):

    __tablename__ = "portfolio_images"

    artist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    artist: Mapped[ArtistProfile] = relationship(back_populates="portfolio_images")

    def __repr__(self) -> str:
        return f"<PortfolioImage {self.id} order={self.sort_order}>"
