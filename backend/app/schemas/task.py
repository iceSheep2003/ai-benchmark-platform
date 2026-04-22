from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field

from .execution import ExecutionMode, ExecutionSpec


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class TaskPriority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class AcceleratorBackend(str, Enum):
    HUGGINGFACE = "huggingface"
    VLLM = "vllm"
    LMDEPLOY = "lmdeploy"


class AcceleratorTaskCreate(BaseModel):
    """Request body for creating an accelerator evaluation task."""

    name: str = Field(..., description="Task display name")
    model_path: str = Field(
        ..., description="HuggingFace model id or local path, e.g. 'internlm/internlm2_5-1_8b-chat'"
    )
    datasets: list[str] = Field(
        default=["gsm8k"],
        description="Dataset names to evaluate against",
    )
    backend: AcceleratorBackend = Field(
        default=AcceleratorBackend.HUGGINGFACE,
        description="Inference backend to benchmark",
    )
    num_gpus: int = Field(default=1, ge=1, le=8, description="Number of GPUs")
    batch_size: int = Field(default=8, ge=1, le=256)
    max_out_len: int = Field(default=256, ge=1, le=4096)
    priority: TaskPriority = Field(default=TaskPriority.P2)
    work_dir: Optional[str] = Field(
        default=None, description="Override working directory for outputs"
    )
    extra_args: dict[str, Any] = Field(
        default_factory=dict,
        description="Extra opencompass CLI arguments, e.g. {'reuse': 'latest'}",
    )
    execution: ExecutionSpec = Field(
        default_factory=ExecutionSpec,
        description="local = run on API host; ssh = run via configured target",
    )


class TaskMetrics(BaseModel):
    """Real-time or final performance metrics."""

    throughput: Optional[float] = Field(None, description="tokens/s or samples/s")
    latency_avg_ms: Optional[float] = None
    latency_p99_ms: Optional[float] = None
    gpu_util_pct: Optional[float] = None
    gpu_memory_used_mb: Optional[float] = None
    gpu_memory_total_mb: Optional[float] = None
    power_watts: Optional[float] = None
    temperature_celsius: Optional[float] = None
    timestamp: Optional[float] = None


class DatasetScore(BaseModel):
    """Score for a single dataset."""

    dataset: str
    metric: str = "accuracy"
    score: float
    details: dict[str, Any] = Field(default_factory=dict)


class TaskResult(BaseModel):
    """Aggregated results once a task completes."""

    scores: list[DatasetScore] = Field(default_factory=list)
    overall_score: Optional[float] = None
    total_time_seconds: Optional[float] = None
    peak_gpu_memory_mb: Optional[float] = None
    avg_throughput: Optional[float] = None
    backend_used: Optional[str] = None
    raw_summary: dict[str, Any] = Field(default_factory=dict)


class TaskResponse(BaseModel):
    """Full task representation returned by the API."""

    id: str
    name: str
    status: TaskStatus
    priority: TaskPriority
    backend: AcceleratorBackend
    model_path: str
    datasets: list[str]
    num_gpus: int
    batch_size: int
    max_out_len: int
    work_dir: str

    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: str = "system"

    metrics: Optional[TaskMetrics] = None
    result: Optional[TaskResult] = None
    error_message: Optional[str] = None
    log_tail: list[str] = Field(default_factory=list, description="Last N log lines")

    execution_mode: ExecutionMode = ExecutionMode.LOCAL
    ssh_target_id: Optional[str] = None
    remote_workspace: Optional[str] = Field(
        default=None,
        description="Absolute OpenCompass -w directory on remote when execution_mode=ssh",
    )

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    total: int
    items: list[TaskResponse]


class GPUInfo(BaseModel):
    """Information about a single GPU device."""

    index: int
    name: str
    memory_total_mb: float
    memory_used_mb: float
    memory_free_mb: float
    utilization_pct: float
    temperature_celsius: float
    power_watts: float
    driver_version: str
    cuda_version: str


class SystemInfoResponse(BaseModel):
    """System hardware information."""

    gpus: list[GPUInfo]
    gpu_count: int
    total_gpu_memory_mb: float
    cpu_count: int
    hostname: str
