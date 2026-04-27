from __future__ import annotations

import sqlite3
import threading
from pathlib import Path

_lock = threading.Lock()


def db_path() -> Path:
    p = Path(__file__).resolve().parents[2] / "data" / "benchmark.db"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


_conn = get_conn()


def execute(sql: str, params: tuple = ()) -> sqlite3.Cursor:
    with _lock:
        cur = _conn.execute(sql, params)
        _conn.commit()
        return cur


def fetchone(sql: str, params: tuple = ()) -> sqlite3.Row | None:
    with _lock:
        cur = _conn.execute(sql, params)
        return cur.fetchone()


def fetchall(sql: str, params: tuple = ()) -> list[sqlite3.Row]:
    with _lock:
        cur = _conn.execute(sql, params)
        return cur.fetchall()


def init_db() -> None:
    execute(
        """
        CREATE TABLE IF NOT EXISTS accelerator_tasks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            backend TEXT NOT NULL,
            model_path TEXT NOT NULL,
            datasets_json TEXT NOT NULL,
            num_gpus INTEGER NOT NULL,
            batch_size INTEGER NOT NULL,
            max_out_len INTEGER NOT NULL,
            work_dir TEXT NOT NULL,
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,
            created_by TEXT NOT NULL,
            metrics_json TEXT,
            result_json TEXT,
            error_message TEXT,
            log_tail_json TEXT NOT NULL,
            execution_mode TEXT NOT NULL,
            ssh_target_id TEXT,
            remote_workspace TEXT
        )
        """
    )
    execute(
        """
        CREATE TABLE IF NOT EXISTS test_tasks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            test_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            num_gpus INTEGER NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            result_json TEXT,
            log_tail_json TEXT NOT NULL,
            execution_mode TEXT NOT NULL,
            ssh_target_id TEXT
        )
        """
    )
    execute(
        """
        CREATE TABLE IF NOT EXISTS accelerator_assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            vendor TEXT NOT NULL,
            model TEXT NOT NULL,
            status TEXT NOT NULL,
            specs_json TEXT NOT NULL,
            scores_json TEXT NOT NULL,
            subtask_scores_json TEXT NOT NULL,
            trend_json TEXT NOT NULL,
            capabilities_json TEXT NOT NULL,
            test_progress_json TEXT,
            tested_at TEXT,
            firmware TEXT NOT NULL,
            driver TEXT NOT NULL,
            version_history_json TEXT NOT NULL,
            strengths_json TEXT NOT NULL,
            weaknesses_json TEXT NOT NULL,
            recommendations_json TEXT NOT NULL
        )
        """
    )
    execute(
        """
        CREATE TABLE IF NOT EXISTS accelerator_results (
            id TEXT PRIMARY KEY,
            source_task_id TEXT NOT NULL,
            source_type TEXT NOT NULL,
            asset_id TEXT NOT NULL,
            category TEXT,
            test_type TEXT,
            overall_score REAL,
            data_json TEXT NOT NULL,
            summary TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    execute(
        """
        CREATE TABLE IF NOT EXISTS accelerator_comparisons (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            created_by TEXT NOT NULL,
            creator_id TEXT NOT NULL,
            cards_json TEXT NOT NULL,
            dimension_weights_json TEXT NOT NULL,
            overall_analysis_json TEXT NOT NULL,
            dimension_analysis_json TEXT NOT NULL,
            advantage_analysis_json TEXT NOT NULL,
            tags_json TEXT NOT NULL,
            category TEXT NOT NULL,
            is_public INTEGER NOT NULL,
            is_starred INTEGER NOT NULL,
            version INTEGER NOT NULL
        )
        """
    )


init_db()
