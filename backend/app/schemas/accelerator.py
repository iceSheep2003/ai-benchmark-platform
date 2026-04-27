from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AcceleratorAsset(BaseModel):
    id: str
    name: str
    vendor: str
    model: str
    status: str
    specs: dict[str, Any] = Field(default_factory=dict)
    scores: dict[str, float] = Field(default_factory=dict)
    subTaskScores: dict[str, Any] = Field(default_factory=dict)
    trend: list[float] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)
    testProgress: dict[str, Any] | None = None
    testedAt: str | None = None
    firmware: str = "unknown"
    driver: str = "unknown"
    versionHistory: list[dict[str, Any]] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class AcceleratorAssetListResponse(BaseModel):
    total: int
    items: list[AcceleratorAsset]


class AcceleratorResult(BaseModel):
    id: str
    source_task_id: str
    source_type: str
    asset_id: str
    category: str | None = None
    test_type: str | None = None
    overall_score: float | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    created_at: datetime


class AcceleratorResultListResponse(BaseModel):
    total: int
    items: list[AcceleratorResult]


class CreateComparisonRequest(BaseModel):
    name: str
    description: str = ""
    card_ids: list[str] = Field(default_factory=list)
    dimension_weights: dict[str, float] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    category: str = ""
    is_public: bool = False
    created_by: str = "系统"
    creator_id: str = "system"


class UpdateComparisonRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    dimension_weights: dict[str, float] | None = None
    tags: list[str] | None = None
    category: str | None = None
    is_public: bool | None = None
    is_starred: bool | None = None


class AcceleratorComparison(BaseModel):
    id: str
    name: str
    description: str
    createdAt: str
    updatedAt: str
    createdBy: str
    creatorId: str
    cards: list[AcceleratorAsset] = Field(default_factory=list)
    dimensionWeights: dict[str, float] = Field(default_factory=dict)
    overallAnalysis: dict[str, Any] = Field(default_factory=dict)
    dimensionAnalysis: list[dict[str, Any]] = Field(default_factory=list)
    advantageAnalysis: list[dict[str, Any]] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    category: str = ""
    isPublic: bool = False
    isStarred: bool = False
    version: int = 1


class AcceleratorComparisonListResponse(BaseModel):
    total: int
    items: list[AcceleratorComparison]
