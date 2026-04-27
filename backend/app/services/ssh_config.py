from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken


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
_fernet_cache: Optional[Fernet] = None


def data_file_path() -> Path:
    """backend/data/ssh_targets.json — takes precedence over env when present."""
    return Path(__file__).resolve().parents[2] / "data" / "ssh_targets.json"


def _key_file_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / ".ssh_targets.key"


def _load_or_create_key() -> bytes:
    env_key = os.environ.get("BENCHMARK_SSH_SECRET_KEY", "").strip()
    if env_key:
        try:
            # Validate key format
            Fernet(env_key.encode("utf-8"))
            return env_key.encode("utf-8")
        except Exception as e:
            raise ValueError("Invalid BENCHMARK_SSH_SECRET_KEY format") from e

    key_file = _key_file_path()
    if key_file.is_file():
        key = key_file.read_text(encoding="utf-8").strip().encode("utf-8")
        try:
            Fernet(key)
            return key
        except Exception as e:
            raise ValueError(f"Invalid key file content: {key_file}") from e

    key_file.parent.mkdir(parents=True, exist_ok=True)
    key = Fernet.generate_key()
    key_file.write_text(key.decode("utf-8"), encoding="utf-8")
    try:
        os.chmod(key_file, 0o600)
    except Exception:
        pass
    return key


def _fernet() -> Fernet:
    global _fernet_cache
    if _fernet_cache is None:
        _fernet_cache = Fernet(_load_or_create_key())
    return _fernet_cache


def _encrypt_password(password: str) -> str:
    return _fernet().encrypt(password.encode("utf-8")).decode("utf-8")


def _decrypt_password(item: dict) -> Optional[str]:
    enc = item.get("password_enc")
    if isinstance(enc, str) and enc.strip():
        try:
            return _fernet().decrypt(enc.encode("utf-8")).decode("utf-8")
        except InvalidToken as e:
            raise ValueError("Failed to decrypt SSH password: invalid key or ciphertext") from e
    pw = item.get("password")
    if isinstance(pw, str) and pw.strip():
        return pw.strip()
    return None


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
        pw = _decrypt_password(item)
        out.append(
            SshTarget(
                id=str(tid),
                host=str(host),
                user=str(user),
                port=int(item.get("port") or 22),
                identity_file=item.get("identity_file"),
                password=pw,
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
    sanitized: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        item = dict(row)
        pw = item.pop("password", None)
        if isinstance(pw, str) and pw.strip():
            item["password_enc"] = _encrypt_password(pw.strip())
        elif isinstance(item.get("password_enc"), str) and item["password_enc"].strip():
            # keep provided encrypted payload as-is
            pass
        else:
            item.pop("password_enc", None)
        # never persist plaintext password
        item.pop("password", None)
        sanitized.append(item)

    path = data_file_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(sanitized, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
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


def get_saved_password_map() -> dict[str, str]:
    """Read persisted target passwords (decrypting if needed)."""
    path = data_file_path()
    if not path.is_file():
        return {}
    try:
        rows = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    if not isinstance(rows, list):
        return {}
    out: dict[str, str] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        tid = row.get("id")
        if not tid:
            continue
        pw = _decrypt_password(row)
        if pw:
            out[str(tid)] = pw
    return out
