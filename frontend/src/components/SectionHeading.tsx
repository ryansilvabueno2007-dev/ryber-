export function SectionHeading({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
        <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
        {eyebrow}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-line via-accent-line to-transparent" />
      {title && <span className="text-sm text-ink-soft">{title}</span>}
    </div>
  )
}
