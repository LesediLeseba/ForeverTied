"""Service layer for memorial records (creation, slugs, listing)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Memorial, QRCode, QRStatus
from app.schemas.memorial import MemorialAdminRead, MemorialCreate
from app.utils.slug import build_memorial_slug, candidate_slugs

MAX_SLUG_ATTEMPTS = 3


class MemorialNotFound(Exception):
    """Raised when a memorial cannot be located by id or slug."""


@dataclass(slots=True)
class MemorialStats:
    qr_code_count: int = 0
    active_qr_codes: int = 0
    bound_codes: list[str] = field(default_factory=list)


def _stats_subquery():
    """Aggregate bound plates per memorial (PostgreSQL ``array_agg``)."""
    return (
        select(
            QRCode.memorial_id.label("memorial_id"),
            func.count().label("total"),
            func.count()
            .filter(QRCode.status == QRStatus.ACTIVE)
            .label("active"),
            func.array_agg(QRCode.code_identifier).label("codes"),
        )
        .where(QRCode.memorial_id.is_not(None))
        .group_by(QRCode.memorial_id)
        .subquery()
    )


async def resolve_unique_slug(session: AsyncSession, base_slug: str) -> str:
    """Return ``base_slug`` or the first free ``base_slug-N`` variant."""
    candidates = candidate_slugs(base_slug, limit=1000)
    existing = await session.execute(
        select(Memorial.slug).where(
            or_(Memorial.slug == base_slug, Memorial.slug.like(f"{base_slug}-%"))
        )
    )
    taken = {row[0] for row in existing.all()}
    for candidate in candidates:
        if candidate not in taken:
            return candidate
    raise RuntimeError(f"exhausted slug candidates for '{base_slug}'")


async def create_memorial(session: AsyncSession, payload: MemorialCreate) -> Memorial:
    """Persist a memorial, generating a collision-safe slug.

    Slug rule (per spec): ``slugify(deceased_name + "-" + birth_year)`` with
    ``-1``/``-2`` suffixes appended on collision.
    """
    base_slug = build_memorial_slug(payload.deceased_name, payload.dates)

    last_error: IntegrityError | None = None
    for attempt in range(MAX_SLUG_ATTEMPTS):
        slug = await resolve_unique_slug(session, base_slug)
        memorial = Memorial(
            deceased_name=payload.deceased_name,
            slug=slug,
            dates=payload.dates,
            biography=payload.biography,
            photo_url=payload.photo_url,
        )
        session.add(memorial)
        try:
            await session.commit()
        except IntegrityError as exc:  # pragma: no cover - concurrent insert
            await session.rollback()
            last_error = exc
            continue
        await session.refresh(memorial)
        return memorial

    raise RuntimeError(f"could not allocate a unique slug for {base_slug!r}") from last_error


async def get_by_slug(session: AsyncSession, slug: str) -> Memorial | None:
    result = await session.execute(select(Memorial).where(Memorial.slug == slug))
    return result.scalar_one_or_none()


async def get_by_id(session: AsyncSession, memorial_id: UUID) -> Memorial | None:
    return await session.get(Memorial, memorial_id)


def _base_query() -> Select[tuple[Memorial, Any, Any, Any]]:
    stats = _stats_subquery()
    return (
        select(Memorial, stats.c.total, stats.c.active, stats.c.codes)
        .outerjoin(stats, stats.c.memorial_id == Memorial.id)
        .order_by(Memorial.created_at.desc(), Memorial.deceased_name.asc())
    )


def _to_admin_read(row: tuple[Any, ...]) -> MemorialAdminRead:
    memorial, total, active, codes = row
    return MemorialAdminRead(
        id=memorial.id,
        deceased_name=memorial.deceased_name,
        slug=memorial.slug,
        dates=memorial.dates,
        biography=memorial.biography,
        photo_url=memorial.photo_url,
        created_at=memorial.created_at,
        qr_code_count=int(total or 0),
        active_qr_codes=int(active or 0),
        bound_codes=sorted(codes) if codes else [],
    )


async def list_memorials(
    session: AsyncSession,
    *,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[MemorialAdminRead], int]:
    """Page through memorials with their bound-plate stats."""
    query = _base_query()
    count_query: Select[tuple[int]] = select(func.count()).select_from(Memorial)

    if search:
        pattern = f"%{search.strip()}%"
        predicate = or_(
            Memorial.deceased_name.ilike(pattern), Memorial.slug.ilike(pattern)
        )
        query = query.where(predicate)
        count_query = count_query.where(predicate)

    total = (await session.execute(count_query)).scalar_one()
    rows = (await session.execute(query.limit(limit).offset(offset))).all()
    return [_to_admin_read(row) for row in rows], int(total)


def stats_from_row(row: tuple[Any, ...]) -> MemorialStats:
    return MemorialStats(
        qr_code_count=int(row[1] or 0),
        active_qr_codes=int(row[2] or 0),
        bound_codes=sorted(row[3]) if row[3] else [],
    )
