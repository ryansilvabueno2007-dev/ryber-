import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Header } from '../components/Header'
import { ScoreTrendChart } from '../components/ScoreTrendChart'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { ProgressBar } from '../components/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { getStats, listAnalyses, resendVerification } from '../api/client'
import { formatDate } from '../lib/formatDate'
import type { AnalysisSummary, DashboardStats, ScoreTrendPoint } from '../types'

const PLAN_LABELS: Record<string, string> = {
  start: 'Ryber Start',
  gold: 'Ryber Gold',
  platinum: 'Ryber Platinum',
  titanium: 'Ryber Titanium',
  infinity: 'Ryber Infinity',
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}

// Puramente client-side, em cima do score_trend que a API já devolve — nenhum dado
// novo, só uma leitura visual da mesma série (primeira metade vs segunda metade).
function computeTrend(points: ScoreTrendPoint[]): { direction: 'up' | 'down' | 'flat'; delta: number } | null {
  if (points.length < 4) return null
  const half = Math.floor(points.length / 2)
  const firstAvg = points.slice(0, half).reduce((s, p) => s + p.score, 0) / half
  const secondAvg = points.slice(half).reduce((s, p) => s + p.score, 0) / (points.length - half)
  const delta = secondAvg - firstAvg
  if (Math.abs(delta) < 0.03) return { direction: 'flat', delta }
  return { direction: delta > 0 ? 'up' : 'down', delta }
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon({ className = 'h-4 w-4 text-accent shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'flat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-3.5 w-3.5 ${direction === 'down' ? 'rotate-180' : ''}`}>
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-accent-strong">
      <path
        d="M8 4h8v4a4 4 0 0 1-8 0V4Z M8 5H5a2 2 0 0 0 2 3.5 M16 5h3a2 2 0 0 1-2 3.5 M12 12v3m-3 3h6 M9 18h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: 'easeOut' },
  }),
}

function StatCard({
  index,
  label,
  value,
  suffix = '',
  context,
}: {
  index: number
  label: string
  value: number | null
  suffix?: string
  context?: React.ReactNode
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={index}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-line bg-panel p-5 shadow-card hover:border-white/[0.14] hover:shadow-glow transition-all flex flex-col justify-between min-h-[112px]"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">{label}</div>
      <div>
        <div className="text-2xl sm:text-[28px] font-semibold tracking-tight text-ink leading-none">
          {value === null ? '—' : <AnimatedNumber value={value} suffix={suffix} />}
        </div>
        {context && <div className="mt-1.5 text-xs text-ink-soft">{context}</div>}
      </div>
    </motion.div>
  )
}

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<AnalysisSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleResendVerification() {
    setResendState('sending')
    try {
      await resendVerification()
      setResendState('sent')
    } catch {
      setResendState('error')
    }
  }

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
  const usageRatio = stats?.analyses_quota ? stats.analyses_used / stats.analyses_quota : 0
  const trend = stats ? computeTrend(stats.score_trend) : null

  // "Melhor criativo" é o de melhor nota dentre as análises recentes já carregadas —
  // sem chamada nova. Se a melhor nota de todos os tempos não estiver entre as
  // recentes, mostramos só o número (stats.best_score), sem inventar qual criativo é.
  const bestRecent =
    recent?.reduce<AnalysisSummary | null>((best, item) => {
      if (item.performance_score === null) return best
      if (!best || (best.performance_score ?? 0) < item.performance_score) return item
      return best
    }, null) ?? null
  const bestRecentMatchesAllTime =
    bestRecent?.performance_score !== null &&
    bestRecent?.performance_score !== undefined &&
    stats?.best_score !== null &&
    stats?.best_score !== undefined &&
    Math.abs(bestRecent.performance_score - stats.best_score) < 0.005

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <Header />

      <div className="relative flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6 sm:space-y-8">
        {user && !user.email_verified && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-warn/25 bg-warn-soft px-4 py-3 text-sm text-ink">
            <span>
              Confirme seu e-mail ({user.email}) pra garantir o acesso à sua conta — enviamos um link quando
              você se cadastrou.
            </span>
            {resendState === 'sent' ? (
              <span className="text-xs text-ink-soft shrink-0">E-mail reenviado.</span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendState === 'sending'}
                className="shrink-0 text-xs font-medium text-accent hover:underline disabled:opacity-60"
              >
                {resendState === 'sending' ? 'Enviando...' : 'Reenviar e-mail'}
              </button>
            )}
          </div>
        )}

        {error && <p className="text-danger text-sm">{error}</p>}

        {/* Resumo da conta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl border border-accent-line bg-accent-soft p-5 sm:p-7 shadow-glow overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold tracking-tight text-ink mb-1">
                  Olá, {user?.name?.split(' ')[0] ?? 'de novo'} <span className="inline-block">👋</span>
                </div>
                <div className="text-sm text-ink-soft">
                  Plano{' '}
                  <span className="text-ink font-semibold">
                    {stats?.plan ? PLAN_LABELS[stats.plan] ?? stats.plan : 'Sem plano (teste grátis)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {remaining === 0 ? (
                  <button
                    onClick={() => navigate('/planos')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white px-5 py-3 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all"
                  >
                    {stats?.is_subscribed ? 'Fazer upgrade' : 'Assine para continuar usando'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/analyze')}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white px-5 py-3 text-sm font-medium shadow-glow hover:bg-accent-strong transition-all whitespace-nowrap"
                    >
                      <PlusIcon />
                      Nova análise
                    </button>
                    {stats?.is_subscribed && stats.plan !== 'infinity' && (
                      <button
                        onClick={() => navigate('/planos')}
                        className="flex-1 sm:flex-initial rounded-full border border-accent-line text-ink px-5 py-3 text-sm font-medium hover:bg-accent-soft transition-all whitespace-nowrap"
                      >
                        Gerenciar plano
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {stats?.analyses_quota != null && (
              <div>
                <div className="flex items-center justify-between text-xs text-ink-soft mb-2">
                  <span>
                    <span className="text-ink font-medium">{stats.analyses_used}</span> de{' '}
                    <span className="text-ink font-medium">{stats.analyses_quota}</span> análises utilizadas
                  </span>
                  <span>
                    Restam <span className="text-ink font-medium">{remaining}</span>
                  </span>
                </div>
                <ProgressBar ratio={usageRatio} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-faint pt-1 border-t border-white/[0.06]">
              <span>
                Última análise: <span className="text-ink-soft font-medium">{formatDate(stats?.last_analysis_at ?? null)}</span>
              </span>
              {stats?.plan_renews_at && (
                <span>
                  {stats.plan_canceled ? 'Acesso até' : 'Renovação'}:{' '}
                  <span className="text-ink-soft font-medium">{formatDate(stats.plan_renews_at)}</span>
                </span>
              )}
            </div>

            {remaining === 0 && stats?.is_subscribed && (
              <p className="text-xs text-ink-soft -mt-2">
                Faça upgrade de plano ou aguarde a renovação em{' '}
                <span className="text-ink font-medium">{formatDate(stats?.plan_renews_at ?? null)}</span>.
              </p>
            )}
          </div>
        </motion.div>

        {loading && <p className="text-ink-soft text-sm">Carregando...</p>}

        {!loading && !hasData && (
          <div className="rounded-2xl border border-line bg-panel p-8 sm:p-10 text-center shadow-card">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <StatCard index={0} label="Criativos analisados" value={stats!.total_analyses} />
              <StatCard
                index={1}
                label="Média de performance"
                value={stats!.average_score !== null ? Math.round(stats!.average_score * 100) : null}
                suffix="%"
                context={
                  trend &&
                  trend.direction !== 'flat' && (
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        trend.direction === 'up' ? 'text-emerald-400' : 'text-danger'
                      }`}
                    >
                      <TrendIcon direction={trend.direction} />
                      {Math.round(Math.abs(trend.delta) * 100)}% recente
                    </span>
                  )
                }
              />
              <StatCard
                index={2}
                label="Melhor nota obtida"
                value={stats!.best_score !== null ? Math.round(stats!.best_score * 100) : null}
                suffix="%"
                context={
                  bestRecentMatchesAllTime && bestRecent ? (
                    <span className="truncate block">{bestRecent.product ?? 'Criativo sem nome'}</span>
                  ) : undefined
                }
              />
              <StatCard
                index={3}
                label="Objetivo mais usado"
                value={null}
                context={<span className="text-sm text-ink font-medium">{stats!.most_used_objective ?? '—'}</span>}
              />
              <StatCard
                index={4}
                label="Maior gargalo"
                value={null}
                context={<span className="text-sm text-ink font-medium">{stats!.weakest_objective ?? '—'}</span>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Insights automáticos */}
              {stats!.insights.length > 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={5}
                  className="lg:col-span-2 rounded-2xl border border-line bg-panel p-5 sm:p-6 shadow-card"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft border border-accent-line">
                      <SparkleIcon />
                    </span>
                    <div className="text-sm font-semibold text-ink tracking-tight">Insights da Ryber</div>
                  </div>
                  <ul className="space-y-3">
                    {stats!.insights.map((insight, i) => (
                      <motion.li
                        key={i}
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        custom={6 + i}
                        className="flex items-start gap-2.5 text-sm text-ink-soft leading-relaxed"
                      >
                        <span className="text-accent-strong mt-1.5 h-1 w-1 rounded-full bg-accent-strong shrink-0" />
                        {insight}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Melhor criativo */}
              {bestRecent && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={6}
                  className="rounded-2xl border border-accent-line bg-accent-soft p-5 sm:p-6 shadow-card flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel border border-accent-line">
                      <TrophyIcon />
                    </span>
                    <div className="text-sm font-semibold text-ink tracking-tight">
                      {bestRecentMatchesAllTime ? 'Melhor criativo' : 'Destaque recente'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-ink tracking-tight mb-1 truncate">
                      {bestRecent.product ?? 'Análise sem produto identificado'}
                    </div>
                    <div className="text-xs text-ink-soft mb-4">
                      {bestRecent.recommended_objective ?? 'Sem objetivo recomendado'} ·{' '}
                      {formatDate(bestRecent.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-semibold text-accent-strong tracking-tight">
                      {formatPct(bestRecent.performance_score)}
                    </span>
                    <Link
                      to={`/analysis/${bestRecent.id}`}
                      className="text-xs font-medium rounded-full border border-accent-line px-3.5 py-2 text-ink hover:bg-panel transition-colors whitespace-nowrap"
                    >
                      Abrir análise
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Evolução */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={7}
              className="rounded-2xl border border-line bg-panel p-5 sm:p-6 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-ink tracking-tight">Evolução da nota de performance</div>
                {trend && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      trend.direction === 'up'
                        ? 'text-emerald-400'
                        : trend.direction === 'down'
                          ? 'text-danger'
                          : 'text-ink-faint'
                    }`}
                  >
                    {trend.direction !== 'flat' && <TrendIcon direction={trend.direction} />}
                    {trend.direction === 'flat' ? 'Estável' : `${Math.round(Math.abs(trend.delta) * 100)}%`}
                  </span>
                )}
              </div>
              <ScoreTrendChart points={stats!.score_trend} />
            </motion.div>

            {/* Ações rápidas */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
              <div className="text-sm font-semibold text-ink tracking-tight mb-3">Ações rápidas</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Nova análise', to: '/analyze' },
                  { label: 'Ver histórico', to: '/history' },
                  { label: 'Ver planos', to: '/planos' },
                  { label: 'Página inicial', to: '/' },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="rounded-2xl border border-line bg-panel px-4 py-4 text-sm font-medium text-ink text-center hover:border-accent-line hover:bg-accent-soft transition-all"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Histórico recente */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={9}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-ink tracking-tight">Análises recentes</div>
                <Link to="/history" className="text-xs font-medium text-accent hover:underline">
                  Ver histórico completo
                </Link>
              </div>
              <div className="space-y-3">
                {recent?.map((item, i) => (
                  <motion.div key={item.id} variants={fadeUp} initial="hidden" animate="show" custom={10 + i}>
                    <Link
                      to={`/analysis/${item.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 shadow-card hover:border-white/[0.14] hover:-translate-y-0.5 transition-all"
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
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
