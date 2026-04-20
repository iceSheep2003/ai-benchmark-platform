from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class TestCategory(str, Enum):
    CHIP_BASIC = "chip_basic"
    MODEL_TRAINING = "model_training"
    MODEL_INFERENCE = "model_inference"
    MODEL_ACCURACY = "model_accuracy"
    ECOSYSTEM_COMPAT = "ecosystem_compat"
    VIDEO_CODEC = "video_codec"


class ChipBasicTestType(str, Enum):
    INTER_CHIP_BANDWIDTH = "inter_chip_bandwidth"
    MEMORY_BANDWIDTH = "memory_bandwidth"
    COMPUTE_POWER = "compute_power"
    POWER_CONSUMPTION = "power_consumption"
    STABILITY = "stability"


class TrainingTestType(str, Enum):
    RESNET50 = "resnet50"
    YOLOV5_L = "yolov5_l"
    LLAMA3_8B = "llama3_8b"
    QWEN3_8B = "qwen3_8b"


class InferenceTestType(str, Enum):
    DEEPSEEK_V3 = "deepseek_v3"
    DEEPSEEK_R1_INT8 = "deepseek_r1_int8"
    DEEPSEEK_R1_DISTILL_QWEN_32B = "deepseek_r1_distill_qwen_32b"
    QWEN3_32B = "qwen3_32b"
    GLM4_W8A8 = "glm4_w8a8"
    YAYI = "yayi"
    BERT = "bert"


class AccuracyTestType(str, Enum):
    OPENCOMPASS_DEEPSEEK_R1 = "opencompass_deepseek_r1"
    EVALSCOPE_DEEPSEEK_R1 = "evalscope_deepseek_r1"


class EcosystemTestType(str, Enum):
    VERL_MIXTRAL_8X7B = "verl_mixtral_8x7b"
    VERL_QWEN25_GPRO = "verl_qwen25_gpro"
    RAG_EMBEDDING = "rag_embedding"
    RAG_RERANK = "rag_rerank"
    CUDA_MIGRATION = "cuda_migration"
    GPU_VIRTUALIZATION = "gpu_virtualization"


class VideoCodecTestType(str, Enum):
    MACCODEC_SDK = "maccodec_sdk"
    HEEPSTREAM = "heepstream"
    CODETEST = "codetest"
    CODEC_BENCHMARK = "codec_benchmark"


class DataPrecision(str, Enum):
    FP64 = "FP64"
    FP32 = "FP32"
    TF32 = "TF32"
    BF16 = "BF16"
    FP16 = "FP16"
    INT8 = "INT8"
    W8A8 = "W8A8"


class InferenceFramework(str, Enum):
    VLLM = "vllm"
    LMDEPLOY = "lmdeploy"
    MIGRAPHX = "migraphx"
    HUGGINGFACE = "huggingface"


class TrainingFramework(str, Enum):
    PYTORCH = "pytorch"
    MEGATRON = "megatron"
    VERL = "verl"


# --------------- Test Case Definition ---------------

class TestCaseBase(BaseModel):
    category: TestCategory
    test_type: str
    name: str
    description: Optional[str] = None


class ChipBasicTestConfig(BaseModel):
    test_type: ChipBasicTestType
    duration_minutes: int = Field(default=10, description="For power/stability tests")
    stress_hours: int = Field(default=48, description="For stability test: 2*24h")


class TrainingTestConfig(BaseModel):
    test_type: TrainingTestType
    framework: TrainingFramework = TrainingFramework.PYTORCH
    framework_version: str = "2.7.1"
    model_path: Optional[str] = None
    dataset_name: str = ""
    precision: DataPrecision = DataPrecision.BF16
    batch_size: int = 64
    epochs: int = 2
    num_gpus: int = 1
    image_size: Optional[str] = None
    seq_len: Optional[int] = None
    global_bs: Optional[int] = None
    tp: int = 1
    pp: int = 1
    dp: int = 1
    cp: int = 1


class InferenceTestConfig(BaseModel):
    test_type: InferenceTestType
    framework: InferenceFramework = InferenceFramework.VLLM
    framework_version: str = "0.11.0"
    model_path: str = ""
    precision: DataPrecision = DataPrecision.BF16
    num_gpus: int = 1
    concurrency_levels: list[int] = Field(default_factory=lambda: [1, 4, 8, 16, 32])
    num_requests: int = 400
    input_output_pairs: list[list[int]] = Field(
        default_factory=lambda: [[1024, 256]],
        description="List of [input_len, output_len] pairs",
    )
    slo_ttft_ms: Optional[float] = None
    slo_tpot_ms: Optional[float] = None


