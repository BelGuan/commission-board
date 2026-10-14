from __future__ import annotations

from tests.conftest import PASSWORD, make_user

REGISTRATION = {
    "email": "newbie@example.com",
    "username": "newbie",
    "password": PASSWORD,
    "display_name": "New Bie",
}

def test_register_creates_user_and_returns_token(client):
    response = client.post("/api/auth/register", json=REGISTRATION)
    assert response.status_code == 201, response.text

    body = response.json()
    assert body["user"]["username"] == "newbie"
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert "password_hash" not in body["user"]

    me = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "newbie@example.com"
    assert me.json()["artist_profile"] is None

def test_register_as_artist_creates_profile(client):
    response = client.post(
        "/api/auth/register", json={**REGISTRATION, "is_artist": True}
    )
    assert response.status_code == 201
    token = response.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["artist_profile"]["handle"] == "newbie"

def test_register_rejects_duplicate_email_and_username(client, db):
    make_user(db, "taken")

    dup_email = client.post(
        "/api/auth/register",
        json={**REGISTRATION, "email": "taken@example.com", "username": "someoneelse"},
    )
    assert dup_email.status_code == 409
    assert dup_email.json()["code"] == "email_taken"

    dup_username = client.post(
        "/api/auth/register", json={**REGISTRATION, "username": "taken"}
    )
    assert dup_username.status_code == 409
    assert dup_username.json()["code"] == "username_taken"

def test_register_validation(client):
    short_pw = client.post("/api/auth/register", json={**REGISTRATION, "password": "short"})
    assert short_pw.status_code == 422
    assert short_pw.json()["code"] == "validation_error"
    assert any(e["field"].endswith("password") for e in short_pw.json()["errors"])

    bad_username = client.post(
        "/api/auth/register", json={**REGISTRATION, "username": "has spaces!"}
    )
    assert bad_username.status_code == 422

    bad_email = client.post(
        "/api/auth/register", json={**REGISTRATION, "email": "not-an-email"}
    )
    assert bad_email.status_code == 422

def test_login_success_and_failure(client, db):
    make_user(db, "someone")

    ok = client.post(
        "/api/auth/login", json={"email": "someone@example.com", "password": PASSWORD}
    )
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    wrong = client.post(
        "/api/auth/login", json={"email": "someone@example.com", "password": "nope-nope"}
    )
    assert wrong.status_code == 401
    assert wrong.json()["code"] == "invalid_credentials"

    unknown = client.post(
        "/api/auth/login", json={"email": "ghost@example.com", "password": PASSWORD}
    )
    assert unknown.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]

def test_me_requires_a_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.get(
            "/api/auth/me", headers={"Authorization": "Bearer not.a.real.token"}
        ).status_code
        == 401
    )

def test_patch_me_updates_only_self(client, db):
    make_user(db, "editor")
    headers = {
        "Authorization": "Bearer "
        + client.post(
            "/api/auth/login",
            json={"email": "editor@example.com", "password": PASSWORD},
        ).json()["access_token"]
    }

    response = client.patch(
        "/api/auth/me",
        headers=headers,
        json={"display_name": "Edited Name", "age_verified": True},
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Edited Name"
    assert response.json()["age_verified"] is True

def test_login_is_rate_limited(client, db):
    make_user(db, "target")
    payload = {"email": "target@example.com", "password": "wrong-password"}

    for _ in range(5):
        assert client.post("/api/auth/login", json=payload).status_code == 401

    limited = client.post("/api/auth/login", json=payload)
    assert limited.status_code == 429
    assert limited.json()["code"] == "rate_limited"

    correct = client.post(
        "/api/auth/login", json={"email": "target@example.com", "password": PASSWORD}
    )
    assert correct.status_code == 429

def test_html_is_stripped_from_user_bio(client, db):
    make_user(db, "writer")
    headers = {
        "Authorization": "Bearer "
        + client.post(
            "/api/auth/login",
            json={"email": "writer@example.com", "password": PASSWORD},
        ).json()["access_token"]
    }

    response = client.patch(
        "/api/auth/me",
        headers=headers,
        json={"bio": "<script>alert('xss')</script>Just an illustrator"},
    )
    assert response.status_code == 200
    bio = response.json()["bio"]
    assert "<script>" not in bio
    assert "alert" not in bio
    assert "Just an illustrator" in bio
