import { useState } from 'react'

const OBJECTIVES = [
  'Vendas/Conversão',
  'Cliques/Tráfego',
  'Engajamento',
  'Reconhecimento de Marca/Alcance',
  'Cadastro/Geração de Leads',
] as const

type Objective = (typeof OBJECTIVES)[number]

function SparkleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  )
}

export function OptimizeVideoCard() {
  const [objective, setObjective] = useState<Objective>(OBJECTIVES[0])
  const [loading, setLoading] = useState(false)

  function handleGenerate() {
    // TODO: chamar o endpoint de otimização (ainda não implementado no backend).
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1200)
  }

  return (
    <div className="relative rounded-2xl border border-accent-line bg-accent-soft p-6 shadow-glow overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative flex items-center gap-2 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shrink-0">
          <SparkleIcon />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink tracking-tight">Otimizar criativo com IA</div>
          <p className="text-xs text-ink-soft">
            Gere uma versão de referência já com os ajustes recomendados aplicados.
          </p>
        </div>
      </div>

      <div className="relative mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
          Otimizar para qual objetivo?
        </div>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map((o) => {
            const active = o === objective
            return (
              <button
                key={o}
                type="button"
                onClick={() => setObjective(o)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-accent text-white border-accent shadow-glow'
                    : 'bg-panel/60 text-ink-soft border-line hover:border-accent-line hover:text-ink'
                }`}
              >
                {o}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="relative w-full flex items-center justify-center gap-2 rounded-full bg-accent text-white px-6 py-3.5 font-medium text-sm shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
      >
        <SparkleIcon className="h-4 w-4" />
        {loading ? 'Gerando...' : `Gerar uma versão otimizada com todos os ajustes para ${objective}`}
      </button>
    </div>
  )
}
