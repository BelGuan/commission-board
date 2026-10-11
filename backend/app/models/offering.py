from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CommissionType
from app.models.types import enum_column, money_column

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile
    from app.models.commission import Commission

class CommissionOffering(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "commission_offerings"

    artist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    commission_type: Mapped[CommissionType] = mapped_column(
        enum_column(CommissionType, "commission_type"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(money_column(), nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, default=14, nullable=False)
    revisions: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    example_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    artist: Mapped[ArtistProfile] = relationship(back_populates="offerings")
    commissions: Mapped[list[Commission]] = relationship(back_populates="offering")

    def __repr__(self) -> str:
        return f"<CommissionOffering {self.title!r} {self.price}>"
