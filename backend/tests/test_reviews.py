from __future__ import annotations

from decimal import Decimal

import pytest

from tests.conftest import auth_header, make_artist, make_user

ARTIST_SUBS = {"quality": 5, "communication": 4, "timeliness": 5}
CLIENT_SUBS = {"paid_on_time": 5, "communication": 5, "respected_boundaries": 5}
BODY = "Genuinely excellent work and the communication was clear throughout."

@pytest.fixture()
def parties(db, tags):
    artist = make_artist(db, "the_artist", tag_objs=[tags["anime"]])
    buyer = make_user(db, "the_client")
    return {"artist": artist, "client": buyer}

@pytest.fixture()
def client_headers(client, parties):
    return auth_header(client, "the_client@example.com")

@pytest.fixture()
def artist_headers(client, parties):
    return auth_header(client, "the_artist@example.com")

def completed_commission(client, client_headers, artist_headers) -> str:
    cid = client.post(
        "/api/commissions",
        headers=client_headers,
        json={"artist_handle": "the_artist", "title": "A commission"},
    ).json()["id"]
    for state in ("accepted", "in_progress", "completed"):
        client.patch(
            f"/api/commissions/{cid}/status", headers=artist_headers, json={"status": state}
        )
    return cid

def test_unsolicited_review_is_not_verified(client, client_headers, parties):
    response = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "rating": 5,
            "body": BODY,
            "sub_ratings": ARTIST_SUBS,
        },
    )
    assert response.status_code == 201
    assert response.json()["verified"] is False

def test_commission_backed_review_is_verified(client, client_headers, artist_headers, parties):
    cid = completed_commission(client, client_headers, artist_headers)

    response = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "commission_id": cid,
            "rating": 5,
            "body": BODY,
            "sub_ratings": ARTIST_SUBS,
        },
    )
    assert response.status_code == 201
    assert response.json()["verified"] is True

def test_cannot_review_yourself(client, artist_headers, parties):
    response = client.post(
        "/api/reviews",
        headers=artist_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "rating": 5,
            "body": BODY,
        },
    )
    assert response.status_code == 422
    assert response.json()["code"] == "self_review"

def test_artist_subject_must_have_a_profile(client, db, client_headers):
    plain = make_user(db, "not_an_artist")
    response = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": plain.id,
            "subject_type": "artist",
            "rating": 4,
            "body": BODY,
        },
    )
    assert response.status_code == 422
    assert response.json()["code"] == "subject_not_artist"

def test_duplicate_review_is_409(client, client_headers, artist_headers, parties):
    cid = completed_commission(client, client_headers, artist_headers)
    payload = {
        "subject_user_id": parties["artist"].user_id,
        "subject_type": "artist",
        "commission_id": cid,
        "rating": 5,
        "body": BODY,
        "sub_ratings": ARTIST_SUBS,
    }

    assert client.post("/api/reviews", headers=client_headers, json=payload).status_code == 201

    duplicate = client.post("/api/reviews", headers=client_headers, json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "duplicate_review"

def test_cannot_review_an_incomplete_commission(client, client_headers, parties):
    cid = client.post(
        "/api/commissions",
        headers=client_headers,
        json={"artist_handle": "the_artist", "title": "Still pending"},
    ).json()["id"]

    response = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "commission_id": cid,
            "rating": 5,
            "body": BODY,
        },
    )
    assert response.status_code == 409
    assert response.json()["code"] == "commission_not_completed"

def test_outsider_cannot_attach_to_someone_elses_commission(
    client, db, client_headers, artist_headers, parties
):
    cid = completed_commission(client, client_headers, artist_headers)
    make_user(db, "stranger")
    outsider = auth_header(client, "stranger@example.com")

    response = client.post(
        "/api/reviews",
        headers=outsider,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "commission_id": cid,
            "rating": 1,
            "body": BODY,
        },
    )
    assert response.status_code == 404

def test_body_minimum_length_and_rating_bounds(client, client_headers, parties):
    base = {
        "subject_user_id": parties["artist"].user_id,
        "subject_type": "artist",
        "rating": 5,
        "body": BODY,
    }

    short = client.post("/api/reviews", headers=client_headers, json={**base, "body": "Great!"})
    assert short.status_code == 422

    bad_rating = client.post("/api/reviews", headers=client_headers, json={**base, "rating": 6})
    assert bad_rating.status_code == 422

    markup = client.post(
        "/api/reviews",
        headers=client_headers,
        json={**base, "body": "<b><i><em></em></i></b><script>alert(1)</script>"},
    )
    assert markup.status_code == 422

