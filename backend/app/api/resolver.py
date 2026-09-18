"""Public scan resolver.

Physical plates encode ``{API_BASE_URL}/q/{code_identifier}``. This endpoint is
the only thing a QR plate needs to know about: it looks the plate up and issues
an HTTP 302 to the React memorial page.
"""

from __future__ import annotations

from fastapi import APIRouter, Response, status
from fastapi.responses import JSONResponse, RedirectResponse

from app.api.deps import SessionDep, SettingsDep
from app.core.config import Settings
from app.models.enums import SCANNABLE_STATUSES, QRStatus
from app.services.qr_codes import get_view_by_identifier

router = APIRouter(tags=["scan-resolver"])


def _miss_response(settings: Settings, code_identifier: str, reason: str) -> Response:
    """What a scanner sees when a plate cannot resolve to a memorial."""
    if settings.resolver_miss_mode == "not_found":
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "detail": "QR plate not found or not active",
                "code_identifier": code_identifier,
                "reason": reason,
            },
        )

    target = (
        f"{settings.frontend_base_url.rstrip('/')}"
        f"{settings.resolver_miss_path}"
        f"?code={code_identifier}&reason={reason}"
    )
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


@router.get(
    "/q/{code_identifier}",
    summary="Resolve a physical QR plate scan to its memorial page",
    responses={
        302: {"description": "Redirect to the memorial page (or /setup)"},
        404: {"description": "Unknown plate (when RESOLVER_MISS_MODE=not_found)"},
    },
)
async def resolve_scan(
    code_identifier: str, session: SessionDep, settings: SettingsDep
) -> Response:
    """302-redirect the scanner to ``{FRONTEND}/memorials/{slug}``."""
    view = await get_view_by_identifier(session, code_identifier)

    if view is None:
        return _miss_response(settings, code_identifier.upper(), "unknown_code")
    if view.code.status not in SCANNABLE_STATUSES:
        return _miss_response(
            settings, view.code.code_identifier, view.code.status.value
        )
    if view.code.memorial_id is None or not view.memorial_slug:
        return _miss_response(
            settings, view.code.code_identifier, QRStatus.UNASSIGNED.value
        )

    target = (
        f"{settings.frontend_base_url.rstrip('/')}/memorials/{view.memorial_slug}"
    )
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)
