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
  performance_score: number | null
  recommended_objective: string | null
}

export interface ScoreTrendPoint {
  date: string
  score: number
}

export interface DashboardStats {
  name: string | null
  plan: string | null
  plan_renews_at: string | null
  is_subscribed: boolean
  analyses_used: number
  analyses_quota: number | null
  total_analyses: number
  average_score: number | null
  best_score: number | null
  most_used_objective: string | null
  weakest_objective: string | null
  last_analysis_at: string | null
  score_trend: ScoreTrendPoint[]
  insights: string[]
}

export interface CurrentUser {
  id: string
  email: string
  name: string | null
  is_subscribed: boolean
  is_admin: boolean
  plan: string | null
  plan_renews_at: string | null
  plan_canceled: boolean
  cpf_cnpj: string | null
}

export type OptimizationObjective =
  | 'Vendas/Conversão'
  | 'Cliques/Tráfego'
  | 'Engajamento'
  | 'Reconhecimento de Marca/Alcance'
  | 'Cadastro/Geração de Leads'

export interface SceneDirection {
  label: string
  start: number
  end: number | null
  observed: string[]
  suggestions: string[]
  reason: string
}

export interface OptimizationStatus {
  id: string
  status: 'queued' | 'processing' | 'done' | 'error'
  objective: string
  error: string | null
  scenes: SceneDirection[]
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
