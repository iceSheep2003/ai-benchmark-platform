from __future__ import annotations

import json
from datetime import datetime
from statistics import pstdev
from typing import Any
from uuid import uuid4

from ..schemas.accelerator import (
    AcceleratorAsset,
    AcceleratorComparison,
    CreateComparisonRequest,
    UpdateComparisonRequest,
)
from ..schemas.task import TaskResponse, TaskResult
from ..schemas.test_case import AcceleratorTestResult
from .db import execute, fetchall, fetchone


def _vendor_from_model(model_name: str) -> str:
    m = (model_name or "").lower()
    if "nvidia" in m:
        return "NVIDIA"
    if "amd" in m or "mi300" in m:
        return "AMD"
    if "ascend" in m or "昇腾" in m or "huawei" in m:
        return "华为"
    if "mlu" in m or "cambricon" in m or "寒武纪" in m:
        return "寒武纪"
    return "Unknown"


def _json(v: Any) -> str:
    return json.dumps(v, ensure_ascii=False)


def _loads(v: str | None, default: Any):
    if not v:
        return default
    try:
        return json.loads(v)
    except Exception:
        return default


def _asset_from_row(row) -> AcceleratorAsset:
    return AcceleratorAsset(
        id=row["id"],
        name=row["name"],
        vendor=row["vendor"],
        model=row["model"],
        status=row["status"],
        specs=_loads(row["specs_json"], {}),
        scores=_loads(row["scores_json"], {}),
        subTaskScores=_loads(row["subtask_scores_json"], {}),
        trend=_loads(row["trend_json"], []),
        capabilities=_loads(row["capabilities_json"], []),
        testProgress=_loads(row["test_progress_json"], None),
        testedAt=row["tested_at"],
        firmware=row["firmware"] or "unknown",
        driver=row["driver"] or "unknown",
        versionHistory=_loads(row["version_history_json"], []),
        strengths=_loads(row["strengths_json"], []),
        weaknesses=_loads(row["weaknesses_json"], []),
        recommendations=_loads(row["recommendations_json"], []),
    )


def _upsert_asset(asset: AcceleratorAsset) -> None:
    execute(
        """
        INSERT INTO accelerator_assets(
            id, name, vendor, model, status, specs_json, scores_json, subtask_scores_json,
            trend_json, capabilities_json, test_progress_json, tested_at, firmware, driver,
            version_history_json, strengths_json, weaknesses_json, recommendations_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            vendor=excluded.vendor,
            model=excluded.model,
            status=excluded.status,
            specs_json=excluded.specs_json,
            scores_json=excluded.scores_json,
            subtask_scores_json=excluded.subtask_scores_json,
            trend_json=excluded.trend_json,
            capabilities_json=excluded.capabilities_json,
            test_progress_json=excluded.test_progress_json,
            tested_at=excluded.tested_at,
            firmware=excluded.firmware,
            driver=excluded.driver,
            version_history_json=excluded.version_history_json,
            strengths_json=excluded.strengths_json,
            weaknesses_json=excluded.weaknesses_json,
            recommendations_json=excluded.recommendations_json
        """,
        (
            asset.id,
            asset.name,
            asset.vendor,
            asset.model,
            asset.status,
            _json(asset.specs),
            _json(asset.scores),
            _json(asset.subTaskScores),
            _json(asset.trend),
            _json(asset.capabilities),
            _json(asset.testProgress),
            asset.testedAt,
            asset.firmware,
            asset.driver,
            _json(asset.versionHistory),
            _json(asset.strengths),
            _json(asset.weaknesses),
            _json(asset.recommendations),
        ),
    )


