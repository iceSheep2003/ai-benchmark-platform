from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.ssh_target import SshTargetsSaveRequest
from ..schemas.task import SystemInfoResponse
from ..services.gpu_info import query_gpu_info, query_gpu_info_ssh_target
from ..services import ssh_config
from ..services.ssh_config import get_target, list_targets_public

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/ssh-targets")
def get_ssh_targets():
    return {"items": list_targets_public()}


@router.get("/ssh-targets-config")
def get_ssh_targets_config():
    """Full target list for admin UI (includes identity_file path, etc.)."""
    targets = ssh_config.load_ssh_targets()
    return {
        "items": [ssh_config.target_to_admin_dict(t) for t in targets],
        "persisted": ssh_config.is_persisted_file(),
        "data_file": str(ssh_config.data_file_path()),
    }


@router.api_route("/ssh-targets-config", methods=["PUT", "POST"])
def put_ssh_targets_config(body: SshTargetsSaveRequest):
    ids = [x.id for x in body.items]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Duplicate target id")

    old_passwords = ssh_config.get_saved_password_map()

    rows: list[dict] = []
    for it in body.items:
        d = it.model_dump(exclude_none=True)
        new_pw = d.pop("password", None)
        if new_pw is not None and str(new_pw).strip():
            d["password"] = str(new_pw).strip()
        elif it.identity_file and str(it.identity_file).strip():
            pass
        elif old_passwords.get(it.id):
            d["password"] = old_passwords[it.id]
        rows.append(d)

    try:
        raw = json.dumps(rows)
        ssh_config._parse_targets(raw)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    try:
        ssh_config.persist_targets_raw(rows)
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"无法写入配置文件（权限或路径问题）: {e}. 请确认进程对 backend/data/ 有写权限。",
        ) from e
    return {
        "ok": True,
        "items": [ssh_config.target_to_admin_dict(t) for t in ssh_config.load_ssh_targets()],
    }


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
