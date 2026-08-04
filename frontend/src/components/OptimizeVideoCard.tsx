import { useEffect, useRef, useState } from 'react'
import { createOptimization, getOptimization } from '../api/client'
import type { OptimizationObjective, OptimizationStatus } from '../types'

const OBJECTIVES: OptimizationObjective[] = [
  'Vendas/Conversão',
  'Cliques/Tráfego',
  'Engajamento',
  'Reconhecimento de Marca/Alcance',
  'Cadastro/Geração de Leads',
]

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

const STATUS_LABEL: Record<string, string> = {
  queued: 'Na fila...',
  processing: 'O diretor criativo está montando o roteiro cena a cena...',
}

export function OptimizeVideoCard({ analysisId }: { analysisId: string }) {
  const [objective, setObjective] = useState<OptimizationObjective>(OBJECTIVES[0])
  const [job, setJob] = useState<OptimizationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function handleGenerate() {
    setError(null)
    setJob(null)
    try {
      const created = await createOptimization(analysisId, objective)
      setJob(created)
      pollRef.current = setInterval(async () => {
        try {
          const updated = await getOptimization(created.id)
          setJob(updated)
          if (updated.status === 'done' || updated.status === 'error') {
            stopPolling()
          }
        } catch (err) {
          stopPolling()
          setError(err instanceof Error ? err.message : 'Falha ao acompanhar a geração.')
        }
      }, 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível iniciar a geração.'
      setError(
        message.includes('administradores')
          ? 'Esse recurso ainda está em teste — disponível só para administradores por enquanto.'
          : message
      )
    }
  }

  const isBusy = job !== null && (job.status === 'queued' || job.status === 'processing')

  return (
    <div className="relative rounded-2xl border border-accent-line bg-accent-soft p-6 shadow-glow overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative flex items-center gap-2 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shrink-0">
          <SparkleIcon />
        </span>
        <div>
          <div className="text-sm font-semibold text-ink tracking-tight">Roteiro de edição com IA</div>
          <p className="text-xs text-ink-soft">
            Um diretor criativo de IA analisa cada cena do seu vídeo e diz exatamente o que editar nela.
          </p>
        </div>
      </div>

      <div className="relative mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
          Gerar roteiro para qual objetivo?
        </div>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map((o) => {
            const active = o === objective
            return (
              <button
                key={o}
                type="button"
                disabled={isBusy}
                onClick={() => setObjective(o)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
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

      {job?.status === 'done' && job.scenes.length > 0 ? (
        <div className="relative space-y-3">
          {job.scenes.map((scene, i) => (
            <div key={i} className="rounded-xl border border-line bg-panel/60 p-4">
              <div className="text-xs font-semibold text-accent-strong tracking-tight mb-2.5">
                Cena {scene.label}
              </div>

              {scene.observed.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
                    O vídeo mostra
                  </div>
                  <ul className="space-y-1">
                    {scene.observed.map((item, j) => (
                      <li key={j} className="text-xs text-ink-soft flex gap-1.5">
                        <span className="text-ink-faint">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scene.suggestions.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
                    Sugestões para {job.objective}
                  </div>
                  <ul className="space-y-1">
                    {scene.suggestions.map((item, j) => (
                      <li key={j} className="text-xs text-ink flex gap-1.5">
                        <span className="text-accent-strong">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scene.reason && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
                    Motivo
                  </div>
                  <p className="text-xs text-ink-soft">{scene.reason}</p>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setJob(null)
              setError(null)
            }}
            className="w-full rounded-full border border-line text-ink-soft hover:border-accent-line hover:text-ink px-6 py-3 font-medium text-sm transition-all"
          >
            Gerar outro roteiro
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isBusy}
          className="relative w-full flex items-center justify-center gap-2 rounded-full bg-accent text-white px-6 py-3.5 font-medium text-sm shadow-glow hover:bg-accent-strong transition-all disabled:opacity-60"
        >
          <SparkleIcon className="h-4 w-4" />
          {isBusy
            ? STATUS_LABEL[job.status] ?? 'Gerando...'
            : `Gerar roteiro de edição cena a cena para ${objective}`}
        </button>
      )}

      {job?.status === 'error' && (
        <p className="relative mt-3 text-danger text-xs">{job.error ?? 'Falha ao gerar o roteiro.'}</p>
      )}
      {error && <p className="relative text-danger text-xs mt-3">{error}</p>}
    </div>
  )
}
