import type { MarketBenchmark } from '../types'

export function MarketBenchmarkCard({ benchmark }: { benchmark: MarketBenchmark }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4 shadow-card shadow-card-hover transition-shadow">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-2">
          Mercado e estilo identificados
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-accent-soft text-accent text-sm font-medium px-3 py-1">
            {benchmark.niche}
          </span>
          <span className="rounded-full bg-line text-ink text-sm font-medium px-3 py-1">
            {benchmark.style}
          </span>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-1">
          O que funciona nesse mercado
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">{benchmark.what_works}</p>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-soft mb-1">
          Como esse criativo se compara
        </div>
        <p className="text-sm text-ink leading-relaxed">{benchmark.fit_assessment}</p>
      </div>
    </div>
  )
}
