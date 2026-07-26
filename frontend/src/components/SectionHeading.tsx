export function SectionHeading({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</span>
      <span className="h-px flex-1 bg-line" />
      {title && <span className="text-sm text-ink-soft">{title}</span>}
    </div>
  )
}
