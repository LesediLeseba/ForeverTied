"""``qr_codes`` table — one row per physical, weatherproof QR plate."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import QRStatus


class QRCode(Base):
    """A physical plate and its (optional) binding to a memorial."""

    __tablename__ = "qr_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    code_identifier: Mapped[str] = mapped_column(
        String(12), nullable=False, unique=True, index=True
    )
    status: Mapped[QRStatus] = mapped_column(
        Enum(
            QRStatus,
            name="qrstatus",
            native_enum=True,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=QRStatus.UNASSIGNED,
        server_default=text("'unassigned'"),
    )
    memorial_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("memorials.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    memorial: Mapped["Memorial | None"] = relationship(  # noqa: F821
        back_populates="qr_codes"
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return (
            f"<QRCode {self.code_identifier!r} status={self.status.value!r} "
            f"memorial_id={self.memorial_id!r}>"
        )
