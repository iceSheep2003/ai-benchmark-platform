from __future__ import annotations

import json
import logging
import os
import shlex
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from ..schemas.execution import ExecutionMode
from ..schemas.task import (
    AcceleratorBackend,
    DatasetScore,
    TaskMetrics,
    TaskResponse,
    TaskResult,
    TaskStatus,
)
from . import task_store

logger = logging.getLogger("opencompass_runner")

OPENCOMPASS_ROOT = os.environ.get(
    "OPENCOMPASS_ROOT",
    str(Path(__file__).resolve().parents[3] / "opencompass"),
)

_executor = threading.Thread


def launch_task(task: TaskResponse) -> None:
    t = threading.Thread(target=_run_task, args=(task.id,), daemon=True)
    t.start()


def _opencompass_work_dir(task: TaskResponse) -> str:
    if task.execution_mode == ExecutionMode.SSH and task.remote_workspace:
        return task.remote_workspace
    return task.work_dir


def _run_task(task_id: str) -> None:
    task = task_store.get_task(task_id)
    if not task:
        return

    if task.execution_mode == ExecutionMode.SSH:
        _run_task_ssh(task_id)
        return

    task_store.update_task_status(task_id, TaskStatus.RUNNING)
    task_store.append_log_lines(task_id, [f"[{_ts()}] Task started, backend={task.backend.value}"])

    try:
        config_path = _generate_config(task)
        task_store.append_log_lines(task_id, [f"[{_ts()}] Config generated: {config_path}"])

        exit_code, duration = _execute_opencompass(task, config_path)

        if exit_code != 0:
            task_store.update_task_status(
                task_id, TaskStatus.FAILED, error_message=f"opencompass exited with code {exit_code}"
            )
            task_store.append_log_lines(task_id, [f"[{_ts()}] FAILED (exit={exit_code})"])
            return

        result = _collect_results(task)
        if result:
            result.total_time_seconds = duration
            result.backend_used = task.backend.value
            task_store.update_task_result(task_id, result)

        task_store.update_task_status(task_id, TaskStatus.SUCCESS)
        task_store.append_log_lines(task_id, [f"[{_ts()}] Task completed successfully in {duration:.1f}s"])

    except Exception as e:
        logger.exception("Task %s failed", task_id)
        task_store.update_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        task_store.append_log_lines(task_id, [f"[{_ts()}] Exception: {e}"])


def _run_task_ssh(task_id: str) -> None:
    from .ssh_config import get_target
    from .ssh_runner import run_opencompass_ssh_stream, scp_push, ssh_run_bash
    from .ssh_transport import scp_pull_dir

    task = task_store.get_task(task_id)
    if not task or not task.ssh_target_id or not task.remote_workspace:
        return

    target = get_target(task.ssh_target_id)
    if not target:
        task_store.update_task_status(task_id, TaskStatus.FAILED, error_message="ssh target missing")
        return

    oc_remote = target.oc_root()
    task_store.update_task_status(task_id, TaskStatus.RUNNING)
    task_store.append_log_lines(
        task_id,
        [
            f"[{_ts()}] Task started (SSH target={target.id}, host={target.host})",
            f"[{_ts()}] remote_workspace={task.remote_workspace}",
        ],
    )

    try:
        local_root = Path(task.work_dir)
        local_root.mkdir(parents=True, exist_ok=True)
        config_path = _generate_config(task)
        task_store.append_log_lines(task_id, [f"[{_ts()}] Config generated locally: {config_path}"])

        rw = task.remote_workspace
        mkdir_line = f"mkdir -p {shlex.quote(rw)}/configs {shlex.quote(rw)}/logs"
        r0 = ssh_run_bash(target, mkdir_line)
        if r0.returncode != 0:
            raise RuntimeError(f"remote mkdir: {r0.stderr or r0.stdout}")

        remote_cfg = f"{rw}/configs/{task.id}.py"
        scp_push(target, config_path, remote_cfg)

        extra: list[str] = []
        if task.backend == AcceleratorBackend.VLLM:
            extra.extend(["-a", "vllm"])
        elif task.backend == AcceleratorBackend.LMDEPLOY:
            extra.extend(["-a", "lmdeploy"])

        start = time.time()

        def _log(line: str) -> None:
            if line.strip():
                task_store.append_log_lines(task_id, [line])

        exit_code = run_opencompass_ssh_stream(
            target,
            oc_remote,
            remote_cfg,
            rw,
            extra,
            _log,
            env_pythonpath=oc_remote,
            timeout=None,
        )
        duration = time.time() - start

        if exit_code != 0:
            task_store.update_task_status(
                task_id,
                TaskStatus.FAILED,
                error_message=f"opencompass remote exited with code {exit_code}",
            )
            task_store.append_log_lines(task_id, [f"[{_ts()}] FAILED (exit={exit_code})"])
            return

        # Mirror remote outputs into local work_dir for result parsing
        try:
            scp_pull_dir(target, rw, local_root)
        except Exception as ex:
            task_store.append_log_lines(task_id, [f"[{_ts()}] WARN pull results: {ex}"])

        result = _collect_results(task)
        if result:
            result.total_time_seconds = duration
            result.backend_used = task.backend.value
            task_store.update_task_result(task_id, result)

        task_store.update_task_status(task_id, TaskStatus.SUCCESS)
        task_store.append_log_lines(task_id, [f"[{_ts()}] Task completed (ssh) in {duration:.1f}s"])

    except Exception as e:
        logger.exception("SSH task %s failed", task_id)
        task_store.update_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        task_store.append_log_lines(task_id, [f"[{_ts()}] Exception: {e}"])


