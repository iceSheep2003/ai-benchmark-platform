from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ..schemas.accelerator import (
    AcceleratorComparison,
    AcceleratorComparisonListResponse,
    CreateComparisonRequest,
    UpdateComparisonRequest,
)
from ..services import accelerator_store

router = APIRouter(prefix="/api/v1/accelerator/comparisons", tags=["accelerator-comparisons"])


@router.post("", response_model=AcceleratorComparison, status_code=201)
def create_comparison(req: CreateComparisonRequest):
    return accelerator_store.create_comparison(req)


@router.get("", response_model=AcceleratorComparisonListResponse)
def list_comparisons(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    items, total = accelerator_store.list_comparisons(limit=limit, offset=offset)
    return AcceleratorComparisonListResponse(total=total, items=items)


@router.get("/{report_id}", response_model=AcceleratorComparison)
def get_comparison(report_id: str):
    item = accelerator_store.get_comparison(report_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Comparison {report_id} not found")
    return item


@router.patch("/{report_id}", response_model=AcceleratorComparison)
def update_comparison(report_id: str, req: UpdateComparisonRequest):
    item = accelerator_store.update_comparison(report_id, req)
    if not item:
        raise HTTPException(status_code=404, detail=f"Comparison {report_id} not found")
    return item


@router.delete("/{report_id}", status_code=204)
def delete_comparison(report_id: str):
    ok = accelerator_store.delete_comparison(report_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Comparison {report_id} not found")

