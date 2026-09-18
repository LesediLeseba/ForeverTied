"""Public read API used by the React frontend."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import SessionDep
from app.schemas.memorial import MemorialRead
from app.services.memorials import get_by_slug

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get(
    "/memorials/{slug}",
    response_model=MemorialRead,
    summary="Fetch a memorial page by slug",
)
async def read_memorial(slug: str, session: SessionDep) -> MemorialRead:
    memorial = await get_by_slug(session, slug)
    if memorial is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No memorial found for slug '{slug}'",
        )
    return MemorialRead.model_validate(memorial)
