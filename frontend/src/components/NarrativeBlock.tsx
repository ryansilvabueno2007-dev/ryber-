interface Props {
  narrative: string
  audienceConclusion: string
}

export function NarrativeBlock({ narrative, audienceConclusion }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-3">
        O que a IA acredita
      </div>
      <p className="text-lg leading-relaxed text-ink">
        {narrative}
        {audienceConclusion && (
          <>
            {' '}
            <mark className="bg-accent-soft text-ink box-decoration-clone rounded px-1">
              {audienceConclusion}
            </mark>
          </>
        )}
      </p>
    </div>
  )
}
