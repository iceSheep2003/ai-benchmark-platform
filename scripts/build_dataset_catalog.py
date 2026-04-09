#!/usr/bin/env python3
"""
Build local dataset catalog for benchmark UI.

Output:
- public/datasets/catalog.json
- public/datasets/open-source/<dataset_id>/sample.jsonl
- public/datasets/open-source/<dataset_id>/raw/* (full dataset files when available)
- public/datasets/self-built/<dataset_id>/sample.jsonl
"""

from __future__ import annotations

import json
import random
import gzip
import io
import argparse
import os
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen, Request


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATASETS_DIR = ROOT / "public" / "datasets"
OPEN_SOURCE_DIR = PUBLIC_DATASETS_DIR / "open-source"
SELF_BUILT_DIR = PUBLIC_DATASETS_DIR / "self-built"
CATALOG_PATH = PUBLIC_DATASETS_DIR / "catalog.json"
HF_TOKEN = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
HF_HOME = ROOT / ".cache" / "huggingface"
os.environ.setdefault("HF_HOME", str(HF_HOME))
os.environ.setdefault("HF_HUB_CACHE", str(HF_HOME / "hub"))
os.environ.setdefault("HF_DATASETS_CACHE", str(HF_HOME / "datasets"))


@dataclass
class OpenSourceDatasetSpec:
    id: str
    name: str
    hf_dataset: str
    subset: str | None
    split: str
    task_type: str
    evaluation_dimension: str
    language_distribution: str
    frameworks: list[str]
    hardware_dependencies: list[str]
    tags: list[str]
    github_url: str | None = None
    # None = download all parquet shards for the split; 1 = only first shard (e.g. ImageNet)
    parquet_max_files: int | None = None


OPEN_SOURCE_SPECS: list[OpenSourceDatasetSpec] = [
    OpenSourceDatasetSpec(
        id="mmlu",
        name="MMLU",
        hf_dataset="cais/mmlu",
        subset="all",
        split="test",
        task_type="reasoning",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA", "昇腾", "昆仑芯"],
        tags=["推理", "开源", "MMLU"],
        github_url="https://raw.githubusercontent.com/hendrycks/test/master/data/test/abstract_algebra_test.csv",
    ),
    OpenSourceDatasetSpec(
        id="gsm8k",
        name="GSM8K",
        hf_dataset="gsm8k",
        subset="main",
        split="test",
        task_type="reasoning",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA", "昇腾", "昆仑芯"],
        tags=["数学推理", "开源", "GSM8K"],
        github_url="https://raw.githubusercontent.com/openai/grade-school-math/master/grade_school_math/data/test.jsonl",
    ),
    OpenSourceDatasetSpec(
        id="boolq",
        name="BoolQ",
        hf_dataset="super_glue",
        subset="boolq",
        split="validation",
        task_type="reasoning",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA"],
        tags=["分类", "开源", "BoolQ"],
        github_url="https://raw.githubusercontent.com/google-research-datasets/boolean-questions/master/boolq/dev.jsonl",
    ),
    OpenSourceDatasetSpec(
        id="squad",
        name="SQuAD",
        hf_dataset="squad",
        subset=None,
        split="validation",
        task_type="instruction-following",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch", "TensorFlow"],
        hardware_dependencies=["CUDA"],
        tags=["问答", "开源", "SQuAD"],
        github_url="https://raw.githubusercontent.com/rajpurkar/SQuAD-explorer/master/dataset/dev-v1.1.json",
    ),
    OpenSourceDatasetSpec(
        id="xnli",
        name="XNLI",
        hf_dataset="xnli",
        subset="en",
        split="validation",
        task_type="multilingual-understanding",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA"],
        tags=["多语言", "开源", "XNLI"],
        github_url="https://raw.githubusercontent.com/facebookresearch/XNLI/master/XNLI-1.0/xnli.dev.tsv",
    ),
    OpenSourceDatasetSpec(
        id="mbpp",
        name="MBPP",
        hf_dataset="mbpp",
        subset=None,
        split="test",
        task_type="code-understanding",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA"],
        tags=["代码", "开源", "MBPP"],
        github_url="https://raw.githubusercontent.com/google-research/google-research/master/mbpp/mbpp.jsonl",
    ),
    OpenSourceDatasetSpec(
        id="humaneval",
        name="HumanEval",
        hf_dataset="openai_humaneval",
        subset=None,
        split="test",
        task_type="code-understanding",
        evaluation_dimension="functionality",
        language_distribution="EN",
        frameworks=["PyTorch"],
        hardware_dependencies=["CUDA"],
        tags=["代码", "开源", "HumanEval"],
        github_url="https://raw.githubusercontent.com/openai/human-eval/master/data/HumanEval.jsonl.gz",
    ),
    OpenSourceDatasetSpec(
        id="mnist",
        name="MNIST",
        hf_dataset="mnist",
        subset=None,
        split="test",
        task_type="inference",
        evaluation_dimension="performance",
        language_distribution="N/A",
        frameworks=["PyTorch", "TensorFlow"],
        hardware_dependencies=["CUDA", "昇腾", "昆仑芯"],
        tags=["图像", "开源", "MNIST"],
        github_url=None,
    ),
    OpenSourceDatasetSpec(
        id="imagenet",
        name="ImageNet-1K",
        hf_dataset="ILSVRC/imagenet-1k",
        subset=None,
        split="validation",
        task_type="training",
        evaluation_dimension="performance",
        language_distribution="N/A",
        frameworks=["PyTorch", "TensorFlow"],
        hardware_dependencies=["CUDA", "昇腾", "昆仑芯"],
        tags=["图像", "开源", "ImageNet"],
        github_url=None,
        parquet_max_files=1,
    ),
]


