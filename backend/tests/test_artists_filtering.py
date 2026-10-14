from __future__ import annotations

import pytest

from tests.conftest import make_artist

@pytest.fixture()
def board(db, tags):
    return {
        "cheap_fast": make_artist(
            db, "cheap_fast",
            tag_objs=[tags["pixel_art"], tags["oc_friendly"], tags["bust"]],
            price_min="10.00", price_max="40.00", turnaround_days=3,
        ),
        "mid_anime": make_artist(
            db, "mid_anime",
            tag_objs=[tags["anime"], tags["oc_friendly"]],
            price_min="80.00", price_max="250.00", turnaround_days=14,
        ),
        "pricey_slow": make_artist(
            db, "pricey_slow",
            tag_objs=[tags["anime"]],
            price_min="400.00", price_max="900.00", turnaround_days=45,
        ),
        "closed_shop": make_artist(
            db, "closed_shop",
            tag_objs=[tags["anime"]],
            price_min="100.00", price_max="300.00",
            is_open=False, slots_open=0,
        ),
    }

def handles(response) -> set[str]:
    return {item["handle"] for item in response.json()["items"]}

def test_lists_all_artists_by_default(client, board):
    response = client.get("/api/artists")
    assert response.status_code == 200
    assert response.json()["total"] == 4
    assert response.json()["page_size"] == 12

def test_style_filter_matches_any(client, board):
    only_anime = client.get("/api/artists?styles=anime")
    assert handles(only_anime) == {"mid_anime", "pricey_slow", "closed_shop"}

    either = client.get("/api/artists?styles=anime,pixel_art")
    assert handles(either) == {"cheap_fast", "mid_anime", "pricey_slow", "closed_shop"}

def test_facets_are_anded_together(client, board):
    response = client.get("/api/artists?styles=anime&content_tags=oc_friendly")
    assert handles(response) == {"mid_anime"}

def test_commission_type_filter(client, board):
    response = client.get("/api/artists?commission_types=bust")
    assert handles(response) == {"cheap_fast"}

def test_price_filter_uses_overlap_not_containment(client, board):
    response = client.get("/api/artists?price_max=100")
    assert handles(response) == {"cheap_fast", "mid_anime", "closed_shop"}

    floor = client.get("/api/artists?price_min=300")
    assert handles(floor) == {"pricey_slow", "closed_shop"}

    window = client.get("/api/artists?price_min=50&price_max=120")
    assert handles(window) == {"mid_anime", "closed_shop"}

def test_turnaround_filter(client, board):
    response = client.get("/api/artists?max_turnaround_days=14")
    assert handles(response) == {"cheap_fast", "mid_anime", "closed_shop"}

def test_open_only_filter(client, board):
    response = client.get("/api/artists?open_only=true")
    assert "closed_shop" not in handles(response)
    assert len(handles(response)) == 3

def test_free_text_search_is_case_insensitive(client, board):
    assert handles(client.get("/api/artists?q=CHEAP")) == {"cheap_fast"}
    assert handles(client.get("/api/artists?q=tagline")) == {
        "cheap_fast", "mid_anime", "pricey_slow", "closed_shop",
    }

def test_impossible_combination_returns_empty_page(client, board):
    response = client.get("/api/artists?styles=pixel_art&price_min=500")
    assert response.status_code == 200
    assert response.json()["total"] == 0
    assert response.json()["items"] == []

@pytest.mark.parametrize(
    ("sort", "first"),
    [("price_low", "cheap_fast"), ("price_high", "pricey_slow")],
)
def test_price_sorting(client, board, sort, first):
    response = client.get(f"/api/artists?sort={sort}")
    assert response.json()["items"][0]["handle"] == first

def test_invalid_sort_is_rejected(client, board):
    assert client.get("/api/artists?sort=cheapest").status_code == 422

def test_pagination_splits_without_overlap(client, board):
    first = client.get("/api/artists?page=1&page_size=2&sort=price_low")
    second = client.get("/api/artists?page=2&page_size=2&sort=price_low")

    assert first.json()["total"] == 4
    assert len(first.json()["items"]) == 2
    assert not handles(first) & handles(second)
    assert handles(first) | handles(second) == {
        "cheap_fast", "mid_anime", "pricey_slow", "closed_shop",
    }

def test_page_size_is_capped(client, board):
    assert client.get("/api/artists?page_size=500").status_code == 422

def test_detail_endpoint_and_404(client, board):
    ok = client.get("/api/artists/mid_anime")
    assert ok.status_code == 200
    body = ok.json()
    assert body["handle"] == "mid_anime"
    assert len(body["offerings"]) == 1
    assert len(body["rating_distribution"]) == 5
    assert "email" not in body["user"]

    missing = client.get("/api/artists/nobody_here")
    assert missing.status_code == 404
    assert missing.json()["code"] == "not_found"
