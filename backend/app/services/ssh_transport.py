"""SSH/SFTP: subprocess (密钥) 或 paramiko（密码）。"""
from __future__ import annotations

import shlex
import stat
import subprocess
import time
from pathlib import Path
from typing import Callable, Optional

import paramiko

from .ssh_config import SshTarget


def _remote_login_shell_wrap(remote_cmd: str) -> str:
    """用登录 shell 执行远程命令，加载 ~/.profile / ~/.bash_profile 中的 PATH。

    Paramiko 与 ssh 非交互执行默认不读 .bashrc，常见现象：交互 SSH 里有 python3，
    自动化执行报 python3: command not found。
    """
    return f"bash -lc {shlex.quote(remote_cmd)}"


class SSHRunResult:
    __slots__ = ("returncode", "stdout", "stderr")

    def __init__(self, returncode: int, stdout: str, stderr: str):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def _use_paramiko(t: SshTarget) -> bool:
    """存在可用私钥时用系统 ssh；否则若配置了密码则用 paramiko。"""
    if t.identity_file:
        key = Path(t.identity_file).expanduser()
        if key.is_file():
            return False
    return bool(t.password and str(t.password).strip())


def connect(t: SshTarget) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kwargs: dict = {
        "hostname": t.host,
        "port": int(t.port),
        "username": t.user,
        "timeout": 60,
    }
    if t.identity_file:
        key = Path(t.identity_file).expanduser()
        if key.is_file():
            kwargs["key_filename"] = str(key)
            kwargs["allow_agent"] = False
            kwargs["look_for_keys"] = False
            client.connect(**kwargs)
            return client
    if t.password:
        kwargs["password"] = str(t.password)
        kwargs["allow_agent"] = False
        kwargs["look_for_keys"] = False
        client.connect(**kwargs)
        return client
    kwargs["allow_agent"] = True
    kwargs["look_for_keys"] = True
    client.connect(**kwargs)
    return client


def ssh_run_bash(t: SshTarget, bash_line: str, timeout: Optional[float] = None) -> SSHRunResult:
    wrapped = _remote_login_shell_wrap(bash_line)
    if _use_paramiko(t):
        return _paramiko_exec(t, wrapped, timeout)
    cmd = _ssh_subprocess_base(t) + [f"{t.user}@{t.host}", wrapped]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return SSHRunResult(r.returncode, r.stdout or "", r.stderr or "")


def _paramiko_exec(t: SshTarget, command: str, timeout: Optional[float]) -> SSHRunResult:
    client = connect(t)
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        if timeout is not None:
            deadline = time.time() + float(timeout)
            while not stdout.channel.exit_status_ready():
                if time.time() >= deadline:
                    try:
                        stdout.channel.close()
                    except Exception:
                        pass
                    return SSHRunResult(124, "", f"remote command timeout after {timeout}s")
                time.sleep(0.2)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        return SSHRunResult(code, out, err)
    finally:
        client.close()


def scp_push(t: SshTarget, local_path: str, remote_path: str) -> None:
    if _use_paramiko(t):
        client = connect(t)
        try:
            sftp = client.open_sftp()
            try:
                sftp.put(local_path, remote_path)
            finally:
                sftp.close()
        finally:
            client.close()
        return
    spec = f"{t.user}@{t.host}:{remote_path}"
    cmd = _scp_subprocess_base(t) + [local_path, spec]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"scp push failed: {r.stderr or r.stdout}")


def scp_pull(t: SshTarget, remote_path: str, local_path: str) -> None:
    if _use_paramiko(t):
        client = connect(t)
        try:
            sftp = client.open_sftp()
            try:
                sftp.get(remote_path, local_path)
            finally:
                sftp.close()
        finally:
            client.close()
        return
    spec = f"{t.user}@{t.host}:{remote_path}"
    cmd = _scp_subprocess_base(t) + [spec, local_path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"scp pull failed: {r.stderr or r.stdout}")


def scp_pull_dir(t: SshTarget, remote_dir: str, local_dir: Path) -> None:
    """递归下载远程目录到本地（remote_dir 为绝对路径）。"""
    if _use_paramiko(t):
        client = connect(t)
        try:
            sftp = client.open_sftp()
            try:
                _sftp_pull_tree(sftp, remote_dir.rstrip("/"), local_dir)
            finally:
                sftp.close()
        finally:
            client.close()
        return
    spec = f"{t.user}@{t.host}:{remote_dir.rstrip('/')}/."
    cmd = ["scp", "-r", "-P", str(t.port)]
    if t.identity_file:
        cmd.extend(["-i", t.identity_file, "-o", "BatchMode=yes"])
    cmd.extend([spec, str(local_dir)])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"scp pull dir failed: {r.stderr or r.stdout}")


def _sftp_pull_tree(sftp: paramiko.SFTPClient, remote_dir: str, local_dir: Path) -> None:
    local_dir.mkdir(parents=True, exist_ok=True)
    for entry in sftp.listdir_attr(remote_dir):
        name = entry.filename
        if name in (".", ".."):
            continue
        rpath = f"{remote_dir}/{name}"
        lpath = local_dir / name
        mode = entry.st_mode
        if mode is None:
            try:
                mode = sftp.stat(rpath).st_mode
            except Exception:
                mode = 0
        is_dir = stat.S_ISDIR(mode) if mode else False
        if is_dir:
            _sftp_pull_tree(sftp, rpath, lpath)
        else:
            sftp.get(rpath, str(lpath))


def run_streaming_command(
    t: SshTarget,
    remote_bash_inner: str,
    log_callback: Callable[[str], None],
    timeout: Optional[float] = None,
) -> int:
    """在远程执行长命令，按行回调 stdout/stderr 合并流。返回 exit status。"""
    wrapped = _remote_login_shell_wrap(remote_bash_inner)
    if _use_paramiko(t):
        client = connect(t)
        try:
            _stdin, stdout, _stderr = client.exec_command(wrapped, get_pty=True)
            for line in stdout:
                log_callback(line.rstrip())
            return int(stdout.channel.recv_exit_status())
        finally:
            client.close()
    cmd = _ssh_subprocess_base(t) + [f"{t.user}@{t.host}", wrapped]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    assert proc.stdout
    try:
        for line in proc.stdout:
            log_callback(line.rstrip())
        proc.wait(timeout=timeout)
        return proc.returncode or 0
    finally:
        if proc.poll() is None:
            proc.kill()


def _ssh_subprocess_base(t: SshTarget) -> list[str]:
    cmd = ["ssh", "-p", str(t.port), "-o", "StrictHostKeyChecking=accept-new"]
    if t.identity_file:
        cmd.extend(["-i", t.identity_file, "-o", "BatchMode=yes"])
    return cmd


def _scp_subprocess_base(t: SshTarget) -> list[str]:
    cmd = ["scp", "-P", str(t.port)]
    if t.identity_file:
        cmd.extend(["-i", t.identity_file, "-o", "BatchMode=yes"])
    return cmd
