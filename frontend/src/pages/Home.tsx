import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { ScoreTrendChart } from '../components/ScoreTrendChart'
import { useAuth } from '../context/AuthContext'
import { getStats, listAnalyses } from '../api/client'
import type { AnalysisSummary, DashboardStats } from '../types'

const PLAN_LABELS: Record<string, string> = {
  start: 'Ryber Start',
  gold: 'Ryber Gold',
  platinum: 'Ryber Platinum',
  titanium: 'Ryber Titanium',
  infinity: 'Ryber Infinity',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent shrink-0">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  )
}

function MediaIcon({ type }: { type: string | null }) {
  if (type === 'image') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-ink-faint">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M21 16l-5.5-5.5-8.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-ink-faint">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
    </svg>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">{label}</div>
      <div className="text-2xl font-semibold tracking-tight text-ink">{value}</div>
    </div>
  )
}

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<AnalysisSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getStats(), listAnalyses()])
      .then(([s, a]) => {
        setStats(s)
        setRecent(a.slice(0, 5))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar o dashboard.'))
  }, [])

  const loading = stats === null && !error
  const hasData = stats !== null && stats.total_analyses > 0
  const remaining = stats?.analyses_quota != null ? Math.max(0, stats.analyses_quota - stats.analyses_used) : null

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <Header />

      <div className="relative flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {error && <p className="text-danger text-sm">{error}</p>}

        {/* Barra superior — resumo da conta */}
        <div className="relative rounded-2xl border border-accent-line bg-accent-soft p-6 sm:p-7 shadow-glow overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="text-xl font-semibold tracking-tight text-ink mb-1">
                Olá, {user?.name?.split(' ')[0] ?? 'de novo'}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                <span>
                  Plano: <span className="text-ink font-medium">{stats?.plan ? PLAN_LABELS[stats.plan] ?? stats.plan : 'Sem plano (teste grátis)'}</span>
                </span>
                <span>
                  Análises usadas:{' '}
                  <span className="text-ink font-medium">
                    {stats?.analyses_used ?? 0}
                    {stats?.analyses_quota != null ? ` / ${stats.analyses_quota}` : ''}
                  </span>
                </span>
                {remaining !== null && (
                  <span>
                    Restam: <span className="text-ink font-medium">{remaining}</span>
                  </span>
                )}
                <span>
                  Última análise: <span className="text-ink font-medium">{formatDate(stats?.last_analysis_at ?? null)}</span>
                </span>
              </div>
              {remaining === 0 && stats?.is_subscribed && (
                <p className="text-xs text-ink-soft mt-2">
                  Faça upgrade de plano ou aguarde a renovação em{' '}
                  <span className="text-ink font-medium">{formatDate(stats?.plan_renews_at ?? null)}</span>.
                </p>
              )}
            </div>

            {remaining === 0 ? (
              <button
                onClick={() => navigate('/planos')}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-3 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
              >
                {stats?.is_subscribed ? 'Fazer upgrade' : 'Assine para continuar usando'}
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => navigate('/analyze')}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-3 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
                >
                  <PlusIcon />
                  Nova análise
                </button>
                {stats?.is_subscribed && stats.plan !== 'infinity' && (
                  <button
                    onClick={() => navigate('/planos')}
                    className="shrink-0 rounded-full border border-accent-line text-ink px-5 py-3 text-sm font-medium hover:bg-accent-soft transition-all"
                  >
                    Fazer upgrade
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading && <p className="text-ink-soft text-sm">Carregando...</p>}

        {!loading && !hasData && (
          <div className="rounded-2xl border border-line bg-panel p-10 text-center shadow-card">
            <div className="text-lg font-medium text-ink mb-2">Nenhuma análise ainda</div>
            <p className="text-ink-soft text-sm mb-6 max-w-sm mx-auto">
              Envie seu primeiro criativo e veja como a IA de anúncios e o público real interpretam ele.
            </p>
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-6 py-3 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
            >
              <PlusIcon />
              Fazer minha primeira análise
            </button>
          </div>
        )}

        {!loading && hasData && (
          <>
            {/* Cards de estatística */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Criativos analisados" value={String(stats!.total_analyses)} />
              <StatCard label="Média de performance" value={formatPct(stats!.average_score)} />
              <StatCard label="Melhor nota obtida" value={formatPct(stats!.best_score)} />
              <StatCard label="Objetivo mais usado" value={stats!.most_used_objective ?? '—'} />
              <StatCard label="Maior gargalo" value={stats!.weakest_objective ?? '—'} />
            </div>

            {/* Insights automáticos */}
            {stats!.insights.length > 0 && (
              <div className="rounded-2xl border border-line bg-panel p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <SparkleIcon />
                  <div className="text-sm font-semibold text-ink tracking-tight">Insights da Ryber</div>
                </div>
                <ul className="space-y-2.5">
                  {stats!.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                      <span className="text-accent-strong mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evolução */}
            <div className="rounded-2xl border border-line bg-panel p-6 shadow-card">
              <div className="text-sm font-semibold text-ink tracking-tight mb-4">Evolução da nota de performance</div>
              <ScoreTrendChart points={stats!.score_trend} />
            </div>

            {/* Histórico recente */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-ink tracking-tight">Análises recentes</div>
                <Link to="/history" className="text-xs font-medium text-accent hover:underline">
                  Ver histórico completo
                </Link>
              </div>
              <div className="space-y-3">
                {recent?.map((item) => (
                  <Link
                    key={item.id}
                    to={`/analysis/${item.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 shadow-card hover:border-white/[0.14] transition-colors"
                  >
                    <div className="h-11 w-11 rounded-xl border border-line bg-panel-raised flex items-center justify-center shrink-0">
                      <MediaIcon type={item.media_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink truncate">
                        {item.product ?? 'Análise sem produto identificado'}
                      </div>
                      <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-2">
                        {item.recommended_objective && <span>{item.recommended_objective}</span>}
                        {item.created_at && <span>{formatDate(item.created_at)}</span>}
                      </div>
                    </div>
                    {item.performance_score !== null && (
                      <span className="shrink-0 text-xs font-semibold text-accent-strong bg-accent-soft border border-accent-line rounded-full px-3 py-1">
                        {formatPct(item.performance_score)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
