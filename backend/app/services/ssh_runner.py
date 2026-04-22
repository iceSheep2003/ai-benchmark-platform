from __future__ import annotations

import json
import logging
import shlex
import subprocess
import tempfile
from pathlib import Path
from typing import Callable, Optional

from ..schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult, TestCategory
from ..schemas.task import TaskStatus
from . import test_store
from .ssh_config import SshTarget

logger = logging.getLogger("ssh_runner")


def _ssh_base(t: SshTarget) -> list[str]:
    cmd = [
        "ssh",
        "-p",
        str(t.port),
        "-o",
        "StrictHostKeyChecking=accept-new",
    ]
    if t.identity_file:
        cmd.extend(["-i", t.identity_file, "-o", "BatchMode=yes"])
    return cmd


def _scp_base(t: SshTarget, push: bool) -> list[str]:
    # scp: -P for port
    cmd = ["scp", "-P", str(t.port)]
    if t.identity_file:
        cmd.extend(["-i", t.identity_file, "-o", "BatchMode=yes"])
    return cmd


def ssh_run_bash(t: SshTarget, bash_line: str, timeout: Optional[float] = None) -> subprocess.CompletedProcess:
    """Run a single bash command line on remote (internal use only; caller must quote safely)."""
    full = _ssh_base(t) + [f"{t.user}@{t.host}", bash_line]
    return subprocess.run(full, capture_output=True, text=True, timeout=timeout)


def scp_push(t: SshTarget, local_path: str, remote_path: str) -> None:
    spec = f"{t.user}@{t.host}:{remote_path}"
    cmd = _scp_base(t, True) + [local_path, spec]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"scp push failed: {r.stderr or r.stdout}")


def scp_pull(t: SshTarget, remote_path: str, local_path: str) -> None:
    spec = f"{t.user}@{t.host}:{remote_path}"
    cmd = _scp_base(t, False) + [spec, local_path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"scp pull failed: {r.stderr or r.stdout}")


def run_test_case_via_ssh(task_id: str) -> None:
    task = test_store.get_test_task(task_id)
    if not task or not task.ssh_target_id:
        return
    from .ssh_config import get_target

    target = get_target(task.ssh_target_id)
    if not target:
        test_store.update_test_task_status(
            task_id, TaskStatus.FAILED, error_message="ssh target not found"
        )
        return

    staging = f"{target.project_root.rstrip('/')}/.benchmark_staging"
    remote_req = f"{staging}/{task_id}.request.json"
    remote_resp = f"{staging}/{task_id}.response.json"

    mkdir_line = f"mkdir -p {shlex.quote(staging)}"
    r0 = ssh_run_bash(target, mkdir_line)
    if r0.returncode != 0:
        test_store.update_test_task_status(
            task_id,
            TaskStatus.FAILED,
            error_message=f"remote mkdir failed: {r0.stderr or r0.stdout}",
        )
        return

    payload = {
        "task_id": task_id,
        "request": {
            "name": task.name,
            "category": task.category.value,
            "test_type": task.test_type,
            "config": task.config,
            "num_gpus": task.num_gpus,
            "description": task.description,
        },
    }

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
        local_req = f.name

    try:
        scp_push(target, local_req, remote_req)
    except Exception as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        Path(local_req).unlink(missing_ok=True)
        return
    finally:
        Path(local_req).unlink(missing_ok=True)

    inner = (
        f"cd {shlex.quote(target.project_root)} && "
        f"{shlex.quote(target.python_executable)} -m backend.app.remote_worker "
        f"test-case {shlex.quote(remote_req)}"
    )
    test_store.append_test_log(task_id, [f"[ssh] {inner}"])
    proc = subprocess.run(
        _ssh_base(target) + [f"{target.user}@{target.host}", inner],
        capture_output=True,
        text=True,
        timeout=3600,
    )
    if proc.stdout:
        test_store.append_test_log(task_id, proc.stdout.strip().split("\n")[-50:])
    if proc.returncode != 0:
        msg = proc.stderr or proc.stdout or f"exit {proc.returncode}"
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=msg)
        return

    with tempfile.NamedTemporaryFile(suffix=".response.json", delete=False) as f:
        local_resp = f.name

    try:
        scp_pull(target, remote_resp, local_resp)
    except Exception as e:
        test_store.update_test_task_status(
            task_id, TaskStatus.FAILED, error_message=f"pull response: {e}"
        )
        Path(local_resp).unlink(missing_ok=True)
        return

    try:
        data = json.loads(Path(local_resp).read_text(encoding="utf-8"))
    except Exception as e:
        test_store.update_test_task_status(
            task_id, TaskStatus.FAILED, error_message=f"bad response json: {e}"
        )
        Path(local_resp).unlink(missing_ok=True)
        return
    finally:
        Path(local_resp).unlink(missing_ok=True)

    for line in data.get("logs") or []:
        test_store.append_test_log(task_id, [line])

    if not data.get("ok"):
        test_store.update_test_task_status(
            task_id,
            TaskStatus.FAILED,
            error_message=data.get("error") or "remote worker failed",
        )
        return

    res = data.get("result") or {}
    try:
        result = AcceleratorTestResult(
            category=TestCategory(res["category"]),
            test_type=res["test_type"],
            data=res.get("data") or {},
            summary=res.get("summary") or "",
        )
    except Exception as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        return

    test_store.update_test_task_result(task_id, result)
    test_store.update_test_task_status(task_id, TaskStatus.SUCCESS)
    test_store.append_test_log(task_id, [f"Test completed (ssh): {result.summary}"])


def run_opencompass_ssh_stream(
    t: SshTarget,
    remote_oc: str,
    remote_config: str,
    remote_workdir: str,
    extra_args: list[str],
    log_callback: Callable[[str], None],
    env_pythonpath: str,
    timeout: Optional[float] = None,
) -> int:
    """Run OpenCompass on remote; stream merged stdout/stderr lines via log_callback. Returns exit code."""
    py = shlex.quote(t.python_executable)
    run_py = shlex.quote(f"{remote_oc}/run.py")
    rcfg = shlex.quote(remote_config)
    rw = shlex.quote(remote_workdir)
    oc = shlex.quote(remote_oc)
    extras = " ".join(shlex.quote(a) for a in extra_args)
    inner = (
        f"mkdir -p {rw}/logs && "
        f"cd {oc} && export PYTHONPATH={shlex.quote(env_pythonpath)} && "
        f"{py} {run_py} {rcfg} -w {rw} --max-num-workers 1 {extras} 2>&1"
    )
    full = _ssh_base(t) + [f"{t.user}@{t.host}", inner]
    proc = subprocess.Popen(full, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    assert proc.stdout
    try:
        for line in proc.stdout:
            log_callback(line.rstrip())
        proc.wait(timeout=timeout)
        return proc.returncode or 0
    finally:
        if proc.poll() is None:
            proc.kill()
