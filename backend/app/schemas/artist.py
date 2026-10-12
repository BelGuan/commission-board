from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from pydantic import Field, model_validator

from app.models.enums import CommissionType, TagCategory
from app.schemas.common import ApiModel
from app.schemas.tag import TagRead
from app.schemas.user import UserPublic

if TYPE_CHECKING:
    from app.models.artist_profile import ArtistProfile

USERNAME_PATTERN = r"^[a-zA-Z0-9._-]+$"

class OfferingRead(ApiModel):
    id: str
    artist_id: str
    commission_type: CommissionType
    title: str
    description: str | None = None
    price: Decimal
    delivery_days: int
    revisions: int = 1
    example_image_url: str | None = None
    sort_order: int = 0

class OfferingCreate(ApiModel):
    commission_type: CommissionType
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal = Field(ge=0, le=Decimal("99999999.99"))
    delivery_days: int = Field(default=14, ge=1, le=365)
    revisions: int = Field(default=1, ge=0, le=20)
    example_image_url: str | None = Field(default=None, max_length=500)
    sort_order: int = Field(default=0, ge=0)

class OfferingUpdate(ApiModel):

    commission_type: CommissionType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal | None = Field(default=None, ge=0, le=Decimal("99999999.99"))
    delivery_days: int | None = Field(default=None, ge=1, le=365)
    revisions: int | None = Field(default=None, ge=0, le=20)
    example_image_url: str | None = Field(default=None, max_length=500)
    sort_order: int | None = Field(default=None, ge=0)

class ImageRead(ApiModel):
    id: str
    artist_id: str
    url: str
    caption: str | None = None
    sort_order: int = 0
    is_restricted: bool = False

class ImageCreate(ApiModel):
    url: str = Field(min_length=1, max_length=500)
    caption: str | None = Field(default=None, max_length=300)
    sort_order: int = Field(default=0, ge=0)
    is_restricted: bool = False

class ImageUpdate(ApiModel):
    url: str | None = Field(default=None, min_length=1, max_length=500)
    caption: str | None = Field(default=None, max_length=300)
    sort_order: int | None = Field(default=None, ge=0)
    is_restricted: bool | None = None

class ReorderRequest(ApiModel):

    ids: list[str] = Field(min_length=1, max_length=200)

class RatingBucket(ApiModel):
    stars: int
    count: int

class GroupedTags(ApiModel):

    styles: list[TagRead] = Field(default_factory=list)
    content_tags: list[TagRead] = Field(default_factory=list)
    commission_types: list[TagRead] = Field(default_factory=list)

class ArtistProfileRead(ApiModel):

    id: str
    user_id: str
    handle: str
    tagline: str | None = None
    banner_url: str | None = None
    location: str | None = None
    languages: list[str] = Field(default_factory=list)
    terms_of_service: str | None = None
    is_open: bool
    slots_open: int
    slots_total: int
    turnaround_days: int
    price_min: Decimal
    price_max: Decimal
    currency: str
    completed_commissions: int
    rating_avg: Decimal
    review_count: int
    created_at: datetime

class ArtistSummary(ApiModel):

    id: str
    handle: str
    user_id: str
    display_name: str
    avatar_url: str | None = None
    banner_url: str | None = None
    bio: str | None = None
    tagline: str | None = None
    location: str | None = None
    languages: list[str] = Field(default_factory=list)

    styles: list[str] = Field(default_factory=list)
    content_tags: list[str] = Field(default_factory=list)
    commission_types: list[str] = Field(default_factory=list)

    price_min: Decimal
    price_max: Decimal
    currency: str = "USD"

    is_open: bool
    slots_open: int
    slots_total: int
    turnaround_days: int

    rating_avg: Decimal
    review_count: int
    completed_commissions: int

    sheet_images: list[str] = Field(default_factory=list)
    portfolio_images: list[str] = Field(default_factory=list)

    joined_at: datetime
    last_active_at: datetime | None = None
    has_restricted_content: bool = False

class ArtistDetail(ArtistSummary):

    user: UserPublic
    tags: GroupedTags
    terms_of_service: str | None = None
    offerings: list[OfferingRead] = Field(default_factory=list)
    sheet_image_details: list[ImageRead] = Field(default_factory=list)
    portfolio_image_details: list[ImageRead] = Field(default_factory=list)
    rating_distribution: list[RatingBucket] = Field(default_factory=list)

