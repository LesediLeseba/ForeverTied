"""Unit tests for slug + plate identifier helpers (no database needed)."""

from __future__ import annotations

import pytest

from app.services.qr_codes import (
    IDENTIFIER_ALPHABET,
    generate_identifier,
    generate_unique_identifiers,
    normalise_identifier,
)
from app.utils.slug import build_memorial_slug, candidate_slugs, extract_year, slugify


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("John Doe", "john-doe"),
        ("  Dr. John   Doe ", "dr-john-doe"),
        ("Nomvula Grace Dlamini", "nomvula-grace-dlamini"),
        ("Pieter van der Merwe", "pieter-van-der-merwe"),
        ("José Núñez", "jose-nunez"),
        ("O'Brien-Smith", "o-brien-smith"),
        ("", ""),
    ],
)
def test_slugify(value: str, expected: str) -> None:
    assert slugify(value) == expected


@pytest.mark.parametrize(
    ("dates", "expected"),
    [
        ("1980 - 2026", "1980"),
        ("1948-2026", "1948"),
        ("b. 1955", "1955"),
        ("12 Jan 1940 — 3 Feb 2026", "1940"),
        ("unknown", None),
    ],
)
def test_extract_year(dates: str, expected: str | None) -> None:
    assert extract_year(dates) == expected


def test_build_memorial_slug_uses_birth_year() -> None:
    assert build_memorial_slug("John Doe", "1980 - 2026") == "john-doe-1980"


def test_build_memorial_slug_without_year() -> None:
    assert build_memorial_slug("John Doe", "dates unknown") == "john-doe"


def test_candidate_slugs_sequence() -> None:
    assert candidate_slugs("john-doe-1980", limit=3) == [
        "john-doe-1980",
        "john-doe-1980-1",
        "john-doe-1980-2",
    ]


def test_generate_identifier_format() -> None:
    identifier = generate_identifier(8)
    assert len(identifier) == 8
    assert set(identifier) <= set(IDENTIFIER_ALPHABET)
    assert identifier == identifier.upper()


def test_generate_unique_identifiers_are_distinct() -> None:
    identifiers = generate_unique_identifiers(500, 8)
    assert len(identifiers) == 500
    assert all(len(code) == 8 for code in identifiers)


def test_normalise_identifier() -> None:
    assert normalise_identifier("  k9x2p7a1\n") == "K9X2P7A1"