def _infer_asset_for_task(task: TaskResponse) -> AcceleratorAsset:
    from .gpu_info import query_gpu_info, query_gpu_info_ssh_target
    from .ssh_config import get_target

    info = None
    if task.execution_mode.value == "ssh" and task.ssh_target_id:
        tgt = get_target(task.ssh_target_id)
        if tgt:
            info = query_gpu_info_ssh_target(tgt)
    else:
        info = query_gpu_info()
    g0 = info.gpus[0] if info and info.gpus else None
    model = g0.name if g0 else "Unknown GPU"
    asset_id = f"asset-{(task.ssh_target_id or 'local').replace('_', '-')}"
    return AcceleratorAsset(
        id=asset_id,
        name=model,
        vendor=_vendor_from_model(model),
        model=model,
        status="tested",
        specs={
            "memory": int((g0.memory_total_mb / 1024)) if g0 and g0.memory_total_mb else 0,
            "memoryType": "unknown",
            "tdp": int(g0.power_watts) if g0 and g0.power_watts else 0,
            "process": "unknown",
            "cores": 0,
            "frequency": "unknown",
            "bandwidth": "unknown",
            "interconnect": "unknown",
        },
        scores={},
        subTaskScores={},
        trend=[],
        capabilities=[],
        testedAt=datetime.utcnow().isoformat(timespec="seconds"),
        firmware="unknown",
        driver=(g0.driver_version if g0 else "unknown"),
    )


def _calc_opencompass_scores(result: TaskResult) -> tuple[dict[str, float], dict[str, Any], float]:
    overall = result.overall_score or 0.0
    scores = {
        "overall": round(overall * 100, 2) if overall <= 1 else round(overall, 2),
        "computePerformance": round(overall * 100, 2),
        "memoryPerformance": round(overall * 95, 2),
        "inferenceSpeed": round(overall * 98, 2),
        "trainingSpeed": round(overall * 92, 2),
        "energyEfficiency": round(overall * 85, 2),
        "costEfficiency": round(overall * 80, 2),
    }
    subtask = {
        "inferenceSpeed": {
            "batchThroughput": {"score": result.avg_throughput or 0, "metric": "samples/s"},
        },
        "computePerformance": {
            "overallAccuracy": {"score": scores["computePerformance"], "metric": "score"},
        },
    }
    return scores, subtask, float(scores["overall"])


def _calc_test_scores(test: AcceleratorTestResult) -> tuple[dict[str, float], dict[str, Any], float]:
    data = test.data or {}
    base = 60.0
    if "passed" in data:
        base = 85.0 if bool(data.get("passed")) else 40.0
    if isinstance(data.get("throughput"), (int, float)):
        base = min(100.0, 50.0 + float(data["throughput"]) / 100.0)
    if isinstance(data.get("tgs"), (int, float)):
        base = min(100.0, 50.0 + float(data["tgs"]) / 20.0)
    scores = {
        "overall": round(base, 2),
        "computePerformance": round(base if test.category.value != "video_codec" else base * 0.8, 2),
        "memoryPerformance": round(base * 0.9, 2),
        "inferenceSpeed": round(base * 0.95, 2),
        "trainingSpeed": round(base * 0.95, 2),
        "energyEfficiency": round(base * 0.85, 2),
        "costEfficiency": round(base * 0.9, 2),
    }
    subtask = {
        test.category.value: {
            test.test_type: {"score": round(base, 2), "metric": "score"},
        }
    }
    return scores, subtask, float(scores["overall"])


def _append_version(asset: AcceleratorAsset, scores: dict[str, float], changes: str) -> list[dict[str, Any]]:
    hist = list(asset.versionHistory or [])
    hist.append(
        {
            "version": f"v{len(hist) + 1}",
            "date": datetime.utcnow().isoformat(timespec="seconds"),
            "scores": scores,
            "changes": changes,
        }
    )
    return hist[-20:]


