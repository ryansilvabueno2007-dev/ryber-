import type { ReactNode } from 'react'

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      data-pdf-block
      className="group relative rounded-2xl border border-line bg-panel p-5 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14] hover:-translate-y-0.5"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-3">
        {title}
      </div>
      {children}
    </div>
  )
}
