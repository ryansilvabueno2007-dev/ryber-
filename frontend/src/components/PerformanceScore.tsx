import type { PerformanceMetricNote } from '../types'
import { ScoreGauge } from './ScoreGauge'

interface Props {
  score: number
  reasoning: string
  breakdown: PerformanceMetricNote[]
  improvements: string[]
}

function bandFor(pct: number): { label: string; text: string; bg: string; line: string; ring: string } {
  if (pct >= 75) {
    return { label: 'Alto potencial', text: 'text-success', bg: 'bg-success-soft', line: 'border-success/25', ring: 'var(--color-success)' }
  }
  if (pct >= 50) {
    return { label: 'Potencial moderado', text: 'text-warn', bg: 'bg-warn-soft', line: 'border-warn/25', ring: 'var(--color-warn)' }
  }
  return { label: 'Baixo potencial', text: 'text-danger', bg: 'bg-danger-soft', line: 'border-danger/25', ring: 'var(--color-danger)' }
}

function MetricRow({ metric, meaning, note }: PerformanceMetricNote) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-sm font-semibold text-ink">{metric}</span>
        <span className="text-xs text-ink-faint">({meaning})</span>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{note}</p>
    </div>
  )
}

export function PerformanceScore({ score, reasoning, breakdown, improvements }: Props) {
  const pct = Math.round(score * 100)
  const band = bandFor(pct)

  return (
    <div
      data-pdf-block
      className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-4">
        Chance de performar bem em tráfego pago
      </div>
      <div className="flex items-center gap-5 mb-2">
        <ScoreGauge pct={pct} color={band.ring} />
        <div>
          <span className={`inline-block rounded-full border ${band.line} ${band.bg} ${band.text} text-xs font-medium px-3 py-1`}>
            {band.label}
          </span>
          {reasoning && <p className="text-sm text-ink mt-2.5 leading-relaxed">{reasoning}</p>}
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
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
          <span className="inline-block rounded-full border border-accent-line bg-accent-soft text-accent text-xs font-medium px-3 py-1">
            Excelente — sem pontos de melhoria relevantes
          </span>
        </div>
      )}
    </div>
  )
}
