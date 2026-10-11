from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ReviewSubjectType
from app.models.types import enum_column

if TYPE_CHECKING:
    from app.models.commission import Commission
    from app.models.user import User

class Review(UUIDPrimaryKeyMixin, TimestampMixin, Base):

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint(
            "author_id",
            "subject_user_id",
            "commission_id",
            name="uq_review_author_subject_commission",
        ),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
        CheckConstraint("author_id != subject_user_id", name="ck_review_no_self_review"),
        Index("ix_reviews_subject_user_type", "subject_user_id", "subject_type"),
    )

    author_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    subject_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    subject_type: Mapped[ReviewSubjectType] = mapped_column(
        enum_column(ReviewSubjectType, "review_subject_type"), index=True, nullable=False
    )
    commission_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commissions.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)

    sub_ratings: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    would_work_again: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    author: Mapped[User] = relationship(
        back_populates="reviews_written", foreign_keys=[author_id]
    )
    subject_user: Mapped[User] = relationship(
        back_populates="reviews_received", foreign_keys=[subject_user_id]
    )
    commission: Mapped[Commission | None] = relationship(back_populates="reviews")

    @property
    def is_verified(self) -> bool:
        return self.commission_id is not None

    def __repr__(self) -> str:
        return f"<Review {self.rating} star {self.subject_type.value}>"
