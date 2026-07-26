import type { ReactNode } from 'react'

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card shadow-card-hover transition-shadow">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-3">
        {title}
      </div>
      {children}
    </div>
  )
}
