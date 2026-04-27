
import torch
import torch.nn as nn
import torch.distributed as dist
import torchvision
import time
import os

if not torch.cuda.is_available():
    raise RuntimeError("CUDA not available on this host")
dist.init_process_group("nccl")
local_rank = int(os.environ.get("LOCAL_RANK", 0))
torch.cuda.set_device(local_rank)

model = torchvision.models.resnet50(weights=None).cuda()  # placeholder for YOLOv5_L
model = torch.nn.parallel.DistributedDataParallel(model, device_ids=[local_rank])

criterion = nn.CrossEntropyLoss().cuda()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
scaler = torch.cuda.amp.GradScaler(enabled=True)

batch_size = 64
input_data = torch.randn(batch_size, 3, 640, 640, device='cuda')
target = torch.randint(0, 1000, (batch_size,), device='cuda')

warmup_iters = 10
measure_iters = 50

for i in range(warmup_iters):
    with torch.cuda.amp.autocast(enabled=True, dtype=torch.float16):
        output = model(input_data)
        loss = criterion(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
torch.cuda.synchronize()

start = time.time()
for i in range(measure_iters):
    with torch.cuda.amp.autocast(enabled=True, dtype=torch.float16):
        output = model(input_data)
        loss = criterion(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
torch.cuda.synchronize()
elapsed = time.time() - start

total_images = batch_size * measure_iters * dist.get_world_size()
throughput = total_images / elapsed
mem = torch.cuda.max_memory_allocated() / 1e6

if local_rank == 0:
    print("DEVICE: cuda")
    print(f"THROUGHPUT: {throughput:.2f} imgs/s")
    print(f"GPU_MEMORY: {mem:.0f} MB")
    print(f"TIME_PER_STEP: {elapsed / measure_iters * 1000:.1f} ms")

dist.destroy_process_group()
