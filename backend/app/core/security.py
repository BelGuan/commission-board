from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.core.errors import ForbiddenError, UnauthorizedError
from app.database import get_db
from app.models import ArtistProfile, User

logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)

pwd_context: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False
)

MAX_PASSWORD_BYTES = 72

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except ValueError:
        return False

def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {"sub": subject, "exp": expire, "iat": now}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def _load_user(db: Session, token: str | None) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        return None

    user = db.scalar(
        select(User)
        .options(selectinload(User.artist_profile))
        .where(User.id == user_id)
    )
    if user is None or not user.is_active:
        return None
    return user

def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    user = _load_user(db, token)
    if user is None:
        raise UnauthorizedError("Not authenticated or token is invalid or expired")
    return user

def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    return _load_user(db, token)

def require_artist(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ArtistProfile:
    profile = db.scalar(
        select(ArtistProfile).where(ArtistProfile.user_id == user.id)
    )
    if profile is None:
        raise ForbiddenError("This endpoint requires an artist profile")
    return profile

def bearer_token_from_request(request: Request) -> str | None:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    return token if scheme.lower() == "bearer" and token else None

CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]
ArtistOwner = Annotated[ArtistProfile, Depends(require_artist)]
DbSession = Annotated[Session, Depends(get_db)]
