from __future__ import annotations

import json
import logging
import re
import shlex
import tarfile
import tempfile
import time
from pathlib import Path
from typing import Callable, Optional

from ..schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult, TestCategory
from ..schemas.task import TaskStatus
from . import test_store
from .ssh_config import SshTarget
from .test_runners.training_runner import TrainingRunner
from .ssh_transport import (
    scp_pull,
    scp_pull_dir,
    scp_push,
    ssh_run_bash,
    run_streaming_command,
)

logger = logging.getLogger("ssh_runner")

_SYNC_EXCLUDE_PARTS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".venv",
    ".tmp-ssh",
    "dist",
    "outputs",
    "remote-results",
}


def _tar_filter(info: tarfile.TarInfo) -> Optional[tarfile.TarInfo]:
    p = Path(info.name)
    if any(part in _SYNC_EXCLUDE_PARTS for part in p.parts):
        return None
    if info.name.endswith(".pyc"):
        return None
    return info


def sync_task_program_files(
    target: SshTarget,
    *,
    paths: list[str],
    remote_project_root: Optional[str] = None,
    log_callback: Optional[Callable[[str], None]] = None,
) -> None:
    """Archive selected task program files and extract them to remote project_root."""
    project_root = Path(__file__).resolve().parents[3]
    remote_root = (remote_project_root or target.project_root).rstrip("/")

    def _log(msg: str) -> None:
        if log_callback:
            log_callback(msg)

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as f:
        local_archive = Path(f.name)

    try:
        added = 0
        with tarfile.open(local_archive, "w:gz") as tar:
            for rel in paths:
                src = project_root / rel
                if src.exists():
                    tar.add(src, arcname=rel, filter=_tar_filter)
                    added += 1
                else:
                    _log(f"[ssh-sync] skip missing path: {rel}")

        if added == 0:
            _log("[ssh-sync] no local task program files matched; skip archive upload")
            return

        staging = f"{remote_root}/.benchmark_staging"
        remote_archive = f"{staging}/code-sync-{int(time.time())}.tar.gz"

        prep = ssh_run_bash(
            target,
            f"mkdir -p {shlex.quote(remote_root)} {shlex.quote(staging)}",
        )
        if prep.returncode != 0:
            raise RuntimeError(f"remote mkdir failed: {prep.stderr or prep.stdout}")

        _log(f"[ssh-sync] pushing task program archive to {remote_archive}")
        scp_push(target, str(local_archive), remote_archive)

        extract = ssh_run_bash(
            target,
            (
                f"tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(remote_root)} "
                f"&& rm -f {shlex.quote(remote_archive)}"
            ),
            timeout=900,
        )
        if extract.returncode != 0:
            raise RuntimeError(f"remote extract failed: {extract.stderr or extract.stdout}")
        _log(f"[ssh-sync] task program synced to {remote_root}")
    finally:
        local_archive.unlink(missing_ok=True)


def run_test_case_via_ssh(task_id: str) -> None:
    try:
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

        remote_root = _resolve_remote_project_root(target)
        staging = f"{remote_root}/.benchmark_staging"

        mkdir_line = f"mkdir -p {shlex.quote(staging)}"
        r0 = ssh_run_bash(target, mkdir_line)
        if r0.returncode != 0:
            test_store.update_test_task_status(
                task_id,
                TaskStatus.FAILED,
                error_message=f"remote mkdir failed: {r0.stderr or r0.stdout}",
            )
            return

        _run_test_case_via_synced_backend(task_id, task, target, remote_root, staging)
    except Exception as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        test_store.append_test_log(task_id, [f"Test FAILED (ssh): {e}"])


