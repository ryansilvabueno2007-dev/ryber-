import type {
  AdminStats,
  AdminUser,
  AnalysisResult,
  AnalysisStatus,
  AnalysisSummary,
  ComparisonResponse,
  CurrentUser,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? `Erro ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function signup(email: string, password: string, inviteCode: string): Promise<CurrentUser> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, invite_code: inviteCode }),
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

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, { credentials: 'include' })
  if (res.status === 401) return null
  return asJson(res)
}

export async function createCheckoutSession(plan: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  return asJson(res)
}

export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const res = await fetch(`${BASE_URL}/api/analyses`, { credentials: 'include' })
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
