"""Service layer for physical QR plates: generation, lookup, binding."""

from __future__ import annotations

import secrets
import string
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models import Memorial, QRCode, QRStatus
from app.schemas.qr_code import QRCodeRead

#: Uppercase alphanumerics — matches the ``K9X2P7A1`` format in the spec.
IDENTIFIER_ALPHABET = string.ascii_uppercase + string.digits

MAX_GENERATION_ATTEMPTS = 25


class QRCodeNotFound(Exception):
    """Raised when a plate identifier does not exist."""

    def __init__(self, code_identifier: str) -> None:
        super().__init__(f"QR code '{code_identifier}' does not exist")
        self.code_identifier = code_identifier


class MemorialNotFound(Exception):
    """Raised when the target memorial of a binding does not exist."""

    def __init__(self, memorial_id: UUID) -> None:
        super().__init__(f"Memorial '{memorial_id}' does not exist")
        self.memorial_id = memorial_id


class QRCodeAlreadyAssigned(Exception):
    """Raised when a plate is already bound to a different memorial."""

    def __init__(self, code_identifier: str, memorial_id: UUID) -> None:
        super().__init__(
            f"QR code '{code_identifier}' is already assigned to memorial "
            f"'{memorial_id}' (pass force=true to re-bind)"
        )
        self.code_identifier = code_identifier
        self.memorial_id = memorial_id


@dataclass(slots=True)
class QRCodeView:
    """A plate plus the denormalised memorial info the admin tables need."""

    code: QRCode
    memorial_slug: str | None = None
    deceased_name: str | None = None


def generate_identifier(length: int = 8) -> str:
    """Return a cryptographically random ``length``-char uppercase identifier."""
    if length < 1:
        raise ValueError("identifier length must be >= 1")
    return "".join(secrets.choice(IDENTIFIER_ALPHABET) for _ in range(length))


def generate_unique_identifiers(quantity: int, length: int = 8) -> set[str]:
    """Generate ``quantity`` distinct identifiers (in-memory dedupe)."""
    identifiers: set[str] = set()
    guard = 0
    max_guard = quantity * 50 + 100
    while len(identifiers) < quantity:
        guard += 1
        if guard > max_guard:  # pragma: no cover - astronomically unlikely
            raise RuntimeError("unable to generate enough unique identifiers")
        identifiers.add(generate_identifier(length))
    return identifiers


def to_read(view: QRCodeView, settings: Settings) -> QRCodeRead:
    """Serialise a :class:`QRCodeView` into the API schema."""
    return QRCodeRead(
        id=view.code.id,
        code_identifier=view.code.code_identifier,
        status=view.code.status,
        memorial_id=view.code.memorial_id,
        created_at=view.code.created_at,
        scan_url=settings.scan_url(view.code.code_identifier),
        memorial_slug=view.memorial_slug,
        deceased_name=view.deceased_name,
    )


def view_from_model(code: QRCode) -> QRCodeView:
    memorial = code.memorial
    return QRCodeView(
        code=code,
        memorial_slug=memorial.slug if memorial else None,
        deceased_name=memorial.deceased_name if memorial else None,
    )


def normalise_identifier(code_identifier: str) -> str:
    """Plates are uppercase; be forgiving about scanner casing/whitespace."""
    return (code_identifier or "").strip().upper()


def _base_query() -> Select[tuple[QRCode, str | None, str | None]]:
    return (
        select(
            QRCode,
            Memorial.slug.label("memorial_slug"),
            Memorial.deceased_name.label("deceased_name"),
        )
        .outerjoin(Memorial, QRCode.memorial_id == Memorial.id)
        .order_by(QRCode.created_at.desc(), QRCode.code_identifier.asc())
    )


def _rows_to_views(rows: Sequence[tuple[Any, ...]]) -> list[QRCodeView]:
    return [
        QRCodeView(code=row[0], memorial_slug=row[1], deceased_name=row[2])
        for row in rows
    ]


