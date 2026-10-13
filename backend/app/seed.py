from __future__ import annotations

import random
import uuid
from datetime import timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import (
    ArtistProfile,
    Commission,
    CommissionOffering,
    CommissionStatus,
    CommissionType,
    PortfolioImage,
    Review,
    ReviewSubjectType,
    SheetImage,
    Tag,
    TagCategory,
    User,
    UserPreferences,
    utcnow,
)
from app.seed_data import (
    ARTISTS,
    ARTIST_REVIEW_BODIES,
    CLIENT_REVIEW_BODIES,
    CLIENTS,
    COMMISSION_TITLES,
    COMMISSION_TYPE_TAGS,
    CONTENT_TAGS,
    STYLE_TAGS,
    TOS,
)

SEED_PASSWORD = "password123"
NS = uuid.UUID("6f0a2c4e-59b6-4f3a-9c21-2a7c5d8e1b40")
rng = random.Random(20260917)

def img(seed: str, width: int, height: int) -> str:
    return f"https://picsum.photos/seed/{seed}/{width}/{height}"

def stable_id(*parts: str) -> str:
    return str(uuid.uuid5(NS, "|".join(parts)))

def seed_tags(db: Session) -> dict[tuple[TagCategory, str], Tag]:
    rows: list[tuple[str, str, TagCategory, str | None, bool]] = []
    rows += [(s, label, TagCategory.STYLE, None, False) for s, label in STYLE_TAGS]
    rows += [
        (slug, label, TagCategory.CONTENT, desc, restricted)
        for slug, label, desc, restricted in CONTENT_TAGS
    ]
    rows += [
        (s, label, TagCategory.COMMISSION_TYPE, None, False) for s, label in COMMISSION_TYPE_TAGS
    ]

    existing = {(tag.category, tag.slug): tag for tag in db.scalars(select(Tag)).all()}
    result: dict[tuple[TagCategory, str], Tag] = {}

    for slug, label, category, description, is_restricted in rows:
        key = (category, slug)
        tag = existing.get(key)
        if tag is None:
            tag = Tag(
                id=stable_id("tag", category.value, slug),
                slug=slug,
                label=label,
                category=category,
                description=description,
                is_restricted=is_restricted,
            )
            db.add(tag)
            existing[key] = tag
        else:
            tag.label = label
            tag.description = description or tag.description
            tag.is_restricted = is_restricted
        result[key] = tag

    db.flush()
    return result

def _upsert_user(
    db: Session,
    *,
    username: str,
    display_name: str,
    is_artist: bool,
    bio: str | None,
    avatar_seed: str,
    joined_days_ago: int,
    last_active_days_ago: int,
    age_verified: bool = False,
) -> User:
    email = f"{username}@example.com"
    user = db.scalar(select(User).where(User.email == email))
    now = utcnow()

    if user is None:
        user = User(
            id=stable_id("user", username),
            email=email,
            username=username,
            password_hash=hash_password(SEED_PASSWORD),
            display_name=display_name,
            is_artist=is_artist,
            created_at=now - timedelta(days=joined_days_ago),
        )
        db.add(user)

    user.display_name = display_name
    user.bio = bio
    user.avatar_url = img(f"{avatar_seed}-avatar", 200, 200)
    user.is_artist = is_artist
    user.is_active = True
    user.age_verified = age_verified
    user.last_active_at = now - timedelta(days=last_active_days_ago)

    if user.preferences is None:
        db.add(UserPreferences(id=stable_id("prefs", username), user_id=user.id))

    db.flush()
    return user