SELF_BUILT_DATASETS: list[dict[str, Any]] = [
    {
        "id": "deepspark_multi",
        "name": "DeepSpark 多卡测试集",
        "taskType": "training",
        "evaluationDimension": "performance",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch"],
        "hardwareDependencies": ["CUDA", "昇腾"],
        "tags": ["自建", "多卡", "吞吐"],
        "sample_template": {"prompt": "run multi-gpu benchmark", "target": "throughput"},
        "sample_count": 300,
    },
    {
        "id": "mlperf",
        "name": "MLPerf 子集（本地整理）",
        "taskType": "training",
        "evaluationDimension": "performance",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch", "TensorFlow"],
        "hardwareDependencies": ["CUDA", "昇腾", "昆仑芯"],
        "tags": ["自建", "MLPerf", "性能"],
        "sample_template": {"prompt": "mlperf_case", "target": "latency"},
        "sample_count": 200,
    },
    {
        "id": "specpower",
        "name": "SpecPower 功耗测试集（自建）",
        "taskType": "inference",
        "evaluationDimension": "performance",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch"],
        "hardwareDependencies": ["CUDA", "昇腾"],
        "tags": ["自建", "功耗", "稳定性"],
        "sample_template": {"prompt": "power_profile_case", "target": "avg_power"},
        "sample_count": 180,
    },
    {
        "id": "deepspark_stability",
        "name": "DeepSpark 稳定性测试集",
        "taskType": "inference",
        "evaluationDimension": "reliability",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch"],
        "hardwareDependencies": ["CUDA", "昇腾"],
        "tags": ["自建", "稳定性", "长稳"],
        "sample_template": {"prompt": "stability_case", "target": "pass"},
        "sample_count": 160,
    },
    {
        "id": "pytorch_compat",
        "name": "PyTorch 兼容性测试集",
        "taskType": "matrix-computation",
        "evaluationDimension": "compatibility",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch"],
        "hardwareDependencies": ["CUDA", "昇腾", "昆仑芯"],
        "tags": ["自建", "兼容性", "PyTorch"],
        "sample_template": {"prompt": "compat_case", "target": "framework_support"},
        "sample_count": 120,
    },
    {
        "id": "tensorflow_compat",
        "name": "TensorFlow 兼容性测试集",
        "taskType": "matrix-computation",
        "evaluationDimension": "compatibility",
        "languageDistribution": "N/A",
        "frameworks": ["TensorFlow"],
        "hardwareDependencies": ["CUDA", "昇腾", "昆仑芯"],
        "tags": ["自建", "兼容性", "TensorFlow"],
        "sample_template": {"prompt": "compat_case", "target": "framework_support"},
        "sample_count": 120,
    },
    {
        "id": "mindspore_compat",
        "name": "MindSpore 兼容性测试集",
        "taskType": "matrix-computation",
        "evaluationDimension": "compatibility",
        "languageDistribution": "N/A",
        "frameworks": ["MindSpore"],
        "hardwareDependencies": ["昇腾"],
        "tags": ["自建", "兼容性", "MindSpore"],
        "sample_template": {"prompt": "compat_case", "target": "framework_support"},
        "sample_count": 120,
    },
    {
        "id": "precision_benchmark",
        "name": "精度基准测试集（自建）",
        "taskType": "matrix-computation",
        "evaluationDimension": "functionality",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch", "TensorFlow"],
        "hardwareDependencies": ["CUDA", "昇腾"],
        "tags": ["自建", "精度", "FP16/BF16"],
        "sample_template": {"prompt": "precision_case", "target": "relative_error"},
        "sample_count": 200,
    },
    {
        "id": "mlperf_precision",
        "name": "MLPerf 精度测试子集",
        "taskType": "matrix-computation",
        "evaluationDimension": "functionality",
        "languageDistribution": "N/A",
        "frameworks": ["PyTorch", "TensorFlow"],
        "hardwareDependencies": ["CUDA", "昇腾"],
        "tags": ["自建", "精度", "MLPerf"],
        "sample_template": {"prompt": "precision_case", "target": "accuracy"},
        "sample_count": 200,
    },
]


