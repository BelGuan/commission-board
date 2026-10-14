from __future__ import annotations

import pytest

from tests.conftest import auth_header, make_artist, make_user

@pytest.fixture()
def parties(db, tags):
    artist = make_artist(db, "the_artist", tag_objs=[tags["anime"]])
    client_user = make_user(db, "the_client")
    return {"artist": artist, "client": client_user}

@pytest.fixture()
def client_headers(client, parties):
    return auth_header(client, "the_client@example.com")

@pytest.fixture()
def artist_headers(client, parties):
    return auth_header(client, "the_artist@example.com")

def open_commission(client, headers, title="A bust of my OC") -> str:
    response = client.post(
        "/api/commissions",
        headers=headers,
        json={"artist_handle": "the_artist", "title": title, "message": "Please and thanks"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]

def advance(client, headers, commission_id, status):
    return client.patch(
        f"/api/commissions/{commission_id}/status", headers=headers, json={"status": status}
    )

def test_create_commission(client, client_headers):
    response = client.post(
        "/api/commissions",
        headers=client_headers,
        json={
            "artist_handle": "the_artist",
            "title": "A bust of my OC",
            "message": "Soft lighting please",
            "proposed_price": "120.00",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "requested"
    assert body["artist_handle"] == "the_artist"
    assert body["agreed_price"] == "120.00"

def test_cannot_commission_yourself(client, artist_headers):
    response = client.post(
        "/api/commissions",
        headers=artist_headers,
        json={"artist_handle": "the_artist", "title": "Self portrait"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "self_commission"

def test_unknown_artist_is_404(client, client_headers):
    response = client.post(
        "/api/commissions",
        headers=client_headers,
        json={"artist_handle": "nobody", "title": "Something"},
    )
    assert response.status_code == 404

def test_happy_path_through_the_machine(client, client_headers, artist_headers, db, parties):
    cid = open_commission(client, client_headers)

    assert advance(client, artist_headers, cid, "accepted").status_code == 200
    assert advance(client, artist_headers, cid, "in_progress").status_code == 200

    completed = advance(client, artist_headers, cid, "completed")
    assert completed.status_code == 200
    assert completed.json()["completed_at"] is not None

    db.refresh(parties["artist"])
    assert parties["artist"].completed_commissions == 1

@pytest.mark.parametrize(
    ("target", "reason"),
    [
        ("in_progress", "requested cannot skip straight to in_progress"),
        ("completed", "requested cannot skip straight to completed"),
    ],
)
def test_illegal_transitions_from_requested(client, client_headers, artist_headers, target, reason):
    cid = open_commission(client, client_headers)
    response = advance(client, artist_headers, cid, target)
    assert response.status_code == 409, reason
    assert response.json()["code"] == "invalid_transition"
    assert "accepted" in response.json()["detail"]

def test_terminal_states_cannot_transition(client, client_headers, artist_headers):
    cid = open_commission(client, client_headers)
    assert advance(client, artist_headers, cid, "declined").status_code == 200

    again = advance(client, artist_headers, cid, "accepted")
    assert again.status_code == 409
    assert again.json()["code"] == "commission_terminal"

def test_completed_is_terminal(client, client_headers, artist_headers):
    cid = open_commission(client, client_headers)
    advance(client, artist_headers, cid, "accepted")
    advance(client, artist_headers, cid, "in_progress")
    advance(client, artist_headers, cid, "completed")

    assert advance(client, artist_headers, cid, "cancelled").status_code == 409

def test_only_the_artist_may_accept_or_complete(client, client_headers, artist_headers):
    cid = open_commission(client, client_headers)

    refused = advance(client, client_headers, cid, "accepted")
    assert refused.status_code == 403
    assert refused.json()["code"] == "artist_only_transition"

    advance(client, artist_headers, cid, "accepted")
    advance(client, artist_headers, cid, "in_progress")
    assert advance(client, client_headers, cid, "completed").status_code == 403

def test_either_party_may_cancel_before_work_starts(client, client_headers, artist_headers):
    cid = open_commission(client, client_headers)
    advance(client, artist_headers, cid, "accepted")

    assert advance(client, client_headers, cid, "cancelled").status_code == 200

def test_client_cannot_cancel_once_in_progress(client, client_headers, artist_headers):
    cid = open_commission(client, client_headers)
    advance(client, artist_headers, cid, "accepted")
    advance(client, artist_headers, cid, "in_progress")

    refused = advance(client, client_headers, cid, "cancelled")
    assert refused.status_code == 403
    assert refused.json()["code"] == "cancel_requires_artist"

    assert advance(client, artist_headers, cid, "cancelled").status_code == 200

def test_outsider_gets_404_not_403(client, db, client_headers, artist_headers):
    cid = open_commission(client, client_headers)
    make_user(db, "nosy")
    outsider = auth_header(client, "nosy@example.com")

    response = advance(client, outsider, cid, "accepted")
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"

def test_list_filters_by_role_and_status(client, client_headers, artist_headers):
    first = open_commission(client, client_headers, "First")
    open_commission(client, client_headers, "Second")
    advance(client, artist_headers, first, "accepted")

    as_client = client.get("/api/commissions?role=client", headers=client_headers)
    assert as_client.json()["total"] == 2

    as_artist = client.get("/api/commissions?role=artist", headers=artist_headers)
    assert as_artist.json()["total"] == 2

    accepted = client.get("/api/commissions?status=accepted", headers=artist_headers)
    assert accepted.json()["total"] == 1
    assert accepted.json()["items"][0]["title"] == "First"

def test_commission_list_requires_auth(client):
    assert client.get("/api/commissions").status_code == 401
