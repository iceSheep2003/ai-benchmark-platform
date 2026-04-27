#!/usr/bin/env python3
"""
Convert local dataset shards under public/datasets/open-source/*/raw/
into one test.jsonl per dataset (UTF-8, one JSON object per line).

Supported source layouts:
- raw/parquet/*.parquet
- raw/hf/ (HuggingFace save_to_disk directory, underlying Arrow files)

If rows contain image bytes (or local image paths), write images into:
  <dataset_dir>/image/
and store relative paths (e.g. "image/image_00000001.jpg") in test.jsonl.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OPEN_SOURCE = ROOT / "public" / "datasets" / "open-source"


def _guess_ext(blob: bytes) -> str:
    if blob.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if blob.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if blob.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if len(blob) >= 12 and blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        return "webp"
    if blob.startswith(b"BM"):
        return "bmp"
    if blob.startswith((b"II*\x00", b"MM\x00*")):
        return "tiff"
    return "bin"


def _safe_key_name(name: str) -> str:
    sanitized = re.sub(r"[^a-zA-Z0-9_]+", "_", name).strip("_")
    return sanitized or "image"


def _save_binary_as_image(blob: bytes, image_dir: Path, field_key: str, counter: list[int]) -> str:
    image_dir.mkdir(parents=True, exist_ok=True)
    counter[0] += 1
    ext = _guess_ext(blob)
    file_name = f"{_safe_key_name(field_key)}_{counter[0]:08d}.{ext}"
    target = image_dir / file_name
    target.write_bytes(blob)
    return str(Path("image") / file_name)


def _save_local_path_as_image(path_value: str, image_dir: Path, field_key: str, counter: list[int]) -> str | None:
    src = Path(path_value)
    if not src.exists() or not src.is_file():
        return None
    image_dir.mkdir(parents=True, exist_ok=True)
    counter[0] += 1
    ext = src.suffix.lstrip(".").lower() or "bin"
    file_name = f"{_safe_key_name(field_key)}_{counter[0]:08d}.{ext}"
    target = image_dir / file_name
    shutil.copy2(src, target)
    return str(Path("image") / file_name)


def _json_safe(value: object, image_dir: Path, field_key: str, counter: list[int]) -> object:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, bytes):
        return _save_binary_as_image(value, image_dir, field_key, counter)
    if isinstance(value, dict):
        b = value.get("bytes")
        if isinstance(b, bytes):
            relative_path = _save_binary_as_image(b, image_dir, field_key, counter)
            extra = {
                str(k): _json_safe(v, image_dir, f"{field_key}_{k}", counter)
                for k, v in value.items()
                if k not in ("bytes", "path")
            }
            if extra:
                return {"path": relative_path, **extra}
            return relative_path
        p = value.get("path")
        if isinstance(p, str):
            relative_path = _save_local_path_as_image(p, image_dir, field_key, counter)
            if relative_path:
                extra = {
                    str(k): _json_safe(v, image_dir, f"{field_key}_{k}", counter)
                    for k, v in value.items()
                    if k != "path"
                }
                if extra:
                    return {"path": relative_path, **extra}
                return relative_path
        return {
            str(k): _json_safe(v, image_dir, f"{field_key}_{k}", counter)
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_json_safe(v, image_dir, f"{field_key}_{idx}", counter) for idx, v in enumerate(value)]
    return str(value)


def _pick_parquet_files(parquet_dir: Path) -> list[Path]:
    return sorted(parquet_dir.glob("*.parquet"))


def parquet_dir_to_test_jsonl(dataset_dir: Path, parquet_dir: Path, out_path: Path) -> tuple[int, list[str], int]:
    import pyarrow.parquet as pq  # type: ignore

    files = _pick_parquet_files(parquet_dir)
    if not files:
        return 0, [], 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    image_dir = dataset_dir / "image"
    if image_dir.exists():
        shutil.rmtree(image_dir)

    total = 0
    sources: list[str] = []
    image_counter = [0]
    with out_path.open("w", encoding="utf-8") as out:
        for pf in files:
            table = pq.read_table(pf, columns=None)
            cols = table.column_names
            n = int(table.num_rows)
            for i in range(n):
                row = {
                    c: _json_safe(table.column(c)[i].as_py(), image_dir, c, image_counter)
                    for c in cols
                }
                out.write(json.dumps(row, ensure_ascii=False) + "\n")
                total += 1
            sources.append(pf.name)
    return total, sources, image_counter[0]


def hf_dir_to_test_jsonl(dataset_dir: Path, hf_dir: Path, out_path: Path) -> tuple[int, list[str], int]:
    from datasets import Image, load_from_disk  # type: ignore

    out_path.parent.mkdir(parents=True, exist_ok=True)
    image_dir = dataset_dir / "image"
    if image_dir.exists():
        shutil.rmtree(image_dir)

    dataset = load_from_disk(str(hf_dir))
    if not hasattr(dataset, "num_rows"):
        raise RuntimeError("raw/hf path is not a Dataset split; expected a single split dataset")

    # Keep image bytes/path available without Pillow decode.
    for column_name, feature in dataset.features.items():
        if feature.__class__.__name__ == "Image":
            dataset = dataset.cast_column(column_name, Image(decode=False))

    total = 0
    image_counter = [0]
    sources = [p.name for p in sorted(hf_dir.glob("*.arrow"))]
    with out_path.open("w", encoding="utf-8") as out:
        for i in range(int(dataset.num_rows)):
            raw_row = dataset[i]
            row = {
                str(k): _json_safe(v, image_dir, str(k), image_counter)
                for k, v in raw_row.items()
            }
            out.write(json.dumps(row, ensure_ascii=False) + "\n")
            total += 1
    return total, sources, image_counter[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Parquet/Arrow(HF) -> test.jsonl under open-source datasets")
    parser.add_argument(
        "--open-source-dir",
        type=Path,
        default=DEFAULT_OPEN_SOURCE,
        help="Root folder containing dataset subdirs (default: public/datasets/open-source)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions only, do not write files",
    )
    args = parser.parse_args()
    base: Path = args.open_source_dir.resolve()

    if not base.is_dir():
        raise SystemExit(f"Not a directory: {base}")

    summary: list[tuple[str, int, int, list[str]]] = []
    for dataset_dir in sorted(p for p in base.iterdir() if p.is_dir()):
        parquet_dir = dataset_dir / "raw" / "parquet"
        hf_dir = dataset_dir / "raw" / "hf"
        parquet_files = _pick_parquet_files(parquet_dir) if parquet_dir.is_dir() else []
        use_hf = not parquet_files and hf_dir.is_dir()
        if not parquet_files and not use_hf:
            continue
        out_path = dataset_dir / "test.jsonl"
        if args.dry_run:
            if parquet_files:
                print(
                    f"[dry-run] {dataset_dir.name}: {len(parquet_files)} parquet(s) "
                    f"-> {out_path.relative_to(ROOT)}"
                )
            else:
                print(f"[dry-run] {dataset_dir.name}: raw/hf -> {out_path.relative_to(ROOT)}")
            continue
        if parquet_files:
            n, used, image_count = parquet_dir_to_test_jsonl(dataset_dir, parquet_dir, out_path)
            source_label = "parquet"
        else:
            n, used, image_count = hf_dir_to_test_jsonl(dataset_dir, hf_dir, out_path)
            source_label = "hf-arrow"
        summary.append((dataset_dir.name, n, image_count, used))
        print(
            f"{dataset_dir.name}: wrote {n} lines, {image_count} images -> "
            f"{out_path.relative_to(ROOT)} [{source_label}] (from {', '.join(used) if used else 'n/a'})"
        )

    if args.dry_run:
        return
    if not summary:
        print("No raw/parquet directories with .parquet files found.")
    else:
        print(f"Done. {len(summary)} dataset(s) processed.")


if __name__ == "__main__":
    main()
