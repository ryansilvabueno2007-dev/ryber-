import { useEffect, useState } from 'react'
import { getNicheBenchmark } from '../api/client'
import type { NicheBenchmarkData } from '../types'

export function NicheBenchmark({ niche, score }: { niche: string; score: number }) {
  const [data, setData] = useState<NicheBenchmarkData | null>(null)

  useEffect(() => {
    let cancelled = false
    getNicheBenchmark(niche, score)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [niche, score])

  // Sem amostra suficiente na base real da Ryber pra esse nicho, o card simplesmente
  // não aparece — melhor não mostrar do que mostrar uma "média" sem significado.
  if (!data) return null

  const yourPct = Math.round(data.your_score * 100)
  const nichePct = Math.round(data.average_score * 100)

  return (
    <div data-pdf-block className="rounded-2xl border border-line bg-panel p-6 shadow-card shadow-card-hover transition-all duration-300 hover:border-white/[0.14]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
        Comparação com seu nicho
      </div>
      <div className="text-lg font-semibold tracking-tight text-ink mb-1">
        Como você está em relação ao mercado
      </div>
      <p className="text-sm text-ink-soft mb-6 leading-relaxed">
        Depois de considerar todo o diagnóstico acima — {data.niche}.
      </p>

      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-ink-soft">Seu resultado</span>
            <span className="text-2xl font-bold tracking-tight tabular-nums text-ink">{yourPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-panel-raised overflow-hidden">
            <div className="h-full rounded-full bg-ink-soft" style={{ width: `${yourPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-ink-soft">Média do nicho</span>
            <span className="text-2xl font-bold tracking-tight tabular-nums text-accent-strong">{nichePct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-panel-raised overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong" style={{ width: `${nichePct}%` }} />
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-faint mt-6 leading-relaxed">
        Cálculo real, com base em {data.sample_size} análises já feitas na Ryber nesse mesmo nicho — não é
        pesquisa de mercado externa.
      </p>
    </div>
  )
}
