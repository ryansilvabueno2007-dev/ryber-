export interface ScoredLabel {
  name: string
  confidence: number
}

export interface Audience {
  gender: string
  age_range: string
  social_class: string
  interests: string[]
}

export interface TimelineEntry {
  t: number
  finding: string
}

export type BriefingItemStatus = 'excelente' | 'bom' | 'precisa_melhorar' | 'ausente'

export interface BriefingItemEvaluation {
  item: string
  score: number
  status: BriefingItemStatus
  missing: string[]
  potential_score: number
}

export interface BriefingCompatibility {
  overall_score: number
  items: BriefingItemEvaluation[]
}

export interface PerformanceMetricNote {
  metric: string
  meaning: string
  note: string
}

export interface MarketBenchmark {
  niche: string
  style: string
  what_works: string
  fit_assessment: string
}

export type ObjectiveFitLevel = 'otimo' | 'bom' | 'fraco'

export interface ObjectiveFit {
  objective: string
  fit: ObjectiveFitLevel
  note: string
  improvements: string[]
}

export interface AnalysisResult {
  media_type: 'video' | 'image'
  product: ScoredLabel
  category: string
  materials: ScoredLabel[]
  audience: Audience
  positioning: ScoredLabel
  benefits: ScoredLabel[]
  emotion: ScoredLabel
  alerts: string[]
  narrative: string
  audience_conclusion: string
  market_benchmark: MarketBenchmark | null
  performance_score: number
  performance_reasoning: string
  performance_breakdown: PerformanceMetricNote[]
  performance_improvements: string[]
  objective_fit: ObjectiveFit[]
  recommended_objective: string
  timeline: TimelineEntry[]
  briefing_compatibility: BriefingCompatibility | null
}

export type Stage = 'reading' | 'interpreting' | 'building' | 'done' | 'error'

export interface AnalysisStatus {
  id: string
  stage: Stage
  detail: string
  error: string | null
}

export interface ComparisonResponse {
  before_id: string
  after_id: string
  before: AnalysisResult
  after: AnalysisResult
}

export interface AnalysisSummary {
  id: string
  media_type: 'video' | 'image' | null
  stage: Stage
  product: string | null
  created_at: string | null
}

export interface CurrentUser {
  id: string
  email: string
  is_subscribed: boolean
  is_admin: boolean
  plan: string | null
}

export type OptimizationObjective =
  | 'Vendas/Conversão'
  | 'Cliques/Tráfego'
  | 'Engajamento'
  | 'Reconhecimento de Marca/Alcance'
  | 'Cadastro/Geração de Leads'

export interface OptimizationStatus {
  id: string
  status: 'queued' | 'processing' | 'done' | 'error'
  objective: string
  error: string | null
  video_url: string | null
  runway_task_id: string | null
}

export interface AdminStats {
  total_users: number
  subscribed_users: number
  total_analyses: number
}

export interface AdminUser {
  id: string
  email: string
  is_admin: boolean
  is_subscribed: boolean
  plan: string | null
  created_at: string
  analyses_count: number
}
