from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SshTargetConfigItem(BaseModel):
    """Single SSH target as edited in admin UI / stored in data/ssh_targets.json."""

    model_config = ConfigDict(extra="ignore")

    id: str = Field(..., min_length=1, max_length=64)
    host: str = Field(..., min_length=1)
    user: str = Field(..., min_length=1)
    port: int = Field(default=22, ge=1, le=65535)
    identity_file: Optional[str] = Field(
        default=None,
        description="Private key path on the machine running FastAPI",
    )
    password: Optional[str] = Field(
        default=None,
        description="SSH 密码（将明文写入 data 文件，仅建议内网；留空表示不修改已存密码）",
    )
    project_root: str = Field(..., min_length=1)
    opencompass_root: Optional[str] = None
    python_executable: str = Field(default="python3")

    @field_validator("password", mode="before")
    @classmethod
    def _empty_password(cls, v):
        if v is None or (isinstance(v, str) and not str(v).strip()):
            return None
        return str(v).strip()

    @field_validator("identity_file", "opencompass_root", mode="before")
    @classmethod
    def _empty_optional_str(cls, v):
        if v is None or (isinstance(v, str) and not str(v).strip()):
            return None
        return str(v).strip()

    @field_validator("project_root", "host", "user", "id", mode="before")
    @classmethod
    def _strip_required(cls, v):
        if v is None:
            return v
        return str(v).strip()


class SshTargetsSaveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: list[SshTargetConfigItem] = Field(default_factory=list)
