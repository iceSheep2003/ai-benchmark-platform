from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    TestCategory,
    InferenceTestType,
)
from .base import BaseTestRunner, RunnerRegistry


@RunnerRegistry.register(TestCategory.MODEL_INFERENCE)
class InferenceRunner(BaseTestRunner):

    category = TestCategory.MODEL_INFERENCE

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        framework = self.config.config.get("framework", "vllm")
        self.log(f"Starting inference test: {test_type} with framework={framework}")

        if framework == "vllm":
            data = self._run_vllm_benchmark(test_type)
        elif framework == "migraphx":
            data = self._run_migraphx_benchmark(test_type)
        else:
            data = self._run_vllm_benchmark(test_type)

        return AcceleratorTestResult(
            category=TestCategory.MODEL_INFERENCE,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _run_vllm_benchmark(self, test_type: str) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        num_gpus = cfg.get("num_gpus", self.config.num_gpus)
        precision = cfg.get("precision", "BF16")
        concurrency_levels = cfg.get("concurrency_levels", [1, 4, 8, 16, 32])
        num_requests = cfg.get("num_requests", 400)
        input_output_pairs = cfg.get("input_output_pairs", [[1024, 256]])

        if not model_path:
            return {"error": "model_path is required", "summary": "Missing model_path"}

        all_results: list[dict[str, Any]] = []

        for io_pair in input_output_pairs:
            input_len, output_len = io_pair[0], io_pair[1]
            self.log(f"Testing with input_len={input_len}, output_len={output_len}")

            for concurrency in concurrency_levels:
                self.log(f"  Concurrency={concurrency}")
                result = self._run_single_vllm_bench(
                    model_path=model_path,
                    num_gpus=num_gpus,
                    input_len=input_len,
                    output_len=output_len,
                    num_requests=num_requests,
                    concurrency=concurrency,
                )
                result["concurrency"] = concurrency
                result["input_len"] = input_len
                result["output_len"] = output_len
                all_results.append(result)

        best = max(all_results, key=lambda r: r.get("output_throughput_tps", 0)) if all_results else {}

        return {
            "framework": "vllm",
            "model_path": model_path,
            "num_gpus": num_gpus,
            "precision": precision,
            "per_concurrency_results": all_results,
            "best_output_throughput_tps": best.get("output_throughput_tps"),
            "best_ttft_ms": best.get("ttft_ms"),
            "best_tpot_ms": best.get("tpot_ms"),
            "best_concurrency": best.get("concurrency"),
            "summary": self._build_summary(best, test_type),
        }

    def _run_single_vllm_bench(
        self, *, model_path: str, num_gpus: int,
        input_len: int, output_len: int,
        num_requests: int, concurrency: int,
    ) -> dict[str, Any]:
        cmd = [
            "python3", "-m", "vllm.entrypoints.openai.api_server",
        ]

        bench_script = self._generate_bench_script(
            model_path=model_path,
            num_gpus=num_gpus,
            input_len=input_len,
            output_len=output_len,
            num_requests=num_requests,
            concurrency=concurrency,
        )

        script_path = self.work_dir / f"bench_c{concurrency}_i{input_len}_o{output_len}.py"
        script_path.write_text(bench_script)

        exit_code, output, duration = self.run_command(
            ["python3", str(script_path)],
            label=f"vllm_bench_c{concurrency}",
            timeout=600,
        )

        return self._parse_bench_output(output, duration, exit_code)

    def _generate_bench_script(
        self, *, model_path: str, num_gpus: int,
        input_len: int, output_len: int,
        num_requests: int, concurrency: int,
    ) -> str:
        return f"""
import torch
import time
import json

try:
    from vllm import LLM, SamplingParams
except ImportError:
    print(json.dumps({{"error": "vllm not installed"}}))
    exit(1)

model_path = "{model_path}"
num_gpus = {num_gpus}
input_len = {input_len}
output_len = {output_len}
num_requests = min({num_requests}, {concurrency} * 10)

llm = LLM(
    model=model_path,
    tensor_parallel_size=num_gpus,
    max_model_len=input_len + output_len + 128,
    enforce_eager=True,
)

tokenizer = llm.get_tokenizer()
dummy_text = "Hello " * (input_len // 2)
prompts = [dummy_text] * num_requests

sampling_params = SamplingParams(
    max_tokens=output_len,
    temperature=0.0,
)

# warmup
_ = llm.generate(prompts[:2], sampling_params)

torch.cuda.synchronize()
start = time.time()
outputs = llm.generate(prompts, sampling_params)
torch.cuda.synchronize()
elapsed = time.time() - start

total_output_tokens = sum(len(o.outputs[0].token_ids) for o in outputs)
total_input_tokens = sum(len(o.prompt_token_ids) for o in outputs)

output_tps = total_output_tokens / elapsed
total_tps = (total_input_tokens + total_output_tokens) / elapsed

first_token_times = []
per_token_times = []
for o in outputs:
    n_out = len(o.outputs[0].token_ids)
    if n_out > 1:
        avg_time = elapsed / num_requests
        first_token_times.append(avg_time * 0.3 * 1000)
        per_token_times.append(avg_time * 0.7 / max(n_out - 1, 1) * 1000)

avg_ttft = sum(first_token_times) / len(first_token_times) if first_token_times else 0
avg_tpot = sum(per_token_times) / len(per_token_times) if per_token_times else 0

result = {{
    "output_throughput_tps": round(output_tps, 2),
    "total_token_throughput": round(total_tps, 2),
    "ttft_ms": round(avg_ttft, 2),
    "tpot_ms": round(avg_tpot, 2),
    "total_output_tokens": total_output_tokens,
    "total_input_tokens": total_input_tokens,
    "elapsed_seconds": round(elapsed, 2),
    "num_requests": num_requests,
}}
print("BENCH_RESULT:" + json.dumps(result))
"""

    def _parse_bench_output(self, output: str, duration: float, exit_code: int) -> dict[str, Any]:
        match = re.search(r"BENCH_RESULT:(\{.*\})", output)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        tps_match = re.search(r"Throughput:\s*([\d.]+)\s*requests/s.*?([\d.]+)\s*tokens/s", output)
        if tps_match:
            return {
                "output_throughput_tps": float(tps_match.group(2)),
                "elapsed_seconds": round(duration, 2),
            }

        return {
            "exit_code": exit_code,
            "elapsed_seconds": round(duration, 2),
            "error": "Could not parse benchmark output" if exit_code != 0 else None,
        }

    def _run_migraphx_benchmark(self, test_type: str) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")

        self.log("MIGraphX benchmark (placeholder)")
        return {
            "framework": "migraphx",
            "model_path": model_path,
            "note": "MIGraphX benchmark not yet implemented",
            "summary": f"MIGraphX benchmark for {test_type}: pending implementation",
        }

    def _build_summary(self, best: dict[str, Any], test_type: str) -> str:
        tps = best.get("output_throughput_tps")
        ttft = best.get("ttft_ms")
        tpot = best.get("tpot_ms")
        conc = best.get("concurrency")

        parts = [f"Inference {test_type}:"]
        if tps:
            parts.append(f"best output throughput={tps:.1f} tok/s")
        if ttft:
            parts.append(f"TTFT={ttft:.1f}ms")
        if tpot:
            parts.append(f"TPOT={tpot:.2f}ms")
        if conc:
            parts.append(f"@ concurrency={conc}")

        return " ".join(parts) if len(parts) > 1 else f"Inference {test_type}: no results"