def _to_preview_record(record: dict[str, Any]) -> dict[str, Any]:
    def _safe_value(value: Any) -> Any:
        if isinstance(value, (str, int, float, bool)) or value is None:
            return value
        if isinstance(value, list):
            return [_safe_value(v) for v in value[:8]]
        if isinstance(value, dict):
            items = list(value.items())[:8]
            return {str(k): _safe_value(v) for k, v in items}
        return str(value)

    preview_keys = [
        "question",
        "answer",
        "instruction",
        "output",
        "prompt",
        "target",
        "text",
        "label",
        "task",
    ]
    out: dict[str, Any] = {}
    for key in preview_keys:
        if key in record and record[key] not in (None, ""):
            out[key] = _safe_value(record[key])
    if not out:
        # Keep at most 4 keys for stable preview
        for key in list(record.keys())[:4]:
            out[key] = _safe_value(record[key])
    return out


def _load_hf_dataset(spec: OpenSourceDatasetSpec) -> list[dict[str, Any]]:
    query: dict[str, str] = {
        "dataset": spec.hf_dataset,
        "split": spec.split,
    }
    if spec.subset:
        query["config"] = spec.subset
    api_url = "https://datasets-server.huggingface.co/first-rows?" + urlencode(query)
    req = Request(api_url, headers=_request_headers())
    with urlopen(req, timeout=60) as resp:  # noqa: S310
        payload = json.loads(resp.read().decode("utf-8"))
    rows = payload.get("rows", [])
    out: list[dict[str, Any]] = []
    for item in rows[:200]:
        row = item.get("row", {})
        if isinstance(row, dict):
            out.append(row)
    if not out:
        raise RuntimeError(f"no rows returned from datasets-server for {spec.id}")
    return out


def _api_json(base_url: str, query: dict[str, str]) -> dict[str, Any]:
    url = base_url + "?" + urlencode(query)
    req = Request(url, headers=_request_headers())
    with urlopen(req, timeout=60) as resp:  # noqa: S310
        return json.loads(resp.read().decode("utf-8"))


def _request_headers() -> dict[str, str]:
    headers = {"User-Agent": "ai-benchmark-platform-dataset-sync/1.0"}
    if HF_TOKEN:
        headers["Authorization"] = f"Bearer {HF_TOKEN}"
    return headers


def _download_url_to_file(url: str, output_path: Path) -> None:
    req = Request(url, headers=_request_headers())
    with urlopen(req, timeout=180) as resp:  # noqa: S310
        content = resp.read()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(content)


