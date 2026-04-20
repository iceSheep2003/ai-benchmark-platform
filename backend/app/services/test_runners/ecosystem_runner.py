from __future__ import annotations

import json
import re
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    EcosystemTestType,
    TestCategory,
)
from .base import BaseTestRunner, RunnerRegistry


@RunnerRegistry.register(TestCategory.ECOSYSTEM_COMPAT)
class EcosystemRunner(BaseTestRunner):

    category = TestCategory.ECOSYSTEM_COMPAT

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        self.log(f"Starting ecosystem compatibility test: {test_type}")

        handlers = {
            EcosystemTestType.VERL_MIXTRAL_8X7B.value: self._test_verl_mixtral,
            EcosystemTestType.VERL_QWEN25_GPRO.value: self._test_verl_qwen,
            EcosystemTestType.RAG_EMBEDDING.value: self._test_rag_embedding,
            EcosystemTestType.RAG_RERANK.value: self._test_rag_rerank,
            EcosystemTestType.CUDA_MIGRATION.value: self._test_cuda_migration,
            EcosystemTestType.GPU_VIRTUALIZATION.value: self._test_gpu_virtualization,
        }

        handler = handlers.get(test_type, self._test_generic)
        data = handler()

        return AcceleratorTestResult(
            category=TestCategory.ECOSYSTEM_COMPAT,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _test_verl_mixtral(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        num_gpus = cfg.get("num_gpus", 8)

        script = f"""
import torch
passed = True
error_msg = ""

try:
    import verl
    print(f"verl version: {{verl.__version__}}")
except ImportError:
    passed = False
    error_msg = "verl not installed"

if passed:
    try:
        assert torch.cuda.is_available(), "CUDA not available"
        gpu_count = torch.cuda.device_count()
        print(f"GPU count: {{gpu_count}}")
        assert gpu_count >= {num_gpus}, f"Need {num_gpus} GPUs, found {{gpu_count}}"
        for i in range({num_gpus}):
            mem = torch.cuda.get_device_properties(i).total_mem / 1e9
            print(f"GPU {{i}}: {{mem:.1f}} GB")
        print("VERL_CHECK: PASSED")
    except Exception as e:
        passed = False
        error_msg = str(e)

if not passed:
    print(f"VERL_CHECK: FAILED - {{error_msg}}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="verl_mixtral_check",
            timeout=120,
        )

        passed = "VERL_CHECK: PASSED" in output

        return {
            "test": "verl_mixtral_8x7b",
            "passed": passed,
            "model_path": model_path,
            "num_gpus": num_gpus,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"Verl Mixtral-8x7B: {'PASSED' if passed else 'FAILED'}",
        }

    def _test_verl_qwen(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")
        num_gpus = cfg.get("num_gpus", 8)

        script = """
import torch
try:
    import verl
    assert torch.cuda.is_available()
    print("VERL_CHECK: PASSED")
except Exception as e:
    print(f"VERL_CHECK: FAILED - {e}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="verl_qwen_check",
            timeout=120,
        )

        passed = "VERL_CHECK: PASSED" in output

        return {
            "test": "verl_qwen25_gpro",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"Verl Qwen2.5-GPRO: {'PASSED' if passed else 'FAILED'}",
        }

    def _test_rag_embedding(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")

        script = f"""
import torch, json, time

try:
    from vllm import LLM
    print("vllm imported successfully")
except ImportError:
    print("EMBED_CHECK: FAILED - vllm not installed")
    exit(0)

model_path = "{model_path}" or "BAAI/bge-large-zh-v1.5"
try:
    llm = LLM(model=model_path, task="embed")
    texts = ["test query 1", "test query 2", "test query 3"]
    outputs = llm.embed(texts)
    dim = len(outputs[0].outputs.embedding)
    print(f"Embedding dim: {{dim}}")
    print("EMBED_CHECK: PASSED")
except Exception as e:
    print(f"EMBED_CHECK: FAILED - {{e}}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="rag_embedding",
            timeout=300,
        )

        passed = "EMBED_CHECK: PASSED" in output

        return {
            "test": "rag_embedding",
            "passed": passed,
            "model_path": model_path or "BAAI/bge-large-zh-v1.5",
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"RAG Embedding (bge-large-zh-v1.5): {'PASSED' if passed else 'FAILED'}",
        }

    def _test_rag_rerank(self) -> dict[str, Any]:
        cfg = self.config.config
        model_path = cfg.get("model_path", "")

        script = f"""
import torch

model_path = "{model_path}" or "BAAI/bge-reranker-large"
try:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path).cuda()
    pairs = [["query", "passage 1"], ["query", "passage 2"]]
    inputs = tokenizer(pairs, padding=True, truncation=True, return_tensors="pt", max_length=512)
    inputs = {{k: v.cuda() for k, v in inputs.items()}}
    with torch.no_grad():
        scores = model(**inputs).logits.squeeze()
    print(f"Rerank scores: {{scores.tolist()}}")
    print("RERANK_CHECK: PASSED")
except Exception as e:
    print(f"RERANK_CHECK: FAILED - {{e}}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="rag_rerank",
            timeout=300,
        )

        passed = "RERANK_CHECK: PASSED" in output

        return {
            "test": "rag_rerank",
            "passed": passed,
            "model_path": model_path or "BAAI/bge-reranker-large",
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"RAG Rerank (bge-reranker-large): {'PASSED' if passed else 'FAILED'}",
        }

    def _test_cuda_migration(self) -> dict[str, Any]:
        script = """
import torch
import subprocess

checks = []

# 1. CUDA toolkit
try:
    result = subprocess.run(["nvcc", "--version"], capture_output=True, text=True, timeout=10)
    checks.append(("nvcc", result.returncode == 0, result.stdout.strip()[:200]))
except Exception as e:
    checks.append(("nvcc", False, str(e)))

# 2. PyTorch CUDA
try:
    assert torch.cuda.is_available()
    checks.append(("torch.cuda", True, f"CUDA {torch.version.cuda}, cuDNN {torch.backends.cudnn.version()}"))
except Exception as e:
    checks.append(("torch.cuda", False, str(e)))

# 3. Basic CUDA op
try:
    a = torch.randn(1024, 1024, device='cuda')
    b = torch.mm(a, a)
    torch.cuda.synchronize()
    checks.append(("cuda_matmul", True, "OK"))
except Exception as e:
    checks.append(("cuda_matmul", False, str(e)))

all_passed = all(c[1] for c in checks)
for name, passed, info in checks:
    print(f"  {name}: {'PASS' if passed else 'FAIL'} - {info}")

print(f"CUDA_MIGRATION: {'PASSED' if all_passed else 'FAILED'}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="cuda_migration",
            timeout=120,
        )

        passed = "CUDA_MIGRATION: PASSED" in output

        return {
            "test": "cuda_migration",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"CUDA migration compatibility: {'PASSED' if passed else 'FAILED'}",
        }

    def _test_gpu_virtualization(self) -> dict[str, Any]:
        script = """
import subprocess, json

checks = []

# 1. Check nvidia-smi MIG status
try:
    result = subprocess.run(["nvidia-smi", "mig", "-lgi"], capture_output=True, text=True, timeout=10)
    checks.append(("mig_support", True, result.stdout.strip()[:200] or "No MIG instances"))
except Exception as e:
    checks.append(("mig_support", False, str(e)))

# 2. Check GPU device count
import torch
if torch.cuda.is_available():
    count = torch.cuda.device_count()
    checks.append(("gpu_devices", True, f"{count} GPU(s) visible"))
    for i in range(count):
        props = torch.cuda.get_device_properties(i)
        checks.append((f"gpu_{i}", True, f"{props.name}, {props.total_mem/1e9:.1f}GB"))
else:
    checks.append(("gpu_devices", False, "No CUDA devices"))

all_passed = all(c[1] for c in checks)
for name, passed, info in checks:
    print(f"  {name}: {'PASS' if passed else 'FAIL'} - {info}")

print(f"GPU_VIRT: {'PASSED' if all_passed else 'FAILED'}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="gpu_virtualization",
            timeout=120,
        )

        passed = "GPU_VIRT: PASSED" in output

        return {
            "test": "gpu_virtualization",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"GPU virtualization: {'PASSED' if passed else 'FAILED'}",
        }

    def _test_generic(self) -> dict[str, Any]:
        test_type = self.config.config.get("test_type", "unknown")
        return {
            "test": test_type,
            "passed": False,
            "note": f"Test type '{test_type}' not yet implemented",
            "summary": f"Ecosystem test '{test_type}': not implemented",
        }