def seed_artists(
    db: Session, tags: dict[tuple[TagCategory, str], Tag]
) -> list[ArtistProfile]:
    profiles: list[ArtistProfile] = []

    for row in ARTISTS:
        handle = row["handle"]
        carries_restricted = any(
            tags[(TagCategory.CONTENT, slug)].is_restricted for slug in row["content_tags"]
        )

        user = _upsert_user(
            db,
            username=handle,
            display_name=row["display_name"],
            is_artist=True,
            bio=row["bio"],
            avatar_seed=handle,
            joined_days_ago=row["joined_days_ago"],
            last_active_days_ago=row["last_active_days_ago"],
            age_verified=carries_restricted,
        )

        profile = db.scalar(select(ArtistProfile).where(ArtistProfile.handle == handle))
        if profile is None:
            profile = ArtistProfile(id=stable_id("profile", handle), user_id=user.id, handle=handle)
            db.add(profile)

        profile.banner_url = img(f"{handle}-banner", 1200, 400)
        profile.location = row["location"]
        profile.languages = row["languages"]
        profile.terms_of_service = TOS[row["tos"]]
        profile.is_open = row["is_open"]
        profile.slots_open = row["slots_open"]
        profile.slots_total = row["slots_total"]
        profile.turnaround_days = row["turnaround_days"]
        profile.price_min = Decimal(row["price_min"])
        profile.price_max = Decimal(row["price_max"])
        profile.currency = "USD"
        profile.completed_commissions = row["completed"]

        wanted: list[tuple[TagCategory, str]] = (
            [(TagCategory.STYLE, slug) for slug in row["styles"]]
            + [(TagCategory.CONTENT, slug) for slug in row["content_tags"]]
            + [(TagCategory.COMMISSION_TYPE, slug) for slug in row["commission_types"]]
        )
        profile.tags = [tags[key] for key in dict.fromkeys(wanted) if key in tags]

        db.flush()
        _seed_artist_children(db, profile, row, carries_restricted)
        profiles.append(profile)

    return profiles

def _seed_artist_children(
    db: Session, profile: ArtistProfile, row: dict, carries_restricted: bool
) -> None:
    low = Decimal(row["price_min"])
    high = Decimal(row["price_max"])
    types = row["commission_types"]
    span = high - low

    existing_offerings = {o.commission_type.value: o for o in profile.offerings}
    for index, type_slug in enumerate(types):
        step = (span * index / (len(types) - 1)) if len(types) > 1 else Decimal(0)
        price = (low + step).quantize(Decimal("1.00"))
        offering = existing_offerings.get(type_slug)
        if offering is None:
            offering = CommissionOffering(
                id=stable_id("offering", profile.handle, type_slug),
                artist_id=profile.id,
                commission_type=CommissionType(type_slug),
            )
            db.add(offering)
        offering.title = f"{type_slug.replace('_', ' ').title()} commission"
        offering.description = (
            f"One character, {row['turnaround_days']}-day typical turnaround. "
            "See the sheet above for exact inclusions."
        )
        offering.price = price
        offering.delivery_days = row["turnaround_days"] + index * 2
        offering.example_image_url = img(f"{profile.handle}-{type_slug}", 320, 320)
        offering.sort_order = index

    existing_sheets = {s.sort_order: s for s in profile.sheet_images}
    for index in range(2):
        sheet = existing_sheets.get(index)
        if sheet is None:
            sheet = SheetImage(
                id=stable_id("sheet", profile.handle, str(index)),
                artist_id=profile.id,
                sort_order=index,
            )
            db.add(sheet)
        sheet.url = img(f"{profile.handle}-sheet-{index + 1}", 900, 1200)
        sheet.caption = f"Commission sheet {index + 1}"
        sheet.is_restricted = carries_restricted

    existing_folio = {p.sort_order: p for p in profile.portfolio_images}
    for index in range(4):
        piece = existing_folio.get(index)
        if piece is None:
            piece = PortfolioImage(
                id=stable_id("folio", profile.handle, str(index)),
                artist_id=profile.id,
                sort_order=index,
            )
            db.add(piece)
        piece.url = img(f"{profile.handle}-folio-{index + 1}", 800, 800)
        piece.caption = None
        piece.is_restricted = carries_restricted

    db.flush()