class AccuracyTestConfig(BaseModel):
    test_type: AccuracyTestType
    framework: str = "opencompass"
    model_path: str = ""
    datasets: list[str] = Field(default_factory=lambda: ["gsm8k", "mmlu"])
    num_gpus: int = 8
    precision: DataPrecision = DataPrecision.INT8
    inference_backend: InferenceFramework = InferenceFramework.VLLM


class EcosystemTestConfig(BaseModel):
    test_type: EcosystemTestType
    framework: str = ""
    model_path: Optional[str] = None
    num_gpus: int = 1
    extra_params: dict[str, Any] = Field(default_factory=dict)


class VideoCodecTestConfig(BaseModel):
    test_type: VideoCodecTestType
    resolutions: list[str] = Field(default_factory=lambda: ["1080p", "4K"])
    formats: list[str] = Field(default_factory=lambda: ["H.264", "H.265"])


# --------------- Results ---------------

class BandwidthResult(BaseModel):
    avg_bidirectional_bandwidth_gbps: Optional[float] = None
    per_gpu_bandwidth_gbps: list[float] = Field(default_factory=list)
    matrix: Optional[list[list[float]]] = None


class MemoryBandwidthResult(BaseModel):
    per_gpu_bandwidth_gbps: list[float] = Field(default_factory=list)


class ComputePowerResult(BaseModel):
    fp64_tflops: Optional[float] = None
    fp32_tflops: Optional[float] = None
    tf32_tflops: Optional[float] = None
    bf16_tflops: Optional[float] = None
    fp16_tflops: Optional[float] = None
    int8_tops: Optional[float] = None


class PowerResult(BaseModel):
    avg_power_watts: float = 0
    max_power_watts: Optional[float] = None
    duration_minutes: int = 10
    per_gpu_power_watts: list[float] = Field(default_factory=list)


class StabilityResult(BaseModel):
    passed: bool = False
    duration_hours: float = 0
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class TrainingResult(BaseModel):
    throughput: float = 0
    throughput_unit: str = "imgs/s"
    time_per_step_ms: Optional[float] = None
    total_time_seconds: Optional[float] = None
    gpu_memory_used_mb: Optional[float] = None
    tgs: Optional[float] = Field(None, description="Token Generation Speed: global_bs*seqlen/gpus/time")


class InferenceResult(BaseModel):
    output_throughput_tokens_per_sec: Optional[float] = None
    total_token_throughput: Optional[float] = None
    ttft_ms: Optional[float] = None
    tpot_ms: Optional[float] = None
    max_concurrency_under_slo: Optional[int] = None
    per_concurrency_results: list[dict[str, Any]] = Field(default_factory=list)


class AccuracyResult(BaseModel):
    dataset_scores: dict[str, float] = Field(default_factory=dict)
    overall_score: Optional[float] = None
    raw_output: dict[str, Any] = Field(default_factory=dict)


class EcosystemResult(BaseModel):
    passed: bool = False
    compatibility_notes: str = ""
    performance_data: dict[str, Any] = Field(default_factory=dict)


class VideoCodecResult(BaseModel):
    passed: bool = False
    encode_fps: dict[str, float] = Field(default_factory=dict)
    decode_fps: dict[str, float] = Field(default_factory=dict)


# --------------- Unified Task ---------------

class AcceleratorTestCreate(BaseModel):
    name: str
    category: TestCategory
    test_type: str
    config: dict[str, Any] = Field(default_factory=dict)
    num_gpus: int = Field(default=1, ge=1, le=64)
    description: Optional[str] = None


class AcceleratorTestResult(BaseModel):
    category: TestCategory
    test_type: str
    data: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""


# --------------- Predefined test case catalog ---------------

