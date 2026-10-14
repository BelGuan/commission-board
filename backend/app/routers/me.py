from __future__ import annotations

from fastapi import APIRouter, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.security import CurrentUser, DbSession
from app.models import ArtistProfile, SavedArtist, UserPreferences
from app.schemas.common import ERROR_RESPONSES, Page
from app.schemas.user import (
    PreferencesRead,
    PreferencesUpdate,
    SavedArtistCreate,
    SavedArtistRead,
)

router = APIRouter(prefix="/me", tags=["me"], responses=ERROR_RESPONSES)

MAX_PAGE_SIZE = 50

def _preferences_for(db: DbSession, user_id: str) -> UserPreferences:
    prefs = db.scalar(select(UserPreferences).where(UserPreferences.user_id == user_id))
    if prefs is None:
        prefs = UserPreferences(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

@router.get("/preferences", response_model=PreferencesRead, summary="Your feed preferences")
def read_preferences(user: CurrentUser, db: DbSession) -> PreferencesRead:
    return PreferencesRead.model_validate(_preferences_for(db, user.id))

@router.put("/preferences", response_model=PreferencesRead, summary="Update your preferences")
def update_preferences(
    payload: PreferencesUpdate, user: CurrentUser, db: DbSession
) -> PreferencesRead:
    if payload.show_restricted is True and not user.age_verified:
        raise ForbiddenError(
            "Confirm you are 18 or older on your account before enabling mature content",
            code="age_verification_required",
        )

    prefs = _preferences_for(db, user.id)
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(prefs, field_name, value)

    db.commit()
    db.refresh(prefs)
    return PreferencesRead.model_validate(prefs)

def _to_saved_read(saved: SavedArtist, profile: ArtistProfile) -> SavedArtistRead:
    return SavedArtistRead(
        id=saved.id,
        artist_id=profile.id,
        handle=profile.handle,
        display_name=profile.user.display_name,
        avatar_url=profile.user.avatar_url,
        price_min=profile.price_min,
        price_max=profile.price_max,
        is_open=profile.is_open,
        rating_avg=profile.rating_avg,
        created_at=saved.created_at,
    )

@router.get(
    "/saved-artists",
    response_model=Page[SavedArtistRead],
    summary="Artists you have bookmarked",
)
def list_saved_artists(
    user: CurrentUser,
    db: DbSession,
    page: int = 1,
    page_size: int = 20,
) -> Page[SavedArtistRead]:
    page = max(1, page)
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))

    stmt = select(SavedArtist).where(SavedArtist.user_id == user.id)
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0

    rows = db.scalars(
        stmt.order_by(SavedArtist.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    profiles = {
        p.id: p
        for p in db.scalars(
            select(ArtistProfile)
            .options(selectinload(ArtistProfile.user))
            .where(ArtistProfile.id.in_([s.artist_id for s in rows] or [""]))
        ).all()
    }

    return Page[SavedArtistRead](
        items=[
            _to_saved_read(s, profiles[s.artist_id]) for s in rows if s.artist_id in profiles
        ],
        total=int(total),
        page=page,
        page_size=page_size,
    )

@router.post(
    "/saved-artists",
    response_model=SavedArtistRead,
    status_code=status.HTTP_201_CREATED,
    summary="Bookmark an artist",
)
def save_artist(
    payload: SavedArtistCreate, user: CurrentUser, db: DbSession
) -> SavedArtistRead:
    profile = db.scalar(
        select(ArtistProfile)
        .options(selectinload(ArtistProfile.user))
        .where(func.lower(ArtistProfile.handle) == payload.artist_handle.lower())
    )
    if profile is None:
        raise NotFoundError(f"No artist with handle '{payload.artist_handle}'")

    existing = db.scalar(
        select(SavedArtist).where(
            SavedArtist.user_id == user.id, SavedArtist.artist_id == profile.id
        )
    )
    if existing is not None:
        raise ConflictError("You have already saved this artist", code="already_saved")

    saved = SavedArtist(user_id=user.id, artist_id=profile.id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return _to_saved_read(saved, profile)

@router.delete(
    "/saved-artists/{handle}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a bookmark",
)
def unsave_artist(handle: str, user: CurrentUser, db: DbSession) -> Response:
    profile = db.scalar(
        select(ArtistProfile).where(func.lower(ArtistProfile.handle) == handle.lower())
    )
    if profile is None:
        raise NotFoundError(f"No artist with handle '{handle}'")

    saved = db.scalar(
        select(SavedArtist).where(
            SavedArtist.user_id == user.id, SavedArtist.artist_id == profile.id
        )
    )
    if saved is None:
        raise NotFoundError("That artist is not in your saved list")

    db.delete(saved)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
