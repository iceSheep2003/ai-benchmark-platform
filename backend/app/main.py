from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    accelerator_assets,
    accelerator_comparisons,
    accelerator_results,
    system,
    tasks,
    test_cases,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(title="AI Benchmark Platform API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(system.router)
app.include_router(test_cases.router)
app.include_router(accelerator_assets.router)
app.include_router(accelerator_results.router)
app.include_router(accelerator_comparisons.router)


@app.get("/health")
def root_health():
    return {"status": "ok"}