def _download_hf_full(spec: OpenSourceDatasetSpec, dataset_dir: Path) -> dict[str, Any]:
    query: dict[str, str] = {"dataset": spec.hf_dataset}
    if spec.subset:
        query["config"] = spec.subset
    payload = _api_json("https://datasets-server.huggingface.co/parquet", query)
    parquet_files = payload.get("parquet_files", [])
    if not parquet_files:
        raise RuntimeError("no parquet files from datasets-server")

    raw_dir = dataset_dir / "raw" / "parquet"
    raw_dir.mkdir(parents=True, exist_ok=True)

    downloaded_files: list[str] = []
    row_count = 0
    max_files = spec.parquet_max_files
    for idx, file_info in enumerate(parquet_files):
        split = file_info.get("split")
        if split and split != spec.split:
            continue
        url = file_info.get("url")
        if not url:
            continue
        num_rows = int(file_info.get("num_rows") or 0)
        row_count += num_rows
        filename = Path(url).name or f"part-{idx}.parquet"
        out_path = raw_dir / filename
        _download_url_to_file(url, out_path)
        downloaded_files.append(f"/datasets/open-source/{spec.id}/raw/parquet/{filename}")
        if max_files is not None and len(downloaded_files) >= max_files:
            break

    if not downloaded_files:
        raise RuntimeError(f"no parquet file matched split={spec.split}")

    return {
        "mode": "hf_parquet",
        "rowCount": row_count if row_count > 0 else None,
        "fullFiles": downloaded_files,
    }


def _download_single_parquet_via_hub(spec: OpenSourceDatasetSpec, dataset_dir: Path) -> dict[str, Any]:
    """Download exactly one .parquet from a gated Hub dataset repo (no full snapshot)."""
    try:
        from huggingface_hub import HfApi, hf_hub_download  # type: ignore
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"huggingface_hub is not available: {exc}") from exc

    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN is required for gated datasets like ImageNet")

    api = HfApi(token=HF_TOKEN)
    files = api.list_repo_files(spec.hf_dataset, repo_type="dataset")
    parquet_paths = [f for f in files if f.endswith(".parquet")]
    if not parquet_paths:
        raise RuntimeError(f"no .parquet files listed for {spec.hf_dataset}")

    split_lower = spec.split.lower()
    preferred = [p for p in parquet_paths if split_lower in p.replace("\\", "/").lower()]
    chosen = sorted(preferred or parquet_paths)[0]

    cached = hf_hub_download(
        repo_id=spec.hf_dataset,
        filename=chosen,
        repo_type="dataset",
        token=HF_TOKEN,
    )
    raw_dir = dataset_dir / "raw" / "parquet"
    raw_dir.mkdir(parents=True, exist_ok=True)
    dest_name = Path(chosen).name
    dest = raw_dir / dest_name
    shutil.copy2(cached, dest)

    row_count: int | None = None
    try:
        import pyarrow.parquet as pq  # type: ignore

        meta = pq.read_metadata(dest)
        row_count = int(meta.num_rows)
    except Exception:
        pass

    rel = f"/datasets/open-source/{spec.id}/raw/parquet/{dest_name}"
    preview_rows: list[dict[str, Any]] = []
    try:
        import pyarrow.parquet as pq  # type: ignore

        table = pq.read_table(dest, columns=None)
        max_rows = min(int(table.num_rows), 200)
        for i in range(max_rows):
            row = {k: table.column(k)[i].as_py() for k in table.column_names}
            preview_rows.append(row)
    except Exception:
        preview_rows = [{"note": "parquet downloaded; preview parse skipped", "file": dest_name}]

    return {
        "mode": "hf_hub_single_parquet",
        "rowCount": row_count,
        "fullFiles": [rel],
        "previewRows": preview_rows,
    }


def _download_with_hf_datasets(spec: OpenSourceDatasetSpec, dataset_dir: Path) -> dict[str, Any]:
    try:
        from datasets import Image, load_dataset  # type: ignore
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(f"datasets package is not available: {exc}") from exc

    raw_dir = dataset_dir / "raw" / "hf"
    raw_dir.mkdir(parents=True, exist_ok=True)
    load_kwargs: dict[str, Any] = {"split": spec.split}
    if HF_TOKEN:
        load_kwargs["token"] = HF_TOKEN
    if spec.subset:
        dataset = load_dataset(spec.hf_dataset, spec.subset, **load_kwargs)
    else:
        dataset = load_dataset(spec.hf_dataset, **load_kwargs)

    # Avoid Pillow dependency for preview extraction on image datasets.
    for column_name, feature in dataset.features.items():
        if feature.__class__.__name__ == "Image":
            dataset = dataset.cast_column(column_name, Image(decode=False))

    dataset.save_to_disk(str(raw_dir))

    preview_rows: list[dict[str, Any]] = []
    preview_count = min(int(dataset.num_rows), 200)
    for i in range(preview_count):
        row = dataset[i]
        if isinstance(row, dict):
            preview_rows.append(row)

    return {
        "mode": "hf_datasets",
        "rowCount": int(dataset.num_rows),
        "fullFiles": [f"/datasets/open-source/{spec.id}/raw/hf"],
        "previewRows": preview_rows,
    }


