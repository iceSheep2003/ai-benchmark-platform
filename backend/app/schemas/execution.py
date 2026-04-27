from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ExecutionMode(str, Enum):
    LOCAL = "local"
    SSH = "ssh"


class ExecutionSpec(BaseModel):
    """Where the workload runs: locally (API host) or via SSH on a configured target."""

    mode: ExecutionMode = Field(default=ExecutionMode.LOCAL)
    target_id: Optional[str] = Field(
        default=None,
        description="ID from BENCHMARK_SSH_TARGETS / ssh-targets file; required when mode=ssh",
    )
