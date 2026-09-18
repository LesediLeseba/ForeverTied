"""initial schema: memorials + qr_codes

Revision ID: 0001
Revises:
Create Date: 2026-09-03

Creates the two V1 tables plus the ``qrstatus`` enum, exactly as specified:

* ``memorials`` — UUID pk (``gen_random_uuid()``), unique indexed slug, text bio.
* ``qr_codes``  — UUID pk, unique indexed 12-char identifier, nullable FK to
  ``memorials.id`` and a ``qrstatus`` enum defaulting to ``unassigned``.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

QRSTATUS = postgresql.ENUM(
    "unassigned", "active", "damaged", name="qrstatus", create_type=False
)


def upgrade() -> None:
    # gen_random_uuid() is core from PostgreSQL 13+; on older servers it lives
    # in the pgcrypto extension, so only ask for it when actually needed.
    bind = op.get_bind()
    server_version = bind.dialect.server_version_info or (13,)
    if server_version < (13,):
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    QRSTATUS.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "memorials",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("deceased_name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("dates", sa.String(length=100), nullable=False),
        sa.Column("biography", sa.Text(), nullable=False),
        sa.Column("photo_url", sa.String(length=1000), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_memorials")),
    )
    op.create_index(
        op.f("ix_memorials_slug"), "memorials", ["slug"], unique=True
    )

    op.create_table(
        "qr_codes",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("code_identifier", sa.String(length=12), nullable=False),
        sa.Column(
            "status",
            QRSTATUS,
            server_default=sa.text("'unassigned'"),
            nullable=False,
        ),
        sa.Column("memorial_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["memorial_id"],
            ["memorials.id"],
            name=op.f("fk_qr_codes_memorial_id_memorials"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_qr_codes")),
    )
    op.create_index(
        op.f("ix_qr_codes_code_identifier"),
        "qr_codes",
        ["code_identifier"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_qr_codes_code_identifier"), table_name="qr_codes")
    op.drop_table("qr_codes")
    op.drop_index(op.f("ix_memorials_slug"), table_name="memorials")
    op.drop_table("memorials")
    QRSTATUS.drop(op.get_bind(), checkfirst=True)
