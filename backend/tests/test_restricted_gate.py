from __future__ import annotations

import pytest

from tests.conftest import PASSWORD, auth_header, make_artist, make_user

@pytest.fixture()
def board(db, tags):
    make_artist(db, "safe_artist", tag_objs=[tags["anime"], tags["oc_friendly"]])
    make_artist(
        db,
        "mature_artist",
        tag_objs=[tags["anime"], tags["nsfw_18plus"]],
        restricted_images=True,
    )

def handles(response) -> set[str]:
    return {item["handle"] for item in response.json()["items"]}

def test_anonymous_never_sees_restricted_artists(client, board):
    assert handles(client.get("/api/artists")) == {"safe_artist"}

def test_flag_alone_does_not_unlock(client, board):
    assert handles(client.get("/api/artists?include_restricted=true")) == {"safe_artist"}

def test_authenticated_but_unverified_does_not_unlock(client, db, board):
    make_user(db, "unverified")
    headers = auth_header(client, "unverified@example.com")

    response = client.get("/api/artists?include_restricted=true", headers=headers)
    assert handles(response) == {"safe_artist"}

def test_verified_without_the_flag_does_not_unlock(client, db, board):
    make_user(db, "grown_up", age_verified=True)
    headers = auth_header(client, "grown_up@example.com")

    assert handles(client.get("/api/artists", headers=headers)) == {"safe_artist"}

def test_all_three_conditions_unlock(client, db, board):
    make_user(db, "grown_up", age_verified=True)
    headers = auth_header(client, "grown_up@example.com")

    response = client.get("/api/artists?include_restricted=true", headers=headers)
    assert handles(response) == {"safe_artist", "mature_artist"}

def test_restricted_tags_and_images_are_stripped_from_the_profile(client, db, board):
    anon = client.get("/api/artists/mature_artist")
    assert anon.status_code == 200
    assert anon.json()["content_tags"] == []
    assert anon.json()["sheet_images"] == []
    assert anon.json()["portfolio_images"] == []
    assert anon.json()["has_restricted_content"] is True

    make_user(db, "grown_up", age_verified=True)
    headers = auth_header(client, "grown_up@example.com")
    unlocked = client.get(
        "/api/artists/mature_artist?include_restricted=true", headers=headers
    )
    assert "nsfw_18plus" in unlocked.json()["content_tags"]
    assert len(unlocked.json()["sheet_images"]) == 1

def test_show_restricted_preference_requires_age_verification(client, db):
    make_user(db, "hopeful")
    headers = auth_header(client, "hopeful@example.com")

    refused = client.put(
        "/api/me/preferences", headers=headers, json={"show_restricted": True}
    )
    assert refused.status_code == 403
    assert refused.json()["code"] == "age_verification_required"

    client.patch("/api/auth/me", headers=headers, json={"age_verified": True})
    allowed = client.put(
        "/api/me/preferences", headers=headers, json={"show_restricted": True}
    )
    assert allowed.status_code == 200
    assert allowed.json()["show_restricted"] is True

def test_excluded_content_tags_remove_artists_entirely(client, db, tags):
    make_artist(db, "furry_artist", tag_objs=[tags["anime"], tags["oc_friendly"]])
    make_artist(db, "plain_artist", tag_objs=[tags["anime"]])

    make_user(db, "picky")
    headers = auth_header(client, "picky@example.com")
    client.put(
        "/api/me/preferences",
        headers=headers,
        json={"excluded_content_tags": ["oc_friendly"]},
    )

    response = client.get("/api/artists", headers=headers)
    assert handles(response) == {"plain_artist"}
