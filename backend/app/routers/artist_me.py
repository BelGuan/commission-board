from __future__ import annotations

from fastapi import APIRouter, Response, status
from sqlalchemy import func, select

from app.core.errors import ConflictError, NotFoundError
from app.core.security import ArtistOwner, DbSession
from app.models import ArtistProfile, CommissionOffering, Tag
from app.schemas.artist import (
    ArtistProfileRead,
    ArtistProfileUpsert,
    OfferingCreate,
    OfferingRead,
    OfferingUpdate,
    ReorderRequest,
)
from app.schemas.common import ERROR_RESPONSES

router = APIRouter(prefix="/artists/me", tags=["artist-management"], responses=ERROR_RESPONSES)

@router.put("", response_model=ArtistProfileRead, summary="Create or replace your profile")
def upsert_profile(
    payload: ArtistProfileUpsert, profile: ArtistOwner, db: DbSession
) -> ArtistProfileRead:
    if payload.handle and payload.handle.lower() != profile.handle.lower():
        taken = db.scalar(
            select(ArtistProfile.id).where(
                func.lower(ArtistProfile.handle) == payload.handle.lower(),
                ArtistProfile.id != profile.id,
            )
        )
        if taken:
            raise ConflictError("That handle is already taken", code="handle_taken")
        profile.handle = payload.handle

    for name in (
        "tagline", "banner_url", "location", "languages", "terms_of_service",
        "is_open", "slots_open", "slots_total", "turnaround_days",
        "price_min", "price_max", "currency",
    ):
        setattr(profile, name, getattr(payload, name))

    if payload.bio is not None:
        profile.user.bio = payload.bio

    if payload.tag_slugs:
        profile.tags = list(db.scalars(select(Tag).where(Tag.slug.in_(payload.tag_slugs))).all())
    else:
        profile.tags = []

    db.commit()
    db.refresh(profile)
    return ArtistProfileRead.model_validate(profile)

def _owned_offering(db: DbSession, profile: ArtistProfile, offering_id: str) -> CommissionOffering:
    offering = db.scalar(
        select(CommissionOffering).where(
            CommissionOffering.id == offering_id,
            CommissionOffering.artist_id == profile.id,
        )
    )
    if offering is None:
        raise NotFoundError("No such offering")
    return offering

@router.post(
    "/offerings",
    response_model=OfferingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add an offering to your sheet",
)
def create_offering(
    payload: OfferingCreate, profile: ArtistOwner, db: DbSession
) -> OfferingRead:
    offering = CommissionOffering(artist_id=profile.id, **payload.model_dump())
    db.add(offering)
    db.commit()
    db.refresh(offering)
    return OfferingRead.model_validate(offering)

@router.patch(
    "/offerings/{offering_id}",
    response_model=OfferingRead,
    summary="Update one of your offerings",
)
def update_offering(
    offering_id: str, payload: OfferingUpdate, profile: ArtistOwner, db: DbSession
) -> OfferingRead:
    offering = _owned_offering(db, profile, offering_id)
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(offering, field_name, value)
    db.commit()
    db.refresh(offering)
    return OfferingRead.model_validate(offering)

@router.delete(
    "/offerings/{offering_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of your offerings",
)
def delete_offering(offering_id: str, profile: ArtistOwner, db: DbSession) -> Response:
    db.delete(_owned_offering(db, profile, offering_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put(
    "/offerings/reorder",
    response_model=list[OfferingRead],
    summary="Rewrite the display order of your offerings",
)
def reorder_offerings(
    payload: ReorderRequest, profile: ArtistOwner, db: DbSession
) -> list[OfferingRead]:
    owned = {
        o.id: o
        for o in db.scalars(
            select(CommissionOffering).where(CommissionOffering.artist_id == profile.id)
        ).all()
    }
    unknown = [oid for oid in payload.ids if oid not in owned]
    if unknown:
        raise NotFoundError("One or more offerings do not exist or are not yours")

    for index, offering_id in enumerate(payload.ids):
        owned[offering_id].sort_order = index
    for offset, offering in enumerate(
        (o for oid, o in owned.items() if oid not in set(payload.ids)),
        start=len(payload.ids),
    ):
        offering.sort_order = offset

    db.commit()
    return [
        OfferingRead.model_validate(o)
        for o in sorted(owned.values(), key=lambda o: o.sort_order)
    ]
