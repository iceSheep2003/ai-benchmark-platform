from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.accelerator import AcceleratorAsset, AcceleratorAssetListResponse
from ..services import accelerator_store

router = APIRouter(prefix="/api/v1/accelerator/assets", tags=["accelerator-assets"])


@router.get("", response_model=AcceleratorAssetListResponse)
def list_assets(
    vendor: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    items, total = accelerator_store.list_assets(limit=limit, offset=offset, vendor=vendor, status=status)
    return AcceleratorAssetListResponse(total=total, items=items)


@router.get("/{asset_id}", response_model=AcceleratorAsset)
def get_asset(asset_id: str):
    item = accelerator_store.get_asset(asset_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    return item

