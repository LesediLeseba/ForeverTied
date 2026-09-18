"""Admin API — physical QR plates (batch generation + memorial binding)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import SessionDep, SettingsDep
from app.models.enums import QRStatus
from app.schemas.qr_code import (
    QRAssignRequest,
    QRBatchCreateRequest,
    QRBatchCreateResponse,
    QRCodeListResponse,
    QRCodeRead,
    QRStatusUpdateRequest,
)
from app.services.qr_codes import (
    QRCodeAlreadyAssigned,
    QRCodeNotFound,
    MemorialNotFound,
    assign_to_memorial,
    create_batch,
    list_qr_codes,
    set_status,
    to_read,
    unassign,
)

router = APIRouter(prefix="/api/v1/admin/qr-codes", tags=["admin-qr-codes"])


@router.post(
    "/batch",
    response_model=QRBatchCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pre-generate a batch of unassigned QR plates",
)
async def create_qr_batch(
    payload: QRBatchCreateRequest, session: SessionDep, settings: SettingsDep
) -> QRBatchCreateResponse:
    views = await create_batch(session, payload.quantity, settings.qr_code_length)
    return QRBatchCreateResponse(
        generated=len(views),
        quantity_requested=payload.quantity,
        qr_codes=[to_read(view, settings) for view in views],
    )


@router.get(
    "",
    response_model=QRCodeListResponse,
    summary="List QR plates (filterable by status / memorial)",
)
async def list_qr_codes_endpoint(
    session: SessionDep,
    settings: SettingsDep,
    code_status: QRStatus | None = Query(default=None, alias="status"),
    memorial_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> QRCodeListResponse:
    parsed_memorial_id = None
    if memorial_id:
        try:
            parsed_memorial_id = UUID(memorial_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=f"memorial_id must be a UUID (got '{memorial_id}')",
            ) from exc

    views, total, counts = await list_qr_codes(
        session,
        status=code_status,
        memorial_id=parsed_memorial_id,
        limit=limit,
        offset=offset,
    )
    return QRCodeListResponse(
        items=[to_read(view, settings) for view in views],
        total=total,
        limit=limit,
        offset=offset,
        counts_by_status=counts,
    )


@router.patch(
    "/{code_identifier}/assign",
    response_model=QRCodeRead,
    summary="Bind a plate to a memorial and activate it",
)
async def assign_qr_code(
    code_identifier: str,
    payload: QRAssignRequest,
    session: SessionDep,
    settings: SettingsDep,
) -> QRCodeRead:
    try:
        view = await assign_to_memorial(
            session, code_identifier, payload.memorial_id, force=payload.force
        )
    except QRCodeNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except MemorialNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except QRCodeAlreadyAssigned as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    return to_read(view, settings)


@router.patch(
    "/{code_identifier}/unassign",
    response_model=QRCodeRead,
    summary="Release a plate back into the unassigned pool",
)
async def unassign_qr_code(
    code_identifier: str, session: SessionDep, settings: SettingsDep
) -> QRCodeRead:
    try:
        view = await unassign(session, code_identifier)
    except QRCodeNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return to_read(view, settings)


@router.patch(
    "/{code_identifier}/status",
    response_model=QRCodeRead,
    summary="Update a plate's lifecycle status (e.g. flag as damaged)",
)
async def update_qr_status(
    code_identifier: str,
    payload: QRStatusUpdateRequest,
    session: SessionDep,
    settings: SettingsDep,
) -> QRCodeRead:
    try:
        view = await set_status(session, code_identifier, payload.status)
    except QRCodeNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return to_read(view, settings)
