from __future__ import annotations

import threading
from datetime import datetime
from typing import Optional
from uuid import uuid4

from ..schemas.execution import ExecutionMode
from ..schemas.task import (
    AcceleratorBackend,
    AcceleratorTaskCreate,
    TaskMetrics,
    TaskPriority,
    TaskResponse,
    TaskResult,
    TaskStatus,
)

_lock = threading.Lock()
_tasks: dict[str, TaskResponse] = {}


def create_task(req: AcceleratorTaskCreate) -> TaskResponse:
    task_id = f"acc-{uuid4().hex[:12]}"
    now = datetime.utcnow()
    work_dir = req.work_dir or f"outputs/accelerator/{task_id}"

    mode = req.execution.mode
    ssh_tid = req.execution.target_id if mode == ExecutionMode.SSH else None
    remote_ws: Optional[str] = None
    if mode == ExecutionMode.SSH and ssh_tid:
        from .ssh_config import get_target

        tgt = get_target(ssh_tid)
        if tgt:
            remote_ws = f"{tgt.project_root.rstrip('/')}/outputs/accelerator/{task_id}"

    task = TaskResponse(
        id=task_id,
        name=req.name,
        status=TaskStatus.PENDING,
        priority=req.priority,
        backend=req.backend,
        model_path=req.model_path,
        datasets=req.datasets,
        num_gpus=req.num_gpus,
        batch_size=req.batch_size,
        max_out_len=req.max_out_len,
        work_dir=work_dir,
        created_at=now,
        execution_mode=mode,
        ssh_target_id=ssh_tid,
        remote_workspace=remote_ws,
    )
    with _lock:
        _tasks[task_id] = task
    return task


def get_task(task_id: str) -> Optional[TaskResponse]:
    with _lock:
        return _tasks.get(task_id)


def list_tasks(
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[TaskResponse], int]:
    with _lock:
        items = list(_tasks.values())

    if status:
        items = [t for t in items if t.status == status]

    items.sort(key=lambda t: t.created_at, reverse=True)
    total = len(items)
    return items[offset : offset + limit], total


def update_task_status(
    task_id: str,
    status: TaskStatus,
    *,
    error_message: Optional[str] = None,
) -> Optional[TaskResponse]:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return None
        task.status = status
        if status == TaskStatus.RUNNING and task.started_at is None:
            task.started_at = datetime.utcnow()
        if status in (TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.CANCELLED):
            task.completed_at = datetime.utcnow()
        if error_message:
            task.error_message = error_message
        return task


def update_task_metrics(task_id: str, metrics: TaskMetrics) -> Optional[TaskResponse]:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return None
        task.metrics = metrics
        return task


def update_task_result(task_id: str, result: TaskResult) -> Optional[TaskResponse]:
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return None
        task.result = result
        return task


def append_log_lines(task_id: str, lines: list[str], max_lines: int = 200):
    with _lock:
        task = _tasks.get(task_id)
        if not task:
            return
        task.log_tail.extend(lines)
        if len(task.log_tail) > max_lines:
            task.log_tail = task.log_tail[-max_lines:]


def delete_task(task_id: str) -> bool:
    with _lock:
        return _tasks.pop(task_id, None) is not None
