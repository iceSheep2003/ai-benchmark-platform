from mmengine.config import read_base

from opencompass.configs.datasets.gsm8k.gsm8k_gen import gsm8k_datasets

datasets = gsm8k_datasets


from opencompass.models import VLLMwithChatTemplate

models = [
    dict(
        type=VLLMwithChatTemplate,
        abbr='Qwen-Qwen2-7B-Instruct-vllm',
        path='Qwen/Qwen2-7B-Instruct',
        max_out_len=256,
        batch_size=8,
        model_kwargs=dict(tensor_parallel_size=1),
        run_cfg=dict(num_gpus=1),
    ),
]


infer = dict(
    partitioner=dict(type='NaivePartitioner'),
    runner=dict(
        type='LocalRunner',
        max_num_workers=1,
        max_workers_per_gpu=1,
        task=dict(type='OpenICLInferTask'),
    ),
)

eval = dict(
    partitioner=dict(type='NaivePartitioner'),
    runner=dict(
        type='LocalRunner',
        max_num_workers=1,
        task=dict(type='OpenICLEvalTask'),
    ),
)

work_dir = 'outputs/accelerator/acc-47da2ab1f046'