def seed_clients(db: Session) -> list[User]:
    return [
        _upsert_user(
            db,
            username=username,
            display_name=display_name,
            is_artist=False,
            bio=None,
            avatar_seed=username,
            joined_days_ago=rng.randint(60, 900),
            last_active_days_ago=rng.randint(0, 30),
        )
        for username, display_name in CLIENTS
    ]

STATUS_MIX: list[CommissionStatus] = (
    [CommissionStatus.COMPLETED] * 31
    + [CommissionStatus.IN_PROGRESS] * 4
    + [CommissionStatus.ACCEPTED] * 3
    + [CommissionStatus.REQUESTED] * 2
    + [CommissionStatus.DECLINED] * 1
    + [CommissionStatus.CANCELLED] * 1
)

NEW_ARTIST_DAYS = 60

def seed_commissions(
    db: Session, profiles: list[ArtistProfile], clients: list[User]
) -> list[Commission]:
    commissions: list[Commission] = []
    now = utcnow()

    established = [
        p
        for p, row in zip(profiles, ARTISTS, strict=True)
        if row["joined_days_ago"] > NEW_ARTIST_DAYS
    ]

    for index, status in enumerate(STATUS_MIX):
        profile = established[index % len(established)]
        client = clients[(index * 5 + 1) % len(clients)]
        offering = profile.offerings[index % len(profile.offerings)] if profile.offerings else None

        commission_id = stable_id("commission", profile.handle, client.username, str(index))
        commission = db.get(Commission, commission_id)
        if commission is None:
            commission = Commission(
                id=commission_id,
                artist_id=profile.id,
                client_id=client.id,
                offering_id=offering.id if offering else None,
            )
            db.add(commission)

        requested_days_ago = rng.randint(30, 400)
        commission.title = COMMISSION_TITLES[index % len(COMMISSION_TITLES)]
        commission.brief = "Seeded record - see the commission sheet for the full brief."
        commission.status = status
        commission.agreed_price = offering.price if offering else profile.price_min
        commission.requested_at = now - timedelta(days=requested_days_ago)
        commission.completed_at = (
            now - timedelta(days=max(1, requested_days_ago - profile.turnaround_days))
            if status is CommissionStatus.COMPLETED
            else None
        )
        commissions.append(commission)

    db.flush()
    return commissions

def seed_reviews(db: Session, commissions: list[Commission]) -> int:
    created = 0
    now = utcnow()
    completed = [c for c in commissions if c.status is CommissionStatus.COMPLETED]

    for index, commission in enumerate(completed):
        artist_user_id = commission.artist.user_id
        days_after = rng.randint(1, 20)
        written_at = (commission.completed_at or now) + timedelta(days=days_after)

        created += _upsert_review(
            db,
            review_id=stable_id("review", "artist", commission.id),
            author_id=commission.client_id,
            subject_user_id=artist_user_id,
            subject_type=ReviewSubjectType.ARTIST,
            commission_id=commission.id,
            rating=rng.choices([5, 4, 3, 2], weights=[62, 25, 9, 4])[0],
            body=ARTIST_REVIEW_BODIES[index % len(ARTIST_REVIEW_BODIES)],
            sub_ratings={
                "quality": rng.randint(4, 5),
                "communication": rng.randint(3, 5),
                "timeliness": rng.randint(3, 5),
            },
            would_work_again=None,
            created_at=written_at,
        )

        if index % 10 != 9:
            created += _upsert_review(
                db,
                review_id=stable_id("review", "client", commission.id),
                author_id=artist_user_id,
                subject_user_id=commission.client_id,
                subject_type=ReviewSubjectType.CLIENT,
                commission_id=commission.id,
                rating=rng.choices([5, 4, 3], weights=[70, 24, 6])[0],
                body=CLIENT_REVIEW_BODIES[index % len(CLIENT_REVIEW_BODIES)],
                sub_ratings={
                    "paid_on_time": rng.randint(4, 5),
                    "communication": rng.randint(3, 5),
                    "respected_boundaries": 5,
                },
                would_work_again=rng.random() > 0.12,
                created_at=written_at + timedelta(days=1),
            )

    created += _seed_unsolicited_reviews(db, completed)
    db.flush()
    return created