def _load_from_github(spec: OpenSourceDatasetSpec) -> list[dict[str, Any]]:
    if not spec.github_url:
        raise RuntimeError("github_url is not configured")
    req = Request(spec.github_url, headers=_request_headers())
    with urlopen(req, timeout=60) as resp:  # noqa: S310
        raw_bytes = resp.read()

    if spec.github_url.endswith(".jsonl"):
        rows = []
        for line in raw_bytes.decode("utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
        return rows

    if spec.github_url.endswith(".jsonl.gz"):
        with gzip.GzipFile(fileobj=io.BytesIO(raw_bytes)) as gz:
            text = gz.read().decode("utf-8", errors="ignore")
        rows = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
        return rows

    if spec.github_url.endswith(".csv"):
        lines = raw_bytes.decode("utf-8", errors="ignore").splitlines()
        if not lines:
            return []
        header = lines[0].split(",")
        out = []
        for line in lines[1:]:
            cols = line.split(",")
            row = {header[i]: cols[i] if i < len(cols) else "" for i in range(len(header))}
            out.append(row)
        return out

    if spec.github_url.endswith(".tsv"):
        lines = raw_bytes.decode("utf-8", errors="ignore").splitlines()
        if not lines:
            return []
        header = lines[0].split("\t")
        out = []
        for line in lines[1:]:
            cols = line.split("\t")
            row = {header[i]: cols[i] if i < len(cols) else "" for i in range(len(header))}
            out.append(row)
        return out

    if spec.id == "squad":
        payload = json.loads(raw_bytes.decode("utf-8", errors="ignore"))
        out: list[dict[str, Any]] = []
        for article in payload.get("data", []):
            title = article.get("title", "")
            for paragraph in article.get("paragraphs", []):
                context = paragraph.get("context", "")
                for qa in paragraph.get("qas", []):
                    answers = qa.get("answers", [])
                    answer = answers[0].get("text", "") if answers else ""
                    out.append(
                        {
                            "title": title,
                            "context": context[:400],
                            "question": qa.get("question", ""),
                            "answer": answer,
                        }
                    )
        return out

    raise RuntimeError("unsupported github dataset format")


def _download_full_from_github(spec: OpenSourceDatasetSpec, dataset_dir: Path) -> dict[str, Any]:
    if not spec.github_url:
        raise RuntimeError("github_url is not configured")

    raw_dir = dataset_dir / "raw" / "source"
    raw_dir.mkdir(parents=True, exist_ok=True)
    source_ext = "".join(Path(spec.github_url).suffixes) or ".txt"
    source_name = f"{spec.id}{source_ext}"
    source_path = raw_dir / source_name
    _download_url_to_file(spec.github_url, source_path)
    rows = _load_from_github(spec)
    return {
        "mode": "github_raw",
        "rowCount": len(rows),
        "fullFiles": [f"/datasets/open-source/{spec.id}/raw/source/{source_name}"],
        "previewRows": rows[:200],
    }


def _write_jsonl(file_path: Path, rows: list[dict[str, Any]]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def build_open_source_entries(full_download: bool = True) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for spec in OPEN_SOURCE_SPECS:
        dataset_dir = OPEN_SOURCE_DIR / spec.id
        sample_rows: list[dict[str, Any]]
        full_files: list[str] = []
        row_count: int | None = None
        download_mode = "preview_only"
        error_text: str | None = None
        if full_download:
            single_parquet_only = spec.parquet_max_files == 1
            try:
                full_meta = _download_hf_full(spec, dataset_dir)
                full_files = full_meta.get("fullFiles", [])
                row_count = full_meta.get("rowCount")
                download_mode = full_meta.get("mode", "hf_parquet")
                rows = _load_hf_dataset(spec)
                sample_rows = [_to_preview_record(r) for r in rows[:200]]
            except Exception as hf_exc:  # noqa: BLE001
                hf_error = str(hf_exc)
                try:
                    if single_parquet_only:
                        full_meta = _download_single_parquet_via_hub(spec, dataset_dir)
                        full_files = full_meta.get("fullFiles", [])
                        row_count = full_meta.get("rowCount")
                        rows = full_meta.get("previewRows", [])
                        sample_rows = [_to_preview_record(r) for r in rows[:200]]
                        download_mode = full_meta.get("mode", "hf_hub_single_parquet")
                        error_text = None
                    else:
                        full_meta = _download_with_hf_datasets(spec, dataset_dir)
                        full_files = full_meta.get("fullFiles", [])
                        row_count = full_meta.get("rowCount")
                        rows = full_meta.get("previewRows", [])
                        sample_rows = [_to_preview_record(r) for r in rows[:200]]
                        download_mode = full_meta.get("mode", "hf_datasets")
                        error_text = f"hf parquet download failed, fallback to datasets lib: {hf_error}"
                except Exception as hf_lib_exc:  # noqa: BLE001
                    hf_lib_error = str(hf_lib_exc)
                    if single_parquet_only:
                        try:
                            full_meta = _download_with_hf_datasets(spec, dataset_dir)
                            full_files = full_meta.get("fullFiles", [])
                            row_count = full_meta.get("rowCount")
                            rows = full_meta.get("previewRows", [])
                            sample_rows = [_to_preview_record(r) for r in rows[:200]]
                            download_mode = full_meta.get("mode", "hf_datasets")
                            error_text = (
                                f"{hf_error}; single-parquet Hub fallback failed: {hf_lib_error}; "
                                "fallback to datasets lib (full split — avoid for ImageNet)"
                            )
                        except Exception as ds_exc:  # noqa: BLE001
                            hf_lib_error = f"{hf_lib_error}; datasets lib: {ds_exc}"
                            try:
                                full_meta = _download_full_from_github(spec, dataset_dir)
                                full_files = full_meta.get("fullFiles", [])
                                row_count = full_meta.get("rowCount")
                                rows = full_meta.get("previewRows", [])
                                sample_rows = [_to_preview_record(r) for r in rows[:200]]
                                download_mode = full_meta.get("mode", "github_raw")
                                error_text = f"{hf_error}; hub+datasets failed: {hf_lib_error}; github fallback"
                            except Exception as github_exc:  # noqa: BLE001
                                error_text = f"{hf_error}; hub+datasets+github failed: {hf_lib_error}; {github_exc}"
                                sample_rows = [
                                    {
                                        "prompt": f"fallback sample for {spec.id}",
                                        "target": "N/A",
                                        "note": "download failed, using fallback sample",
                                    }
                                ]
                                row_count = len(sample_rows)
                    else:
                        try:
                            full_meta = _download_full_from_github(spec, dataset_dir)
                            full_files = full_meta.get("fullFiles", [])
                            row_count = full_meta.get("rowCount")
                            rows = full_meta.get("previewRows", [])
                            sample_rows = [_to_preview_record(r) for r in rows[:200]]
                            download_mode = full_meta.get("mode", "github_raw")
                            error_text = f"{hf_error}; datasets lib fallback failed: {hf_lib_error}; fallback to github full download"
                        except Exception as github_exc:  # noqa: BLE001
                            error_text = f"{hf_error}; datasets lib fallback failed: {hf_lib_error}; github full fallback failed: {github_exc}"
                            sample_rows = [
                                {
                                    "prompt": f"fallback sample for {spec.id}",
                                    "target": "N/A",
                                    "note": "download failed, using fallback sample",
                                }
                            ]
                            row_count = len(sample_rows)
        else:
            try:
                rows = _load_hf_dataset(spec)
                sample_rows = [_to_preview_record(r) for r in rows[:200]]
                row_count = len(sample_rows)
                download_mode = "preview_only"
            except Exception as exc:  # noqa: BLE001
                hf_error = str(exc)
                try:
                    rows = _load_from_github(spec)
                    sample_rows = [_to_preview_record(r) for r in rows[:200]]
                    row_count = len(rows)
                    download_mode = "preview_only_github"
                    error_text = f"datasets-server failed, preview fallback to github source: {hf_error}"
                except Exception as github_exc:  # noqa: BLE001
                    error_text = f"{hf_error}; github fallback failed: {github_exc}"
                    sample_rows = [
                        {
                            "prompt": f"fallback sample for {spec.id}",
                            "target": "N/A",
                            "note": "download failed, using fallback sample",
                        }
                    ]
                    row_count = len(sample_rows)

        output_file = dataset_dir / "sample.jsonl"
        _write_jsonl(output_file, sample_rows)

        full_download_ok = bool(full_files) if full_download else error_text is None
        entry = {
            "id": spec.id,
            "name": spec.name,
            "version": "1.0",
            "taskType": spec.task_type,
            "evaluationDimension": spec.evaluation_dimension,
            "sampleCount": row_count if row_count is not None else len(sample_rows),
            "qualityScore": 90 if full_download_ok else 65,
            "languageDistribution": spec.language_distribution,
            "hardwareDependencies": spec.hardware_dependencies,
            "frameworks": spec.frameworks,
            "source": "open-source",
            "updatedAt": datetime.now().isoformat(),
            "createdAt": datetime.now().isoformat(),
            "versions": [
                {
                    "version": "1.0",
                    "createdAt": datetime.now().isoformat(),
                    "changes": ["初始导入到本地数据集库"],
                }
            ],
            "tags": spec.tags,
            "files": {
                "sample": f"/datasets/open-source/{spec.id}/sample.jsonl",
                "full": full_files,
            },
            "previewData": sample_rows[:50],
            "downloadMode": download_mode,
            "downloadStatus": "ok" if full_download_ok else "fallback",
        }
        if error_text:
            entry["downloadError"] = error_text
        entries.append(entry)

    return entries


def build_self_built_entries() -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    owners = [
        ("Admin User", "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"),
        ("Developer A", "https://api.dicebear.com/7.x/avataaars/svg?seed=DevA"),
        ("Researcher B", "https://api.dicebear.com/7.x/avataaars/svg?seed=ResB"),
        ("Engineer C", "https://api.dicebear.com/7.x/avataaars/svg?seed=EngC"),
    ]
    for idx, spec in enumerate(SELF_BUILT_DATASETS):
        rows: list[dict[str, Any]] = []
        for i in range(spec["sample_count"]):
            row = {
                "id": i + 1,
                "task": spec["id"],
                **spec["sample_template"],
                "seed": random.randint(1, 10_000),
            }
            rows.append(row)

        output_file = SELF_BUILT_DIR / spec["id"] / "sample.jsonl"
        _write_jsonl(output_file, rows)

        owner, avatar = owners[idx % len(owners)]
        entries.append(
            {
                "id": spec["id"],
                "name": spec["name"],
                "version": "1.0",
                "taskType": spec["taskType"],
                "evaluationDimension": spec["evaluationDimension"],
                "sampleCount": len(rows),
                "qualityScore": 85,
                "languageDistribution": spec["languageDistribution"],
                "hardwareDependencies": spec["hardwareDependencies"],
                "frameworks": spec["frameworks"],
                "source": "self-built",
                "uploadedBy": owner,
                "uploadedByAvatar": avatar,
                "updatedAt": datetime.now().isoformat(),
                "createdAt": datetime.now().isoformat(),
                "versions": [
                    {
                        "version": "1.0",
                        "createdAt": datetime.now().isoformat(),
                        "changes": ["基于当前评测配置初始化数据集"],
                    }
                ],
                "tags": spec["tags"],
                "files": {
                    "sample": f"/datasets/self-built/{spec['id']}/sample.jsonl",
                },
                "previewData": rows[:50],
            }
        )
    return entries


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build local dataset catalog")
    parser.add_argument(
        "--preview-only",
        action="store_true",
        help="Only fetch preview rows, skip full dataset files",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    OPEN_SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    SELF_BUILT_DIR.mkdir(parents=True, exist_ok=True)

    open_source_entries = build_open_source_entries(full_download=not args.preview_only)
    self_built_entries = build_self_built_entries()
    catalog = {
        "generatedAt": datetime.now().isoformat(),
        "datasets": [*open_source_entries, *self_built_entries],
    }
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Dataset catalog generated: {CATALOG_PATH}")
    print(f"Total datasets: {len(catalog['datasets'])}")


if __name__ == "__main__":
    main()
