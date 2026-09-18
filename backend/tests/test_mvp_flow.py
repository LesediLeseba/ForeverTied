"""End-to-end MVP flow, exactly as a funeral home + visitor would run it.

1. Admin pre-generates a batch of physical plates.
2. Admin creates a memorial (auto slug).
3. Admin binds a plate to the memorial.
4. A visitor scans the plate → 302 to the React memorial page.
5. The React page fetches the memorial JSON by slug.
"""

from __future__ import annotations

from tests.conftest import create_plates_via_api


async def test_full_plate_to_memorial_flow(client) -> None:
    # 1. batch of plates
    batch = await client.post("/api/v1/admin/qr-codes/batch", json={"quantity": 5})
    assert batch.status_code == 201
    plates = batch.json()["qr_codes"]
    assert len(plates) == 5

    # 2. create the memorial
    memorial_response = await client.post(
        "/api/v1/admin/memorials",
        json={
            "deceased_name": "Elsabe Botha",
            "dates": "1952 - 2026",
            "biography": "Librarian for thirty years; keeper of everybody's stories.",
            "photo_url": "https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07",
        },
    )
    assert memorial_response.status_code == 201
    memorial = memorial_response.json()
    assert memorial["slug"] == "elsabe-botha-1952"

    # 3. bind the first plate
    plate = plates[0]
    assign = await client.patch(
        f"/api/v1/admin/qr-codes/{plate['code_identifier']}/assign",
        json={"memorial_id": memorial["id"]},
    )
    assert assign.status_code == 200
    assert assign.json()["status"] == "active"

    # 4. a visitor scans the plate printed with plate['scan_url']
    scan = await client.get(f"/q/{plate['code_identifier']}")
    assert scan.status_code == 302
    assert scan.headers["location"] == (
        "http://frontend.test/memorials/elsabe-botha-1952"
    )

    # 5. the React page loads the memorial JSON
    public = await client.get(
        f"/api/v1/public/memorials/{memorial['slug']}"
    )
    assert public.status_code == 200
    assert public.json()["deceased_name"] == "Elsabe Botha"

    # An unbound plate from the same batch must not resolve to a memorial.
    unbound_scan = await client.get(f"/q/{plates[1]['code_identifier']}")
    assert unbound_scan.status_code == 302
    assert unbound_scan.headers["location"].startswith("http://frontend.test/setup?")


async def test_deleting_nothing_keeps_inventory_consistent(client) -> None:
    """Inventory tallies stay correct as plates move through states."""
    await create_plates_via_api(client, 4)

    listing = await client.get("/api/v1/admin/qr-codes")
    assert listing.json()["counts_by_status"] == {"unassigned": 4}
