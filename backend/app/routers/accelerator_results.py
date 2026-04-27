from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.accelerator import AcceleratorResult, AcceleratorResultListResponse
from ..services import accelerator_store

router = APIRouter(prefix="/api/v1/accelerator/results", tags=["accelerator-results"])


@router.get("", response_model=AcceleratorResultListResponse)
def list_results(
    asset_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    items, total = accelerator_store.list_results(
        limit=limit,
        offset=offset,
        asset_id=asset_id,
        category=category,
        source_type=source_type,
    )
    return AcceleratorResultListResponse(total=total, items=[AcceleratorResult(**x) for x in items])


@router.get("/{result_id}", response_model=AcceleratorResult)
def get_result(result_id: str):
    item = accelerator_store.get_result(result_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Result {result_id} not found")
    return AcceleratorResult(**item)

