from __future__ import annotations

from fastapi import APIRouter

from ..schemas.task import SystemInfoResponse
from ..services.gpu_info import query_gpu_info

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/gpu-info", response_model=SystemInfoResponse)
def get_gpu_info():
    return query_gpu_info()


@router.get("/health")
def health_check():
    return {"status": "ok"}
