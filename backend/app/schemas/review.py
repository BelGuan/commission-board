from __future__ import annotations

from datetime import datetime

from pydantic import Field, model_validator

from app.core.sanitize import CleanText
from app.models.enums import ReviewSubjectType
from app.schemas.common import ApiModel

ARTIST_SUB_RATINGS: tuple[str, ...] = ("quality", "communication", "timeliness")
CLIENT_SUB_RATINGS: tuple[str, ...] = (
    "paid_on_time",
    "communication",
    "respected_boundaries",
)

MIN_BODY_LENGTH = 30

class ReviewCreate(ApiModel):
    subject_user_id: str
    subject_type: ReviewSubjectType
    commission_id: str | None = None
    rating: int = Field(ge=1, le=5)
    body: CleanText = Field(min_length=MIN_BODY_LENGTH, max_length=5000)
    sub_ratings: dict[str, int] = Field(default_factory=dict)
    would_work_again: bool | None = None

    @model_validator(mode="after")
    def _check_direction_fields(self) -> "ReviewCreate":
        if len(self.body.strip()) < MIN_BODY_LENGTH:
            raise ValueError(
                f"Review body must be at least {MIN_BODY_LENGTH} characters of text"
            )

        allowed = (
            ARTIST_SUB_RATINGS
            if self.subject_type is ReviewSubjectType.ARTIST
            else CLIENT_SUB_RATINGS
        )
        unexpected = set(self.sub_ratings) - set(allowed)
        if unexpected:
            raise ValueError(
                f"sub_ratings keys {sorted(unexpected)} are not valid for a "
                f"{self.subject_type.value} review; allowed: {list(allowed)}"
            )
        for key, value in self.sub_ratings.items():
            if not 1 <= value <= 5:
                raise ValueError(f"sub_rating {key!r} must be between 1 and 5")
        if self.subject_type is ReviewSubjectType.ARTIST and self.would_work_again is not None:
            raise ValueError("would_work_again applies to client reviews only")
        return self

class ReviewAuthor(ApiModel):

    id: str
    username: str
    display_name: str
    avatar_url: str | None = None

class ReviewRead(ApiModel):
    id: str
    author: ReviewAuthor
    subject_user_id: str
    subject_type: ReviewSubjectType
    commission_id: str | None = None
    rating: int
    body: str | None = None
    sub_ratings: dict[str, int] = Field(default_factory=dict)
    would_work_again: bool | None = None
    verified: bool = False
    created_at: datetime

class RatingBucket(ApiModel):

    stars: int
    count: int

class ReviewSummary(ApiModel):

    average: float = 0.0
    total: int = 0
    distribution: list[RatingBucket] = Field(default_factory=list)

class ReviewPage(ApiModel):

    items: list[ReviewRead]
    total: int
    page: int
    page_size: int
    average: float = 0.0
    distribution: list[RatingBucket] = Field(default_factory=list)

class ClientReputation(ApiModel):

    id: str
    username: str
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    joined_at: datetime
    is_artist: bool
    artist_handle: str | None = None

    completed_commissions: int = 0
    rating_avg: float = 0.0
    review_count: int = 0
    sub_rating_averages: dict[str, float] = Field(default_factory=dict)
    would_work_again_pct: float | None = None
    distribution: list[RatingBucket] = Field(default_factory=list)
