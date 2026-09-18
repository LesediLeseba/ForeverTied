"""Pydantic v2 schemas for memorial records."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_URL_PREFIXES = ("http://", "https://", "data:")


class MemorialCreate(BaseModel):
    """Payload for ``POST /api/v1/admin/memorials``."""

    deceased_name: str = Field(
        ..., min_length=1, max_length=255, examples=["John Doe"]
    )
    dates: str = Field(..., min_length=1, max_length=100, examples=["1980 - 2026"])
    biography: str = Field(
        ..., min_length=1, examples=["Beloved father, gardener and storyteller."]
    )
    photo_url: str | None = Field(
        default=None,
        max_length=1000,
        examples=["https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07"],
    )

    @field_validator("deceased_name", "dates", "biography")
    @classmethod
    def strip_and_require(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("value must not be blank")
        return stripped

    @field_validator("photo_url")
    @classmethod
    def validate_photo_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if not stripped.lower().startswith(_URL_PREFIXES):
            raise ValueError("photo_url must be an absolute http(s) URL or a data: URI")
        return stripped


class MemorialRead(BaseModel):
    """Public representation of a memorial page."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    deceased_name: str
    slug: str
    dates: str
    biography: str
    photo_url: str | None = None
    created_at: datetime


class MemorialAdminRead(MemorialRead):
    """Admin table row — adds plate-binding metadata."""

    qr_code_count: int = 0
    active_qr_codes: int = 0
    bound_codes: list[str] = Field(default_factory=list)


class MemorialListResponse(BaseModel):
    """Paginated memorial list."""

    items: list[MemorialAdminRead]
    total: int
    limit: int
    offset: int
