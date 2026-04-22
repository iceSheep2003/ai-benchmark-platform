from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class SshTarget:
    id: str
    host: str
    user: str
    port: int = 22
    identity_file: Optional[str] = None
    """Path to private key on the machine running the FastAPI process."""
    password: Optional[str] = None
    """SSH password (stored in data file; prefer key in production)."""
    project_root: str = ""
    """Absolute path to repo root on remote (directory containing `backend/`)."""
    opencompass_root: Optional[str] = None
    """Override OpenCompass root on remote; default: {project_root}/opencompass"""
    python_executable: str = "python3"

    def oc_root(self) -> str:
        if self.opencompass_root:
            return self.opencompass_root.rstrip("/")
        return f"{self.project_root.rstrip('/')}/opencompass"


_targets_cache: Optional[list[SshTarget]] = None


def data_file_path() -> Path:
    """backend/data/ssh_targets.json — takes precedence over env when present."""
    return Path(__file__).resolve().parents[2] / "data" / "ssh_targets.json"


def _parse_targets(raw: str) -> list[SshTarget]:
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("BENCHMARK_SSH_TARGETS must be a JSON array")
    out: list[SshTarget] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        tid = item.get("id")
        host = item.get("host")
        user = item.get("user")
        if not tid or not host or not user:
            continue
        pr = (item.get("project_root") or "").strip()
        if not pr:
            continue
        pw = item.get("password")
        out.append(
            SshTarget(
                id=str(tid),
                host=str(host),
                user=str(user),
                port=int(item.get("port") or 22),
                identity_file=item.get("identity_file"),
                password=str(pw).strip() if pw else None,
                project_root=pr,
                opencompass_root=item.get("opencompass_root")
                or item.get("openccompass_root"),
                python_executable=str(item.get("python_executable") or "python3"),
            )
        )
    return out


def load_ssh_targets() -> list[SshTarget]:
    global _targets_cache
    if _targets_cache is not None:
        return _targets_cache

    data_path = data_file_path()
    if data_path.is_file():
        raw_file = data_path.read_text(encoding="utf-8").strip()
        if raw_file:
            _targets_cache = _parse_targets(raw_file)
        else:
            _targets_cache = []
        return _targets_cache

    raw: Optional[str] = os.environ.get("BENCHMARK_SSH_TARGETS")
    if not raw:
        env_path = os.environ.get("BENCHMARK_SSH_TARGETS_FILE")
        if env_path:
            p = Path(env_path)
            if p.is_file():
                raw = p.read_text(encoding="utf-8")
    if not raw:
        _targets_cache = []
        return _targets_cache

    _targets_cache = _parse_targets(raw)
    return _targets_cache


def target_to_admin_dict(t: SshTarget) -> dict:
    return {
        "id": t.id,
        "host": t.host,
        "port": t.port,
        "user": t.user,
        "identity_file": t.identity_file,
        "password_set": bool(t.password),
        "project_root": t.project_root,
        "opencompass_root": t.opencompass_root,
        "python_executable": t.python_executable,
    }


def persist_targets_raw(rows: list[dict]) -> None:
    """Write validated rows to data file and clear cache."""
    path = data_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    clear_targets_cache()


def is_persisted_file() -> bool:
    return data_file_path().is_file()


def get_target(target_id: str) -> Optional[SshTarget]:
    for t in load_ssh_targets():
        if t.id == target_id:
            return t
    return None


def list_targets_public() -> list[dict]:
    """Safe to expose to UI (no key paths if you prefer — we omit identity_file)."""
    return [
        {
            "id": t.id,
            "host": t.host,
            "port": t.port,
            "user": t.user,
            "project_root": t.project_root,
        }
        for t in load_ssh_targets()
    ]


def clear_targets_cache() -> None:
    global _targets_cache
    _targets_cache = None