def _seed_unsolicited_reviews(db: Session, completed: list[Commission]) -> int:
    created = 0
    for offset, commission in enumerate(completed[:6]):
        other = completed[(offset + 4) % len(completed)]
        author_id = other.client_id
        subject_id = commission.artist.user_id
        if author_id == subject_id or other.client_id == commission.client_id:
            continue
        created += _upsert_review(
            db,
            review_id=stable_id("review", "unsolicited", commission.id, author_id),
            author_id=author_id,
            subject_user_id=subject_id,
            subject_type=ReviewSubjectType.ARTIST,
            commission_id=None,
            rating=rng.choices([5, 4, 3], weights=[55, 30, 15])[0],
            body=ARTIST_REVIEW_BODIES[(offset + 3) % len(ARTIST_REVIEW_BODIES)],
            sub_ratings={"quality": rng.randint(3, 5), "communication": rng.randint(3, 5)},
            would_work_again=None,
            created_at=utcnow() - timedelta(days=rng.randint(10, 200)),
        )
    return created

def _upsert_review(db: Session, *, review_id: str, **fields) -> int:
    review = db.get(Review, review_id)
    if review is None:
        db.add(Review(id=review_id, **fields))
        return 1
    for key, value in fields.items():
        setattr(review, key, value)
    return 0

def recompute_artist_stats(db: Session, profiles: list[ArtistProfile]) -> None:
    for profile in profiles:
        stats = db.execute(
            select(func.count(Review.id), func.avg(Review.rating)).where(
                Review.subject_user_id == profile.user_id,
                Review.subject_type == ReviewSubjectType.ARTIST,
            )
        ).one()
        count, average = int(stats[0] or 0), stats[1]
        profile.review_count = count
        profile.rating_avg = (
            Decimal(str(round(float(average), 2))) if count and average else Decimal("0.00")
        )
    db.flush()

def print_logins(profiles: list[ArtistProfile], clients: list[User]) -> None:
    line = "-" * 74
    print(f"\n{line}\n  SEEDED LOGINS - password for every account: {SEED_PASSWORD}\n{line}")
    print(f"  {'EMAIL':<34}{'ROLE':<10}{'HANDLE / NAME':<30}")
    print(line)
    for profile in profiles:
        email = f"{profile.handle}@example.com"
        if not profile.is_open:
            status = "closed"
        elif profile.slots_open == 0:
            status = "waitlist"
        else:
            status = f"open ({profile.slots_open} slots)"
        print(f"  {email:<34}{'artist':<10}@{profile.handle:<20}{status}")
    for user in clients:
        print(f"  {user.username + '@example.com':<34}{'client':<10}{user.display_name:<30}")
    print(f"{line}\n")

def run() -> None:
    db = SessionLocal()
    try:
        print("Seeding tags...")
        tags = seed_tags(db)

        print(f"Seeding {len(ARTISTS)} artists...")
        profiles = seed_artists(db, tags)

        print(f"Seeding {len(CLIENTS)} clients...")
        clients = seed_clients(db)

        print(f"Seeding {len(STATUS_MIX)} commissions...")
        commissions = seed_commissions(db, profiles, clients)

        print("Seeding reviews in both directions...")
        seed_reviews(db, commissions)

        print("Recomputing artist rating stats...")
        recompute_artist_stats(db, profiles)

        db.commit()

        totals = {
            "tags": db.scalar(select(func.count(Tag.id))),
            "users": db.scalar(select(func.count(User.id))),
            "artist_profiles": db.scalar(select(func.count(ArtistProfile.id))),
            "offerings": db.scalar(select(func.count(CommissionOffering.id))),
            "commissions": db.scalar(select(func.count(Commission.id))),
            "reviews": db.scalar(select(func.count(Review.id))),
        }
        print("\nRow counts: " + ", ".join(f"{k}={v}" for k, v in totals.items()))
        print_logins(profiles, clients)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run()