def test_sub_rating_keys_are_checked_against_the_direction(client, client_headers, parties):
    response = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "rating": 5,
            "body": BODY,
            "sub_ratings": {"paid_on_time": 5},
        },
    )
    assert response.status_code == 422

def test_reviews_are_append_only(client):
    assert client.patch("/api/reviews/whatever", json={"rating": 1}).status_code == 405

def test_rating_is_recomputed_after_each_write(client, db, client_headers, parties, tags):
    artist_user_id = parties["artist"].user_id

    def post(rating: int, author_headers):
        return client.post(
            "/api/reviews",
            headers=author_headers,
            json={
                "subject_user_id": artist_user_id,
                "subject_type": "artist",
                "rating": rating,
                "body": BODY,
                "sub_ratings": ARTIST_SUBS,
            },
        )

    assert post(5, client_headers).status_code == 201
    db.refresh(parties["artist"])
    assert parties["artist"].review_count == 1
    assert parties["artist"].rating_avg == Decimal("5.00")

    make_user(db, "second_client")
    second = auth_header(client, "second_client@example.com")
    assert post(3, second).status_code == 201

    db.refresh(parties["artist"])
    assert parties["artist"].review_count == 2
    assert parties["artist"].rating_avg == Decimal("4.00")

def test_delete_recomputes_and_respects_the_window(client, db, client_headers, parties):
    created = client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "rating": 2,
            "body": BODY,
            "sub_ratings": ARTIST_SUBS,
        },
    )
    review_id = created.json()["id"]
    db.refresh(parties["artist"])
    assert parties["artist"].rating_avg == Decimal("2.00")

    assert client.delete(f"/api/reviews/{review_id}", headers=client_headers).status_code == 204

    db.refresh(parties["artist"])
    assert parties["artist"].review_count == 0
    assert parties["artist"].rating_avg == Decimal("0.00")

def test_listing_is_paginated_and_newest_first(client, db, client_headers, parties):
    for i in range(3):
        make_user(db, f"reviewer_{i}")
        headers = auth_header(client, f"reviewer_{i}@example.com")
        client.post(
            "/api/reviews",
            headers=headers,
            json={
                "subject_user_id": parties["artist"].user_id,
                "subject_type": "artist",
                "rating": 4,
                "body": BODY,
                "sub_ratings": ARTIST_SUBS,
            },
        )

    listing = client.get(
        f"/api/reviews?subject_user_id={parties['artist'].user_id}&page_size=2"
    )
    assert listing.status_code == 200
    assert listing.json()["total"] == 3
    assert len(listing.json()["items"]) == 2
    assert listing.json()["items"][0]["author"]["username"]

def test_verified_only_filter(client, client_headers, artist_headers, parties):
    cid = completed_commission(client, client_headers, artist_headers)
    client.post(
        "/api/reviews",
        headers=client_headers,
        json={
            "subject_user_id": parties["artist"].user_id,
            "subject_type": "artist",
            "commission_id": cid,
            "rating": 5,
            "body": BODY,
            "sub_ratings": ARTIST_SUBS,
        },
    )

    url = f"/api/reviews?subject_user_id={parties['artist'].user_id}&verified_only=true"
    assert client.get(url).json()["total"] == 1

def test_client_reputation_page(client, client_headers, artist_headers, parties):
    cid = completed_commission(client, client_headers, artist_headers)
    client.post(
        "/api/reviews",
        headers=artist_headers,
        json={
            "subject_user_id": parties["client"].id,
            "subject_type": "client",
            "commission_id": cid,
            "rating": 5,
            "body": "Clear brief, paid promptly, a pleasure to work with throughout.",
            "sub_ratings": CLIENT_SUBS,
            "would_work_again": True,
        },
    )

    page = client.get("/api/users/the_client")
    assert page.status_code == 200
    body = page.json()
    assert body["review_count"] == 1
    assert body["rating_avg"] == 5.0
    assert body["completed_commissions"] == 1
    assert body["sub_rating_averages"]["paid_on_time"] == 5.0
    assert body["would_work_again_pct"] == 100.0
    assert "email" not in body

def test_reputation_page_404s_for_unknown_user(client):
    assert client.get("/api/users/ghost").status_code == 404
