"""Aggregate the versioned API routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import SettingsDep
from app.api.v1.admin.memorials import router as admin_memorials_router
from app.api.v1.admin.qr_codes import router as admin_qr_codes_router
from app.api.v1.public.memorials import router as public_memorials_router

api_router = APIRouter()
api_router.include_router(public_memorials_router)
api_router.include_router(admin_memorials_router)
api_router.include_router(admin_qr_codes_router)


@api_router.get("/api/v1/health", tags=["meta"], summary="Liveness probe")
async def health(settings: SettingsDep) -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }
