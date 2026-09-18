"""Pydantic v2 schemas for physical QR plates."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import QRStatus


class QRBatchCreateRequest(BaseModel):
    """Payload for ``POST /api/v1/admin/qr-codes/batch``."""

    quantity: int = Field(..., ge=1, le=1000, examples=[10])


class QRAssignRequest(BaseModel):
    """Payload for ``PATCH /api/v1/admin/qr-codes/{code_identifier}/assign``."""

    memorial_id: uuid.UUID
    # ``force`` re-binds a plate that is already linked to another memorial.
    force: bool = False


class QRStatusUpdateRequest(BaseModel):
    """Payload for ``PATCH /api/v1/admin/qr-codes/{code_identifier}/status``."""

    status: QRStatus


class QRCodeRead(BaseModel):
    """A plate row for the admin tables (includes its printable scan URL)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code_identifier: str
    status: QRStatus
    memorial_id: uuid.UUID | None = None
    created_at: datetime
    scan_url: str
    memorial_slug: str | None = None
    deceased_name: str | None = None


class QRBatchCreateResponse(BaseModel):
    """Result of a batch plate generation run."""

    generated: int
    quantity_requested: int
    qr_codes: list[QRCodeRead]


class QRCodeListResponse(BaseModel):
    """Paginated plate list."""

    items: list[QRCodeRead]
    total: int
    limit: int
    offset: int
    counts_by_status: dict[str, int] = Field(default_factory=dict)
