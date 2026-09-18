"""Admin memorial endpoints — creation, slug collisions, listing, validation."""

from __future__ import annotations

import pytest

from tests.conftest import create_memorial_via_api, create_plates_via_api


async def test_create_memorial_generates_slug(client) -> None:
    payload = await create_memorial_via_api(
        client,
        deceased_name="John Doe",
        dates="1980 - 2026",
        biography="Beloved father and gardener.",
        photo_url="https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07",
    )

    assert payload["slug"] == "john-doe-1980"
    assert payload["deceased_name"] == "John Doe"
    assert payload["dates"] == "1980 - 2026"
    assert payload["photo_url"].startswith("https://images.unsplash.com/")
    assert payload["qr_code_count"] == 0
    assert payload["id"]


async def test_slug_collisions_get_numeric_suffixes(client) -> None:
    first = await create_memorial_via_api(client, deceased_name="John Doe")
    second = await create_memorial_via_api(client, deceased_name="John Doe")
    third = await create_memorial_via_api(client, deceased_name="John Doe")

    assert [first["slug"], second["slug"], third["slug"]] == [
        "john-doe-1980",
        "john-doe-1980-1",
        "john-doe-1980-2",
    ]


async def test_blank_fields_are_rejected(client) -> None:
    response = await client.post(
        "/api/v1/admin/memorials",
        json={
            "deceased_name": "   ",
            "dates": "1980 - 2026",
            "biography": "text",
        },
    )
    assert response.status_code == 422


async def test_relative_photo_url_is_rejected(client) -> None:
    response = await client.post(
        "/api/v1/admin/memorials",
        json={
            "deceased_name": "John Doe",
            "dates": "1980 - 2026",
            "biography": "text",
            "photo_url": "/local/photo.jpg",
        },
    )
    assert response.status_code == 422
    assert "photo_url" in response.text


async def test_photo_url_is_optional(client) -> None:
    payload = await create_memorial_via_api(client, photo_url=None)
    assert payload["photo_url"] is None


async def test_list_memorials_reports_bound_plates(client) -> None:
    memorial = await create_memorial_via_api(client, deceased_name="Listed Person")
    plates = await create_plates_via_api(client, 2)

    for plate in plates:
        response = await client.patch(
            f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
            json={"memorial_id": memorial["id"]},
        )
        assert response.status_code == 200, response.text

    listing = await client.get("/api/v1/admin/memorials")
    assert listing.status_code == 200
    body = listing.json()

    assert body["total"] == 1
    row = body["items"][0]
    assert row["slug"] == "listed-person-1980"
    assert row["qr_code_count"] == 2
    assert row["active_qr_codes"] == 2
    assert sorted(row["bound_codes"]) == sorted(
        plate["code_identifier"] for plate in plates
    )


async def test_list_memorials_search_filter(client) -> None:
    await create_memorial_via_api(client, deceased_name="Thabo Mokoena")
    await create_memorial_via_api(client, deceased_name="Sarah Adams")

    response = await client.get("/api/v1/admin/memorials", params={"search": "thabo"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["deceased_name"] == "Thabo Mokoena"


async def test_read_memorial_by_id_and_slug(client) -> None:
    created = await create_memorial_via_api(client, deceased_name="Read Me")

    by_id = await client.get(f"/api/v1/admin/memorials/{created['id']}")
    assert by_id.status_code == 200
    assert by_id.json()["slug"] == created["slug"]

    by_slug = await client.get(
        f"/api/v1/admin/memorials/by-slug/{created['slug']}"
    )
    assert by_slug.status_code == 200
    assert by_slug.json()["id"] == created["id"]


async def test_read_unknown_memorial_returns_404(client) -> None:
    response = await client.get("/api/v1/admin/memorials/by-slug/nope")
    assert response.status_code == 404


async def test_pagination_limits(client) -> None:
    for index in range(3):
        await create_memorial_via_api(client, deceased_name=f"Person {index}")

    response = await client.get(
        "/api/v1/admin/memorials", params={"limit": 2, "offset": 0}
    )
    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["limit"] == 2


@pytest.mark.parametrize("limit", [0, 500])
async def test_invalid_limit_rejected(client, limit: int) -> None:
    response = await client.get(
        "/api/v1/admin/memorials", params={"limit": limit}
    )
    assert response.status_code == 422
