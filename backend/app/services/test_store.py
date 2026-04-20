from __future__ import annotations

import threading
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from ..schemas.task import TaskStatus
from ..schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult, TestCategory

_lock = threading.Lock()


class TestTask:
    __slots__ = (
        "id", "name", "category", "test_type", "config", "num_gpus",
        "description", "status", "created_at", "started_at", "completed_at",
        "error_message", "result", "log_tail",
    )

    def __init__(self, *, task_id: str, req: AcceleratorTestCreate):
        self.id = task_id
        self.name = req.name
        self.category = req.category
        self.test_type = req.test_type
        self.config = req.config
        self.num_gpus = req.num_gpus
        self.description = req.description
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
        }


_test_tasks: dict[str, TestTask] = {}


def create_test_task(req: AcceleratorTestCreate) -> TestTask:
    task_id = f"test-{uuid4().hex[:12]}"
    task = TestTask(task_id=task_id, req=req)
    with _lock:
        _test_tasks[task_id] = task
    return task


def get_test_task(task_id: str) -> Optional[TestTask]:
    with _lock:
        return _test_tasks.get(task_id)


def list_test_tasks(
    category: Optional[TestCategory] = None,
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[TestTask], int]:
    with _lock:
        items = list(_test_tasks.values())

    if category:
        items = [t for t in items if t.category == category]
    if status:
        items = [t for t in items if t.status == status]

    items.sort(key=lambda t: t.created_at, reverse=True)
    total = len(items)
    return items[offset: offset + limit], total


def update_test_task_status(
    task_id: str,
    status: TaskStatus,
    *,
    error_message: Optional[str] = None,
) -> Optional[TestTask]:
    with _lock:
        task = _test_tasks.get(task_id)
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


def update_test_task_result(task_id: str, result: AcceleratorTestResult) -> Optional[TestTask]:
    with _lock:
        task = _test_tasks.get(task_id)
        if not task:
            return None
        task.result = result
        return task


def append_test_log(task_id: str, lines: list[str], max_lines: int = 200):
    with _lock:
        task = _test_tasks.get(task_id)
        if not task:
            return
        task.log_tail.extend(lines)
        if len(task.log_tail) > max_lines:
            task.log_tail = task.log_tail[-max_lines:]


def delete_test_task(task_id: str) -> bool:
    with _lock:
        return _test_tasks.pop(task_id, None) is not None