TEST_CASE_CATALOG: list[dict[str, Any]] = [
    {
        "category": "chip_basic",
        "test_type": "inter_chip_bandwidth",
        "name": "AI芯片间通信带宽测试",
        "description": "检测单机内AI芯片之间通信带宽",
        "metric": "双向通信带宽(GB/s)",
    },
    {
        "category": "chip_basic",
        "test_type": "memory_bandwidth",
        "name": "AI芯片显存带宽测试",
        "description": "检测AI芯片显存带宽",
        "metric": "显存带宽(GB/s)",
    },
    {
        "category": "chip_basic",
        "test_type": "compute_power",
        "name": "AI芯片基础算力测试",
        "description": "检测AI芯片在FP64/FP32/TF32/BF16/FP16/INT8精度下的算力值",
        "metric": "算力值(TFLOPS/TOPS)",
    },
    {
        "category": "chip_basic",
        "test_type": "power_consumption",
        "name": "AI芯片功耗测试",
        "description": "验证AI芯片满载10分钟平均功耗",
        "metric": "平均功耗(W)",
    },
    {
        "category": "chip_basic",
        "test_type": "stability",
        "name": "高负载稳定性测试",
        "description": "验证设备2*24小时高负载运行稳定性",
        "metric": "通过/失败",
    },
    {
        "category": "model_training",
        "test_type": "resnet50",
        "name": "ResNet50训练性能测试",
        "description": "PyTorch框架下ResNet50训练性能，ImageNet2012数据集",
        "metric": "imgs/s",
        "default_config": {
            "framework": "pytorch",
            "framework_version": "2.7.1",
            "dataset_name": "ImageNet2012",
            "precision": "FP16",
            "batch_size": 64,
            "epochs": 2,
            "image_size": "224x224",
        },
    },
    {
        "category": "model_training",
        "test_type": "yolov5_l",
        "name": "YOLOv5_L训练性能测试",
        "description": "PyTorch框架下YOLOv5_L训练性能，COCO2017数据集",
        "metric": "imgs/s",
        "default_config": {
            "framework": "pytorch",
            "framework_version": "2.4.1",
            "dataset_name": "COCO2017",
            "precision": "FP16",
            "batch_size": 64,
            "epochs": 5,
            "image_size": "640x640",
        },
    },
    {
        "category": "model_training",
        "test_type": "llama3_8b",
        "name": "Llama3_8B预训练性能测试",
        "description": "Megatron框架下Llama3-8B预训练，单机8卡",
        "metric": "TGS (tokens/gpu/s)",
        "default_config": {
            "framework": "megatron",
            "precision": "BF16",
            "num_gpus": 8,
            "seq_len": 4096,
            "global_bs": 256,
            "tp": 2,
            "pp": 1,
            "dp": 4,
        },
    },
    {
        "category": "model_training",
        "test_type": "qwen3_8b",
        "name": "Qwen3_8B预训练性能测试",
        "description": "Megatron框架下Qwen3-8B预训练，单机8卡",
        "metric": "TGS (tokens/gpu/s)",
        "default_config": {
            "framework": "megatron",
            "precision": "BF16",
            "num_gpus": 8,
            "seq_len": 8192,
            "global_bs": 32,
            "tp": 4,
            "pp": 1,
            "dp": 1,
            "cp": 2,
        },
    },
    {
        "category": "model_inference",
        "test_type": "deepseek_v3",
        "name": "DeepSeek-V3 推理性能测试",
        "description": "VLLM框架下DeepSeek-V3多机推理，32卡BF16",
        "metric": "Output Throughput, TTFT, TPOT",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.9.2",
            "precision": "BF16",
            "num_gpus": 32,
            "input_output_pairs": [[12288, 550]],
            "concurrency_levels": [4, 6, 8, 10, 12],
        },
    },
    {
        "category": "model_inference",
        "test_type": "deepseek_r1_int8",
        "name": "DeepSeek R1-Channel-INT8 推理性能测试",
        "description": "VLLM框架下DeepSeek R1 INT8推理，16卡",
        "metric": "Output Throughput, TTFT, TPOT",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.9.2",
            "precision": "INT8",
            "num_gpus": 16,
            "input_output_pairs": [[12288, 550]],
            "concurrency_levels": [2, 4, 8, 16, 32, 64, 128, 256, 512],
        },
    },
    {
        "category": "model_inference",
        "test_type": "deepseek_r1_distill_qwen_32b",
        "name": "DeepSeek-R1-Distill-Qwen-32B 变长推理性能测试",
        "description": "VLLM框架下变长推理，单机4卡BF16",
        "metric": "total_token_throughput",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.11.0",
            "precision": "BF16",
            "num_gpus": 4,
            "concurrency_levels": [128],
            "num_requests": 1000,
        },
    },
    {
        "category": "model_inference",
        "test_type": "qwen3_32b",
        "name": "Qwen3-32B 定长推理性能测试",
        "description": "VLLM框架下定长推理，单机4卡FP16",
        "metric": "TTFT, TPOT, throughput",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.11.0",
            "precision": "FP16",
            "num_gpus": 4,
            "concurrency_levels": [1, 20, 40, 50, 60, 80, 100, 150, 200],
            "num_requests": 400,
        },
    },
    {
        "category": "model_inference",
        "test_type": "glm4_w8a8",
        "name": "GLM4.7-W8A8 推理性能测试",
        "description": "VLLM框架下GLM4 W8A8量化推理，单机8卡",
        "metric": "TTFT, TPOT, throughput",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.9.2",
            "precision": "W8A8",
            "num_gpus": 8,
        },
    },
    {
        "category": "model_inference",
        "test_type": "yayi",
        "name": "YAYI 变长推理性能测试",
        "description": "VLLM框架下YAYI变长推理，单机4卡",
        "metric": "total_token_throughput",
        "default_config": {
            "framework": "vllm",
            "framework_version": "0.11.0",
            "num_gpus": 4,
        },
    },
    {
        "category": "model_inference",
        "test_type": "bert",
        "name": "Bert 推理性能测试",
        "description": "MIGraphX框架下Bert推理，单机单卡",
        "metric": "throughput",
        "default_config": {
            "framework": "migraphx",
            "num_gpus": 1,
        },
    },
    {
        "category": "model_accuracy",
        "test_type": "opencompass_deepseek_r1",
        "name": "OpenCompass DeepSeek-R1-671B 推理精度测试",
        "description": "通过OpenCompass测试大模型推理精度，衡量加速卡计算正确性",
        "metric": "accuracy scores",
        "default_config": {
            "framework": "opencompass",
            "datasets": ["gsm8k", "mmlu", "ceval", "humaneval"],
            "precision": "INT8",
            "num_gpus": 8,
            "inference_backend": "vllm",
        },
    },
    {
        "category": "model_accuracy",
        "test_type": "evalscope_deepseek_r1",
        "name": "EvalScope DeepSeek-R1-671B 推理精度测试",
        "description": "通过EvalScope测试大模型推理精度",
        "metric": "accuracy scores",
        "default_config": {
            "framework": "evalscope",
            "datasets": ["gsm8k", "mmlu"],
            "precision": "INT8",
            "num_gpus": 8,
        },
    },
    {
        "category": "ecosystem_compat",
        "test_type": "verl_mixtral_8x7b",
        "name": "Mixtral-8x7B MOE模型微调兼容性测试",
        "description": "Verl框架下Mixtral-8x7B MOE模型微调兼容性",
        "metric": "通过/失败",
    },
    {
        "category": "ecosystem_compat",
        "test_type": "verl_qwen25_gpro",
        "name": "Qwen2.5-0.5B-GPRO训练兼容性测试",
        "description": "Verl框架下Qwen2.5-0.5B GPRO训练兼容性及性能",
        "metric": "通过/失败 + 性能数据",
    },
    {
        "category": "ecosystem_compat",
        "test_type": "rag_embedding",
        "name": "Embedding模型 bge-large-zh-v1.5 兼容性测试",
        "description": "VLLM框架下Embedding模型兼容性",
        "metric": "通过/失败",
    },
    {
        "category": "ecosystem_compat",
        "test_type": "rag_rerank",
        "name": "Rerank模型 bge-reranker-large 兼容性测试",
        "description": "VLLM框架下Rerank模型兼容性",
        "metric": "通过/失败",
    },
    {
        "category": "ecosystem_compat",
        "test_type": "cuda_migration",
        "name": "国产芯片CUDA迁移适配能力",
        "description": "测试AI加速卡对CUDA代码迁移适配能力",
        "metric": "通过/失败 + 迁移报告",
    },
    {
        "category": "ecosystem_compat",
        "test_type": "gpu_virtualization",
        "name": "基于Kubernetes的GPU虚拟化测试",
        "description": "测试GPU虚拟化支持能力",
        "metric": "通过/失败",
    },
    {
        "category": "video_codec",
        "test_type": "maccodec_sdk",
        "name": "MacCodec SDK测试",
        "description": "测试MacCodec SDK支持能力",
        "metric": "通过/失败",
    },
    {
        "category": "video_codec",
        "test_type": "heepstream",
        "name": "Heepstream 插件测试",
        "description": "测试Heepstream支持能力",
        "metric": "通过/失败",
    },
    {
        "category": "video_codec",
        "test_type": "codetest",
        "name": "CodeTest 工具测试",
        "description": "编解码功能正确性测试",
        "metric": "通过/失败",
    },
    {
        "category": "video_codec",
        "test_type": "codec_benchmark",
        "name": "CodecBenchmark 测试",
        "description": "视频编解码性能基准测试",
        "metric": "编解码FPS",
    },
]
