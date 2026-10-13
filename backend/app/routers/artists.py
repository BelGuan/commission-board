from __future__ import annotations

from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.errors import NotFoundError
from app.core.security import DbSession, OptionalUser
from app.schemas.artist import ArtistDetail, ArtistSummary, detail_from_profile, summary_from_profile
from app.schemas.common import ERROR_RESPONSES, Page
from app.services import artist_query as q

router = APIRouter(prefix="/artists", tags=["artists"], responses=ERROR_RESPONSES)

MAX_PAGE_SIZE = 50
DEFAULT_PAGE_SIZE = 12

def _csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]

@router.get(
    "",
    response_model=Page[ArtistSummary],
    summary="Search, filter and sort artists",
)
def list_artists(
    db: DbSession,
    user: OptionalUser,
    styles: Annotated[str | None, Query(description="Comma-separated style slugs; matches ANY")] = None,
    content_tags: Annotated[str | None, Query(description="Comma-separated content slugs; matches ANY")] = None,
    commission_types: Annotated[str | None, Query(description="Comma-separated type slugs; matches ANY")] = None,
    price_min: Annotated[Decimal | None, Query(ge=0, description="Overlaps the artist's range")] = None,
    price_max: Annotated[Decimal | None, Query(ge=0, description="Overlaps the artist's range")] = None,
    max_turnaround_days: Annotated[int | None, Query(ge=1, le=365)] = None,
    open_only: Annotated[bool, Query(description="Only artists currently open")] = False,
    q_: Annotated[str, Query(alias="q", description="Free text over name, handle, tagline, bio")] = "",
    sort: Annotated[str, Query(pattern="^(recommended|rating|price_low|price_high|newest)$")] = "recommended",
    include_restricted: Annotated[bool, Query(description="Requires an age-verified account")] = False,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> Page[ArtistSummary]:
    filters = q.ArtistFilters(
        styles=_csv(styles),
        content_tags=_csv(content_tags),
        commission_types=_csv(commission_types),
        price_min=price_min,
        price_max=price_max,
        max_turnaround_days=max_turnaround_days,
        open_only=open_only,
        q=q_,
        sort=sort,
        include_restricted=include_restricted,
    )

    profiles, total = q.list_artists(
        db, filters, user=user, page=page, page_size=page_size
    )
    allowed = q.restricted_allowed(user, include_restricted)

    return Page[ArtistSummary](
        items=[summary_from_profile(p, include_restricted=allowed) for p in profiles],
        total=total,
        page=page,
        page_size=page_size,
    )

@router.get(
    "/{handle}",
    response_model=ArtistDetail,
    summary="One artist's full public profile",
)
def get_artist(handle: str, db: DbSession, user: OptionalUser,
               include_restricted: Annotated[bool, Query()] = False) -> ArtistDetail:
    profile = q.get_artist_by_handle(db, handle)
    if profile is None:
        raise NotFoundError(f"No artist with handle '{handle}'")

    return detail_from_profile(
        profile,
        rating_distribution=q.rating_distribution(db, profile.user_id),
        include_restricted=q.restricted_allowed(user, include_restricted),
    )
