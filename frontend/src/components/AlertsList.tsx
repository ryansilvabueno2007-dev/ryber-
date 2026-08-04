function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 mt-0.5 text-warn">
      <path
        d="M10 2.5 18 16.5H2L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="0.9" fill="currentColor" />
    </svg>
  )
}

export function AlertsList({ alerts }: { alerts: string[] }) {
  if (alerts.length === 0) return null
  return (
    <div className="rounded-2xl border border-warn/20 bg-warn-soft p-5 shadow-card shadow-card-hover transition-all duration-300">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-warn mb-3">Alertas</div>
      <ul className="space-y-2.5">
        {alerts.map((alert, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-ink leading-relaxed">
            <WarningIcon />
            <span>{alert}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
