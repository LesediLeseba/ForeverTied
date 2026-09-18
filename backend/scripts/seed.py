#!/usr/bin/env python
"""Seed the database with demo data for local development.

Creates:
  * the ``sample`` memorial used by the landing page live preview,
  * two extra demo memorials,
  * a batch of unassigned plates, with the first one bound to ``sample`` so the
    scan resolver (``GET /q/{code}``) can be exercised immediately.

Idempotent — existing rows are left untouched. Run with:
    python scripts/seed.py [--codes 12] [--assign-sample]
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.core.database import dispose_engine, get_session_factory  # noqa: E402
from app.models import Memorial, QRStatus  # noqa: E402
from app.schemas.memorial import MemorialCreate  # noqa: E402
from app.services.memorials import create_memorial, get_by_slug  # noqa: E402
from app.services.qr_codes import (  # noqa: E402
    assign_to_memorial,
    create_batch,
    list_qr_codes,
)

SAMPLE_PHOTO = (
    "https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07"
    "?auto=format&fit=crop&q=85"
)

DEMO_MEMORIALS: list[MemorialCreate] = [
    MemorialCreate(
        deceased_name="Nomvula Grace Dlamini",
        dates="1948 - 2026",
        biography=(
            "Nomvula was the quiet centre of a loud, loving family. Born in "
            "KwaZulu-Natal, she spent forty-one years teaching Grade 4 at "
            "Meadowlands Primary, where three generations of the same families "
            "passed through her classroom.\n\n"
            "She kept a garden that refused to obey the seasons, baked "
            "amadumbe for every funeral and wedding within a twenty-kilometre "
            "radius, and could identify anyone's grandmother by their laugh "
            "alone.\n\n"
            "She is survived by four children, eleven grandchildren, and a "
            "street that still refers to itself as 'Mama Dlamini's side'."
        ),
        photo_url=SAMPLE_PHOTO,
    ),
    MemorialCreate(
        deceased_name="Pieter van der Merwe",
        dates="1955 - 2026",
        biography=(
            "Pieter farmed the same red soil outside Lichtenburg for fifty "
            "years. He measured his life in rainfall, in the births of "
            "lambs, and in the number of children who learned to ride a "
            "bicycle in his back yard.\n\n"
            "He never threw anything away. The workshop still holds four "
            "decades of labelled jars, each one containing a screw that "
            "would, one day, be exactly the right size.\n\n"
            "Survived by his wife Ansie, two sons, and a farm dog that has "
            "not yet accepted the arrangement."
        ),
        photo_url=(
            "https://images.unsplash.com/photo-1552058544-f2b08422138a"
            "?auto=format&fit=crop&q=85"
        ),
    ),
]


async def seed(codes: int, assign_sample: bool) -> None:
    factory = get_session_factory()
    async with factory() as session:
        sample = await get_by_slug(session, "sample")
        if sample is None:
            sample = await create_memorial(
                session,
                MemorialCreate(
                    deceased_name="Sample Memorial",
                    dates="1940 - 2026",
                    biography=(
                        "This is a live sample memorial page. It is seeded "
                        "automatically so funeral-home partners can click "
                        "through from the landing page and see exactly what "
                        "a visitor sees after scanning a plate at a grave "
                        "site — portrait, dates, and the family's own words.\n\n"
                        "Everything here is editable by MemorialCode staff in "
                        "the admin dashboard, and every page is reachable "
                        "through a weatherproof stainless steel QR plate that "
                        "survives sun, rain and graveyard maintenance."
                    ),
                    photo_url=SAMPLE_PHOTO,
                ),
            )
            # Force the marketing slug used by the landing-page preview card.
            sample.slug = "sample"
            await session.commit()
            await session.refresh(sample)
            print(f"created sample memorial (id={sample.id})")
        else:
            print(f"sample memorial already exists (slug={sample.slug})")

        for payload in DEMO_MEMORIALS:
            existing = (
                await session.execute(
                    select(Memorial).where(
                        Memorial.deceased_name == payload.deceased_name
                    )
                )
            ).scalar_one_or_none()
            if existing is None:
                created = await create_memorial(session, payload)
                print(f"created memorial '{created.slug}'")
            else:
                print(f"memorial '{existing.slug}' already exists")

        views, total, counts = await list_qr_codes(session, limit=1)
        print(f"existing plates: {total} {counts}")

        if total < codes:
            created_views = await create_batch(session, codes - total)
            print(f"generated {len(created_views)} new unassigned plates")

        if assign_sample:
            unassigned, _, _ = await list_qr_codes(
                session, status=QRStatus.UNASSIGNED, limit=1
            )
            if unassigned:
                code = unassigned[0].code.code_identifier
                bound = await assign_to_memorial(session, code, sample.id)
                print(
                    f"bound plate {bound.code.code_identifier} → "
                    f"{bound.memorial_slug}"
                )
            else:
                print("no unassigned plates available to bind")

    await dispose_engine()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--codes", type=int, default=12, help="minimum plate count")
    parser.add_argument(
        "--assign-sample",
        action="store_true",
        default=True,
        help="bind one unassigned plate to the sample memorial (default: on)",
    )
    parser.add_argument(
        "--no-assign-sample", dest="assign_sample", action="store_false"
    )
    args = parser.parse_args()

    asyncio.run(seed(args.codes, args.assign_sample))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