def _generate_config(task: TaskResponse) -> str:
    config_dir = Path(task.work_dir) / "configs"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_path = config_dir / f"{task.id}.py"

    model_cfg = _build_model_config(task)
    dataset_cfg = _build_dataset_config(task)

    config_content = f'''\
from mmengine.config import read_base

{dataset_cfg}

{model_cfg}

infer = dict(
    partitioner=dict(type='NaivePartitioner'),
    runner=dict(
        type='LocalRunner',
        max_num_workers=1,
        max_workers_per_gpu=1,
        task=dict(type='OpenICLInferTask'),
    ),
)

eval = dict(
    partitioner=dict(type='NaivePartitioner'),
    runner=dict(
        type='LocalRunner',
        max_num_workers=1,
        task=dict(type='OpenICLEvalTask'),
    ),
)

work_dir = '{_opencompass_work_dir(task)}'
'''
    config_path.write_text(config_content)
    return str(config_path)


def _build_model_config(task: TaskResponse) -> str:
    if task.backend == AcceleratorBackend.VLLM:
        return f'''
from opencompass.models import VLLMwithChatTemplate

models = [
    dict(
        type=VLLMwithChatTemplate,
        abbr='{_model_abbr(task.model_path)}-vllm',
        path='{task.model_path}',
        max_out_len={task.max_out_len},
        batch_size={task.batch_size},
        model_kwargs=dict(tensor_parallel_size={task.num_gpus}),
        run_cfg=dict(num_gpus={task.num_gpus}),
    ),
]
'''
    elif task.backend == AcceleratorBackend.LMDEPLOY:
        return f'''
from opencompass.models import TurboMindModelwithChatTemplate

models = [
    dict(
        type=TurboMindModelwithChatTemplate,
        abbr='{_model_abbr(task.model_path)}-lmdeploy',
        path='{task.model_path}',
        max_out_len={task.max_out_len},
        batch_size={task.batch_size},
        engine_config=dict(session_len={task.max_out_len + 2048}, tp={task.num_gpus}),
        gen_config=dict(top_k=1, temperature=1e-6, top_p=0.9),
        run_cfg=dict(num_gpus={task.num_gpus}),
    ),
]
'''
    else:
        return f'''
from opencompass.models import HuggingFacewithChatTemplate

models = [
    dict(
        type=HuggingFacewithChatTemplate,
        abbr='{_model_abbr(task.model_path)}-hf',
        path='{task.model_path}',
        max_out_len={task.max_out_len},
        batch_size={task.batch_size},
        run_cfg=dict(num_gpus={task.num_gpus}),
    ),
]
'''


def _build_dataset_config(task: TaskResponse) -> str:
    imports: list[str] = []
    refs: list[str] = []

    dataset_map = {
        "gsm8k": ("opencompass.configs.datasets.gsm8k.gsm8k_gen", "gsm8k_datasets"),
        "mmlu": ("opencompass.configs.datasets.mmlu.mmlu_gen", "mmlu_datasets"),
        "ceval": ("opencompass.configs.datasets.ceval.ceval_gen", "ceval_datasets"),
        "humaneval": ("opencompass.configs.datasets.humaneval.humaneval_gen", "humaneval_datasets"),
        "hellaswag": ("opencompass.configs.datasets.hellaswag.hellaswag_gen", "hellaswag_datasets"),
        "winogrande": ("opencompass.configs.datasets.winogrande.winogrande_gen", "winogrande_datasets"),
        "arc": ("opencompass.configs.datasets.ARC_c.ARC_c_gen", "ARC_c_datasets"),
    }

    for ds_name in task.datasets:
        key = ds_name.lower().replace("-", "_").replace(" ", "_")
        if key in dataset_map:
            mod, var = dataset_map[key]
            imports.append(f"from {mod} import {var}")
            refs.append(var)
        else:
            imports.append(f"# WARNING: unknown dataset '{ds_name}', skipped")

    if not refs:
        imports.append("from opencompass.configs.datasets.gsm8k.gsm8k_gen import gsm8k_datasets")
        refs.append("gsm8k_datasets")

    import_block = "\n".join(imports)
    datasets_line = "datasets = " + " + ".join(refs)
    return f"{import_block}\n\n{datasets_line}"