async def create_batch(
    session: AsyncSession, quantity: int, length: int = 8
) -> list[QRCodeView]:
    """Pre-generate ``quantity`` unassigned plates, guaranteeing uniqueness."""
    if quantity < 1:
        raise ValueError("quantity must be >= 1")

    created: list[QRCode] = []
    remaining = quantity
    attempts = 0

    while remaining > 0 and attempts < MAX_GENERATION_ATTEMPTS:
        attempts += 1
        candidates = generate_unique_identifiers(remaining, length)

        existing = await session.execute(
            select(QRCode.code_identifier).where(
                QRCode.code_identifier.in_(candidates)
            )
        )
        taken = {row[0] for row in existing.all()}
        fresh = sorted(candidates - taken)

        if not fresh:  # pragma: no cover - collision storm
            continue

        for identifier in fresh:
            session.add(QRCode(code_identifier=identifier, status=QRStatus.UNASSIGNED))
        try:
            await session.flush()
        except IntegrityError:
            # A concurrent writer claimed an identifier: roll back and retry.
            await session.rollback()
            continue

        new_rows = (
            await session.execute(
                select(QRCode).where(QRCode.code_identifier.in_(fresh))
            )
        ).scalars()
        created.extend(new_rows)
        remaining = quantity - len(created)

    if len(created) < quantity:  # pragma: no cover - defensive
        raise RuntimeError(
            f"could only generate {len(created)} of {quantity} requested QR codes"
        )

    await session.commit()
    return [view_from_model(code) for code in created]


async def list_qr_codes(
    session: AsyncSession,
    *,
    status: QRStatus | None = None,
    memorial_id: UUID | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[QRCodeView], int, dict[str, int]]:
    """Return a page of plates, the total count and per-status tallies."""
    query = _base_query()
    if status is not None:
        query = query.where(QRCode.status == status)
    if memorial_id is not None:
        query = query.where(QRCode.memorial_id == memorial_id)

    count_query = select(func.count()).select_from(QRCode)
    if status is not None:
        count_query = count_query.where(QRCode.status == status)
    if memorial_id is not None:
        count_query = count_query.where(QRCode.memorial_id == memorial_id)

    total = (await session.execute(count_query)).scalar_one()

    status_rows = (
        await session.execute(
            select(QRCode.status, func.count()).group_by(QRCode.status)
        )
    ).all()
    counts = {
        (row[0].value if isinstance(row[0], QRStatus) else str(row[0])): row[1]
        for row in status_rows
    }

    rows = (
        await session.execute(query.limit(limit).offset(offset))
    ).all()
    return _rows_to_views(rows), int(total), counts


async def get_view_by_identifier(
    session: AsyncSession, code_identifier: str
) -> QRCodeView | None:
    """Fetch a single plate (with memorial info) by its identifier."""
    identifier = normalise_identifier(code_identifier)
    row = (
        await session.execute(
            _base_query().where(QRCode.code_identifier == identifier)
        )
    ).first()
    if row is None:
        return None
    return QRCodeView(code=row[0], memorial_slug=row[1], deceased_name=row[2])


async def get_by_identifier(
    session: AsyncSession, code_identifier: str
) -> QRCode | None:
    identifier = normalise_identifier(code_identifier)
    result = await session.execute(
        select(QRCode).where(QRCode.code_identifier == identifier)
    )
    return result.scalar_one_or_none()


async def assign_to_memorial(
    session: AsyncSession,
    code_identifier: str,
    memorial_id: UUID,
    *,
    force: bool = False,
) -> QRCodeView:
    """Bind a plate to a memorial and flip it to ``active``."""
    code = await get_by_identifier(session, code_identifier)
    if code is None:
        raise QRCodeNotFound(normalise_identifier(code_identifier))

    memorial = await session.get(Memorial, memorial_id)
    if memorial is None:
        raise MemorialNotFound(memorial_id)

    if (
        code.memorial_id is not None
        and code.memorial_id != memorial_id
        and not force
    ):
        raise QRCodeAlreadyAssigned(code.code_identifier, code.memorial_id)

    code.memorial_id = memorial.id
    code.status = QRStatus.ACTIVE
    await session.commit()
    await session.refresh(code, attribute_names=["memorial"])
    return view_from_model(code)


async def unassign(session: AsyncSession, code_identifier: str) -> QRCodeView:
    """Release a plate back into the unassigned pool."""
    code = await get_by_identifier(session, code_identifier)
    if code is None:
        raise QRCodeNotFound(normalise_identifier(code_identifier))

    code.memorial_id = None
    code.status = QRStatus.UNASSIGNED
    await session.commit()
    await session.refresh(code, attribute_names=["memorial"])
    return view_from_model(code)


async def set_status(
    session: AsyncSession, code_identifier: str, status: QRStatus
) -> QRCodeView:
    """Update a plate's lifecycle status (e.g. flag a plate as damaged)."""
    code = await get_by_identifier(session, code_identifier)
    if code is None:
        raise QRCodeNotFound(normalise_identifier(code_identifier))

    code.status = status
    if status is not QRStatus.ACTIVE:
        code.memorial_id = None
    await session.commit()
    await session.refresh(code, attribute_names=["memorial"])
    return view_from_model(code)