def _run_test_case_via_synced_backend(task_id: str, task, target: SshTarget, remote_root: str, staging: str) -> None:
    remote_req = f"{staging}/{task_id}.request.json"
    remote_resp = f"{staging}/{task_id}.response.json"

    # Push related backend code required by remote_worker + runners.
    try:
        sync_task_program_files(
            target,
            paths=["backend"],
            remote_project_root=remote_root,
            log_callback=lambda m: test_store.append_test_log(task_id, [m]),
        )
    except Exception as e:
        test_store.update_test_task_status(
            task_id, TaskStatus.FAILED, error_message=f"code sync failed: {e}"
        )
        return

    code_check = ssh_run_bash(
        target,
        f"test -f {shlex.quote(f'{remote_root}/backend/app/remote_worker.py')}",
    )
    if code_check.returncode != 0:
        test_store.update_test_task_status(
            task_id,
            TaskStatus.FAILED,
            error_message=f"required code missing after sync: {remote_root}/backend/app/remote_worker.py",
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

    # Verify request file exists on remote before execution.
    vr = ssh_run_bash(target, f"test -f {shlex.quote(remote_req)}")
    if vr.returncode != 0:
        test_store.update_test_task_status(
            task_id,
            TaskStatus.FAILED,
            error_message=f"request file missing after push: {remote_req}",
        )
        return

    inner = (
        f"cd {shlex.quote(remote_root)} && "
        f"{shlex.quote(target.python_executable)} -m backend.app.remote_worker "
        f"test-case {shlex.quote(remote_req)}"
    )
    test_store.append_test_log(task_id, [f"[ssh] {inner}"])
    with tempfile.NamedTemporaryFile(suffix=".response.json", delete=False) as f:
        local_resp = f.name

    proc = ssh_run_bash(target, inner, timeout=3600)
    if proc.stdout:
        test_store.append_test_log(task_id, proc.stdout.strip().split("\n")[-50:])

    _sync_remote_test_outputs(task_id, target, remote_root)

    response_data = None
    try:
        scp_pull(target, remote_resp, local_resp)
        response_data = json.loads(Path(local_resp).read_text(encoding="utf-8"))
    except Exception as e:
        if proc.returncode == 0:
            test_store.update_test_task_status(
                task_id, TaskStatus.FAILED, error_message=f"pull response: {e}"
            )
            Path(local_resp).unlink(missing_ok=True)
            return
    finally:
        Path(local_resp).unlink(missing_ok=True)

    if proc.returncode != 0 and response_data is None:
        msg = proc.stderr or proc.stdout or f"exit {proc.returncode}"
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=msg)
        return

    data = response_data or {}
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


def _sync_remote_test_outputs(task_id: str, target: SshTarget, remote_root: str) -> None:
    remote_dir = f"{remote_root}/outputs/tests/{task_id}"
    local_root = Path(__file__).resolve().parents[3] / "remote-results" / "tests" / task_id
    local_root.mkdir(parents=True, exist_ok=True)
    try:
        scp_pull_dir(target, remote_dir, local_root)
        test_store.append_test_log(task_id, [f"[ssh-sync] pulled remote outputs to {local_root}"])
    except Exception as e:
        test_store.append_test_log(task_id, [f"[ssh-sync] WARN pull remote outputs failed: {e}"])


def _resolve_remote_project_root(target: SshTarget) -> str:
    pr = (target.project_root or "").strip()
    if not pr:
        return pr
    if "~" not in pr:
        return pr
    # Resolve ~ / ~/... on remote host to absolute path so SFTP + shell use same location.
    home_res = ssh_run_bash(target, "printf %s \"$HOME\"")
    home = (home_res.stdout or "").strip()
    if home_res.returncode != 0 or not home:
        return pr
    if pr == "~":
        return home
    if pr.startswith("~/"):
        return f"{home}/{pr[2:]}"
    return pr.replace("~", home, 1)


