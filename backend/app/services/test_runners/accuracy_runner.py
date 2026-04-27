from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    TestCategory,
)
from .base import BaseTestRunner, RunnerRegistry


OPENCOMPASS_ROOT = os.environ.get(
    "OPENCOMPASS_ROOT",
    str(Path(__file__).resolve().parents[4] / "opencompass"),
)


@RunnerRegistry.register(TestCategory.MODEL_ACCURACY)
class AccuracyRunner(BaseTestRunner):

    category = TestCategory.MODEL_ACCURACY

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        framework = self.config.config.get("framework", "opencompass")
        self.log(f"Starting accuracy test: {test_type} with framework={framework}")

        if framework == "opencompass":
            data = self._run_opencompass()
        elif framework == "evalscope":
            data = self._run_evalscope()
        else:
            data = self._run_opencompass()

        return AcceleratorTestResult(
            category=TestCategory.MODEL_ACCURACY,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _run_opencompass(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        datasets = cfg.get("datasets", ["gsm8k", "mmlu"])
        num_gpus = cfg.get("num_gpus", 8)
        inference_backend = cfg.get("inference_backend", "vllm")

        if not model_path:
            return {"error": "model_path is required", "summary": "Missing model_path"}

        config_content = self._generate_opencompass_config(
            model_path=model_path,
            datasets=datasets,
            num_gpus=num_gpus,
            backend=inference_backend,
        )

        config_path = self.work_dir / "opencompass_config.py"
        config_path.write_text(config_content)

        oc_work_dir = self.work_dir / "opencompass_output"
        oc_work_dir.mkdir(parents=True, exist_ok=True)

        run_script = os.path.join(OPENCOMPASS_ROOT, "run.py")
        cmd = [
            sys.executable, run_script,
            str(config_path),
            "-w", str(oc_work_dir),
            "--max-num-workers", "1",
        ]

        env = {"PYTHONPATH": OPENCOMPASS_ROOT + ":" + os.environ.get("PYTHONPATH", "")}

        exit_code, duration = self.run_command_streaming(
            cmd, env=env, cwd=OPENCOMPASS_ROOT, label="opencompass_eval"
        )

        scores = self._collect_opencompass_results(oc_work_dir)

        return {
            "framework": "opencompass",
            "model_path": model_path,
            "datasets": datasets,
            "num_gpus": num_gpus,
            "inference_backend": inference_backend,
            "exit_code": exit_code,
            "total_time_seconds": round(duration, 1),
            "dataset_scores": scores,
            "overall_score": round(sum(scores.values()) / len(scores), 2) if scores else None,
            "summary": self._build_summary(scores, "OpenCompass"),
        }

    def _run_evalscope(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        datasets = cfg.get("datasets", ["gsm8k", "mmlu"])
        num_gpus = cfg.get("num_gpus", 8)

        if not model_path:
            return {"error": "model_path is required", "summary": "Missing model_path"}

        cmd = [
            sys.executable, "-m", "evalscope.run",
            "--model", model_path,
            "--datasets", *datasets,
            "--work-dir", str(self.work_dir / "evalscope_output"),
        ]

        exit_code, output, duration = self.run_command(
            cmd, label="evalscope_eval", timeout=7200,
        )

        scores = self._parse_evalscope_output(output)

        return {
            "framework": "evalscope",
            "model_path": model_path,
            "datasets": datasets,
            "num_gpus": num_gpus,
            "exit_code": exit_code,
            "total_time_seconds": round(duration, 1),
            "dataset_scores": scores,
            "overall_score": round(sum(scores.values()) / len(scores), 2) if scores else None,
            "summary": self._build_summary(scores, "EvalScope"),
        }

    def _generate_opencompass_config(
        self, *, model_path: str, datasets: list[str],
        num_gpus: int, backend: str,
    ) -> str:
        dataset_map = {
            "gsm8k": ("opencompass.configs.datasets.gsm8k.gsm8k_gen", "gsm8k_datasets"),
            "mmlu": ("opencompass.configs.datasets.mmlu.mmlu_gen", "mmlu_datasets"),
            "ceval": ("opencompass.configs.datasets.ceval.ceval_gen", "ceval_datasets"),
            "humaneval": ("opencompass.configs.datasets.humaneval.humaneval_gen", "humaneval_datasets"),
        }

        imports = []
        refs = []
        for ds in datasets:
            key = ds.lower().replace("-", "_")
            if key in dataset_map:
                mod, var = dataset_map[key]
                imports.append(f"from {mod} import {var}")
                refs.append(var)

        if not refs:
            imports.append("from opencompass.configs.datasets.gsm8k.gsm8k_gen import gsm8k_datasets")
            refs.append("gsm8k_datasets")

        import_block = "\n".join(imports)
        datasets_line = "datasets = " + " + ".join(refs)

        abbr = model_path.replace("/", "-").replace(".", "_")[-50:]

        if backend == "vllm":
            model_block = f"""
from opencompass.models import VLLMwithChatTemplate
models = [dict(
    type=VLLMwithChatTemplate,
    abbr='{abbr}-vllm',
    path='{model_path}',
    max_out_len=2048,
    batch_size=16,
    model_kwargs=dict(tensor_parallel_size={num_gpus}),
    run_cfg=dict(num_gpus={num_gpus}),
)]
"""
        else:
            model_block = f"""
from opencompass.models import HuggingFacewithChatTemplate
models = [dict(
    type=HuggingFacewithChatTemplate,
    abbr='{abbr}-hf',
    path='{model_path}',
    max_out_len=2048,
    batch_size=8,
    run_cfg=dict(num_gpus={num_gpus}),
)]
"""

        return f"""{import_block}

{datasets_line}

{model_block}

work_dir = '{self.work_dir / "opencompass_output"}'
"""

    def _collect_opencompass_results(self, work_dir: Path) -> dict[str, float]:
        scores: dict[str, float] = {}
        for results_dir in work_dir.rglob("results"):
            for json_file in results_dir.rglob("*.json"):
                try:
                    data = json.loads(json_file.read_text())
                    if isinstance(data, dict):
                        name = json_file.stem
                        for k, v in data.items():
                            if k != "details" and isinstance(v, (int, float)):
                                scores[f"{name}/{k}"] = round(float(v), 2)
                except Exception:
                    continue
        return scores

    def _parse_evalscope_output(self, output: str) -> dict[str, float]:
        scores: dict[str, float] = {}
        for match in re.finditer(r"(\w+)\s*:\s*([\d.]+)", output):
            key, value = match.group(1), match.group(2)
            try:
                scores[key] = round(float(value), 2)
            except ValueError:
                pass
        return scores

    def _build_summary(self, scores: dict[str, float], framework: str) -> str:
        if not scores:
            return f"{framework} accuracy test completed but no scores parsed"
        top_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:5]
        details = ", ".join(f"{k}={v}" for k, v in top_scores)
        avg = sum(scores.values()) / len(scores)
        return f"{framework} accuracy: avg={avg:.2f} ({details})"
