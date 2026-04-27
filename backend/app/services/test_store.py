from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from ..schemas.execution import ExecutionMode
from ..schemas.task import TaskStatus
from ..schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult, TestCategory
from .db import execute, fetchall, fetchone



class TestTask:
    __slots__ = (
        "id", "name", "category", "test_type", "config", "num_gpus",
        "description", "status", "created_at", "started_at", "completed_at",
        "error_message", "result", "log_tail",
        "execution_mode", "ssh_target_id",
    )

    def __init__(self, *, task_id: str, req: AcceleratorTestCreate):
        self.id = task_id
        self.name = req.name
        self.category = req.category
        self.test_type = req.test_type
        self.config = req.config
        self.num_gpus = req.num_gpus
        self.description = req.description
        self.execution_mode: ExecutionMode = req.execution.mode
        self.ssh_target_id: Optional[str] = (
            req.execution.target_id if req.execution.mode == ExecutionMode.SSH else None
        )
        self.status: TaskStatus = TaskStatus.PENDING
        self.created_at: datetime = datetime.utcnow()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error_message: Optional[str] = None
        self.result: Optional[AcceleratorTestResult] = None
        self.log_tail: list[str] = []

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.value,
            "test_type": self.test_type,
            "config": self.config,
            "num_gpus": self.num_gpus,
            "description": self.description,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "result": self.result.model_dump() if self.result else None,
            "log_tail": self.log_tail[-100:],
            "execution_mode": self.execution_mode.value,
            "ssh_target_id": self.ssh_target_id,
        }


def _dt(v: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(v) if v else None


def _row_to_test_task(row) -> TestTask:
    req = AcceleratorTestCreate(
        name=row["name"],
        category=TestCategory(row["category"]),
        test_type=row["test_type"],
        config=json.loads(row["config_json"] or "{}"),
        num_gpus=row["num_gpus"],
        description=row["description"],
        execution={
            "mode": row["execution_mode"],
            "target_id": row["ssh_target_id"],
        },
    )
    t = TestTask(task_id=row["id"], req=req)
    t.status = TaskStatus(row["status"])
    t.created_at = datetime.fromisoformat(row["created_at"])
    t.started_at = _dt(row["started_at"])
    t.completed_at = _dt(row["completed_at"])
    t.error_message = row["error_message"]
    t.log_tail = json.loads(row["log_tail_json"] or "[]")
    t.result = AcceleratorTestResult.model_validate(json.loads(row["result_json"])) if row["result_json"] else None
    return t


def create_test_task(req: AcceleratorTestCreate) -> TestTask:
    task_id = f"test-{uuid4().hex[:12]}"
    task = TestTask(task_id=task_id, req=req)
    execute(
        """
        INSERT INTO test_tasks(
            id, name, category, test_type, config_json, num_gpus, description,
            status, created_at, error_message, result_json, log_tail_json, execution_mode, ssh_target_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task.id,
            task.name,
            task.category.value,
            task.test_type,
            json.dumps(task.config, ensure_ascii=False),
            task.num_gpus,
            task.description,
            task.status.value,
            task.created_at.isoformat(),
            task.error_message,
            None,
            "[]",
            task.execution_mode.value,
            task.ssh_target_id,
        ),
    )
    return task


def get_test_task(task_id: str) -> Optional[TestTask]:
    row = fetchone("SELECT * FROM test_tasks WHERE id = ?", (task_id,))
    return _row_to_test_task(row) if row else None


def list_test_tasks(
    category: Optional[TestCategory] = None,
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[TestTask], int]:
    where_parts: list[str] = []
    params: list[Any] = []
    if category:
        where_parts.append("category = ?")
        params.append(category.value)
    if status:
        where_parts.append("status = ?")
        params.append(status.value)
    where = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

    total_row = fetchone(f"SELECT COUNT(*) AS c FROM test_tasks {where}", tuple(params))
    total = int(total_row["c"]) if total_row else 0
    rows = fetchall(
        f"""
        SELECT * FROM test_tasks
        {where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params + [limit, offset]),
    )
    return [_row_to_test_task(r) for r in rows], total


def update_test_task_status(
    task_id: str,
    status: TaskStatus,
    *,
    error_message: Optional[str] = None,
) -> Optional[TestTask]:
    task = get_test_task(task_id)
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
        UPDATE test_tasks
        SET status = ?, started_at = ?, completed_at = ?, error_message = ?
        WHERE id = ?
        """,
        (status.value, started_at, completed_at, em, task_id),
    )
    return get_test_task(task_id)


def update_test_task_result(task_id: str, result: AcceleratorTestResult) -> Optional[TestTask]:
    task = get_test_task(task_id)
    if not task:
        return None
    execute(
        "UPDATE test_tasks SET result_json = ? WHERE id = ?",
        (result.model_dump_json(), task_id),
    )
    try:
        from .accelerator_store import record_test_result

        record_test_result(task, result)
    except Exception:
        pass
    return get_test_task(task_id)


def append_test_log(task_id: str, lines: list[str], max_lines: int = 200):
    task = get_test_task(task_id)
    if not task:
        return
    merged = task.log_tail + lines
    if len(merged) > max_lines:
        merged = merged[-max_lines:]
    execute(
        "UPDATE test_tasks SET log_tail_json = ? WHERE id = ?",
        (json.dumps(merged, ensure_ascii=False), task_id),
    )


def delete_test_task(task_id: str) -> bool:
    cur = execute("DELETE FROM test_tasks WHERE id = ?", (task_id,))
    return cur.rowcount > 0
