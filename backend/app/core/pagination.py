from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

T = TypeVar("T")

DEFAULT_PAGE_SIZE: int = 12
MAX_PAGE_SIZE: int = 100

class PageParams(BaseModel):

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size

def count_query(db: Session, statement: Select) -> int:
    subquery = statement.order_by(None).subquery()
    total = db.scalar(select(func.count()).select_from(subquery))
    return int(total or 0)

def paginate(db: Session, statement: Select, params: PageParams) -> tuple[list, int]:
    total = count_query(db, statement)
    rows = db.execute(statement.offset(params.offset).limit(params.limit)).scalars().all()
    return list(rows), total
