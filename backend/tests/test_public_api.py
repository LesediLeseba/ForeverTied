"""Public read API + service metadata."""

from __future__ import annotations

from tests.conftest import create_memorial_via_api


async def test_public_memorial_lookup_by_slug(client) -> None:
    created = await create_memorial_via_api(
        client,
        deceased_name="Nomvula Dlamini",
        dates="1948 - 2026",
        biography="Teacher, gardener, matriarch.",
        photo_url="https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07",
    )

    response = await client.get(f"/api/v1/public/memorials/{created['slug']}")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "nomvula-dlamini-1948"
    assert body["deceased_name"] == "Nomvula Dlamini"
    assert body["dates"] == "1948 - 2026"
    assert body["biography"] == "Teacher, gardener, matriarch."
    assert body["photo_url"].startswith("https://images.unsplash.com/")
    # Admin-only fields must not leak through the public endpoint.
    assert "qr_code_count" not in body
    assert "bound_codes" not in body


async def test_public_memorial_404(client) -> None:
    response = await client.get("/api/v1/public/memorials/does-not-exist")

    assert response.status_code == 404
    assert "does-not-exist" in response.json()["detail"]


async def test_health_endpoint(client) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "MemorialCode API"


async def test_root_metadata_advertises_scan_endpoint(client) -> None:
    response = await client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["scan_endpoint"] == "http://api.test/q/{code_identifier}"
    assert body["frontend_base_url"] == "http://frontend.test"


async def test_openapi_schema_is_served(client) -> None:
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/q/{code_identifier}" in paths
    assert "/api/v1/public/memorials/{slug}" in paths
    assert "/api/v1/admin/qr-codes/batch" in paths
    assert "/api/v1/admin/memorials" in paths
    assert "/api/v1/admin/qr-codes/{code_identifier}/assign" in paths
