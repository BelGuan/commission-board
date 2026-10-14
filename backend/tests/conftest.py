from __future__ import annotations

import os
import sys
from collections.abc import Generator
from decimal import Decimal
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ["DATABASE_URL"] = "sqlite:///./test_commission_board.db"
os.environ["SECRET_KEY"] = "test-only-secret"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.rate_limit import reset_all_limiters
from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import (
    ArtistProfile,
    CommissionOffering,
    CommissionType,
    PortfolioImage,
    SheetImage,
    Tag,
    TagCategory,
    User,
    UserPreferences,
)

TEST_DB_PATH = Path("./test_commission_board.db")
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

@pytest.fixture(scope="session")
def engine():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    eng = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()
    TEST_DB_PATH.unlink(missing_ok=True)

@pytest.fixture()
def db(engine) -> Generator[Session, None, None]:
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSession()
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    reset_all_limiters()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:

    def _get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = _get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

PASSWORD = "password123"

@pytest.fixture()
def tags(db: Session) -> dict[str, Tag]:
    rows = [
        Tag(slug="anime", label="Anime", category=TagCategory.STYLE),
        Tag(slug="pixel_art", label="Pixel art", category=TagCategory.STYLE),
        Tag(slug="oc_friendly", label="OC friendly", category=TagCategory.CONTENT),
        Tag(
            slug="nsfw_18plus",
            label="NSFW (18+)",
            category=TagCategory.CONTENT,
            is_restricted=True,
        ),
        Tag(slug="bust", label="Bust", category=TagCategory.COMMISSION_TYPE),
    ]
    db.add_all(rows)
    db.commit()
    return {t.slug: t for t in rows}

def make_user(
    db: Session,
    username: str,
    *,
    is_artist: bool = False,
    age_verified: bool = False,
    is_admin: bool = False,
) -> User:
    user = User(
        email=f"{username}@example.com",
        username=username,
        password_hash=hash_password(PASSWORD),
        display_name=username.replace("_", " ").title(),
        is_artist=is_artist,
        age_verified=age_verified,
        is_admin=is_admin,
    )
    db.add(user)
    db.flush()
    db.add(UserPreferences(user_id=user.id))
    db.commit()
    db.refresh(user)
    return user

def make_artist(
    db: Session,
    username: str,
    *,
    tag_objs: list[Tag],
    price_min: str = "50.00",
    price_max: str = "200.00",
    is_open: bool = True,
    slots_open: int = 3,
    turnaround_days: int = 10,
    restricted_images: bool = False,
) -> ArtistProfile:
    user = make_user(db, username, is_artist=True)
    profile = ArtistProfile(
        user_id=user.id,
        handle=username,
        tagline=f"{username} tagline",
        price_min=Decimal(price_min),
        price_max=Decimal(price_max),
        is_open=is_open,
        slots_open=slots_open,
        slots_total=max(slots_open, 1),
        turnaround_days=turnaround_days,
        languages=["English"],
    )
    profile.tags = tag_objs
    db.add(profile)
    db.flush()

    db.add(
        CommissionOffering(
            artist_id=profile.id,
            commission_type=CommissionType.BUST,
            title="Bust",
            price=Decimal(price_min),
            delivery_days=turnaround_days,
            sort_order=0,
        )
    )
    db.add(
        SheetImage(
            artist_id=profile.id,
            url=f"https://example.com/{username}-sheet.png",
            sort_order=0,
            is_restricted=restricted_images,
        )
    )
    db.add(
        PortfolioImage(
            artist_id=profile.id,
            url=f"https://example.com/{username}-folio.png",
            sort_order=0,
            is_restricted=restricted_images,
        )
    )
    db.commit()
    db.refresh(profile)
    return profile

def auth_header(client: TestClient, email: str, password: str = PASSWORD) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
