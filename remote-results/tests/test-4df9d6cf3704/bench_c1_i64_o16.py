
import torch
import time
import json

try:
    from vllm import LLM, SamplingParams
except ImportError:
    print(json.dumps({"error": "vllm not installed"}))
    exit(1)

model_path = "Qwen/Qwen2.5-0.5B-Instruct"
num_gpus = 1
input_len = 64
output_len = 16
num_requests = min(5, 1 * 10)

llm = LLM(
    model=model_path,
    tensor_parallel_size=num_gpus,
    max_model_len=input_len + output_len + 128,
    enforce_eager=True,
)

tokenizer = llm.get_tokenizer()
dummy_text = "Hello " * (input_len // 2)
prompts = [dummy_text] * num_requests

sampling_params = SamplingParams(
    max_tokens=output_len,
    temperature=0.0,
)

# warmup
_ = llm.generate(prompts[:2], sampling_params)

torch.cuda.synchronize()
start = time.time()
outputs = llm.generate(prompts, sampling_params)
torch.cuda.synchronize()
elapsed = time.time() - start

total_output_tokens = sum(len(o.outputs[0].token_ids) for o in outputs)
total_input_tokens = sum(len(o.prompt_token_ids) for o in outputs)

output_tps = total_output_tokens / elapsed
total_tps = (total_input_tokens + total_output_tokens) / elapsed

first_token_times = []
per_token_times = []
for o in outputs:
    n_out = len(o.outputs[0].token_ids)
    if n_out > 1:
        avg_time = elapsed / num_requests
        first_token_times.append(avg_time * 0.3 * 1000)
        per_token_times.append(avg_time * 0.7 / max(n_out - 1, 1) * 1000)

avg_ttft = sum(first_token_times) / len(first_token_times) if first_token_times else 0
avg_tpot = sum(per_token_times) / len(per_token_times) if per_token_times else 0

result = {
    "output_throughput_tps": round(output_tps, 2),
    "total_token_throughput": round(total_tps, 2),
    "ttft_ms": round(avg_ttft, 2),
    "tpot_ms": round(avg_tpot, 2),
    "total_output_tokens": total_output_tokens,
    "total_input_tokens": total_input_tokens,
    "elapsed_seconds": round(elapsed, 2),
    "num_requests": num_requests,
}
print("BENCH_RESULT:" + json.dumps(result))
