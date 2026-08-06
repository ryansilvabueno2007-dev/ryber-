interface Props {
  narrative: string
  audienceConclusion: string
}

export function NarrativeBlock({ narrative, audienceConclusion }: Props) {
  return (
    <div
      data-pdf-block
      className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-3">
        O que a IA acredita
      </div>
      <p className="text-lg leading-relaxed text-ink">{narrative}</p>
      {audienceConclusion && (
        <div className="mt-4 rounded-xl bg-accent-soft text-ink text-base leading-relaxed px-4 py-3">
          {audienceConclusion}
        </div>
      )}
    </div>
  )
}
