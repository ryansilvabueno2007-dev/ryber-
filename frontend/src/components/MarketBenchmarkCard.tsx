import type { MarketBenchmark } from '../types'

export function MarketBenchmarkCard({ benchmark }: { benchmark: MarketBenchmark }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-6 space-y-4 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
          Mercado e estilo identificados
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-accent-line bg-accent-soft text-accent text-sm font-medium px-3 py-1">
            {benchmark.niche}
          </span>
          <span className="rounded-full border border-line bg-panel-raised text-ink text-sm font-medium px-3 py-1">
            {benchmark.style}
          </span>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
          O que funciona nesse mercado
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">{benchmark.what_works}</p>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
          Como esse criativo se compara
        </div>
        <p className="text-sm text-ink leading-relaxed">{benchmark.fit_assessment}</p>
      </div>
    </div>
  )
}
