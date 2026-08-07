import type {
  AdminStats,
  AdminUser,
  AnalysisResult,
  AnalysisStatus,
  AnalysisSummary,
  ComparisonResponse,
  CurrentUser,
  DashboardStats,
  NicheBenchmarkData,
  OptimizationObjective,
  OptimizationStatus,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? `Erro ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function signup(
  name: string,
  email: string,
  password: string,
  termsAccepted: boolean
): Promise<CurrentUser> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, terms_accepted: termsAccepted }),
  })
  return asJson(res)
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return asJson(res)
}

export async function loginWithGoogle(
  idToken: string,
  createIfMissing: boolean,
  termsAccepted = true
): Promise<CurrentUser> {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_token: idToken,
      create_if_missing: createIfMissing,
      terms_accepted: termsAccepted,
    }),
  })
  return asJson(res)
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  await asJson(res)
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  await asJson(res)
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  await asJson(res)
}

export async function resendVerification(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    credentials: 'include',
  })
  await asJson(res)
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/account`, {
    method: 'DELETE',
    credentials: 'include',
  })
  await asJson(res)
}

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, { credentials: 'include' })
  if (res.status === 401) return null
  return asJson(res)
}

export async function createCheckoutSession(plan: string, cpfCnpj?: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, cpf_cnpj: cpfCnpj ?? null }),
  })
  return asJson(res)
}

export async function cancelSubscription(
  experience: 'boa' | 'ruim',
  reason: string
): Promise<{ access_until: string | null }> {
  const res = await fetch(`${BASE_URL}/api/billing/cancel`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experience, reason }),
  })
  return asJson(res)
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const res = await fetch(`${BASE_URL}/api/analyses`, { credentials: 'include' })
  return asJson(res)
}

export async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/api/stats`, { credentials: 'include' })
  return asJson(res)
}

export async function getNicheBenchmark(niche: string, score: number): Promise<NicheBenchmarkData | null> {
  const params = new URLSearchParams({ niche, score: String(score) })
  const res = await fetch(`${BASE_URL}/api/niche-benchmark?${params}`, { credentials: 'include' })
  return asJson(res)
}

export async function createAnalysis(params: {
  file?: File | null
  link?: string
  briefing?: string
}): Promise<{ id: string }> {
  const form = new FormData()
  if (params.file) form.append('file', params.file)
  if (params.link) form.append('link', params.link)
  if (params.briefing) form.append('briefing', params.briefing)

  const res = await fetch(`${BASE_URL}/api/analyses`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  return asJson(res)
}

export async function createComparison(
  id: string,
  params: { file?: File | null; link?: string; briefing?: string }
): Promise<{ id: string }> {
  const form = new FormData()
  if (params.file) form.append('file', params.file)
  if (params.link) form.append('link', params.link)
  if (params.briefing) form.append('briefing', params.briefing)

  const res = await fetch(`${BASE_URL}/api/analyses/${id}/compare`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  return asJson(res)
}

export async function getComparison(id: string): Promise<ComparisonResponse | null> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}/comparison`, { credentials: 'include' })
  if (res.status === 404) return null
  return asJson(res)
}

export async function getStatus(id: string): Promise<AnalysisStatus> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}/status`, { credentials: 'include' })
  return asJson(res)
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}`, { credentials: 'include' })
  return asJson(res)
}

export function mediaUrl(id: string): string {
  return `${BASE_URL}/api/media/${id}`
}

export async function getCorrection(id: string): Promise<AnalysisResult | null> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}/correction`, { credentials: 'include' })
  if (res.status === 404) return null
  return asJson(res)
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${BASE_URL}/api/admin/stats`, { credentials: 'include' })
  return asJson(res)
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${BASE_URL}/api/admin/users`, { credentials: 'include' })
  return asJson(res)
}

export async function createOptimization(
  analysisId: string,
  objective: OptimizationObjective
): Promise<OptimizationStatus> {
  const res = await fetch(`${BASE_URL}/api/analyses/${analysisId}/optimize`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objective }),
  })
  return asJson(res)
}

export async function getOptimization(id: string): Promise<OptimizationStatus> {
  const res = await fetch(`${BASE_URL}/api/optimizations/${id}`, { credentials: 'include' })
  return asJson(res)
}

export async function listOptimizations(analysisId: string): Promise<OptimizationStatus[]> {
  const res = await fetch(`${BASE_URL}/api/analyses/${analysisId}/optimizations`, { credentials: 'include' })
  return asJson(res)
}

export async function saveCorrection(
  id: string,
  correction: AnalysisResult
): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/analyses/${id}/correction`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correction),
  })
  return asJson(res)
}
