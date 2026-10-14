from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.core.security import CurrentUser, DbSession
from app.models import (
    ArtistProfile,
    Commission,
    CommissionOffering,
    CommissionStatus,
    Review,
    User,
    utcnow,
)
from app.schemas.commission import CommissionCreate, CommissionRead, CommissionStatusUpdate
from app.schemas.common import ERROR_RESPONSES, Page
from app.schemas.user import UserPublic
from app.services.commission_flow import assert_can_transition

router = APIRouter(prefix="/commissions", tags=["commissions"], responses=ERROR_RESPONSES)

MAX_PAGE_SIZE = 50

def _to_read(commission: Commission, *, reviewed_by_me: bool = False) -> CommissionRead:
    return CommissionRead(
        id=commission.id,
        artist_id=commission.artist_id,
        artist_handle=commission.artist.handle,
        client_id=commission.client_id,
        offering_id=commission.offering_id,
        title=commission.title,
        brief=commission.brief,
        status=commission.status,
        agreed_price=commission.agreed_price,
        requested_at=commission.requested_at,
        completed_at=commission.completed_at,
        created_at=commission.created_at,
        artist_user=UserPublic.model_validate(commission.artist.user),
        client=UserPublic.model_validate(commission.client),
        reviewed_by_me=reviewed_by_me,
    )

_EAGER = (
    selectinload(Commission.artist).selectinload(ArtistProfile.user),
    selectinload(Commission.client),
)

@router.post(
    "",
    response_model=CommissionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Request a commission from an artist",
)
def create_commission(
    payload: CommissionCreate, user: CurrentUser, db: DbSession
) -> CommissionRead:
    artist = db.scalar(
        select(ArtistProfile).where(
            func.lower(ArtistProfile.handle) == payload.artist_handle.lower()
        )
    )
    if artist is None:
        raise NotFoundError(f"No artist with handle '{payload.artist_handle}'")
    if artist.user_id == user.id:
        raise ValidationError("You cannot commission yourself", code="self_commission")

    offering_id = None
    if payload.offering_id:
        offering = db.scalar(
            select(CommissionOffering).where(
                CommissionOffering.id == payload.offering_id,
                CommissionOffering.artist_id == artist.id,
            )
        )
        if offering is None:
            raise NotFoundError("That offering does not belong to this artist")
        offering_id = offering.id

    commission = Commission(
        artist_id=artist.id,
        client_id=user.id,
        offering_id=offering_id,
        title=payload.title,
        brief=payload.message,
        status=CommissionStatus.REQUESTED,
        agreed_price=payload.proposed_price,
        requested_at=utcnow(),
    )
    db.add(commission)
    db.commit()
    db.refresh(commission)
    return _to_read(commission)

@router.get("", response_model=Page[CommissionRead], summary="Your commissions")
def list_commissions(
    user: CurrentUser,
    db: DbSession,
    role: Annotated[Literal["client", "artist", "any"], Query()] = "any",
    status_filter: Annotated[CommissionStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = 20,
) -> Page[CommissionRead]:
    profile = user.artist_profile
    stmt = select(Commission)

    if role == "client":
        stmt = stmt.where(Commission.client_id == user.id)
    elif role == "artist":
        if profile is None:
            return Page[CommissionRead](items=[], total=0, page=page, page_size=page_size)
        stmt = stmt.where(Commission.artist_id == profile.id)
    else:
        clauses = [Commission.client_id == user.id]
        if profile is not None:
            clauses.append(Commission.artist_id == profile.id)
        stmt = stmt.where(or_(*clauses))

    if status_filter is not None:
        stmt = stmt.where(Commission.status == status_filter)

    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0

    rows = db.scalars(
        stmt.options(*_EAGER)
        .order_by(Commission.requested_at.desc(), Commission.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    reviewed: set[str] = set()
    if rows:
        reviewed = set(
            db.scalars(
                select(Review.commission_id).where(
                    Review.author_id == user.id,
                    Review.commission_id.in_([c.id for c in rows]),
                )
            ).all()
        )

    return Page[CommissionRead](
        items=[_to_read(c, reviewed_by_me=c.id in reviewed) for c in rows],
        total=int(total),
        page=page,
        page_size=page_size,
    )

@router.patch(
    "/{commission_id}/status",
    response_model=CommissionRead,
    summary="Advance a commission through the state machine",
)
def update_status(
    commission_id: str,
    payload: CommissionStatusUpdate,
    user: CurrentUser,
    db: DbSession,
) -> CommissionRead:
    profile = user.artist_profile
    artist_ids = [profile.id] if profile is not None else []

    commission = db.scalar(
        select(Commission)
        .options(*_EAGER)
        .where(
            Commission.id == commission_id,
            or_(
                Commission.client_id == user.id,
                Commission.artist_id.in_(artist_ids) if artist_ids else False,
            ),
        )
    )
    if commission is None:
        raise NotFoundError("No such commission")

    assert_can_transition(commission, payload.status, user=user, artist_profile=profile)

    commission.status = payload.status
    if payload.agreed_price is not None:
        commission.agreed_price = payload.agreed_price

    if payload.status is CommissionStatus.COMPLETED:
        commission.completed_at = utcnow()
        commission.artist.completed_commissions += 1

    db.commit()
    db.refresh(commission)
    return _to_read(commission)
