from __future__ import annotations

from fastapi import APIRouter, Response
from sqlalchemy import select

from app.core.security import DbSession
from app.models import Tag, TagCategory
from app.schemas.tag import TagRead, TagVocabulary

router = APIRouter(tags=["tags"])

@router.get("/tags", response_model=TagVocabulary, summary="All tags, grouped by category")
def list_tags(db: DbSession, response: Response) -> TagVocabulary:
    response.headers["Cache-Control"] = "public, max-age=3600"

    rows = db.scalars(select(Tag).order_by(Tag.category, Tag.label)).all()
    grouped: dict[TagCategory, list[TagRead]] = {
        TagCategory.STYLE: [],
        TagCategory.CONTENT: [],
        TagCategory.COMMISSION_TYPE: [],
    }
    for tag in rows:
        grouped[tag.category].append(TagRead.model_validate(tag))

    return TagVocabulary(
        styles=grouped[TagCategory.STYLE],
        content_tags=grouped[TagCategory.CONTENT],
        commission_types=grouped[TagCategory.COMMISSION_TYPE],
    )
