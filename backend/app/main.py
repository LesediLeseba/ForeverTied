"""FastAPI application entry point for the MemorialCode V1 API."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.resolver import router as resolver_router
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import dispose_engine


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Release pooled database connections on shutdown."""
    yield
    await dispose_engine()


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory (keeps tests able to build isolated instances)."""
    settings = settings or get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "MemorialCode (Pty) Ltd — DeathTech SaaS bridging physical tombstone "
            "QR plates with digital memorial pages. V1 ships without auth."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Location"],
    )

    # Public scan resolver lives at the API root: {API_BASE_URL}/q/{code}
    app.include_router(resolver_router)
    app.include_router(api_router)

    @app.get("/", tags=["meta"], summary="Service metadata")
    async def root() -> JSONResponse:
        return JSONResponse(
            {
                "service": settings.app_name,
                "version": __version__,
                "environment": settings.environment,
                "frontend_base_url": settings.frontend_base_url,
                "scan_endpoint": f"{settings.qr_url_prefix}/{{code_identifier}}",
                "docs": "/docs",
                "health": "/api/v1/health",
            }
        )

    return app


app = create_app()
