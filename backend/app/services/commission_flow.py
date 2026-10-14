from __future__ import annotations

from app.core.errors import ConflictError, ForbiddenError
from app.models import ArtistProfile, Commission, CommissionStatus, User

S = CommissionStatus

ALLOWED_TRANSITIONS: dict[CommissionStatus, set[CommissionStatus]] = {
    S.REQUESTED: {S.ACCEPTED, S.DECLINED},
    S.ACCEPTED: {S.IN_PROGRESS, S.CANCELLED},
    S.IN_PROGRESS: {S.COMPLETED, S.CANCELLED},
    S.COMPLETED: set(),
    S.DECLINED: set(),
    S.CANCELLED: set(),
}

TERMINAL: frozenset[CommissionStatus] = frozenset(
    state for state, nxt in ALLOWED_TRANSITIONS.items() if not nxt
)

ARTIST_ONLY: frozenset[CommissionStatus] = frozenset(
    {S.ACCEPTED, S.DECLINED, S.IN_PROGRESS, S.COMPLETED}
)

def assert_can_transition(
    commission: Commission,
    target: CommissionStatus,
    *,
    user: User,
    artist_profile: ArtistProfile | None,
) -> None:
    current = commission.status

    if current in TERMINAL:
        raise ConflictError(
            f"This commission is already {current.value} and cannot change again.",
            code="commission_terminal",
        )

    if target not in ALLOWED_TRANSITIONS[current]:
        allowed = sorted(s.value for s in ALLOWED_TRANSITIONS[current])
        raise ConflictError(
            f"Cannot go from {current.value} to {target.value}. "
            f"From {current.value} the only valid transitions are: {', '.join(allowed)}.",
            code="invalid_transition",
        )

    is_artist = artist_profile is not None and artist_profile.id == commission.artist_id
    is_client = commission.client_id == user.id

    if not (is_artist or is_client):
        raise ForbiddenError("You are not a party to this commission")

    if target in ARTIST_ONLY and not is_artist:
        raise ForbiddenError(
            f"Only the artist can mark a commission {target.value}",
            code="artist_only_transition",
        )

    if target is S.CANCELLED and current is S.IN_PROGRESS and not is_artist:
        raise ForbiddenError(
            "Work is already in progress - ask the artist to cancel.",
            code="cancel_requires_artist",
        )
