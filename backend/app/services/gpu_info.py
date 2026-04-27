from __future__ import annotations

import os
import subprocess
import platform

from ..schemas.task import GPUInfo, SystemInfoResponse
from .ssh_config import SshTarget
from .ssh_transport import ssh_run_bash


def query_gpu_info_ssh_target(target: SshTarget) -> SystemInfoResponse:
    """Run nvidia-smi on a remote host via SSH (same query shape as local)."""
    remote_cmd = (
        "nvidia-smi "
        "--query-gpu=index,name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw "
        "--format=csv,noheader,nounits"
    )
    try:
        result = ssh_run_bash(target, remote_cmd, timeout=30)
        if result.returncode != 0:
            return _remote_fallback(target.host, result.stderr or result.stdout)
    except Exception as e:
        return _remote_fallback(target.host, str(e))

    gpus = _parse_nvidia_smi_lines(result.stdout)
    driver_version, cuda_version = "N/A", "N/A"
    for g in gpus:
        g.driver_version = driver_version
        g.cuda_version = cuda_version
    total_mem = sum(g.memory_total_mb for g in gpus)
    return SystemInfoResponse(
        gpus=gpus,
        gpu_count=len(gpus),
        total_gpu_memory_mb=total_mem,
        cpu_count=1,
        hostname=f"{target.host} (ssh:{target.id})",
    )


def _remote_fallback(host: str, err: str) -> SystemInfoResponse:
    return SystemInfoResponse(
        gpus=[
            GPUInfo(
                index=0,
                name=f"Remote {host} (nvidia-smi failed)",
                memory_total_mb=0,
                memory_used_mb=0,
                memory_free_mb=0,
                utilization_pct=0,
                temperature_celsius=0,
                power_watts=0,
                driver_version="N/A",
                cuda_version="N/A",
            )
        ],
        gpu_count=0,
        total_gpu_memory_mb=0,
        cpu_count=1,
        hostname=f"{host} ({err[:80]})",
    )


def _parse_nvidia_smi_lines(stdout: str) -> list[GPUInfo]:
    gpus: list[GPUInfo] = []
    for line in stdout.strip().split("\n"):
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 8:
            continue
        gpus.append(
            GPUInfo(
                index=int(parts[0]),
                name=parts[1],
                memory_total_mb=float(parts[2]),
                memory_used_mb=float(parts[3]),
                memory_free_mb=float(parts[4]),
                utilization_pct=float(parts[5]),
                temperature_celsius=float(parts[6]),
                power_watts=float(parts[7]) if parts[7] not in ("[N/A]", "N/A") else 0.0,
                driver_version="",
                cuda_version="",
            )
        )
    return gpus if gpus else _fallback_gpu_info()


def query_gpu_info() -> SystemInfoResponse:
    gpus = _parse_nvidia_smi()
    driver_version, cuda_version = _get_driver_cuda_version()
    for g in gpus:
        g.driver_version = driver_version
        g.cuda_version = cuda_version

    total_mem = sum(g.memory_total_mb for g in gpus)
    return SystemInfoResponse(
        gpus=gpus,
        gpu_count=len(gpus),
        total_gpu_memory_mb=total_mem,
        cpu_count=os.cpu_count() or 1,
        hostname=platform.node(),
    )


def _parse_nvidia_smi() -> list[GPUInfo]:
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=index,name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,power.draw",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return _fallback_gpu_info()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return _fallback_gpu_info()

    return _parse_nvidia_smi_lines(result.stdout)


def _get_driver_cuda_version() -> tuple[str, str]:
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        driver = result.stdout.strip().split("\n")[0].strip() if result.returncode == 0 else "N/A"
    except Exception:
        driver = "N/A"

    cuda = os.environ.get("CUDA_VERSION", "N/A")
    if cuda == "N/A":
        try:
            result = subprocess.run(["nvcc", "--version"], capture_output=True, text=True, timeout=5)
            for line in result.stdout.split("\n"):
                if "release" in line.lower():
                    cuda = line.split("release")[-1].split(",")[0].strip()
                    break
        except Exception:
            pass
    return driver, cuda


def _fallback_gpu_info() -> list[GPUInfo]:
    return [
        GPUInfo(
            index=0,
            name="Simulated GPU (nvidia-smi not available)",
            memory_total_mb=81920,
            memory_used_mb=0,
            memory_free_mb=81920,
            utilization_pct=0,
            temperature_celsius=30,
            power_watts=0,
            driver_version="N/A",
            cuda_version="N/A",
        )
    ]
