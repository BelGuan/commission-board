from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import app.models
from app.config import settings
from app.core.errors import register_exception_handlers
from app.database import get_db
from app.routers import (
    artist_images,
    artist_me,
    artists,
    auth,
    commissions,
    me,
    reviews,
    tags,
    uploads,
    users,
)
from app.schemas.common import HealthStatus

API_VERSION = "1.0.0"

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=API_VERSION,
    description=(
        "Backend for Commission Board: artists publish commission sheets, "
        "clients find them by style, price and content tags, and reviews flow "
        "in both directions.\n\n"
        "Authenticate with `POST /api/auth/login`, then send "
        "`Authorization: Bearer <token>`."
    ),
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.mount(
    "/uploads",
    StaticFiles(directory=Path(settings.UPLOAD_DIR), check_dir=False),
    name="uploads",
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(artist_me.router, prefix=settings.API_PREFIX)
app.include_router(artist_images.router, prefix=settings.API_PREFIX)
app.include_router(artists.router, prefix=settings.API_PREFIX)
app.include_router(tags.router, prefix=settings.API_PREFIX)
app.include_router(uploads.router, prefix=settings.API_PREFIX)
app.include_router(commissions.router, prefix=settings.API_PREFIX)
app.include_router(reviews.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(me.router, prefix=settings.API_PREFIX)

@app.get(
    f"{settings.API_PREFIX}/health",
    response_model=HealthStatus,
    tags=["system"],
    summary="Liveness and database connectivity check",
)
def health_check(db: Session = Depends(get_db)) -> HealthStatus:
    try:
        db.execute(select(1))
        database_status = "connected"
    except SQLAlchemyError as exc:
        database_status = f"error: {type(exc).__name__}"

    return HealthStatus(
        status="ok",
        database=database_status,
        version=API_VERSION,
        environment="development" if settings.DEBUG else "production",
    )

@app.get("/", tags=["system"], include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "name": settings.PROJECT_NAME,
        "docs": f"{settings.API_PREFIX}/docs",
        "health": f"{settings.API_PREFIX}/health",
    }
