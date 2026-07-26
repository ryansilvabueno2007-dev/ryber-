import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { ScoreGauge } from '../components/ScoreGauge'
import { ConfidenceBar } from '../components/ConfidenceBar'
import { getComparison } from '../api/client'
import type { AnalysisResult, ComparisonResponse } from '../types'

function scoreColor(pct: number): string {
  if (pct >= 75) return 'var(--color-success)'
  if (pct >= 50) return 'var(--color-warn)'
  return 'var(--color-danger)'
}

function Column({ label, result, id }: { label: string; result: AnalysisResult; id: string }) {
  const pct = Math.round(result.performance_score * 100)
  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-accent">{label}</div>

      <div className="rounded-2xl border border-line bg-panel p-6 shadow-card text-center">
        <ScoreGauge pct={pct} color={scoreColor(pct)} />
        <div className="text-xs text-ink-soft mt-3">Nota de performance</div>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">Emoção</div>
        <ConfidenceBar value={result.emotion.confidence} label={result.emotion.name} />
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">Alertas</div>
        {result.alerts.length === 0 ? (
          <p className="text-sm text-ink-soft">Nenhum alerta.</p>
        ) : (
          <ul className="space-y-1.5">
            {result.alerts.map((a, i) => (
              <li key={i} className="text-sm text-ink leading-relaxed">
                • {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">Narrativa</div>
        <p className="text-sm text-ink leading-relaxed">{result.narrative}</p>
      </div>

      {result.recommended_objective && (
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">
            Objetivo recomendado
          </div>
          <p className="text-sm text-ink leading-relaxed">{result.recommended_objective}</p>
        </div>
      )}

      <Link
        to={`/analysis/${id}`}
        className="block text-center text-sm text-ink-soft hover:text-accent underline underline-offset-2"
      >
        Ver análise completa
      </Link>
    </div>
  )
}

export function Comparison() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ComparisonResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getComparison(id)
      .then((res) => {
        if (res === null) setError('Nenhuma comparação encontrada para esta análise.')
        else setData(res)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar comparação.'))
  }, [id])

  const delta =
    data !== null
      ? Math.round(data.after.performance_score * 100) - Math.round(data.before.performance_score * 100)
      : null

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Antes e depois</h1>
        <p className="text-ink-soft text-sm mb-8">
          Compare a versão original com a nova, já com as melhorias aplicadas.
        </p>

        {error && <p className="text-danger text-sm">{error}</p>}

        {data && (
          <>
            {delta !== null && (
              <div
                className={`rounded-2xl px-5 py-4 mb-8 text-sm font-medium ${
                  delta > 0
                    ? 'bg-success-soft text-success'
                    : delta < 0
                      ? 'bg-danger-soft text-danger'
                      : 'bg-line text-ink-soft'
                }`}
              >
                {delta > 0 && `Performance melhorou ${delta} pontos com a nova versão.`}
                {delta < 0 && `Performance caiu ${Math.abs(delta)} pontos com a nova versão.`}
                {delta === 0 && 'A nota de performance ficou igual entre as duas versões.'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Column label="Antes" result={data.before} id={data.before_id} />
              <Column label="Depois" result={data.after} id={data.after_id} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
