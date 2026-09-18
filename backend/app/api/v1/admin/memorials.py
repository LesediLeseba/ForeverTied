"""Admin API — memorial records.

V1 ships without authentication (see README) so the MVP can be validated fast.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import SessionDep
from app.schemas.memorial import (
    MemorialAdminRead,
    MemorialCreate,
    MemorialListResponse,
)
from app.services.memorials import (
    create_memorial,
    get_by_id,
    get_by_slug,
    list_memorials,
)

router = APIRouter(prefix="/api/v1/admin/memorials", tags=["admin-memorials"])


def _to_admin_read(memorial) -> MemorialAdminRead:
    return MemorialAdminRead.model_validate(memorial)


@router.post(
    "",
    response_model=MemorialAdminRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a memorial (slug is generated automatically)",
)
async def create_memorial_endpoint(
    payload: MemorialCreate, session: SessionDep
) -> MemorialAdminRead:
    memorial = await create_memorial(session, payload)
    return _to_admin_read(memorial)


@router.get(
    "",
    response_model=MemorialListResponse,
    summary="List memorials with bound-plate stats",
)
async def list_memorials_endpoint(
    session: SessionDep,
    search: str | None = Query(default=None, max_length=255),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> MemorialListResponse:
    items, total = await list_memorials(
        session, search=search, limit=limit, offset=offset
    )
    return MemorialListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/{memorial_id}",
    response_model=MemorialAdminRead,
    summary="Fetch a single memorial by id",
)
async def read_memorial_endpoint(
    memorial_id: UUID, session: SessionDep
) -> MemorialAdminRead:
    memorial = await get_by_id(session, memorial_id)
    if memorial is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memorial '{memorial_id}' not found",
        )
    return _to_admin_read(memorial)


@router.get(
    "/by-slug/{slug}",
    response_model=MemorialAdminRead,
    summary="Fetch a single memorial by slug (admin preview)",
)
async def read_memorial_by_slug_endpoint(
    slug: str, session: SessionDep
) -> MemorialAdminRead:
    memorial = await get_by_slug(session, slug)
    if memorial is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No memorial found for slug '{slug}'",
        )
    return _to_admin_read(memorial)
