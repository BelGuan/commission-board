from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.rate_limit import review_limiter
from app.core.security import CurrentUser, DbSession, OptionalUser
from app.models import (
    ArtistProfile,
    Commission,
    CommissionStatus,
    Review,
    ReviewSubjectType,
    User,
    as_utc,
    utcnow,
)
from app.schemas.common import ERROR_RESPONSES, Page
from app.schemas.review import ReviewAuthor, ReviewCreate, ReviewPage, ReviewRead
from app.services.reputation import rating_distribution, recompute_artist_rating

router = APIRouter(prefix="/reviews", tags=["reviews"], responses=ERROR_RESPONSES)

MAX_PAGE_SIZE = 50
EDIT_WINDOW = timedelta(hours=24)

def _to_read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        author=ReviewAuthor.model_validate(review.author),
        subject_user_id=review.subject_user_id,
        subject_type=review.subject_type,
        commission_id=review.commission_id,
        rating=review.rating,
        body=review.body,
        sub_ratings=review.sub_ratings or {},
        would_work_again=review.would_work_again,
        verified=review.commission_id is not None,
        created_at=review.created_at,
    )

def _validate_commission_link(
    db: DbSession, payload: ReviewCreate, author: User
) -> None:
    commission = db.scalar(
        select(Commission)
        .options(selectinload(Commission.artist))
        .where(Commission.id == payload.commission_id)
    )
    if commission is None:
        raise NotFoundError("No such commission")

    artist_user_id = commission.artist.user_id
    parties = {commission.client_id, artist_user_id}

    if author.id not in parties:
        raise NotFoundError("No such commission")
    if commission.status is not CommissionStatus.COMPLETED:
        raise ConflictError(
            "You can only review a commission once it is completed",
            code="commission_not_completed",
        )
    if payload.subject_user_id not in parties or payload.subject_user_id == author.id:
        raise ValidationError(
            "The subject of the review must be the other party to that commission",
            code="subject_not_counterparty",
        )

    expects_artist = payload.subject_user_id == artist_user_id
    if expects_artist and payload.subject_type is not ReviewSubjectType.ARTIST:
        raise ValidationError(
            "That commission's artist must be reviewed with subject_type 'artist'",
            code="subject_type_mismatch",
        )
    if not expects_artist and payload.subject_type is not ReviewSubjectType.CLIENT:
        raise ValidationError(
            "That commission's client must be reviewed with subject_type 'client'",
            code="subject_type_mismatch",
        )

@router.post(
    "",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Write a review",
)
def create_review(payload: ReviewCreate, user: CurrentUser, db: DbSession) -> ReviewRead:
    review_limiter.check(user.id)

    if payload.subject_user_id == user.id:
        raise ValidationError("You cannot review yourself", code="self_review")

    subject = db.get(User, payload.subject_user_id)
    if subject is None:
        raise NotFoundError("No such user")

    if payload.subject_type is ReviewSubjectType.ARTIST:
        has_profile = db.scalar(
            select(ArtistProfile.id).where(ArtistProfile.user_id == subject.id)
        )
        if not has_profile:
            raise ValidationError(
                "That user does not have an artist profile",
                code="subject_not_artist",
            )

    if payload.commission_id:
        _validate_commission_link(db, payload, user)

    duplicate = db.scalar(
        select(Review.id).where(
            Review.author_id == user.id,
            Review.subject_user_id == payload.subject_user_id,
            Review.commission_id == payload.commission_id
            if payload.commission_id
            else Review.commission_id.is_(None),
        )
    )
    if duplicate:
        raise ConflictError(
            "You have already reviewed this person for this commission",
            code="duplicate_review",
        )

    review = Review(
        author_id=user.id,
        subject_user_id=payload.subject_user_id,
        subject_type=payload.subject_type,
        commission_id=payload.commission_id,
        rating=payload.rating,
        body=payload.body,
        sub_ratings=payload.sub_ratings,
        would_work_again=payload.would_work_again,
    )
    db.add(review)
    db.flush()

    if payload.subject_type is ReviewSubjectType.ARTIST:
        recompute_artist_rating(db, payload.subject_user_id)

    db.commit()
    db.refresh(review)
    return _to_read(review)

@router.get("", response_model=ReviewPage, summary="Reviews about someone")
def list_reviews(
    db: DbSession,
    subject_user_id: Annotated[str, Query(description="Whose reviews to read")],
    subject_type: Annotated[ReviewSubjectType, Query()] = ReviewSubjectType.ARTIST,
    verified_only: Annotated[bool, Query(description="Only commission-backed")] = False,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = 10,
) -> ReviewPage:
    stmt = select(Review).where(
        Review.subject_user_id == subject_user_id,
        Review.subject_type == subject_type,
    )
    if verified_only:
        stmt = stmt.where(Review.commission_id.isnot(None))

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0

    rows = db.scalars(
        stmt.options(selectinload(Review.author))
        .order_by(Review.created_at.desc(), Review.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    buckets = rating_distribution(db, subject_user_id, subject_type)
    graded = sum(b.stars * b.count for b in buckets)
    counted = sum(b.count for b in buckets)

    return ReviewPage(
        items=[_to_read(r) for r in rows],
        total=int(total),
        page=page,
        page_size=page_size,
        average=round(graded / counted, 2) if counted else 0.0,
        distribution=buckets,
    )

@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Retract your own review (24h) or remove one as an admin",
)
def delete_review(review_id: str, user: CurrentUser, db: DbSession) -> Response:
    review = db.scalar(select(Review).where(Review.id == review_id))
    if review is None:
        raise NotFoundError("No such review")

    is_author = review.author_id == user.id
    if not is_author and not user.is_admin:
        raise NotFoundError("No such review")

    if is_author and not user.is_admin:
        age = utcnow() - as_utc(review.created_at)
        if age > EDIT_WINDOW:
            raise ForbiddenError(
                "Reviews can only be retracted within 24 hours of posting",
                code="edit_window_closed",
            )

    subject_user_id = review.subject_user_id
    subject_type = review.subject_type
    db.delete(review)
    db.flush()

    if subject_type is ReviewSubjectType.ARTIST:
        recompute_artist_rating(db, subject_user_id)

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
