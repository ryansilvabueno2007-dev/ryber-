from typing import Literal, Optional

from pydantic import BaseModel


class ScoredLabel(BaseModel):
    name: str
    confidence: float


class Audience(BaseModel):
    gender: str
    age_range: str
    social_class: str
    interests: list[str] = []


class TimelineEntry(BaseModel):
    t: float
    finding: str


class BriefingItemEvaluation(BaseModel):
    item: str
    score: float
    status: Literal["excelente", "bom", "precisa_melhorar", "ausente"]
    missing: list[str] = []
    potential_score: float


class BriefingCompatibility(BaseModel):
    overall_score: float
    items: list[BriefingItemEvaluation]


class PerformanceMetricNote(BaseModel):
    metric: str
    meaning: str
    note: str


class MarketBenchmark(BaseModel):
    niche: str
    style: str
    what_works: str
    fit_assessment: str


class ObjectiveFit(BaseModel):
    objective: str
    fit: Literal["otimo", "bom", "fraco"]
    note: str
    improvements: list[str] = []


class AnalysisResult(BaseModel):
    media_type: Literal["video", "image"] = "video"
    product: ScoredLabel
    category: str
    materials: list[ScoredLabel]
    audience: Audience
    positioning: ScoredLabel
    benefits: list[ScoredLabel]
    emotion: ScoredLabel
    alerts: list[str]
    narrative: str
    audience_conclusion: str = ""
    market_benchmark: Optional[MarketBenchmark] = None
    performance_score: float = 0.5
    performance_reasoning: str = ""
    performance_breakdown: list[PerformanceMetricNote] = []
    performance_improvements: list[str] = []
    objective_fit: list[ObjectiveFit] = []
    recommended_objective: str = ""
    timeline: list[TimelineEntry]
    briefing_compatibility: Optional[BriefingCompatibility] = None


Stage = Literal["reading", "interpreting", "building", "done", "error"]


class AnalysisStatus(BaseModel):
    id: str
    stage: Stage
    detail: str = ""
    error: Optional[str] = None


class CreateAnalysisResponse(BaseModel):
    id: str


class AnalysisSummary(BaseModel):
    id: str
    media_type: Optional[str] = None
    stage: str
    product: Optional[str] = None
    created_at: Optional[str] = None


class ComparisonResponse(BaseModel):
    before_id: str
    after_id: str
    before: AnalysisResult
    after: AnalysisResult


OBJECTIVES = [
    "Vendas/Conversão",
    "Cliques/Tráfego",
    "Engajamento",
    "Reconhecimento de Marca/Alcance",
    "Cadastro/Geração de Leads",
]


class CreateOptimizationRequest(BaseModel):
    objective: Literal[
        "Vendas/Conversão",
        "Cliques/Tráfego",
        "Engajamento",
        "Reconhecimento de Marca/Alcance",
        "Cadastro/Geração de Leads",
    ]


class OptimizationStatus(BaseModel):
    id: str
    status: Literal["queued", "processing", "done", "error"]
    objective: str
    error: Optional[str] = None
    video_url: Optional[str] = None
    runway_task_id: Optional[str] = None
