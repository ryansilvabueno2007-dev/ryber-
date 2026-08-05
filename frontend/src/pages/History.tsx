import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { listAnalyses } from '../api/client'
import type { AnalysisSummary } from '../types'

const STAGE_LABEL: Record<string, string> = {
  reading: 'Processando',
  interpreting: 'Interpretando',
  building: 'Finalizando',
  done: 'Concluída',
  error: 'Falhou',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPct(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
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

export function History() {
  const [items, setItems] = useState<AnalysisSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAnalyses()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar histórico.'))
  }, [])

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-6 text-ink">Histórico de análises</h1>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {items === null && !error && <p className="text-ink-soft text-sm">Carregando...</p>}

        {items !== null && items.length === 0 && (
          <p className="text-ink-soft text-sm">
            Nenhuma análise ainda.{' '}
            <Link to="/analyze" className="text-accent hover:underline">
              Analisar um criativo
            </Link>
          </p>
        )}

        <div className="space-y-3">
          {items?.map((item) => (
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
                <div className="text-xs text-ink-soft mt-0.5 flex items-center gap-2 flex-wrap">
                  {item.recommended_objective && <span>{item.recommended_objective}</span>}
                  {item.created_at && <span>{formatDate(item.created_at)}</span>}
                  {item.stage !== 'done' && (
                    <span className="font-medium uppercase tracking-wide text-[10px]">
                      {STAGE_LABEL[item.stage] ?? item.stage}
                    </span>
                  )}
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
    </div>
  )
}
