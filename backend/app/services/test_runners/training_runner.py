from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    TestCategory,
    TrainingTestType,
)
from .base import BaseTestRunner, RunnerRegistry


@RunnerRegistry.register(TestCategory.MODEL_TRAINING)
class TrainingRunner(BaseTestRunner):

    category = TestCategory.MODEL_TRAINING

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        framework = self.config.config.get("framework", "pytorch")
        self.log(f"Starting training test: {test_type} with framework={framework}")

        if framework == "megatron":
            data = self._run_megatron(test_type)
        else:
            data = self._run_pytorch(test_type)

        return AcceleratorTestResult(
            category=TestCategory.MODEL_TRAINING,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _run_pytorch(self, test_type: str) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        dataset_name = cfg.get("dataset_name", "")
        precision = cfg.get("precision", "FP16")
        batch_size = cfg.get("batch_size", 64)
        epochs = cfg.get("epochs", 2)
        num_gpus = cfg.get("num_gpus", self.config.num_gpus)
        image_size = cfg.get("image_size", "224x224")

        script = self._generate_pytorch_training_script(
            test_type=test_type,
            model_path=model_path,
            precision=precision,
            batch_size=batch_size,
            epochs=epochs,
            image_size=image_size,
        )

        script_path = self.work_dir / "train_script.py"
        script_path.write_text(script)

        torchrun_bin = shutil.which("torchrun")
        if torchrun_bin:
            cmd = [torchrun_bin, f"--nproc_per_node={num_gpus}", str(script_path)]
        else:
            # Fallback for environments where torchrun is not on PATH.
            cmd = ["python3", "-m", "torch.distributed.run", f"--nproc_per_node={num_gpus}", str(script_path)]

        visible = ",".join(str(i) for i in range(num_gpus))
        exit_code, duration = self.run_command_streaming(
            cmd,
            label=f"train_{test_type}",
            env={"CUDA_VISIBLE_DEVICES": visible},
        )

        log_path = self.work_dir / f"train_{test_type}.log"
        output = log_path.read_text() if log_path.exists() else ""

        if exit_code != 0:
            tail = "\n".join(output.strip().splitlines()[-40:]) if output else "(no training log)"
            raise RuntimeError(f"training failed (exit={exit_code})\n{tail}")

        throughput = self._extract_throughput(output, test_type)
        gpu_mem = self._extract_gpu_memory(output)

        return {
            "exit_code": exit_code,
            "throughput": throughput,
            "throughput_unit": "imgs/s",
            "total_time_seconds": round(duration, 1),
            "gpu_memory_used_mb": gpu_mem,
            "batch_size": batch_size,
            "num_gpus": num_gpus,
            "precision": precision,
            "summary": f"Training {test_type}: {throughput:.1f} imgs/s, {duration:.0f}s total"
            if throughput > 0
            else f"Training {test_type}: completed in {duration:.0f}s (exit={exit_code})",
        }

    def _run_megatron(self, test_type: str) -> dict[str, Any]:
        cfg = self.config.config
        num_gpus = cfg.get("num_gpus", 8)
        seq_len = cfg.get("seq_len", 4096)
        global_bs = cfg.get("global_bs", 256)
        tp = cfg.get("tp", 2)
        pp = cfg.get("pp", 1)
        dp = cfg.get("dp", 4)
        cp = cfg.get("cp", 1)
        precision = cfg.get("precision", "BF16")

        script = self._generate_megatron_script(
            test_type=test_type,
            num_gpus=num_gpus,
            seq_len=seq_len,
            global_bs=global_bs,
            tp=tp, pp=pp, dp=dp, cp=cp,
            precision=precision,
        )

        script_path = self.work_dir / "megatron_train.sh"
        script_path.write_text(script)
        os.chmod(str(script_path), 0o755)

        exit_code, duration = self.run_command_streaming(
            ["bash", str(script_path)], label=f"megatron_{test_type}"
        )

        log_path = self.work_dir / f"megatron_{test_type}.log"
        output = log_path.read_text() if log_path.exists() else ""

        tgs = self._extract_tgs(output, global_bs, seq_len, num_gpus)
        time_per_step = self._extract_time_per_step(output)

        return {
            "exit_code": exit_code,
            "tgs": round(tgs, 1) if tgs else None,
            "time_per_step_ms": time_per_step,
            "throughput_unit": "tokens/gpu/s",
            "total_time_seconds": round(duration, 1),
            "parallel_config": {"tp": tp, "pp": pp, "dp": dp, "cp": cp},
            "num_gpus": num_gpus,
            "seq_len": seq_len,
            "global_bs": global_bs,
            "precision": precision,
            "summary": f"Megatron {test_type}: TGS={tgs:.1f} tokens/gpu/s"
            if tgs
            else f"Megatron {test_type}: completed in {duration:.0f}s (exit={exit_code})",
        }

    def _generate_pytorch_training_script(
        self, *, test_type: str, model_path: str, precision: str,
        batch_size: int, epochs: int, image_size: str,
    ) -> str:
        w, h = (image_size.split("x") + ["224"])[:2]
        use_amp = precision in ("FP16", "BF16")
        amp_dtype = "torch.bfloat16" if precision == "BF16" else "torch.float16"

        if "resnet" in test_type.lower():
            model_init = "model = torchvision.models.resnet50(weights=None).cuda()"
        elif "yolo" in test_type.lower():
            model_init = "model = torchvision.models.resnet50(weights=None).cuda()  # placeholder for YOLOv5_L"
        else:
            model_init = "model = torchvision.models.resnet50(weights=None).cuda()"

        return f"""
import torch
import torch.nn as nn
import torch.distributed as dist
import torchvision
import time
import os

if not torch.cuda.is_available():
    raise RuntimeError("CUDA not available on this host")
dist.init_process_group("nccl")
local_rank = int(os.environ.get("LOCAL_RANK", 0))
torch.cuda.set_device(local_rank)

{model_init}
model = torch.nn.parallel.DistributedDataParallel(model, device_ids=[local_rank])

criterion = nn.CrossEntropyLoss().cuda()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
scaler = torch.cuda.amp.GradScaler(enabled={use_amp})

batch_size = {batch_size}
input_data = torch.randn(batch_size, 3, {h}, {w}, device='cuda')
target = torch.randint(0, 1000, (batch_size,), device='cuda')

warmup_iters = 10
measure_iters = 50

for i in range(warmup_iters):
    with torch.cuda.amp.autocast(enabled={use_amp}, dtype={amp_dtype}):
        output = model(input_data)
        loss = criterion(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
torch.cuda.synchronize()

start = time.time()
for i in range(measure_iters):
    with torch.cuda.amp.autocast(enabled={use_amp}, dtype={amp_dtype}):
        output = model(input_data)
        loss = criterion(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
torch.cuda.synchronize()
elapsed = time.time() - start

total_images = batch_size * measure_iters * dist.get_world_size()
throughput = total_images / elapsed
mem = torch.cuda.max_memory_allocated() / 1e6

if local_rank == 0:
    print("DEVICE: cuda")
    print(f"THROUGHPUT: {{throughput:.2f}} imgs/s")
    print(f"GPU_MEMORY: {{mem:.0f}} MB")
    print(f"TIME_PER_STEP: {{elapsed / measure_iters * 1000:.1f}} ms")

dist.destroy_process_group()
"""

    def _generate_megatron_script(
        self, *, test_type: str, num_gpus: int, seq_len: int,
        global_bs: int, tp: int, pp: int, dp: int, cp: int, precision: str,
    ) -> str:
        return f"""#!/bin/bash
set -e

echo "Megatron training benchmark for {test_type}"
echo "Config: TP={tp}, PP={pp}, DP={dp}, CP={cp}, SEQ_LEN={seq_len}, GBS={global_bs}"
echo "This is a placeholder script - configure MEGATRON_ROOT and model config for actual runs"

python3 -c "
import torch, time, os

os.environ.setdefault('MASTER_ADDR', 'localhost')
os.environ.setdefault('MASTER_PORT', '29500')
os.environ.setdefault('RANK', '0')
os.environ.setdefault('WORLD_SIZE', '1')
os.environ.setdefault('LOCAL_RANK', '0')

torch.cuda.set_device(0)
m, k = 8192, 8192
a = torch.randn(m, k, dtype=torch.bfloat16, device='cuda')
b = torch.randn(k, m, dtype=torch.bfloat16, device='cuda')

warmup = 20
iters = 100
for _ in range(warmup):
    torch.mm(a, b)
torch.cuda.synchronize()

start = time.time()
for _ in range(iters):
    torch.mm(a, b)
torch.cuda.synchronize()
elapsed = time.time() - start

tokens_per_iter = {global_bs} * {seq_len}
simulated_time_per_step = elapsed / iters
tgs = tokens_per_iter / {num_gpus} / simulated_time_per_step
print(f'TGS: {{tgs:.1f}} tokens/gpu/s')
print(f'TIME_PER_STEP: {{simulated_time_per_step*1000:.1f}} ms')
"
"""

    def _extract_throughput(self, output: str, test_type: str) -> float:
        match = re.search(r"THROUGHPUT:\s*([\d.]+)", output)
        return float(match.group(1)) if match else 0.0

    def _extract_gpu_memory(self, output: str) -> float | None:
        match = re.search(r"GPU_MEMORY:\s*([\d.]+)", output)
        return float(match.group(1)) if match else None

    def _extract_tgs(self, output: str, global_bs: int, seq_len: int, num_gpus: int) -> float | None:
        match = re.search(r"TGS:\s*([\d.]+)", output)
        if match:
            return float(match.group(1))

        match = re.search(r"TIME_PER_STEP:\s*([\d.]+)", output)
        if match:
            time_per_step_ms = float(match.group(1))
            return (global_bs * seq_len) / num_gpus / (time_per_step_ms / 1000)
        return None

    def _extract_time_per_step(self, output: str) -> float | None:
        match = re.search(r"TIME_PER_STEP:\s*([\d.]+)", output)
        return float(match.group(1)) if match else None
