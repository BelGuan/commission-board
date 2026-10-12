from __future__ import annotations

from pydantic import Field

from app.models.enums import TagCategory
from app.schemas.common import ApiModel

class TagRead(ApiModel):

    id: str
    slug: str
    label: str
    category: TagCategory
    description: str | None = None
    is_restricted: bool = False

class TagVocabulary(ApiModel):

    styles: list[TagRead] = Field(default_factory=list)
    content_tags: list[TagRead] = Field(default_factory=list)
    commission_types: list[TagRead] = Field(default_factory=list)
