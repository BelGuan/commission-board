from __future__ import annotations

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ArtistProfile, Review, ReviewSubjectType
from app.schemas.review import RatingBucket

def recompute_artist_rating(db: Session, artist_user_id: str) -> None:
    profile = db.scalar(
        select(ArtistProfile).where(ArtistProfile.user_id == artist_user_id)
    )
    if profile is None:
        return

    count, average = db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(
            Review.subject_user_id == artist_user_id,
            Review.subject_type == ReviewSubjectType.ARTIST,
        )
    ).one()

    profile.review_count = int(count or 0)
    profile.rating_avg = (
        Decimal(str(round(float(average), 2))) if count and average else Decimal("0.00")
    )
    db.flush()

def rating_distribution(
    db: Session, subject_user_id: str, subject_type: ReviewSubjectType
) -> list[RatingBucket]:
    rows = db.execute(
        select(Review.rating, func.count())
        .where(
            Review.subject_user_id == subject_user_id,
            Review.subject_type == subject_type,
        )
        .group_by(Review.rating)
    ).all()
    counts = {int(stars): int(count) for stars, count in rows}
    return [RatingBucket(stars=s, count=counts.get(s, 0)) for s in range(1, 6)]

def sub_rating_averages(
    db: Session, subject_user_id: str, subject_type: ReviewSubjectType
) -> tuple[dict[str, float], float | None]:
    rows = db.scalars(
        select(Review).where(
            Review.subject_user_id == subject_user_id,
            Review.subject_type == subject_type,
        )
    ).all()

    totals: dict[str, list[int]] = {}
    recommendations: list[bool] = []

    for review in rows:
        for key, value in (review.sub_ratings or {}).items():
            if isinstance(value, (int, float)):
                totals.setdefault(key, []).append(int(value))
        if review.would_work_again is not None:
            recommendations.append(bool(review.would_work_again))

    averages = {
        key: round(sum(values) / len(values), 2) for key, values in totals.items() if values
    }
    pct = (
        round(100 * sum(recommendations) / len(recommendations), 1)
        if recommendations
        else None
    )
    return averages, pct
