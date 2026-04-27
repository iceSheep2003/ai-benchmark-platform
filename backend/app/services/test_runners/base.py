"""Base class for all test runners and a registry for dispatching."""

from __future__ import annotations

import logging
import subprocess
import time
import threading
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from ...schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult, TestCategory

logger = logging.getLogger("test_runner")


class BaseTestRunner(ABC):
    """Abstract base class that every concrete runner must extend."""

    category: TestCategory  # subclass must set this

    def __init__(self, task_id: str, config: AcceleratorTestCreate, work_dir: str):
        self.task_id = task_id
        self.config = config
        self.work_dir = Path(work_dir)
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.work_dir / "run.log"
        self._log_lines: list[str] = []

    # ---- abstract interface ----

    @abstractmethod
    def run(self) -> AcceleratorTestResult:
        """Execute the test and return structured result.

        This method is called in a background thread.  It should be
        blocking – i.e. do not spawn extra threads internally.
        """
        ...

    # ---- helpers available to subclasses ----

    def log(self, msg: str) -> None:
        ts = datetime.utcnow().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        self._log_lines.append(line)
        logger.info("[%s] %s", self.task_id, msg)
        try:
            with open(self.log_file, "a") as f:
                f.write(line + "\n")
        except Exception:
            pass

    def get_log_lines(self) -> list[str]:
        return list(self._log_lines)

    def run_command(
        self,
        cmd: list[str],
        *,
        cwd: Optional[str] = None,
        env: Optional[dict[str, str]] = None,
        timeout: Optional[int] = None,
        label: str = "command",
    ) -> tuple[int, str, float]:
        """Run a shell command, stream output to log file, return (exit_code, stdout, duration)."""
        import os

        full_env = os.environ.copy()
        if env:
            full_env.update(env)

        self.log(f"RUN [{label}]: {' '.join(cmd)}")
        start = time.time()

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=cwd or str(self.work_dir),
                env=full_env,
                timeout=timeout,
            )
            duration = time.time() - start
            output = proc.stdout + proc.stderr

            # log last 30 lines
            lines = output.strip().split("\n")
            for line in lines[-30:]:
                self.log(f"  | {line}")

            if proc.returncode != 0:
                self.log(f"WARN [{label}] exited with code {proc.returncode}")

            return proc.returncode, output, duration

        except subprocess.TimeoutExpired:
            duration = time.time() - start
            self.log(f"TIMEOUT [{label}] after {duration:.0f}s")
            return -1, f"Timeout after {timeout}s", duration

        except Exception as e:
            duration = time.time() - start
            self.log(f"ERROR [{label}]: {e}")
            return -1, str(e), duration

    def run_command_streaming(
        self,
        cmd: list[str],
        *,
        cwd: Optional[str] = None,
        env: Optional[dict[str, str]] = None,
        label: str = "command",
    ) -> tuple[int, float]:
        """Run a long-running command with output streamed to log file in real time."""
        import os

        full_env = os.environ.copy()
        if env:
            full_env.update(env)

        self.log(f"RUN-STREAM [{label}]: {' '.join(cmd)}")
        start = time.time()

        try:
            with open(self.work_dir / f"{label}.log", "w") as log_f:
                proc = subprocess.Popen(
                    cmd,
                    stdout=log_f,
                    stderr=subprocess.STDOUT,
                    cwd=cwd or str(self.work_dir),
                    env=full_env,
                )

                while proc.poll() is None:
                    time.sleep(5)

            duration = time.time() - start
            self.log(f"DONE [{label}] exit={proc.returncode} in {duration:.1f}s")
            return proc.returncode, duration

        except Exception as e:
            duration = time.time() - start
            self.log(f"ERROR [{label}]: {e}")
            return -1, duration

    def query_gpu_metric(self, gpu_id: int = 0) -> dict[str, Any]:
        """Quick nvidia-smi query for a single GPU."""
        try:
            result = subprocess.run(
                [
                    "nvidia-smi",
                    "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw",
                    "--format=csv,noheader,nounits",
                    f"--id={gpu_id}",
                ],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode != 0:
                return {}
            parts = [p.strip() for p in result.stdout.strip().split(",")]
            if len(parts) >= 5:
                return {
                    "gpu_util_pct": float(parts[0]),
                    "memory_used_mb": float(parts[1]),
                    "memory_total_mb": float(parts[2]),
                    "temperature_c": float(parts[3]),
                    "power_w": float(parts[4]) if parts[4] not in ("N/A", "[N/A]") else None,
                }
        except Exception:
            pass
        return {}


class RunnerRegistry:
    """Maps TestCategory -> concrete runner class."""

    _registry: dict[TestCategory, type[BaseTestRunner]] = {}

    @classmethod
    def register(cls, category: TestCategory):
        def decorator(runner_cls: type[BaseTestRunner]):
            cls._registry[category] = runner_cls
            return runner_cls
        return decorator

    @classmethod
    def get(cls, category: TestCategory) -> type[BaseTestRunner]:
        runner_cls = cls._registry.get(category)
        if runner_cls is None:
            raise ValueError(f"No runner registered for category: {category}")
        return runner_cls

    @classmethod
    def all_categories(cls) -> list[TestCategory]:
        return list(cls._registry.keys())