def _record_result(
    *,
    source_task_id: str,
    source_type: str,
    asset_id: str,
    category: str | None,
    test_type: str | None,
    overall_score: float | None,
    data: dict[str, Any],
    summary: str,
) -> None:
    result_id = f"res-{uuid4().hex[:12]}"
    execute(
        """
        INSERT INTO accelerator_results(
            id, source_task_id, source_type, asset_id, category, test_type,
            overall_score, data_json, summary, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            result_id,
            source_task_id,
            source_type,
            asset_id,
            category,
            test_type,
            overall_score,
            _json(data),
            summary,
            datetime.utcnow().isoformat(),
        ),
    )


def record_opencompass_result(task: TaskResponse, result: TaskResult) -> None:
    asset = _infer_asset_for_task(task)
    old_row = fetchone("SELECT * FROM accelerator_assets WHERE id = ?", (asset.id,))
    if old_row:
        old = _asset_from_row(old_row)
        asset.capabilities = old.capabilities
        asset.strengths = old.strengths
        asset.weaknesses = old.weaknesses
        asset.recommendations = old.recommendations
        asset.trend = old.trend
    scores, subtask, overall = _calc_opencompass_scores(result)
    asset.scores = scores
    asset.subTaskScores = subtask
    asset.trend = (asset.trend or []) + [overall]
    asset.versionHistory = _append_version(asset, scores, "OpenCompass evaluation completed")
    _upsert_asset(asset)
    _record_result(
        source_task_id=task.id,
        source_type="opencompass",
        asset_id=asset.id,
        category="model_accuracy",
        test_type="opencompass",
        overall_score=overall,
        data=result.model_dump(),
        summary=f"OpenCompass overall={overall:.2f}",
    )


def record_test_result(task, result: AcceleratorTestResult) -> None:
    # test_store.TestTask is a lightweight object, convert just what we need.
    execution_mode = getattr(task, "execution_mode", None)
    ssh_tid = getattr(task, "ssh_target_id", None)
    fake_task = TaskResponse(
        id=task.id,
        name=task.name,
        status=getattr(task, "status"),
        priority="P2",
        backend="huggingface",
        model_path="",
        datasets=[],
        num_gpus=task.num_gpus,
        batch_size=1,
        max_out_len=1,
        work_dir=f"outputs/tests/{task.id}",
        created_at=task.created_at,
        execution_mode=execution_mode,
        ssh_target_id=ssh_tid,
        remote_workspace=None,
    )
    asset = _infer_asset_for_task(fake_task)
    old_row = fetchone("SELECT * FROM accelerator_assets WHERE id = ?", (asset.id,))
    if old_row:
        old = _asset_from_row(old_row)
        asset.capabilities = old.capabilities
        asset.strengths = old.strengths
        asset.weaknesses = old.weaknesses
        asset.recommendations = old.recommendations
        asset.trend = old.trend
    scores, subtask, overall = _calc_test_scores(result)
    asset.scores = scores
    merged_subtask = dict(old.subTaskScores) if old_row else {}
    merged_subtask.update(subtask)
    asset.subTaskScores = merged_subtask
    asset.trend = (asset.trend or []) + [overall]
    asset.versionHistory = _append_version(asset, scores, f"Test case {result.category.value}/{result.test_type}")
    _upsert_asset(asset)
    _record_result(
        source_task_id=task.id,
        source_type="test_case",
        asset_id=asset.id,
        category=result.category.value,
        test_type=result.test_type,
        overall_score=overall,
        data=result.model_dump(),
        summary=result.summary,
    )


def list_assets(limit: int = 50, offset: int = 0, vendor: str | None = None, status: str | None = None):
    where_parts: list[str] = []
    params: list[Any] = []
    if vendor:
        where_parts.append("vendor = ?")
        params.append(vendor)
    if status:
        where_parts.append("status = ?")
        params.append(status)
    where = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    total_row = fetchone(f"SELECT COUNT(*) AS c FROM accelerator_assets {where}", tuple(params))
    total = int(total_row["c"]) if total_row else 0
    rows = fetchall(
        f"""
        SELECT * FROM accelerator_assets
        {where}
        ORDER BY tested_at DESC, id DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params + [limit, offset]),
    )
    return [_asset_from_row(r) for r in rows], total


def get_asset(asset_id: str) -> AcceleratorAsset | None:
    row = fetchone("SELECT * FROM accelerator_assets WHERE id = ?", (asset_id,))
    return _asset_from_row(row) if row else None


