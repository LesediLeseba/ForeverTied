"""The scan resolver: GET /q/{code_identifier} → 302 to the React app."""

from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from tests.conftest import create_memorial_via_api, create_plates_via_api


async def _active_plate(client) -> tuple[str, dict]:
    memorial = await create_memorial_via_api(client, deceased_name="Scanned Person")
    plate = (await create_plates_via_api(client, 1))[0]
    response = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": memorial["id"]},
    )
    assert response.status_code == 200
    return plate["code_identifier"], memorial


async def test_active_plate_redirects_to_memorial_page(client) -> None:
    code, memorial = await _active_plate(client)

    response = await client.get(f"/q/{code}")

    assert response.status_code == 302
    assert response.headers["location"] == (
        f"http://frontend.test/memorials/{memorial['slug']}"
    )
    assert memorial["slug"] == "scanned-person-1980"


async def test_lowercase_scan_still_resolves(client) -> None:
    code, memorial = await _active_plate(client)

    response = await client.get(f"/q/{code.lower()}")

    assert response.status_code == 302
    assert response.headers["location"].endswith(f"/memorials/{memorial['slug']}")


async def test_unknown_code_redirects_to_setup(client) -> None:
    response = await client.get("/q/ZZZZ9999")

    assert response.status_code == 302
    location = urlparse(response.headers["location"])
    assert f"{location.scheme}://{location.netloc}{location.path}" == (
        "http://frontend.test/setup"
    )
    query = parse_qs(location.query)
    assert query["code"] == ["ZZZZ9999"]
    assert query["reason"] == ["unknown_code"]


async def test_unassigned_plate_redirects_to_setup(client) -> None:
    plate = (await create_plates_via_api(client, 1))[0]

    response = await client.get(f"/q/{plate['code_identifier']}")

    assert response.status_code == 302
    assert response.headers["location"].startswith("http://frontend.test/setup?")
    assert "reason=unassigned" in response.headers["location"]


async def test_damaged_plate_redirects_to_setup(client) -> None:
    memorial = await create_memorial_via_api(client)
    plate = (await create_plates_via_api(client, 1))[0]
    code = plate["code_identifier"]

    await client.patch(
        f"/api/v1/admin/qr-codes/{code}/assign",
        json={"memorial_id": memorial["id"]},
    )
    await client.patch(
        f"/api/v1/admin/qr-codes/{code}/status", json={"status": "damaged"}
    )

    response = await client.get(f"/q/{code}")

    assert response.status_code == 302
    assert "reason=damaged" in response.headers["location"]


async def test_not_found_mode_returns_404(not_found_client) -> None:
    response = await not_found_client.get("/q/ZZZZ9999")

    assert response.status_code == 404
    body = response.json()
    assert body["code_identifier"] == "ZZZZ9999"
    assert body["reason"] == "unknown_code"


async def test_resolver_does_not_leak_memorial_data_on_miss(client) -> None:
    response = await client.get("/q/NOPE0000")
    assert response.status_code == 302
    assert "memorial" not in response.text.lower()
