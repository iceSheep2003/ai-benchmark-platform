from __future__ import annotations

import json
import re
import time
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    ChipBasicTestType,
    TestCategory,
)
from .base import BaseTestRunner, RunnerRegistry


@RunnerRegistry.register(TestCategory.CHIP_BASIC)
class ChipBasicRunner(BaseTestRunner):

    category = TestCategory.CHIP_BASIC

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        self.log(f"Starting chip basic test: {test_type}")

        handlers = {
            ChipBasicTestType.INTER_CHIP_BANDWIDTH.value: self._test_inter_chip_bandwidth,
            ChipBasicTestType.MEMORY_BANDWIDTH.value: self._test_memory_bandwidth,
            ChipBasicTestType.COMPUTE_POWER.value: self._test_compute_power,
            ChipBasicTestType.POWER_CONSUMPTION.value: self._test_power_consumption,
            ChipBasicTestType.STABILITY.value: self._test_stability,
        }

        handler = handlers.get(test_type, self._test_unknown)
        data = handler()

        return AcceleratorTestResult(
            category=TestCategory.CHIP_BASIC,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _test_inter_chip_bandwidth(self) -> dict[str, Any]:
        self.log("Running p2pBandwidthLatencyTest for inter-chip bandwidth")

        exit_code, output, duration = self.run_command(
            ["p2pBandwidthLatencyTest"],
            label="p2p_bandwidth",
            timeout=300,
        )

        if exit_code != 0:
            self.log("p2pBandwidthLatencyTest not found, falling back to nvidia-smi nvlink")
            exit_code, output, duration = self.run_command(
                ["nvidia-smi", "nvlink", "-s"],
                label="nvlink_status",
                timeout=60,
            )
            return {
                "method": "nvidia-smi nvlink",
                "raw_output": output[:5000],
                "duration_seconds": duration,
                "summary": f"NVLink status collected in {duration:.1f}s",
            }

        bw_values = re.findall(r"Bidirectional.*?:\s*([\d.]+)\s*GB/s", output)
        per_gpu = [float(v) for v in bw_values]
        avg_bw = sum(per_gpu) / len(per_gpu) if per_gpu else 0.0

        return {
            "method": "p2pBandwidthLatencyTest",
            "avg_bidirectional_bandwidth_gbps": round(avg_bw, 2),
            "per_gpu_bandwidth_gbps": per_gpu,
            "duration_seconds": round(duration, 1),
            "summary": f"Avg bidirectional bandwidth: {avg_bw:.2f} GB/s across {len(per_gpu)} pairs",
        }

    def _test_memory_bandwidth(self) -> dict[str, Any]:
        self.log("Running bandwidthTest for memory bandwidth")

        exit_code, output, duration = self.run_command(
            ["bandwidthTest", "--memory=pinned", "--mode=shmoo", "--device=all"],
            label="bandwidth_test",
            timeout=300,
        )

        if exit_code != 0:
            self.log("bandwidthTest not found, falling back to nvidia-smi query")
            exit_code, output, _ = self.run_command(
                [
                    "nvidia-smi",
                    "--query-gpu=index,memory.total,memory.used,memory.free",
                    "--format=csv,noheader",
                ],
                label="memory_query",
                timeout=30,
            )
            return {
                "method": "nvidia-smi query (fallback)",
                "raw_output": output[:3000],
                "summary": "Memory info collected via nvidia-smi (bandwidthTest not available)",
            }

        bw_values = re.findall(r"Bandwidth\s*=\s*([\d.]+)\s*GB/s", output)
        per_gpu = [float(v) for v in bw_values]

        return {
            "method": "bandwidthTest",
            "per_gpu_bandwidth_gbps": per_gpu,
            "duration_seconds": round(duration, 1),
            "summary": f"Memory bandwidth measured for {len(per_gpu)} data points",
        }

    def _test_compute_power(self) -> dict[str, Any]:
        self.log("Running GEMM benchmark for compute power")

        precisions = ["FP64", "FP32", "TF32", "BF16", "FP16", "INT8"]
        results: dict[str, Any] = {}

        for prec in precisions:
            self.log(f"Testing {prec} compute power")
            exit_code, output, dur = self.run_command(
                ["python3", "-c", self._gemm_script(prec)],
                label=f"gemm_{prec.lower()}",
                timeout=120,
            )
            if exit_code == 0:
                match = re.search(r"RESULT:\s*([\d.]+)", output)
                if match:
                    value = float(match.group(1))
                    key = f"{prec.lower()}_{'tflops' if prec != 'INT8' else 'tops'}"
                    results[key] = round(value, 2)

        return {
            "method": "PyTorch GEMM benchmark",
            **results,
            "summary": f"Compute power measured for {len(results)} precisions",
        }

    def _gemm_script(self, precision: str) -> str:
        dtype_map = {
            "FP64": "torch.float64",
            "FP32": "torch.float32",
            "TF32": "torch.float32",
            "BF16": "torch.bfloat16",
            "FP16": "torch.float16",
            "INT8": "torch.int8",
        }
        dtype = dtype_map.get(precision, "torch.float32")
        m, n, k = 4096, 4096, 4096
        warmup, iters = 10, 100

        script = f"""
import torch, time
torch.backends.cuda.matmul.allow_tf32 = {'True' if precision == 'TF32' else 'False'}
device = 'cuda'
dtype = {dtype}
m, n, k = {m}, {n}, {k}
if dtype == torch.int8:
    a = torch.randint(-128, 127, (m, k), dtype=dtype, device=device)
    b = torch.randint(-128, 127, (k, n), dtype=dtype, device=device)
else:
    a = torch.randn(m, k, dtype=dtype, device=device)
    b = torch.randn(k, n, dtype=dtype, device=device)

for _ in range({warmup}):
    if dtype == torch.int8:
        torch._int_mm(a, b)
    else:
        torch.mm(a, b)
torch.cuda.synchronize()

start = time.time()
for _ in range({iters}):
    if dtype == torch.int8:
        torch._int_mm(a, b)
    else:
        torch.mm(a, b)
torch.cuda.synchronize()
elapsed = time.time() - start

ops = 2 * m * n * k * {iters}
tflops = ops / elapsed / 1e12
print(f"RESULT: {{tflops:.2f}}")
"""
        return script

    def _test_power_consumption(self) -> dict[str, Any]:
        duration_minutes = self.config.config.get("duration_minutes", 10)
        self.log(f"Monitoring GPU power for {duration_minutes} minutes under stress")

        import subprocess as sp
        stress_proc = sp.Popen(
            ["python3", "-c", self._stress_script()],
            stdout=sp.DEVNULL, stderr=sp.DEVNULL,
        )

        power_readings: list[float] = []
        try:
            end_time = time.time() + duration_minutes * 60
            while time.time() < end_time:
                time.sleep(10)
                metrics = self.query_gpu_metric(0)
                if metrics.get("power_w") is not None:
                    power_readings.append(metrics["power_w"])
                    self.log(f"  Power: {metrics['power_w']}W, Temp: {metrics.get('temperature_c')}C")
        finally:
            stress_proc.terminate()
            stress_proc.wait(timeout=10)

        avg_power = sum(power_readings) / len(power_readings) if power_readings else 0
        max_power = max(power_readings) if power_readings else 0

        return {
            "avg_power_watts": round(avg_power, 1),
            "max_power_watts": round(max_power, 1),
            "duration_minutes": duration_minutes,
            "num_samples": len(power_readings),
            "summary": f"Avg power: {avg_power:.1f}W, Max: {max_power:.1f}W over {duration_minutes}min",
        }

    def _stress_script(self) -> str:
        return """
import torch, time
device = 'cuda'
a = torch.randn(8192, 8192, dtype=torch.float16, device=device)
b = torch.randn(8192, 8192, dtype=torch.float16, device=device)
while True:
    torch.mm(a, b)
    torch.cuda.synchronize()
"""

    def _test_stability(self) -> dict[str, Any]:
        stress_hours = self.config.config.get("stress_hours", 48)
        self.log(f"Starting stability test: gpu-burn for {stress_hours} hours")

        exit_code, output, duration = self.run_command(
            ["gpu-burn", str(stress_hours * 3600)],
            label="gpu_burn",
            timeout=int(stress_hours * 3600 + 600),
        )

        if exit_code != 0:
            self.log("gpu-burn not available, running PyTorch stress test instead")
            exit_code, output, duration = self.run_command(
                ["python3", "-c", self._stress_script_with_check(min(stress_hours * 3600, 600))],
                label="pytorch_stress",
                timeout=int(stress_hours * 3600 + 600),
            )

        passed = exit_code == 0
        errors = []
        if not passed:
            errors.append(f"Test exited with code {exit_code}")

        return {
            "passed": passed,
            "duration_hours": round(duration / 3600, 2),
            "errors": errors,
            "summary": f"Stability test {'PASSED' if passed else 'FAILED'} after {duration/3600:.1f}h",
        }

    def _stress_script_with_check(self, duration_seconds: int) -> str:
        return f"""
import torch, time, sys

device = 'cuda'
a = torch.randn(4096, 4096, dtype=torch.float32, device=device)
b = torch.randn(4096, 4096, dtype=torch.float32, device=device)
ref = torch.mm(a, b)

end = time.time() + {duration_seconds}
iteration = 0
while time.time() < end:
    result = torch.mm(a, b)
    if not torch.allclose(result, ref, rtol=1e-3, atol=1e-3):
        print(f"MISMATCH at iteration {{iteration}}", file=sys.stderr)
        sys.exit(1)
    iteration += 1
    if iteration % 1000 == 0:
        print(f"Iteration {{iteration}} OK")

print(f"Completed {{iteration}} iterations successfully")
"""

    def _test_unknown(self) -> dict[str, Any]:
        return {
            "error": f"Unknown chip basic test type: {self.config.config.get('test_type')}",
            "summary": "Unknown test type",
        }
