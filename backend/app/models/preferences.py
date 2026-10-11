from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.types import money_column

if TYPE_CHECKING:
    from app.models.user import User

class UserPreferences(UUIDPrimaryKeyMixin, TimestampMixin, Base):

    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    preferred_style_tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    preferred_content_tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    excluded_content_tags: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    preferred_commission_types: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )

    budget_min: Mapped[Decimal | None] = mapped_column(money_column(), nullable=True)
    budget_max: Mapped[Decimal | None] = mapped_column(money_column(), nullable=True)

    show_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreferences user={self.user_id}>"