def _run_training_case_via_single_script(task_id: str, task, target: SshTarget, staging: str) -> None:
    test_store.update_test_task_status(task_id, TaskStatus.RUNNING)
    test_store.append_test_log(
        task_id,
        [f"Starting test (SSH/single-script): {task.category.value}/{task.test_type} target={task.ssh_target_id}"],
    )

    req = AcceleratorTestCreate(
        name=task.name,
        category=task.category,
        test_type=task.test_type,
        config=task.config,
        num_gpus=task.num_gpus,
        description=task.description,
    )
    cfg = req.config
    framework = cfg.get("framework", "pytorch")
    if framework != "pytorch":
        test_store.update_test_task_status(
            task_id, TaskStatus.FAILED, error_message=f"single-script mode only supports pytorch training, got: {framework}"
        )
        return

    runner = TrainingRunner(task_id=task_id, config=req, work_dir=f"outputs/tests/{task_id}")
    script = runner._generate_pytorch_training_script(
        test_type=cfg.get("test_type", task.test_type),
        model_path=cfg.get("model_path", ""),
        precision=cfg.get("precision", "FP16"),
        batch_size=cfg.get("batch_size", 64),
        epochs=cfg.get("epochs", 2),
        image_size=cfg.get("image_size", "224x224"),
    )

    remote_script = f"{staging}/{task_id}.train.py"
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(script)
        local_script = f.name
    try:
        scp_push(target, local_script, remote_script)
    except Exception as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=f"push script failed: {e}")
        Path(local_script).unlink(missing_ok=True)
        return
    finally:
        Path(local_script).unlink(missing_ok=True)

    num_gpus = int(cfg.get("num_gpus", task.num_gpus))
    visible = ",".join(str(i) for i in range(num_gpus))
    py = shlex.quote(target.python_executable)
    cmd = (
        f"cd {shlex.quote(target.project_root)} && "
        f"CUDA_VISIBLE_DEVICES={shlex.quote(visible)} "
        f"{py} -m torch.distributed.run --nproc_per_node={num_gpus} {shlex.quote(remote_script)}"
    )
    test_store.append_test_log(task_id, [f"[ssh] {cmd}"])
    proc = ssh_run_bash(target, cmd, timeout=3600)
    out = (proc.stdout or "") + (proc.stderr or "")
    if out.strip():
        test_store.append_test_log(task_id, out.strip().split("\n")[-80:])

    if proc.returncode != 0:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=f"exit {proc.returncode}")
        return

    throughput = _extract_metric(out, r"THROUGHPUT:\s*([\d.]+)")
    gpu_mem = _extract_metric(out, r"GPU_MEMORY:\s*([\d.]+)")
    result = AcceleratorTestResult(
        category=task.category,
        test_type=task.test_type,
        data={
            "exit_code": proc.returncode,
            "throughput": throughput or 0.0,
            "throughput_unit": "imgs/s",
            "gpu_memory_used_mb": gpu_mem,
            "num_gpus": num_gpus,
            "precision": cfg.get("precision", "FP16"),
            "summary": f"Training {task.test_type}: {(throughput or 0.0):.1f} imgs/s",
        },
        summary=f"Training {task.test_type}: {(throughput or 0.0):.1f} imgs/s",
    )
    test_store.update_test_task_result(task_id, result)
    test_store.update_test_task_status(task_id, TaskStatus.SUCCESS)
    test_store.append_test_log(task_id, [f"Test completed (ssh/single-script): {result.summary}"])


