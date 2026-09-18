"""Application configuration.

All settings are read from environment variables (optionally via a ``.env``
file in the backend working directory) so the same container image can be
pointed at different PostgreSQL instances / frontends without code changes.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the MemorialCode API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MemorialCode API"
    environment: Literal["development", "staging", "production"] = "development"

    # --- database -----------------------------------------------------------
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/memorialcode"
    )
    db_echo: bool = False

    # --- cross-service URLs -------------------------------------------------
    # Public base URL of the React (Vite) frontend. The scan resolver 302
    # redirects here.
    frontend_base_url: str = "http://localhost:5173"
    # Public base URL of this API. Physical QR plates encode
    # ``{api_base_url}/q/{code_identifier}``. Leave empty to emit *relative*
    # scan URLs (handy behind a reverse proxy / preview host).
    api_base_url: str = "http://localhost:8000"

    # --- CORS ---------------------------------------------------------------
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_allow_credentials: bool = True

    # --- scan resolver behaviour -------------------------------------------
    # ``redirect`` → 302 to ``{frontend}{resolver_miss_path}`` (setup page)
    # ``not_found`` → plain HTTP 404
    resolver_miss_mode: Literal["redirect", "not_found"] = "redirect"
    resolver_miss_path: str = "/setup"

    # --- QR plate generation ------------------------------------------------
    qr_code_length: int = 8
    max_batch_size: int = 1000

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS origins as a list (``*`` is passed through untouched)."""
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        return [origin for origin in origins if origin]

    @property
    def qr_url_prefix(self) -> str:
        """Prefix used when rendering a plate's scan URL (``.../q``)."""
        return f"{self.api_base_url.rstrip('/')}/q"

    def scan_url(self, code_identifier: str) -> str:
        """Absolute-or-relative URL physically printed inside a QR plate."""
        return f"{self.qr_url_prefix}/{code_identifier}"


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor (used as a FastAPI dependency)."""
    return Settings()
