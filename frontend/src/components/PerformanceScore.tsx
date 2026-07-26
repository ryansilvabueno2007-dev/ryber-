import type { PerformanceMetricNote } from '../types'
import { ScoreGauge } from './ScoreGauge'

interface Props {
  score: number
  reasoning: string
  breakdown: PerformanceMetricNote[]
  improvements: string[]
}

function bandFor(pct: number): { label: string; text: string; bg: string; ring: string } {
  if (pct >= 75) {
    return { label: 'Alto potencial', text: 'text-success', bg: 'bg-success-soft', ring: 'var(--color-success)' }
  }
  if (pct >= 50) {
    return { label: 'Potencial moderado', text: 'text-warn', bg: 'bg-warn-soft', ring: 'var(--color-warn)' }
  }
  return { label: 'Baixo potencial', text: 'text-danger', bg: 'bg-danger-soft', ring: 'var(--color-danger)' }
}

function MetricRow({ metric, meaning, note }: PerformanceMetricNote) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-sm font-semibold text-ink">{metric}</span>
        <span className="text-xs text-ink-soft">({meaning})</span>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{note}</p>
    </div>
  )
}

export function PerformanceScore({ score, reasoning, breakdown, improvements }: Props) {
  const pct = Math.round(score * 100)
  const band = bandFor(pct)

  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-4">
        Chance de performar bem em tráfego pago
      </div>
      <div className="flex items-center gap-5 mb-2">
        <ScoreGauge pct={pct} color={band.ring} />
        <div>
          <span className={`rounded-full ${band.bg} ${band.text} text-xs font-medium px-3 py-1`}>
            {band.label}
          </span>
          {reasoning && <p className="text-sm text-ink mt-2 leading-relaxed">{reasoning}</p>}
        </div>
      </div>

      {breakdown.length > 0 ? (
        <div className="mt-3 pt-1 divide-y divide-line">
          {breakdown.map((m) => (
            <MetricRow key={m.metric} {...m} />
          ))}
        </div>
      ) : null}

      {improvements.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">
            Melhorias técnicas gerais (valem para qualquer objetivo)
          </div>
          <ul className="space-y-1.5">
            {improvements.map((imp, i) => (
              <li key={i} className="text-sm text-ink flex gap-2">
                <span className="text-accent">→</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-line">
          <span className="rounded-full bg-accent-soft text-accent text-xs font-medium px-3 py-1">
            Excelente — sem pontos de melhoria relevantes
          </span>
        </div>
      )}
    </div>
  )
}
