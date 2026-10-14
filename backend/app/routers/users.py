from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.errors import NotFoundError
from app.core.security import DbSession
from app.models import ArtistProfile, Commission, CommissionStatus, Review, ReviewSubjectType, User
from app.schemas.common import ERROR_RESPONSES
from app.schemas.review import ClientReputation
from app.services.reputation import rating_distribution, sub_rating_averages

router = APIRouter(prefix="/users", tags=["users"], responses=ERROR_RESPONSES)

@router.get(
    "/{username}",
    response_model=ClientReputation,
    summary="Public reputation for a user (what an artist checks before accepting)",
)
def get_user(username: str, db: DbSession) -> ClientReputation:
    user = db.scalar(select(User).where(func.lower(User.username) == username.lower()))
    if user is None:
        raise NotFoundError(f"No user '{username}'")

    profile = db.scalar(select(ArtistProfile).where(ArtistProfile.user_id == user.id))

    completed = db.scalar(
        select(func.count())
        .select_from(Commission)
        .where(
            Commission.client_id == user.id,
            Commission.status == CommissionStatus.COMPLETED,
        )
    )

    count, average = db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(
            Review.subject_user_id == user.id,
            Review.subject_type == ReviewSubjectType.CLIENT,
        )
    ).one()

    averages, would_work_again = sub_rating_averages(
        db, user.id, ReviewSubjectType.CLIENT
    )

    return ClientReputation(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        joined_at=user.created_at,
        is_artist=user.is_artist,
        artist_handle=profile.handle if profile else None,
        completed_commissions=int(completed or 0),
        rating_avg=round(float(average), 2) if count and average else 0.0,
        review_count=int(count or 0),
        sub_rating_averages=averages,
        would_work_again_pct=would_work_again,
        distribution=rating_distribution(db, user.id, ReviewSubjectType.CLIENT),
    )
