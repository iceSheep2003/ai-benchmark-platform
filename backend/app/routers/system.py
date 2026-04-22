from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.task import SystemInfoResponse
from ..services.gpu_info import query_gpu_info, query_gpu_info_ssh_target
from ..services.ssh_config import get_target, list_targets_public

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/ssh-targets")
def get_ssh_targets():
    return {"items": list_targets_public()}


@router.get("/gpu-info", response_model=SystemInfoResponse)
def get_gpu_info(target_id: Optional[str] = Query(None)):
    if target_id:
        t = get_target(target_id)
        if not t:
            raise HTTPException(status_code=404, detail=f"Unknown target_id: {target_id}")
        return query_gpu_info_ssh_target(t)
    return query_gpu_info()


@router.get("/health")
def health_check():
    return {"status": "ok"}
