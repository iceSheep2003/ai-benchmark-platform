from __future__ import annotations

import json
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
from .db import execute, fetchall, fetchone


def _dt(v: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(v) if v else None


def _row_to_task(row) -> TaskResponse:
    return TaskResponse(
        id=row["id"],
        name=row["name"],
        status=TaskStatus(row["status"]),
        priority=TaskPriority(row["priority"]),
        backend=AcceleratorBackend(row["backend"]),
        model_path=row["model_path"],
        datasets=json.loads(row["datasets_json"] or "[]"),
        num_gpus=row["num_gpus"],
        batch_size=row["batch_size"],
        max_out_len=row["max_out_len"],
        work_dir=row["work_dir"],
        created_at=datetime.fromisoformat(row["created_at"]),
        started_at=_dt(row["started_at"]),
        completed_at=_dt(row["completed_at"]),
        created_by=row["created_by"] or "system",
        metrics=TaskMetrics.model_validate(json.loads(row["metrics_json"])) if row["metrics_json"] else None,
        result=TaskResult.model_validate(json.loads(row["result_json"])) if row["result_json"] else None,
        error_message=row["error_message"],
        log_tail=json.loads(row["log_tail_json"] or "[]"),
        execution_mode=ExecutionMode(row["execution_mode"]),
        ssh_target_id=row["ssh_target_id"],
        remote_workspace=row["remote_workspace"],
    )


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

    execute(
        """
        INSERT INTO accelerator_tasks(
            id, name, status, priority, backend, model_path, datasets_json,
            num_gpus, batch_size, max_out_len, work_dir, created_at, created_by,
            log_tail_json, execution_mode, ssh_target_id, remote_workspace
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task_id,
            req.name,
            TaskStatus.PENDING.value,
            req.priority.value,
            req.backend.value,
            req.model_path,
            json.dumps(req.datasets, ensure_ascii=False),
            req.num_gpus,
            req.batch_size,
            req.max_out_len,
            work_dir,
            now.isoformat(),
            "system",
            "[]",
            mode.value,
            ssh_tid,
            remote_ws,
        ),
    )
    task = get_task(task_id)
    if not task:
        raise RuntimeError(f"failed to create task: {task_id}")
    return task


def get_task(task_id: str) -> Optional[TaskResponse]:
    row = fetchone("SELECT * FROM accelerator_tasks WHERE id = ?", (task_id,))
    return _row_to_task(row) if row else None


def list_tasks(
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[TaskResponse], int]:
    params: list = []
    where = ""
    if status:
        where = "WHERE status = ?"
        params.append(status.value)

    total_row = fetchone(f"SELECT COUNT(*) AS c FROM accelerator_tasks {where}", tuple(params))
    total = int(total_row["c"]) if total_row else 0

    rows = fetchall(
        f"""
        SELECT * FROM accelerator_tasks
        {where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params + [limit, offset]),
    )
    return [_row_to_task(r) for r in rows], total


def update_task_status(
    task_id: str,
    status: TaskStatus,
    *,
    error_message: Optional[str] = None,
) -> Optional[TaskResponse]:
    task = get_task(task_id)
    if not task:
        return None
    started_at = task.started_at.isoformat() if task.started_at else None
    completed_at = task.completed_at.isoformat() if task.completed_at else None
    if status == TaskStatus.RUNNING and started_at is None:
        started_at = datetime.utcnow().isoformat()
    if status in (TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.CANCELLED):
        completed_at = datetime.utcnow().isoformat()
    em = error_message or task.error_message
    execute(
        """
        UPDATE accelerator_tasks
        SET status = ?, started_at = ?, completed_at = ?, error_message = ?
        WHERE id = ?
        """,
        (status.value, started_at, completed_at, em, task_id),
    )
    return get_task(task_id)


def update_task_metrics(task_id: str, metrics: TaskMetrics) -> Optional[TaskResponse]:
    if not get_task(task_id):
        return None
    execute(
        "UPDATE accelerator_tasks SET metrics_json = ? WHERE id = ?",
        (metrics.model_dump_json(), task_id),
    )
    return get_task(task_id)


def update_task_result(task_id: str, result: TaskResult) -> Optional[TaskResponse]:
    task = get_task(task_id)
    if not task:
        return None
    execute(
        "UPDATE accelerator_tasks SET result_json = ? WHERE id = ?",
        (result.model_dump_json(), task_id),
    )
    try:
        from .accelerator_store import record_opencompass_result

        record_opencompass_result(task, result)
    except Exception:
        # Keep task lifecycle resilient even when analytics persistence fails.
        pass
    return get_task(task_id)


def append_log_lines(task_id: str, lines: list[str], max_lines: int = 200):
    task = get_task(task_id)
    if not task:
        return
    merged = task.log_tail + lines
    if len(merged) > max_lines:
        merged = merged[-max_lines:]
    execute(
        "UPDATE accelerator_tasks SET log_tail_json = ? WHERE id = ?",
        (json.dumps(merged, ensure_ascii=False), task_id),
    )


def delete_task(task_id: str) -> bool:
    cur = execute("DELETE FROM accelerator_tasks WHERE id = ?", (task_id,))
    return cur.rowcount > 0
