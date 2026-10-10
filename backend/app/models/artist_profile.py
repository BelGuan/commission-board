from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.tag import artist_tags
from app.models.types import money_column

if TYPE_CHECKING:
    from app.models.commission import Commission
    from app.models.images import PortfolioImage, SheetImage
    from app.models.offering import CommissionOffering
    from app.models.tag import Tag
    from app.models.user import User

class ArtistProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "artist_profiles"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    handle: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    languages: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    terms_of_service: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_open: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    slots_open: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    slots_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    turnaround_days: Mapped[int] = mapped_column(Integer, default=14, nullable=False)

    price_min: Mapped[Decimal] = mapped_column(
        money_column(), default=Decimal("0.00"), index=True, nullable=False
    )
    price_max: Mapped[Decimal] = mapped_column(
        money_column(), default=Decimal("0.00"), nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    completed_commissions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating_avg: Mapped[Decimal] = mapped_column(
        money_column(), default=Decimal("0.00"), index=True, nullable=False
    )
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped[User] = relationship(back_populates="artist_profile")
    tags: Mapped[list[Tag]] = relationship(secondary=artist_tags, back_populates="artists")
    offerings: Mapped[list[CommissionOffering]] = relationship(
        back_populates="artist",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="CommissionOffering.sort_order",
    )
    sheet_images: Mapped[list[SheetImage]] = relationship(
        back_populates="artist",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="SheetImage.sort_order",
    )
    portfolio_images: Mapped[list[PortfolioImage]] = relationship(
        back_populates="artist",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PortfolioImage.sort_order",
    )
    commissions: Mapped[list[Commission]] = relationship(
        back_populates="artist",
        foreign_keys="Commission.artist_id",
    )

    def __repr__(self) -> str:
        return f"<ArtistProfile @{self.handle}>"
