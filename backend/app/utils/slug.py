"""Slug helpers (collision-safe, ASCII-only, URL friendly)."""

from __future__ import annotations

import re
import unicodedata

_YEAR_RE = re.compile(r"(1[6-9]\d{2}|20\d{2}|21\d{2})")
_SLUG_SAFE_RE = re.compile(r"[^a-z0-9]+")


def slugify(value: str, max_length: int = 255) -> str:
    """Normalise ``value`` into a lowercase, hyphen-separated slug.

    >>> slugify("  Dr. John  Doe ")
    'dr-john-doe'
    """
    # Strip accents (é → e) then lowercase.
    normalised = unicodedata.normalize("NFKD", value or "")
    normalised = normalised.encode("ascii", "ignore").decode("ascii").lower()
    slug = _SLUG_SAFE_RE.sub("-", normalised).strip("-")
    return slug[:max_length].rstrip("-")


def extract_year(dates: str) -> str | None:
    """Pull the first plausible 4-digit year out of a ``dates`` string.

    ``"1980 - 2026"`` → ``"1980"`` (the birth year, per the product spec).
    """
    match = _YEAR_RE.search(dates or "")
    return match.group(1) if match else None


def build_memorial_slug(deceased_name: str, dates: str) -> str:
    """``slugify(name + "-" + birth_year)`` — e.g. ``john-doe-1980``."""
    year = extract_year(dates)
    base = f"{deceased_name}-{year}" if year else deceased_name
    return slugify(base) or "memorial"


def candidate_slugs(base_slug: str, limit: int = 1000) -> list[str]:
    """``[base, base-1, base-2, ...]`` — the collision-avoidance sequence."""
    return [base_slug] + [f"{base_slug}-{index}" for index in range(1, limit)]