def list_results(
    limit: int = 50,
    offset: int = 0,
    asset_id: str | None = None,
    category: str | None = None,
    source_type: str | None = None,
):
    where_parts: list[str] = []
    params: list[Any] = []
    if asset_id:
        where_parts.append("asset_id = ?")
        params.append(asset_id)
    if category:
        where_parts.append("category = ?")
        params.append(category)
    if source_type:
        where_parts.append("source_type = ?")
        params.append(source_type)
    where = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    total_row = fetchone(f"SELECT COUNT(*) AS c FROM accelerator_results {where}", tuple(params))
    total = int(total_row["c"]) if total_row else 0
    rows = fetchall(
        f"""
        SELECT * FROM accelerator_results
        {where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        tuple(params + [limit, offset]),
    )
    items = []
    for r in rows:
        items.append(
            {
                "id": r["id"],
                "source_task_id": r["source_task_id"],
                "source_type": r["source_type"],
                "asset_id": r["asset_id"],
                "category": r["category"],
                "test_type": r["test_type"],
                "overall_score": r["overall_score"],
                "data": _loads(r["data_json"], {}),
                "summary": r["summary"] or "",
                "created_at": datetime.fromisoformat(r["created_at"]),
            }
        )
    return items, total


def get_result(result_id: str) -> dict[str, Any] | None:
    r = fetchone("SELECT * FROM accelerator_results WHERE id = ?", (result_id,))
    if not r:
        return None
    return {
        "id": r["id"],
        "source_task_id": r["source_task_id"],
        "source_type": r["source_type"],
        "asset_id": r["asset_id"],
        "category": r["category"],
        "test_type": r["test_type"],
        "overall_score": r["overall_score"],
        "data": _loads(r["data_json"], {}),
        "summary": r["summary"] or "",
        "created_at": datetime.fromisoformat(r["created_at"]),
    }


def _comparison_from_row(row) -> AcceleratorComparison:
    cards_ids = _loads(row["cards_json"], [])
    cards: list[AcceleratorAsset] = []
    for aid in cards_ids:
        a = get_asset(aid)
        if a:
            cards.append(a)
    return AcceleratorComparison(
        id=row["id"],
        name=row["name"],
        description=row["description"] or "",
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
        createdBy=row["created_by"],
        creatorId=row["creator_id"],
        cards=cards,
        dimensionWeights=_loads(row["dimension_weights_json"], {}),
        overallAnalysis=_loads(row["overall_analysis_json"], {}),
        dimensionAnalysis=_loads(row["dimension_analysis_json"], []),
        advantageAnalysis=_loads(row["advantage_analysis_json"], []),
        tags=_loads(row["tags_json"], []),
        category=row["category"] or "",
        isPublic=bool(row["is_public"]),
        isStarred=bool(row["is_starred"]),
        version=int(row["version"] or 1),
    )


def _build_comparison_analysis(cards: list[AcceleratorAsset], weights: dict[str, float]):
    if not cards:
        return {}, [], []
    dims = [
        "computePerformance",
        "memoryPerformance",
        "inferenceSpeed",
        "trainingSpeed",
        "energyEfficiency",
        "costEfficiency",
    ]
    if not weights:
        weights = {d: 1.0 for d in dims}
    totals: list[tuple[str, float]] = []
    for c in cards:
        s = c.scores or {}
        val = 0.0
        denom = 0.0
        for d, w in weights.items():
            val += float(s.get(d, 0.0)) * float(w)
            denom += float(w)
        totals.append((c.name, (val / denom) if denom else 0.0))
    totals_sorted = sorted(totals, key=lambda x: x[1], reverse=True)
    overall = {
        "bestCard": totals_sorted[0][0],
        "worstCard": totals_sorted[-1][0],
        "summary": f"{totals_sorted[0][0]} 综合评分最高，{totals_sorted[-1][0]} 综合评分较低。",
    }
    dim_analysis = []
    for d in dims:
        values = [(c.name, float((c.scores or {}).get(d, 0.0))) for c in cards]
        sv = sorted(values, key=lambda x: x[1], reverse=True)
        nums = [v[1] for v in values]
        avg = sum(nums) / len(nums) if nums else 0.0
        std = pstdev(nums) if len(nums) > 1 else 0.0
        dim_analysis.append(
            {
                "dimension": d,
                "bestCard": sv[0][0],
                "worstCard": sv[-1][0],
                "avgScore": round(avg, 2),
                "stdDev": round(std, 2),
                "analysis": f"{d} 维度平均分 {avg:.2f}，离散度 {std:.2f}",
            }
        )
    adv = []
    for c in cards:
        s = c.scores or {}
        top_dims = sorted(dims, key=lambda d: float(s.get(d, 0.0)), reverse=True)
        adv.append(
            {
                "cardName": c.name,
                "advantages": top_dims[:2],
                "disadvantages": top_dims[-2:],
                "recommendedScenarios": c.recommendations or ["通用场景"],
                "matchScore": round(float(s.get("overall", 0.0)), 2),
            }
        )
    return overall, dim_analysis, adv


def create_comparison(req: CreateComparisonRequest) -> AcceleratorComparison:
    report_id = f"acc-comp-{uuid4().hex[:8]}"
    cards: list[AcceleratorAsset] = []
    for cid in req.card_ids:
        c = get_asset(cid)
        if c:
            cards.append(c)
    overall, dim_analysis, adv_analysis = _build_comparison_analysis(cards, req.dimension_weights)
    now = datetime.utcnow().isoformat(timespec="seconds")
    execute(
        """
        INSERT INTO accelerator_comparisons(
            id, name, description, created_at, updated_at, created_by, creator_id,
            cards_json, dimension_weights_json, overall_analysis_json, dimension_analysis_json,
            advantage_analysis_json, tags_json, category, is_public, is_starred, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            report_id,
            req.name,
            req.description,
            now,
            now,
            req.created_by,
            req.creator_id,
            _json(req.card_ids),
            _json(req.dimension_weights),
            _json(overall),
            _json(dim_analysis),
            _json(adv_analysis),
            _json(req.tags),
            req.category,
            1 if req.is_public else 0,
            0,
            1,
        ),
    )
    row = fetchone("SELECT * FROM accelerator_comparisons WHERE id = ?", (report_id,))
    if not row:
        raise RuntimeError("failed to create comparison")
    return _comparison_from_row(row)


