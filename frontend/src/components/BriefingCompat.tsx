import type { BriefingCompatibility, BriefingItemEvaluation, BriefingItemStatus } from '../types'
import { ConfidenceBar } from './ConfidenceBar'
import { ScoreGauge } from './ScoreGauge'

function gaugeColorFor(pct: number): string {
  if (pct >= 75) return 'var(--color-success)'
  if (pct >= 50) return 'var(--color-warn)'
  return 'var(--color-danger)'
}

const STATUS_LABEL: Record<BriefingItemStatus, string> = {
  excelente: 'Excelente',
  bom: 'Bom',
  precisa_melhorar: 'Precisa melhorar',
  ausente: 'Ausente',
}

const STATUS_STYLE: Record<BriefingItemStatus, string> = {
  excelente: 'bg-accent-soft text-accent',
  bom: 'bg-accent-soft text-accent',
  precisa_melhorar: 'bg-warn-soft text-warn',
  ausente: 'bg-danger-soft text-danger',
}

function BriefingItem({ item }: { item: BriefingItemEvaluation }) {
  const pct = Math.round(item.score * 100)
  const potentialPct = Math.round(item.potential_score * 100)
  const isExcellent = item.status === 'excelente'

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-medium text-sm">{item.item}</span>
        <span
          className={`rounded-full text-xs font-medium px-2.5 py-0.5 shrink-0 ${STATUS_STYLE[item.status]}`}
        >
          {isExcellent ? `${STATUS_LABEL[item.status]} · 100%` : `${STATUS_LABEL[item.status]} · ${pct}%`}
        </span>
      </div>
      <ConfidenceBar value={item.score} />

      {!isExcellent && item.missing.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <ul className="space-y-1">
            {item.missing.map((m, i) => (
              <li key={i} className="text-sm text-ink-soft flex gap-1.5">
                <span>—</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
          {potentialPct > pct && (
            <p className="text-xs text-accent font-medium">
              Corrigindo isso, sobe de {pct}% para ~{potentialPct}%
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function BriefingCompat({ compat }: { compat: BriefingCompatibility }) {
  const pct = Math.round(compat.overall_score * 100)
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-4">
        Compatibilidade com Briefing
      </div>
      <div className="flex items-center gap-5 mb-5">
        <ScoreGauge pct={pct} color={gaugeColorFor(pct)} />
        <div className="text-sm text-ink-soft">Compatível no geral com o briefing enviado</div>
      </div>

      <div className="space-y-3">
        {compat.items.map((item) => (
          <BriefingItem key={item.item} item={item} />
        ))}
      </div>
    </div>
  )
}
