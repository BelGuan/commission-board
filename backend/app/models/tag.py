from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, ForeignKey, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import TagCategory
from app.models.types import enum_column

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile

artist_tags = Table(
    "artist_tags",
    Base.metadata,
    Column(
        "artist_id",
        String(36),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
    Column(
        "tag_id",
        String(36),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
)

class Tag(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("category", "slug", name="uq_tag_category_slug"),
    )

    slug: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[TagCategory] = mapped_column(
        enum_column(TagCategory, "tag_category"), index=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_restricted: Mapped[bool] = mapped_column(
        Boolean, default=False, index=True, nullable=False
    )

    artists: Mapped[list[ArtistProfile]] = relationship(
        secondary=artist_tags,
        back_populates="tags",
    )

    def __repr__(self) -> str:
        return f"<Tag {self.category.value}:{self.slug}>"
