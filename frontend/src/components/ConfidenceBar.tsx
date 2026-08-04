interface Props {
  value: number
  label?: string
}

export function ConfidenceBar({ value, label }: Props) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-blue transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-ink-soft w-9 text-right font-medium">
        {label ?? `${pct}%`}
      </span>
    </div>
  )
}
