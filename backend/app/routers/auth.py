from __future__ import annotations

from fastapi import APIRouter, Response, status
from sqlalchemy import func, select

from app.core.errors import ConflictError, UnauthorizedError
from app.core.rate_limit import login_limiter
from app.core.security import (
    CurrentUser,
    DbSession,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models import ArtistProfile, User, UserPreferences, utcnow
from app.schemas.common import ERROR_RESPONSES
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserRead,
    UserUpdate,
    UserWithProfile,
)

router = APIRouter(prefix="/auth", tags=["auth"], responses=ERROR_RESPONSES)

def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        user=UserRead.model_validate(user),
        access_token=create_access_token(user.id),
        token_type="bearer",
    )

def _unique_handle(db: DbSession, desired: str) -> str:
    candidate = desired
    suffix = 1
    while db.scalar(
        select(ArtistProfile.id).where(func.lower(ArtistProfile.handle) == candidate.lower())
    ):
        suffix += 1
        candidate = f"{desired}{suffix}"
    return candidate

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
)
def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    if db.scalar(select(User.id).where(func.lower(User.email) == payload.email.lower())):
        raise ConflictError("An account with that email already exists", code="email_taken")
    if db.scalar(
        select(User.id).where(func.lower(User.username) == payload.username.lower())
    ):
        raise ConflictError("That username is already taken", code="username_taken")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        is_artist=payload.is_artist,
        last_active_at=utcnow(),
    )
    db.add(user)
    db.flush()

    db.add(UserPreferences(user_id=user.id))
    if payload.is_artist:
        db.add(ArtistProfile(user_id=user.id, handle=_unique_handle(db, payload.username)))

    db.commit()
    db.refresh(user)
    return _auth_response(user)

@router.post("/login", response_model=AuthResponse, summary="Exchange credentials for a token")
def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    limiter_key = payload.email.lower()
    login_limiter.check(limiter_key)

    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Incorrect email or password", code="invalid_credentials")
    if not user.is_active:
        raise UnauthorizedError("This account is disabled", code="account_disabled")

    login_limiter.reset(limiter_key)
    user.last_active_at = utcnow()
    db.commit()
    db.refresh(user)
    return _auth_response(user)

@router.get(
    "/me",
    response_model=UserWithProfile,
    summary="The signed-in account, with artist profile if present",
)
def read_me(user: CurrentUser) -> UserWithProfile:
    return UserWithProfile.model_validate(user)

@router.patch("/me", response_model=UserWithProfile, summary="Update your own account")
def update_me(payload: UserUpdate, user: CurrentUser, db: DbSession) -> UserWithProfile:
    for field_name, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field_name, value)

    db.commit()
    db.refresh(user)
    return UserWithProfile.model_validate(user)

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out (client discards the token)",
)
def logout(_user: CurrentUser) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
