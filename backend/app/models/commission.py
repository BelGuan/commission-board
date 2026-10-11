from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin, utcnow
from app.models.enums import CommissionStatus
from app.models.types import enum_column, money_column

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile
    from app.models.offering import CommissionOffering
    from app.models.review import Review
    from app.models.user import User

class Commission(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "commissions"

    artist_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    client_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    offering_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commission_offerings.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CommissionStatus] = mapped_column(
        enum_column(CommissionStatus, "commission_status"),
        default=CommissionStatus.REQUESTED,
        index=True,
        nullable=False,
    )
    agreed_price: Mapped[Decimal | None] = mapped_column(money_column(), nullable=True)

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    artist: Mapped[ArtistProfile] = relationship(
        back_populates="commissions", foreign_keys=[artist_id]
    )
    client: Mapped[User] = relationship(
        back_populates="commissions_as_client", foreign_keys=[client_id]
    )
    offering: Mapped[CommissionOffering | None] = relationship(back_populates="commissions")
    reviews: Mapped[list[Review]] = relationship(back_populates="commission")

    def __repr__(self) -> str:
        return f"<Commission {self.title!r} {self.status.value}>"
