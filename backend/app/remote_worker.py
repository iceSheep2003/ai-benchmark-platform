"""
Run on the SSH target machine (repo root = cwd).

  cd /path/to/demo && python3 -m backend.app.remote_worker test-case /path/to/request.json

Request JSON:
  { "task_id": "...", "request": { ... AcceleratorTestCreate fields without execution ... } }
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from .schemas.test_case import AcceleratorTestCreate, AcceleratorTestResult
from .services.test_runners.base import RunnerRegistry

# Register runners (same as router)
from .services.test_runners import chip_basic_runner  # noqa: F401
from .services.test_runners import training_runner  # noqa: F401
from .services.test_runners import inference_runner  # noqa: F401
from .services.test_runners import accuracy_runner  # noqa: F401
from .services.test_runners import ecosystem_runner  # noqa: F401
from .services.test_runners import video_codec_runner  # noqa: F401


def _run_test_case(request_path: Path) -> int:
    data = json.loads(request_path.read_text(encoding="utf-8"))
    task_id = data["task_id"]
    response_path = request_path.parent / f"{task_id}.response.json"
    req_raw = data["request"]
    req = AcceleratorTestCreate.model_validate(req_raw)

    project_root = Path.cwd()
    work_dir = (project_root / "outputs" / "tests" / task_id).as_posix()

    try:
        runner_cls = RunnerRegistry.get(req.category)
    except ValueError as e:
        _write_response(
            response_path,
            ok=False,
            error=str(e),
            logs=[],
            result=None,
        )
        return 1

    runner = runner_cls(
        task_id=task_id,
        config=req,
        work_dir=work_dir,
    )
    logs: list[str] = []
    try:
        result: AcceleratorTestResult = runner.run()
        for line in runner.get_log_lines():
            logs.append(line)
        _write_response(
            response_path,
            ok=True,
            error=None,
            logs=logs,
            result={
                "category": result.category.value,
                "test_type": result.test_type,
                "data": result.data,
                "summary": result.summary,
            },
        )
        return 0
    except Exception as e:
        for line in runner.get_log_lines():
            logs.append(line)
        _write_response(
            response_path,
            ok=False,
            error=str(e),
            logs=logs,
            result=None,
        )
        return 1


def _write_response(
    response_path: Path,
    *,
    ok: bool,
    error: str | None,
    logs: list[str],
    result: dict | None,
) -> None:
    payload = {"ok": ok, "error": error, "logs": logs, "result": result}
    response_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] != "test-case":
        print("Usage: python -m backend.app.remote_worker test-case /path/to/request.json", file=sys.stderr)
        return 2
    path = Path(argv[2]).expanduser()
    if not path.is_file():
        print(f"Missing file: {path}", file=sys.stderr)
        return 2
    return _run_test_case(path)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
