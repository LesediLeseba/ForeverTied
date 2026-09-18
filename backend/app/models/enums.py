"""Domain enumerations shared by the ORM models and Pydantic schemas."""

from __future__ import annotations

import enum


class QRStatus(str, enum.Enum):
    """Lifecycle of a physical QR plate.

    * ``unassigned`` — manufactured/printed, not yet bound to a memorial.
    * ``active``     — bound to a memorial; scans resolve to a live page.
    * ``damaged``    — physically unusable; scans fall through to /setup.
    """

    UNASSIGNED = "unassigned"
    ACTIVE = "active"
    DAMAGED = "damaged"

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.value


#: Statuses whose scans redirect to a memorial page.
SCANNABLE_STATUSES: tuple[QRStatus, ...] = (QRStatus.ACTIVE,)
