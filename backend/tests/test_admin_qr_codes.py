"""Admin plate endpoints — batch generation, binding, status transitions."""

from __future__ import annotations

import re
import uuid

from tests.conftest import create_memorial_via_api, create_plates_via_api

IDENTIFIER_RE = re.compile(r"^[A-Z0-9]{8}$")


async def test_batch_generation(client) -> None:
    plates = await create_plates_via_api(client, quantity=12)

    assert len(plates) == 12
    identifiers = [plate["code_identifier"] for plate in plates]
    assert len(set(identifiers)) == 12
    assert all(IDENTIFIER_RE.match(code) for code in identifiers)
    assert all(plate["status"] == "unassigned" for plate in plates)
    assert all(plate["memorial_id"] is None for plate in plates)


async def test_batch_response_includes_scan_urls(client) -> None:
    plates = await create_plates_via_api(client, quantity=1)
    plate = plates[0]

    assert plate["scan_url"] == f"http://api.test/q/{plate['code_identifier']}"
    assert plate["id"]
    assert plate["created_at"]


async def test_repeated_batches_never_reuse_identifiers(client) -> None:
    first = await create_plates_via_api(client, quantity=25)
    second = await create_plates_via_api(client, quantity=25)

    identifiers = [p["code_identifier"] for p in first + second]
    assert len(set(identifiers)) == 50


async def test_batch_quantity_validation(client) -> None:
    for invalid in (0, -1, 1001):
        response = await client.post(
            "/api/v1/admin/qr-codes/batch", json={"quantity": invalid}
        )
        assert response.status_code == 422, invalid


async def test_assign_plate_activates_it(client) -> None:
    memorial = await create_memorial_via_api(client, deceased_name="Bound Person")
    plate = (await create_plates_via_api(client, 1))[0]

    response = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": memorial["id"]},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "active"
    assert body["memorial_id"] == memorial["id"]
    assert body["memorial_slug"] == "bound-person-1980"
    assert body["deceased_name"] == "Bound Person"


async def test_assign_is_case_insensitive(client) -> None:
    memorial = await create_memorial_via_api(client)
    plate = (await create_plates_via_api(client, 1))[0]

    response = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier'].lower()}/assign",
        json={"memorial_id": memorial["id"]},
    )
    assert response.status_code == 200, response.text


async def test_assign_unknown_plate_returns_404(client) -> None:
    memorial = await create_memorial_via_api(client)
    response = await client.patch(
        "/api/v1/admin/qr-codes/NOPE1234/assign",
        json={"memorial_id": memorial["id"]},
    )
    assert response.status_code == 404
    assert "does not exist" in response.json()["detail"]


async def test_assign_unknown_memorial_returns_404(client) -> None:
    plate = (await create_plates_via_api(client, 1))[0]
    response = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": str(uuid.uuid4())},
    )
    assert response.status_code == 404


async def test_reassign_requires_force(client) -> None:
    first = await create_memorial_via_api(client, deceased_name="First Person")
    second = await create_memorial_via_api(client, deceased_name="Second Person")
    plate = (await create_plates_via_api(client, 1))[0]

    await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": first["id"]},
    )

    conflict = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": second["id"]},
    )
    assert conflict.status_code == 409

    forced = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": second["id"], "force": True},
    )
    assert forced.status_code == 200
    assert forced.json()["memorial_id"] == second["id"]


async def test_reassign_to_same_memorial_is_idempotent(client) -> None:
    memorial = await create_memorial_via_api(client)
    plate = (await create_plates_via_api(client, 1))[0]
    url = f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign"

    assert (
        await client.patch(url, json={"memorial_id": memorial["id"]})
    ).status_code == 200
    second = await client.patch(url, json={"memorial_id": memorial["id"]})
    assert second.status_code == 200
    assert second.json()["status"] == "active"


async def test_unassign_returns_plate_to_pool(client) -> None:
    memorial = await create_memorial_via_api(client)
    plate = (await create_plates_via_api(client, 1))[0]
    code = plate["code_identifier"]

    await client.patch(
        f"/api/v1/admin/qr-codes/{code}/assign",
        json={"memorial_id": memorial["id"]},
    )

    response = await client.patch(f"/api/v1/admin/qr-codes/{code}/unassign")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "unassigned"
    assert body["memorial_id"] is None
    assert body["memorial_slug"] is None


async def test_mark_plate_damaged(client) -> None:
    memorial = await create_memorial_via_api(client)
    plate = (await create_plates_via_api(client, 1))[0]
    code = plate["code_identifier"]

    await client.patch(
        f"/api/v1/admin/qr-codes/{code}/assign",
        json={"memorial_id": memorial["id"]},
    )

    response = await client.patch(
        f"/api/v1/admin/qr-codes/{code}/status", json={"status": "damaged"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "damaged"
    assert body["memorial_id"] is None


async def test_invalid_status_rejected(client) -> None:
    plate = (await create_plates_via_api(client, 1))[0]
    response = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/status",
        json={"status": "exploded"},
    )
    assert response.status_code == 422


async def test_list_plates_with_filters_and_counts(client) -> None:
    memorial = await create_memorial_via_api(client)
    plates = await create_plates_via_api(client, 3)

    await client.patch(
        f"/api/v1/admin/qr-codes/{plates[0]['code_identifier']}/assign",
        json={"memorial_id": memorial["id"]},
    )
    await client.patch(
        f"/api/v1/admin/qr-codes/{plates[1]['code_identifier']}/status",
        json={"status": "damaged"},
    )

    listing = await client.get("/api/v1/admin/qr-codes")
    body = listing.json()
    assert listing.status_code == 200
    assert body["total"] == 3
    assert body["counts_by_status"] == {
        "unassigned": 1,
        "active": 1,
        "damaged": 1,
    }

    active = await client.get(
        "/api/v1/admin/qr-codes", params={"status": "active"}
    )
    assert active.json()["total"] == 1
    assert active.json()["items"][0]["status"] == "active"

    by_memorial = await client.get(
        "/api/v1/admin/qr-codes", params={"memorial_id": memorial["id"]}
    )
    assert by_memorial.json()["total"] == 1


async def test_list_plates_rejects_bad_memorial_id(client) -> None:
    response = await client.get(
        "/api/v1/admin/qr-codes", params={"memorial_id": "not-a-uuid"}
    )
    assert response.status_code == 422
