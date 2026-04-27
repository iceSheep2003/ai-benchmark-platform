from mmengine.config import read_base

from opencompass.configs.datasets.gsm8k.gsm8k_gen import gsm8k_datasets

datasets = gsm8k_datasets


from opencompass.models import HuggingFacewithChatTemplate

models = [
    dict(
        type=HuggingFacewithChatTemplate,
        abbr='internlm-internlm2_5-1_8b-chat-hf',
        path='internlm/internlm2_5-1_8b-chat',
        max_out_len=256,
        batch_size=8,
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

work_dir = 'outputs/accelerator/acc-057c5d7cd13a'