def _run_inference_case_via_single_script(task_id: str, task, target: SshTarget, staging: str) -> None:
    test_store.update_test_task_status(task_id, TaskStatus.RUNNING)
    test_store.append_test_log(
        task_id,
        [f"Starting test (SSH/single-script): {task.category.value}/{task.test_type} target={task.ssh_target_id}"],
    )

    cfg = task.config or {}
    framework = str(cfg.get("framework", "vllm")).lower()
    if framework != "vllm":
        test_store.update_test_task_status(
            task_id,
            TaskStatus.FAILED,
            error_message=f"single-script inference currently supports framework=vllm only, got: {framework}",
        )
        return

    script = f"""
import json, time

model_path = {cfg.get("model_path", "")!r}
num_gpus = int({int(cfg.get("num_gpus", task.num_gpus))})
pairs = {cfg.get("input_output_pairs", [[1024, 256]])!r}
concurrency_levels = {cfg.get("concurrency_levels", [1, 4, 8, 16, 32])!r}
num_requests = int({int(cfg.get("num_requests", 400))})

if not model_path:
    print("SCRIPT_ERROR:model_path is required")
    raise SystemExit(2)

try:
    from vllm import LLM, SamplingParams
except Exception as e:
    print(f"SCRIPT_ERROR:vllm import failed: {{e}}")
    raise SystemExit(2)

results = []
for pair in pairs:
    input_len, output_len = int(pair[0]), int(pair[1])
    for c in concurrency_levels:
        req_n = min(num_requests, max(int(c), 1) * 10)
        llm = LLM(model=model_path, tensor_parallel_size=num_gpus, max_model_len=input_len + output_len + 128, enforce_eager=True)
        prompt = ("Hello " * max(input_len // 2, 1)).strip()
        prompts = [prompt] * req_n
        sp = SamplingParams(max_tokens=output_len, temperature=0.0)

        _ = llm.generate(prompts[: min(2, len(prompts))], sp)
        start = time.time()
        outputs = llm.generate(prompts, sp)
        elapsed = max(time.time() - start, 1e-9)

        total_output_tokens = sum(len(o.outputs[0].token_ids) for o in outputs)
        tps = total_output_tokens / elapsed
        one = {{
            "concurrency": int(c),
            "input_len": input_len,
            "output_len": output_len,
            "output_throughput_tps": round(float(tps), 2),
            "elapsed_seconds": round(float(elapsed), 2),
            "num_requests": int(req_n),
        }}
        print("BENCH_RESULT:" + json.dumps(one, ensure_ascii=False))
        results.append(one)

best = max(results, key=lambda x: x.get("output_throughput_tps", 0.0)) if results else {{}}
print("BENCH_FINAL:" + json.dumps({{"best": best, "all": results}}, ensure_ascii=False))
"""

    remote_script = f"{staging}/{task_id}.infer.py"
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(script)
        local_script = f.name
    try:
        scp_push(target, local_script, remote_script)
    except Exception as e:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=f"push script failed: {e}")
        Path(local_script).unlink(missing_ok=True)
        return
    finally:
        Path(local_script).unlink(missing_ok=True)

    num_gpus = int(cfg.get("num_gpus", task.num_gpus))
    visible = ",".join(str(i) for i in range(num_gpus))
    py = shlex.quote(target.python_executable)
    cmd = (
        f"cd {shlex.quote(target.project_root)} && "
        f"CUDA_VISIBLE_DEVICES={shlex.quote(visible)} "
        f"{py} {shlex.quote(remote_script)}"
    )
    test_store.append_test_log(task_id, [f"[ssh] {cmd}"])
    proc = ssh_run_bash(target, cmd, timeout=7200)
    out = (proc.stdout or "") + (proc.stderr or "")
    if out.strip():
        test_store.append_test_log(task_id, out.strip().split("\\n")[-120:])

    if proc.returncode != 0:
        test_store.update_test_task_status(task_id, TaskStatus.FAILED, error_message=f"exit {proc.returncode}")
        return

    final = None
    m = re.search(r"BENCH_FINAL:(\\{{.*\\}})", out)
    if m:
        try:
            final = json.loads(m.group(1))
        except Exception:
            final = None

    best = (final or {}).get("best") or {}
    summary = f"Inference {task.test_type}: best output throughput={float(best.get('output_throughput_tps', 0.0)):.1f} tok/s"
    result = AcceleratorTestResult(
        category=task.category,
        test_type=task.test_type,
        data={
            "framework": "vllm",
            "best": best,
            "all": (final or {}).get("all", []),
            "summary": summary,
        },
        summary=summary,
    )
    test_store.update_test_task_result(task_id, result)
    test_store.update_test_task_status(task_id, TaskStatus.SUCCESS)
    test_store.append_test_log(task_id, [f"Test completed (ssh/single-script): {result.summary}"])


def _extract_metric(text: str, pattern: str) -> float | None:
    m = re.search(pattern, text)
    if not m:
        return None
    try:
        return float(m.group(1))
    except Exception:
        return None


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
    return run_streaming_command(t, inner, log_callback, timeout=timeout)