def _execute_opencompass(task: TaskResponse, config_path: str) -> tuple[int, float]:
    python = sys.executable
    run_script = os.path.join(OPENCOMPASS_ROOT, "run.py")

    cmd = [python, run_script, config_path, "-w", task.work_dir, "--max-num-workers", "1"]

    if task.backend == AcceleratorBackend.VLLM:
        cmd.extend(["-a", "vllm"])
    elif task.backend == AcceleratorBackend.LMDEPLOY:
        cmd.extend(["-a", "lmdeploy"])

    env = os.environ.copy()
    env["PYTHONPATH"] = OPENCOMPASS_ROOT + ":" + env.get("PYTHONPATH", "")

    task_store.append_log_lines(task.id, [f"[{_ts()}] CMD: {' '.join(cmd)}"])

    log_dir = Path(task.work_dir) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "run.log"

    start = time.time()
    try:
        with open(log_file, "w") as f:
            proc = subprocess.Popen(
                cmd,
                stdout=f,
                stderr=subprocess.STDOUT,
                env=env,
                cwd=OPENCOMPASS_ROOT,
            )

            while proc.poll() is None:
                time.sleep(5)
                _stream_log_tail(task.id, log_file)
                _collect_live_metrics(task)

            _stream_log_tail(task.id, log_file)

        duration = time.time() - start
        return proc.returncode, duration
    except Exception as e:
        duration = time.time() - start
        task_store.append_log_lines(task.id, [f"[{_ts()}] Process error: {e}"])
        return 1, duration


def _stream_log_tail(task_id: str, log_file: Path, n: int = 10):
    try:
        if not log_file.exists():
            return
        lines = log_file.read_text().strip().split("\n")
        tail = lines[-n:] if len(lines) > n else lines
        task_store.append_log_lines(task_id, tail)
    except Exception:
        pass


def _collect_live_metrics(task: TaskResponse):
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw",
                "--format=csv,noheader,nounits",
                f"--id={0}",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            return
        parts = [p.strip() for p in result.stdout.strip().split(",")]
        if len(parts) >= 5:
            metrics = TaskMetrics(
                gpu_util_pct=float(parts[0]),
                gpu_memory_used_mb=float(parts[1]),
                gpu_memory_total_mb=float(parts[2]),
                temperature_celsius=float(parts[3]),
                power_watts=float(parts[4]) if parts[4] not in ("N/A", "[N/A]") else None,
                timestamp=time.time(),
            )
            task_store.update_task_metrics(task.id, metrics)
    except Exception:
        pass


def _collect_results(task: TaskResponse) -> Optional[TaskResult]:
    work_dir = Path(task.work_dir)

    # opencompass 的结果目录结构: work_dir/<timestamp>/results/<model>/<dataset>.json
    # 也可能直接在 work_dir/results/ 下
    results_dirs = list(work_dir.rglob("results"))
    scores: list[DatasetScore] = []
    raw_summary: dict = {}

    for results_dir in results_dirs:
        for json_file in results_dir.rglob("*.json"):
            try:
                data = json.loads(json_file.read_text())
                if isinstance(data, dict) and "error" not in data:
                    dataset_name = json_file.stem
                    for metric_name, value in data.items():
                        if metric_name in ("details",):
                            continue
                        if isinstance(value, (int, float)):
                            scores.append(
                                DatasetScore(
                                    dataset=dataset_name,
                                    metric=metric_name,
                                    score=float(value),
                                )
                            )
                    raw_summary[dataset_name] = data
            except Exception:
                continue

    for summary_file in work_dir.rglob("summary/*.csv"):
        try:
            raw_summary["_summary_csv"] = summary_file.read_text()
        except Exception:
            pass

    overall = None
    if scores:
        main_scores = [s.score for s in scores if s.metric in ("accuracy", "score", "humaneval_pass@1")]
        if main_scores:
            overall = sum(main_scores) / len(main_scores)

    return TaskResult(
        scores=scores,
        overall_score=overall,
        raw_summary=raw_summary,
        backend_used=task.backend.value,
    )


def _model_abbr(model_path: str) -> str:
    return model_path.replace("/", "-").replace(".", "_").replace(" ", "_")[-50:]


def _ts() -> str:
    return datetime.utcnow().strftime("%H:%M:%S")
