"""Pytest configuration.

Tests run against a real PostgreSQL instance in a dedicated ``memorialcode_test``
database (created if missing) so the async/``asyncpg`` code path, the ``qrstatus``
enum and ``gen_random_uuid()`` defaults are all exercised for real. Alembic builds
the schema — the same migration path production uses.
"""

from __future__ import annotations

import asyncio
import os
import sys
from collections.abc import AsyncIterator
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import asyncpg
import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

BASE_DSN = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/memorialcode",
)
TEST_DB_NAME = os.getenv("MEMORIALCODE_TEST_DB", "memorialcode_test")


def test_dsn() -> str:
    """The app DSN, pointed at the throwaway test database."""
    parts = urlparse(BASE_DSN)
    return urlunparse(parts._replace(path=f"/{TEST_DB_NAME}"))


TEST_DSN = test_dsn()

# ``alembic/env.py`` and ``app.core.config.get_settings`` both read
# DATABASE_URL, and importing ``app.main`` eagerly builds an app (caching those
# settings). Pin the test DSN *before* any app import so migrations, fixtures
# and the app under test all share the throwaway database.
os.environ["DATABASE_URL"] = TEST_DSN

from app.core.config import Settings  # noqa: E402
from app.core.database import get_session  # noqa: E402
from app.main import create_app  # noqa: E402


def sync_dsn(dsn: str, dbname: str | None = None) -> str:
    """Plain ``postgresql://`` DSN for asyncpg/psql-style connections."""
    parts = urlparse(dsn)
    scheme = "postgresql"
    path = f"/{dbname}" if dbname else parts.path
    return urlunparse(parts._replace(scheme=scheme, path=path))


async def _ensure_database() -> None:
    maintenance = await asyncpg.connect(sync_dsn(BASE_DSN, "postgres"))
    try:
        exists = await maintenance.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", TEST_DB_NAME
        )
        if not exists:
            await maintenance.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        await maintenance.close()


@pytest.fixture(scope="session", autouse=True)
def prepared_database() -> str:
    """Create the test database and run Alembic migrations once per session."""
    dsn = test_dsn()
    asyncio.run(_ensure_database())

    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", dsn)
    command.upgrade(config, "head")
    return dsn


@pytest_asyncio.fixture(scope="session", loop_scope="session")
async def session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(test_dsn())
    try:
        yield async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def db_session(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """A clean session — every test starts from empty tables."""
    async with session_factory() as setup_session:
        await setup_session.execute(
            text("TRUNCATE qr_codes, memorials RESTART IDENTITY CASCADE")
        )
        await setup_session.commit()

    async with session_factory() as session:
        yield session


def make_settings(**overrides) -> Settings:
    defaults = {
        "database_url": test_dsn(),
        "frontend_base_url": "http://frontend.test",
        "api_base_url": "http://api.test",
        "resolver_miss_mode": "redirect",
        "resolver_miss_path": "/setup",
        "cors_origins": "http://frontend.test",
    }
    defaults.update(overrides)
    return Settings(**defaults)


@pytest_asyncio.fixture
async def app(db_session: AsyncSession):
    """FastAPI app whose DB dependency is bound to the test session."""
    application = create_app(make_settings())

    async def _override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    application.dependency_overrides[get_session] = _override_session
    yield application
    application.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://api.test", follow_redirects=False
    ) as http_client:
        yield http_client


@pytest_asyncio.fixture
async def not_found_client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    """Same app, but configured to 404 instead of redirecting failed scans."""
    application = create_app(make_settings(resolver_miss_mode="not_found"))

    async def _override_session() -> AsyncIterator[AsyncSession]:
        yield db_session

    application.dependency_overrides[get_session] = _override_session
    transport = ASGITransport(app=application)
    async with AsyncClient(
        transport=transport, base_url="http://api.test", follow_redirects=False
    ) as http_client:
        yield http_client
    application.dependency_overrides.clear()


# --- shared helpers -----------------------------------------------------------


async def create_memorial_via_api(
    client: AsyncClient,
    *,
    deceased_name: str = "John Doe",
    dates: str = "1980 - 2026",
    biography: str = "A life well lived.",
    photo_url: str | None = None,
) -> dict:
    response = await client.post(
        "/api/v1/admin/memorials",
        json={
            "deceased_name": deceased_name,
            "dates": dates,
            "biography": biography,
            "photo_url": photo_url,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def create_plates_via_api(client: AsyncClient, quantity: int = 1) -> list[dict]:
    response = await client.post(
        "/api/v1/admin/qr-codes/batch", json={"quantity": quantity}
    )
    assert response.status_code == 201, response.text
    return response.json()["qr_codes"]