class ArtistProfileUpsert(ApiModel):

    handle: str | None = Field(
        default=None, min_length=3, max_length=50, pattern=USERNAME_PATTERN
    )
    tagline: str | None = Field(default=None, max_length=200)
    bio: str | None = Field(default=None, max_length=2000)
    banner_url: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=120)
    languages: list[str] = Field(default_factory=list, max_length=20)
    terms_of_service: str | None = Field(default=None, max_length=10000)
    is_open: bool = True
    slots_open: int = Field(default=0, ge=0, le=999)
    slots_total: int = Field(default=0, ge=0, le=999)
    turnaround_days: int = Field(default=14, ge=1, le=365)
    price_min: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("99999999.99"))
    price_max: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("99999999.99"))
    currency: str = Field(default="USD", min_length=3, max_length=3)
    tag_slugs: list[str] = Field(default_factory=list, max_length=60)

    @model_validator(mode="after")
    def _check_ranges(self) -> ArtistProfileUpsert:
        if self.price_max < self.price_min:
            raise ValueError("price_max must be greater than or equal to price_min")
        if self.slots_open > self.slots_total:
            raise ValueError("slots_open cannot exceed slots_total")
        return self

def _tag_facets(profile: ArtistProfile, include_restricted: bool):
    facets: dict[TagCategory, list] = {
        TagCategory.STYLE: [],
        TagCategory.CONTENT: [],
        TagCategory.COMMISSION_TYPE: [],
    }
    has_restricted = False
    for tag in profile.tags:
        if tag.is_restricted:
            has_restricted = True
            if not include_restricted:
                continue
        facets[tag.category].append(tag)
    return facets, has_restricted

def _visible_images(images, include_restricted: bool):
    return [img for img in images if include_restricted or not img.is_restricted]

def summary_from_profile(
    profile: ArtistProfile, *, include_restricted: bool = False
) -> ArtistSummary:
    facets, has_restricted = _tag_facets(profile, include_restricted)
    user = profile.user
    return ArtistSummary(
        id=profile.id,
        handle=profile.handle,
        user_id=profile.user_id,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        banner_url=profile.banner_url,
        bio=user.bio,
        tagline=profile.tagline,
        location=profile.location,
        languages=list(profile.languages or []),
        styles=[t.slug for t in facets[TagCategory.STYLE]],
        content_tags=[t.slug for t in facets[TagCategory.CONTENT]],
        commission_types=[t.slug for t in facets[TagCategory.COMMISSION_TYPE]],
        price_min=profile.price_min,
        price_max=profile.price_max,
        currency=profile.currency,
        is_open=profile.is_open,
        slots_open=profile.slots_open,
        slots_total=profile.slots_total,
        turnaround_days=profile.turnaround_days,
        rating_avg=profile.rating_avg,
        review_count=profile.review_count,
        completed_commissions=profile.completed_commissions,
        sheet_images=[i.url for i in _visible_images(profile.sheet_images, include_restricted)],
        portfolio_images=[
            i.url for i in _visible_images(profile.portfolio_images, include_restricted)
        ],
        joined_at=user.created_at,
        last_active_at=user.last_active_at,
        has_restricted_content=has_restricted,
    )

def detail_from_profile(
    profile: ArtistProfile,
    *,
    rating_distribution: list[RatingBucket],
    include_restricted: bool = False,
) -> ArtistDetail:
    facets, _ = _tag_facets(profile, include_restricted)
    base = summary_from_profile(profile, include_restricted=include_restricted)
    sheets = _visible_images(profile.sheet_images, include_restricted)
    folio = _visible_images(profile.portfolio_images, include_restricted)

    return ArtistDetail(
        **base.model_dump(),
        user=UserPublic.model_validate(profile.user),
        tags=GroupedTags(
            styles=[TagRead.model_validate(t) for t in facets[TagCategory.STYLE]],
            content_tags=[TagRead.model_validate(t) for t in facets[TagCategory.CONTENT]],
            commission_types=[
                TagRead.model_validate(t) for t in facets[TagCategory.COMMISSION_TYPE]
            ],
        ),
        terms_of_service=profile.terms_of_service,
        offerings=[
            OfferingRead.model_validate(o)
            for o in sorted(profile.offerings, key=lambda o: o.sort_order)
        ],
        sheet_image_details=[ImageRead.model_validate(i) for i in sheets],
        portfolio_image_details=[ImageRead.model_validate(i) for i in folio],
        rating_distribution=rating_distribution,
    )
