import type { ObjectiveFit, ObjectiveFitLevel } from '../types'

const FIT_LABEL: Record<ObjectiveFitLevel, string> = {
  otimo: 'Ótimo',
  bom: 'Bom',
  fraco: 'Fraco',
}

const FIT_STYLE: Record<ObjectiveFitLevel, string> = {
  otimo: 'bg-success-soft text-success border-success/25',
  bom: 'bg-panel-raised text-ink border-line',
  fraco: 'bg-danger-soft text-danger border-danger/25',
}

function ObjectiveRow({ objective, fit, note, improvements }: ObjectiveFit) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-ink">{objective}</span>
        <span className={`rounded-full border text-xs font-medium px-2.5 py-0.5 shrink-0 ${FIT_STYLE[fit]}`}>
          {FIT_LABEL[fit]}
        </span>
      </div>
      <p className="text-sm text-ink-soft leading-relaxed">{note}</p>
      {improvements.length > 0 && (
        <ul className="mt-2 space-y-1">
          {improvements.map((imp, i) => (
            <li key={i} className="text-sm text-ink flex gap-2">
              <span className="text-accent">→</span>
              <span>{imp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ObjectiveFitCard({
  objectives,
  recommended,
}: {
  objectives: ObjectiveFit[]
  recommended: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-3">
        Melhor objetivo de campanha para esse criativo
      </div>

      {recommended && (
        <div className="rounded-xl border border-accent-line bg-accent-soft text-accent text-sm font-medium px-4 py-3 mb-4">
          {recommended}
        </div>
      )}

      <div className="divide-y divide-line">
        {objectives.map((o) => (
          <ObjectiveRow key={o.objective} {...o} />
        ))}
      </div>
    </div>
  )
}
