interface Props {
  value: number
  label?: string
}

export function ConfidenceBar({ value, label }: Props) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-ink-soft w-9 text-right">
        {label ?? `${pct}%`}
      </span>
    </div>
  )
}
