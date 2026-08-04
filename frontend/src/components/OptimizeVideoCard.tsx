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
  processing: 'Gerando a versão otimizada... (pode levar alguns minutos)',
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

      {job?.status === 'done' && job.video_url ? (
        <div className="relative space-y-3">
          <video
            src={job.video_url}
            controls
            className="w-full rounded-xl border border-line bg-black aspect-[9/16] max-h-[60vh] object-contain"
          />
          <button
            type="button"
            onClick={() => {
              setJob(null)
              setError(null)
            }}
            className="w-full rounded-full border border-line text-ink-soft hover:border-accent-line hover:text-ink px-6 py-3 font-medium text-sm transition-all"
          >
            Gerar outra versão
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
            : `Gerar uma versão otimizada com todos os ajustes para ${objective}`}
        </button>
      )}

      {job?.status === 'error' && (
        <div className="relative mt-3">
          <p className="text-danger text-xs">{job.error ?? 'Falha ao gerar a versão otimizada.'}</p>
          {job.runway_task_id && (
            <p className="text-ink-faint text-[11px] mt-1 font-mono">ID da tarefa: {job.runway_task_id}</p>
          )}
        </div>
      )}
      {error && <p className="relative text-danger text-xs mt-3">{error}</p>}
    </div>
  )
}
