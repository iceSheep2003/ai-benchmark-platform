from __future__ import annotations

import logging
import threading
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas.execution import ExecutionMode
from ..schemas.task import TaskStatus
from ..schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    TestCategory,
    TEST_CASE_CATALOG,
)
from ..services import test_store
from ..services.ssh_config import get_target
from ..services.test_runners.base import RunnerRegistry

from ..services.test_runners import chip_basic_runner  # noqa: F401 – register
from ..services.test_runners import training_runner  # noqa: F401
from ..services.test_runners import inference_runner  # noqa: F401
from ..services.test_runners import accuracy_runner  # noqa: F401
from ..services.test_runners import ecosystem_runner  # noqa: F401
from ..services.test_runners import video_codec_runner  # noqa: F401

logger = logging.getLogger("test_cases_router")

router = APIRouter(prefix="/api/v1/test-cases", tags=["test-cases"])


@router.get("/catalog")
def get_catalog(category: Optional[str] = Query(None)):
    items = TEST_CASE_CATALOG
    if category:
        items = [c for c in items if c["category"] == category]
    return {"total": len(items), "items": items}


@router.get("/categories")
def get_categories():
    return {
        "categories": [
            {"key": c.value, "label": _category_label(c)}
            for c in TestCategory
        ]
    }


@router.post("", status_code=201)
def create_test(req: AcceleratorTestCreate):
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

    task = test_store.create_test_task(req)

    t = threading.Thread(target=_execute_test, args=(task.id,), daemon=True)
    t.start()

    return task.to_dict()


@router.get("")
def list_tests(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    cat = TestCategory(category) if category else None
    st = TaskStatus(status) if status else None
    items, total = test_store.list_test_tasks(category=cat, status=st, limit=limit, offset=offset)
    return {"total": total, "items": [t.to_dict() for t in items]}


@router.get("/{task_id}")
def get_test(task_id: str):
    task = test_store.get_test_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Test task {task_id} not found")
    return task.to_dict()


@router.post("/{task_id}/cancel")
def cancel_test(task_id: str):
    task = test_store.update_test_task_status(task_id, TaskStatus.CANCELLED)
    if not task:
        raise HTTPException(status_code=404, detail=f"Test task {task_id} not found")
    return task.to_dict()


@router.delete("/{task_id}", status_code=204)
def delete_test(task_id: str):
    if not test_store.delete_test_task(task_id):
        raise HTTPException(status_code=404, detail=f"Test task {task_id} not found")


@router.get("/{task_id}/logs")
def get_test_logs(task_id: str, tail: int = Query(100, ge=1, le=1000)):
    task = test_store.get_test_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Test task {task_id} not found")
    lines = task.log_tail[-tail:] if len(task.log_tail) > tail else task.log_tail
    return {"task_id": task_id, "lines": lines}


def _execute_test(task_id: str) -> None:
    task = test_store.get_test_task(task_id)
    if not task:
        return

    if task.execution_mode == ExecutionMode.SSH:
        from ..services.ssh_runner import run_test_case_via_ssh

        test_store.update_test_task_status(task_id, TaskStatus.RUNNING)
        test_store.append_test_log(
            task_id,
            [f"Starting test (SSH): {task.category.value}/{task.test_type} target={task.ssh_target_id}"],
        )
        run_test_case_via_ssh(task_id)
        return

    test_store.update_test_task_status(task_id, TaskStatus.RUNNING)
    test_store.append_test_log(task_id, [f"Starting test: {task.category.value}/{task.test_type}"])

    try:
        runner_cls = RunnerRegistry.get(task.category)
    except ValueError as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        return

    work_dir = f"outputs/tests/{task_id}"
    runner = runner_cls(
        task_id=task_id,
        config=AcceleratorTestCreate(
            name=task.name,
            category=task.category,
            test_type=task.test_type,
            config=task.config,
            num_gpus=task.num_gpus,
            description=task.description,
        ),
        work_dir=work_dir,
    )

    try:
        result = runner.run()

        for line in runner.get_log_lines():
            test_store.append_test_log(task_id, [line])

        test_store.update_test_task_result(task_id, result)
        test_store.update_test_task_status(task_id, TaskStatus.SUCCESS)
        test_store.append_test_log(task_id, [f"Test completed: {result.summary}"])

    except Exception as e:
        logger.exception("Test %s failed", task_id)
        for line in runner.get_log_lines():
            test_store.append_test_log(task_id, [line])
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        test_store.append_test_log(task_id, [f"Test FAILED: {e}"])


def _category_label(c: TestCategory) -> str:
    labels = {
        TestCategory.CHIP_BASIC: "AI芯片基础测试",
        TestCategory.MODEL_TRAINING: "模型训练性能测试",
        TestCategory.MODEL_INFERENCE: "模型推理性能测试",
        TestCategory.MODEL_ACCURACY: "模型精度测试",
        TestCategory.ECOSYSTEM_COMPAT: "生态兼容性测试",
        TestCategory.VIDEO_CODEC: "视频编解码测试",
    }
    return labels.get(c, c.value)
