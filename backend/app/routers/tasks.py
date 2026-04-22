from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.execution import ExecutionMode
from ..schemas.task import (
    AcceleratorTaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskStatus,
)
from ..services import task_store
from ..services.opencompass_runner import launch_task
from ..services.ssh_config import get_target

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(req: AcceleratorTaskCreate):
    if req.execution.mode == ExecutionMode.SSH:
        if not req.execution.target_id:
            raise HTTPException(
                status_code=400,
                detail="execution.target_id is required when execution.mode is ssh",
            )
        if not get_target(req.execution.target_id):
            raise HTTPException(
                status_code=400,
                detail=f"Unknown SSH target id: {req.execution.target_id}. Configure BENCHMARK_SSH_TARGETS.",
            )
    task = task_store.create_task(req)
    launch_task(task)
    return task


@router.get("", response_model=TaskListResponse)
def list_tasks(
    status: Optional[TaskStatus] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    items, total = task_store.list_tasks(status=status, limit=limit, offset=offset)
    return TaskListResponse(total=total, items=items)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    task = task_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@router.post("/{task_id}/cancel", response_model=TaskResponse)
def cancel_task(task_id: str):
    task = task_store.update_task_status(task_id, TaskStatus.CANCELLED)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str):
    if not task_store.delete_task(task_id):
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")


@router.get("/{task_id}/logs")
def get_task_logs(task_id: str, tail: int = Query(100, ge=1, le=1000)):
    task = task_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    lines = task.log_tail[-tail:] if len(task.log_tail) > tail else task.log_tail
    return {"task_id": task_id, "lines": lines}
