from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from sqlalchemy import Select, and_, case, desc, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    ArtistProfile,
    Review,
    ReviewSubjectType,
    Tag,
    TagCategory,
    User,
    UserPreferences,
    artist_tags,
)
from app.schemas.artist import RatingBucket

SORT_OPTIONS = ("recommended", "rating", "price_low", "price_high", "newest")

@dataclass(slots=True)
class ArtistFilters:

    styles: list[str] = field(default_factory=list)
    content_tags: list[str] = field(default_factory=list)
    commission_types: list[str] = field(default_factory=list)
    price_min: Decimal | None = None
    price_max: Decimal | None = None
    max_turnaround_days: int | None = None
    open_only: bool = False
    q: str = ""
    sort: str = "recommended"
    include_restricted: bool = False

def _has_tag_in(category: TagCategory, slugs: list[str]):
    return ArtistProfile.tags.any(
        and_(Tag.category == category, Tag.slug.in_(slugs))
    )

def _tag_match_count(category: TagCategory, slugs: list[str]):
    return (
        select(func.count())
        .select_from(artist_tags)
        .join(Tag, Tag.id == artist_tags.c.tag_id)
        .where(
            artist_tags.c.artist_id == ArtistProfile.id,
            Tag.category == category,
            Tag.slug.in_(slugs),
        )
        .scalar_subquery()
    )

def _apply_restricted_gate(stmt: Select, allowed: bool) -> Select:
    if allowed:
        return stmt
    return stmt.where(~ArtistProfile.tags.any(Tag.is_restricted.is_(True)))

def restricted_allowed(user: User | None, include_restricted: bool) -> bool:
    return bool(user and user.age_verified and include_restricted)

def _apply_filters(stmt: Select, f: ArtistFilters) -> Select:
    if f.styles:
        stmt = stmt.where(_has_tag_in(TagCategory.STYLE, f.styles))
    if f.content_tags:
        stmt = stmt.where(_has_tag_in(TagCategory.CONTENT, f.content_tags))
    if f.commission_types:
        stmt = stmt.where(_has_tag_in(TagCategory.COMMISSION_TYPE, f.commission_types))

    if f.price_min is not None:
        stmt = stmt.where(ArtistProfile.price_max >= f.price_min)
    if f.price_max is not None:
        stmt = stmt.where(ArtistProfile.price_min <= f.price_max)

    if f.max_turnaround_days is not None:
        stmt = stmt.where(ArtistProfile.turnaround_days <= f.max_turnaround_days)
    if f.open_only:
        stmt = stmt.where(ArtistProfile.is_open.is_(True))

    if f.q.strip():
        needle = f"%{f.q.strip()}%"
        stmt = stmt.where(
            or_(
                User.display_name.ilike(needle),
                ArtistProfile.handle.ilike(needle),
                ArtistProfile.tagline.ilike(needle),
                User.bio.ilike(needle),
            )
        )
    return stmt

def _recommended_score(prefs: UserPreferences):
    score = ArtistProfile.rating_avg

    if prefs.preferred_style_tags:
        score = score + _tag_match_count(TagCategory.STYLE, prefs.preferred_style_tags) * 3
    if prefs.preferred_content_tags:
        score = score + _tag_match_count(TagCategory.CONTENT, prefs.preferred_content_tags) * 2

    if prefs.budget_min is not None or prefs.budget_max is not None:
        low = prefs.budget_min if prefs.budget_min is not None else Decimal("0")
        high = prefs.budget_max if prefs.budget_max is not None else Decimal("99999999.99")
        score = score + case(
            (
                and_(ArtistProfile.price_max >= low, ArtistProfile.price_min <= high),
                2,
            ),
            else_=0,
        )

    return score + case((ArtistProfile.is_open.is_(True), 1), else_=0)

def _apply_sort(stmt: Select, f: ArtistFilters, prefs: UserPreferences | None) -> Select:
    if f.sort == "price_low":
        return stmt.order_by(ArtistProfile.price_min.asc(), ArtistProfile.id.asc())
    if f.sort == "price_high":
        return stmt.order_by(ArtistProfile.price_max.desc(), ArtistProfile.id.asc())
    if f.sort == "newest":
        return stmt.order_by(User.created_at.desc(), ArtistProfile.id.asc())
    if f.sort == "rating":
        return stmt.order_by(
            ArtistProfile.rating_avg.desc(),
            ArtistProfile.review_count.desc(),
            ArtistProfile.id.asc(),
        )

    if prefs is not None and _has_any_preference(prefs):
        return stmt.order_by(desc(_recommended_score(prefs)), ArtistProfile.id.asc())
    return stmt.order_by(
        ArtistProfile.rating_avg.desc(),
        ArtistProfile.review_count.desc(),
        ArtistProfile.id.asc(),
    )

def _has_any_preference(prefs: UserPreferences) -> bool:
    return bool(
        prefs.preferred_style_tags
        or prefs.preferred_content_tags
        or prefs.preferred_commission_types
        or prefs.budget_min is not None
        or prefs.budget_max is not None
    )

def list_artists(
    db: Session,
    filters: ArtistFilters,
    *,
    user: User | None,
    page: int,
    page_size: int,
) -> tuple[list[ArtistProfile], int]:
    allowed = restricted_allowed(user, filters.include_restricted)
    prefs = user.preferences if user is not None else None

    stmt = select(ArtistProfile).join(User, ArtistProfile.user_id == User.id)
    stmt = stmt.where(User.is_active.is_(True))
    stmt = _apply_restricted_gate(stmt, allowed)
    stmt = _apply_filters(stmt, filters)

    if prefs is not None and prefs.excluded_content_tags:
        stmt = stmt.where(
            ~ArtistProfile.tags.any(
                and_(
                    Tag.category == TagCategory.CONTENT,
                    Tag.slug.in_(prefs.excluded_content_tags),
                )
            )
        )

    total = db.scalar(
        select(func.count()).select_from(stmt.order_by(None).subquery())
    )

    stmt = _apply_sort(stmt, filters, prefs)
    stmt = stmt.options(
        selectinload(ArtistProfile.user),
        selectinload(ArtistProfile.tags),
        selectinload(ArtistProfile.sheet_images),
        selectinload(ArtistProfile.portfolio_images),
    )
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    return list(db.scalars(stmt).unique().all()), int(total or 0)

def get_artist_by_handle(db: Session, handle: str) -> ArtistProfile | None:
    return db.scalar(
        select(ArtistProfile)
        .where(func.lower(ArtistProfile.handle) == handle.lower())
        .options(
            selectinload(ArtistProfile.user),
            selectinload(ArtistProfile.tags),
            selectinload(ArtistProfile.offerings),
            selectinload(ArtistProfile.sheet_images),
            selectinload(ArtistProfile.portfolio_images),
        )
    )

def rating_distribution(db: Session, artist_user_id: str) -> list[RatingBucket]:
    rows = db.execute(
        select(Review.rating, func.count())
        .where(
            Review.subject_user_id == artist_user_id,
            Review.subject_type == ReviewSubjectType.ARTIST,
        )
        .group_by(Review.rating)
    ).all()
    counts = {int(stars): int(count) for stars, count in rows}
    return [RatingBucket(stars=stars, count=counts.get(stars, 0)) for stars in range(1, 6)]
