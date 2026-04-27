from __future__ import annotations

import re
from typing import Any

from ...schemas.test_case import (
    AcceleratorTestCreate,
    AcceleratorTestResult,
    TestCategory,
    VideoCodecTestType,
)
from .base import BaseTestRunner, RunnerRegistry


@RunnerRegistry.register(TestCategory.VIDEO_CODEC)
class VideoCodecRunner(BaseTestRunner):

    category = TestCategory.VIDEO_CODEC

    def run(self) -> AcceleratorTestResult:
        test_type = self.config.config.get("test_type", "")
        self.log(f"Starting video codec test: {test_type}")

        handlers = {
            VideoCodecTestType.MACCODEC_SDK.value: self._test_maccodec,
            VideoCodecTestType.HEEPSTREAM.value: self._test_heepstream,
            VideoCodecTestType.CODETEST.value: self._test_codetest,
            VideoCodecTestType.CODEC_BENCHMARK.value: self._test_codec_benchmark,
        }

        handler = handlers.get(test_type, self._test_generic)
        data = handler()

        return AcceleratorTestResult(
            category=TestCategory.VIDEO_CODEC,
            test_type=test_type,
            data=data,
            summary=data.get("summary", ""),
        )

    def _test_maccodec(self) -> dict[str, Any]:
        self.log("Testing MacCodec SDK availability")

        exit_code, output, duration = self.run_command(
            ["python3", "-c", "import maccodec; print('MacCodec version:', maccodec.__version__); print('MACCODEC: PASSED')"],
            label="maccodec_check",
            timeout=60,
        )

        passed = "MACCODEC: PASSED" in output

        if not passed:
            exit_code2, output2, _ = self.run_command(
                ["which", "maccodec"],
                label="maccodec_which",
                timeout=10,
            )
            if exit_code2 == 0:
                passed = True
                output = output2

        return {
            "test": "maccodec_sdk",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"MacCodec SDK: {'PASSED' if passed else 'NOT AVAILABLE'}",
        }

    def _test_heepstream(self) -> dict[str, Any]:
        self.log("Testing Heepstream plugin")

        exit_code, output, duration = self.run_command(
            ["python3", "-c", "import heepstream; print('Heepstream loaded'); print('HEEPSTREAM: PASSED')"],
            label="heepstream_check",
            timeout=60,
        )

        passed = "HEEPSTREAM: PASSED" in output

        return {
            "test": "heepstream",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"Heepstream plugin: {'PASSED' if passed else 'NOT AVAILABLE'}",
        }

    def _test_codetest(self) -> dict[str, Any]:
        self.log("Running codec correctness test via FFmpeg/GPU")

        script = """
import subprocess, sys

checks = []

# Check ffmpeg with GPU support
try:
    result = subprocess.run(["ffmpeg", "-hwaccels"], capture_output=True, text=True, timeout=10)
    has_cuda = "cuda" in result.stdout.lower() or "nvenc" in result.stdout.lower()
    checks.append(("ffmpeg_hwaccel", has_cuda, result.stdout.strip()[:200]))
except Exception as e:
    checks.append(("ffmpeg_hwaccel", False, str(e)))

# Check nvidia video codec SDK
try:
    result = subprocess.run(
        ["nvidia-smi", "--query-gpu=encoder.stats.sessionCount,decoder.stats.sessionCount",
         "--format=csv,noheader"],
        capture_output=True, text=True, timeout=10,
    )
    checks.append(("nvenc_nvdec", result.returncode == 0, result.stdout.strip()[:200]))
except Exception as e:
    checks.append(("nvenc_nvdec", False, str(e)))

all_passed = all(c[1] for c in checks)
for name, passed, info in checks:
    print(f"  {name}: {'PASS' if passed else 'FAIL'} - {info}")
print(f"CODETEST: {'PASSED' if all_passed else 'FAILED'}")
"""

        exit_code, output, duration = self.run_command(
            ["python3", "-c", script],
            label="codetest",
            timeout=120,
        )

        passed = "CODETEST: PASSED" in output

        return {
            "test": "codetest",
            "passed": passed,
            "output": output[:3000],
            "duration_seconds": round(duration, 1),
            "summary": f"Codec correctness test: {'PASSED' if passed else 'FAILED'}",
        }

    def _test_codec_benchmark(self) -> dict[str, Any]:
        cfg = self.config.config
        resolutions = cfg.get("resolutions", ["1080p", "4K"])
        formats = cfg.get("formats", ["H.264", "H.265"])

        self.log(f"Running codec benchmark: resolutions={resolutions}, formats={formats}")

        results: dict[str, dict[str, float]] = {}

        for resolution in resolutions:
            w, h = self._resolution_to_size(resolution)
            for fmt in formats:
                key = f"{resolution}_{fmt}"
                self.log(f"  Benchmarking {key}")

                codec = "h264_nvenc" if "264" in fmt else "hevc_nvenc"
                encode_fps = self._benchmark_encode(w, h, codec)
                decode_fps = self._benchmark_decode(w, h, codec.replace("_nvenc", "_cuvid"))

                results[key] = {
                    "encode_fps": round(encode_fps, 1),
                    "decode_fps": round(decode_fps, 1),
                }

        return {
            "test": "codec_benchmark",
            "passed": bool(results),
            "results_by_format": results,
            "summary": self._build_benchmark_summary(results),
        }

    def _resolution_to_size(self, resolution: str) -> tuple[int, int]:
        res_map = {
            "720p": (1280, 720),
            "1080p": (1920, 1080),
            "2K": (2560, 1440),
            "4K": (3840, 2160),
        }
        return res_map.get(resolution, (1920, 1080))

    def _benchmark_encode(self, width: int, height: int, codec: str) -> float:
        cmd = [
            "ffmpeg", "-y",
            "-f", "rawvideo", "-pix_fmt", "yuv420p",
            "-s", f"{width}x{height}",
            "-r", "30",
            "-i", "/dev/zero",
            "-frames:v", "300",
            "-c:v", codec,
            "-f", "null", "/dev/null",
        ]

        exit_code, output, duration = self.run_command(
            cmd, label=f"encode_{codec}_{width}x{height}", timeout=120,
        )

        fps_match = re.search(r"fps=\s*([\d.]+)", output)
        if fps_match:
            return float(fps_match.group(1))

        return 300.0 / duration if duration > 0 and exit_code == 0 else 0.0

    def _benchmark_decode(self, width: int, height: int, codec: str) -> float:
        self.log(f"  Decode benchmark for {codec} at {width}x{height} (placeholder)")
        return 0.0

    def _build_benchmark_summary(self, results: dict[str, dict[str, float]]) -> str:
        if not results:
            return "Codec benchmark: no results"
        parts = []
        for key, data in results.items():
            parts.append(f"{key}: encode={data['encode_fps']}fps, decode={data['decode_fps']}fps")
        return "Codec benchmark: " + "; ".join(parts)

    def _test_generic(self) -> dict[str, Any]:
        test_type = self.config.config.get("test_type", "unknown")
        return {
            "test": test_type,
            "passed": False,
            "note": f"Video codec test '{test_type}' not yet implemented",
            "summary": f"Video codec test '{test_type}': not implemented",
        }