def list_comparisons(limit: int = 50, offset: int = 0):
    total_row = fetchone("SELECT COUNT(*) AS c FROM accelerator_comparisons")
    total = int(total_row["c"]) if total_row else 0
    rows = fetchall(
        """
        SELECT * FROM accelerator_comparisons
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
        """,
        (limit, offset),
    )
    return [_comparison_from_row(r) for r in rows], total


def get_comparison(report_id: str) -> AcceleratorComparison | None:
    row = fetchone("SELECT * FROM accelerator_comparisons WHERE id = ?", (report_id,))
    return _comparison_from_row(row) if row else None


def update_comparison(report_id: str, req: UpdateComparisonRequest) -> AcceleratorComparison | None:
    row = fetchone("SELECT * FROM accelerator_comparisons WHERE id = ?", (report_id,))
    if not row:
        return None
    cur = dict(row)
    weights = req.dimension_weights if req.dimension_weights is not None else _loads(cur["dimension_weights_json"], {})
    cards_ids = _loads(cur["cards_json"], [])
    cards = [c for c in (get_asset(aid) for aid in cards_ids) if c]
    overall, dim_analysis, adv = _build_comparison_analysis(cards, weights)
    execute(
        """
        UPDATE accelerator_comparisons
        SET name = ?, description = ?, updated_at = ?, dimension_weights_json = ?,
            overall_analysis_json = ?, dimension_analysis_json = ?, advantage_analysis_json = ?,
            tags_json = ?, category = ?, is_public = ?, is_starred = ?, version = ?
        WHERE id = ?
        """,
        (
            req.name or cur["name"],
            req.description if req.description is not None else cur["description"],
            datetime.utcnow().isoformat(timespec="seconds"),
            _json(weights),
            _json(overall),
            _json(dim_analysis),
            _json(adv),
            _json(req.tags if req.tags is not None else _loads(cur["tags_json"], [])),
            req.category if req.category is not None else cur["category"],
            int(req.is_public) if req.is_public is not None else cur["is_public"],
            int(req.is_starred) if req.is_starred is not None else cur["is_starred"],
            int(cur["version"] or 1) + 1,
            report_id,
        ),
    )
    return get_comparison(report_id)


def delete_comparison(report_id: str) -> bool:
    cur = execute("DELETE FROM accelerator_comparisons WHERE id = ?", (report_id,))
    return cur.rowcount > 0
