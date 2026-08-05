import { useEffect, useRef, useState } from 'react'
import { createOptimization, getOptimization, listOptimizations } from '../api/client'
import { useAuth } from '../context/AuthContext'
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

function SceneReport({ job }: { job: OptimizationStatus }) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
        Roteiro para {job.objective}
      </div>
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
    </div>
  )
}

export function OptimizeVideoCard({ analysisId }: { analysisId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.is_admin ?? false

  const [objective, setObjective] = useState<OptimizationObjective>(OBJECTIVES[0])
  const [history, setHistory] = useState<OptimizationStatus[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [generating, setGenerating] = useState<OptimizationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const updated = await getOptimization(id)
        setGenerating(updated)
        if (updated.status === 'done' || updated.status === 'error') {
          stopPolling()
          setGenerating(null)
          setHistory((prev) => [updated, ...prev])
        }
      } catch (err) {
        stopPolling()
        setGenerating(null)
        setError(err instanceof Error ? err.message : 'Falha ao acompanhar a geração.')
      }
    }, 3000)
  }

  useEffect(() => {
    let cancelled = false
    listOptimizations(analysisId)
      .then((rows) => {
        if (cancelled) return
        const inFlight = rows.find((r) => r.status === 'queued' || r.status === 'processing')
        if (inFlight) {
          setHistory(rows.filter((r) => r.id !== inFlight.id))
          setGenerating(inFlight)
          startPolling(inFlight.id)
        } else {
          setHistory(rows)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })
    return () => {
      cancelled = true
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId])

  async function handleGenerate() {
    setError(null)
    try {
      const created = await createOptimization(analysisId, objective)
      setGenerating(created)
      startPolling(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar a geração.')
    }
  }

  const isBusy = generating !== null
  // Um erro anterior não conta contra a única geração permitida — nada foi produzido,
  // então o backend deixa tentar de novo (mesma regra em routes/optimize.py).
  const hasUsedGeneration = history.some((h) => h.status === 'done')
  const canGenerate = isAdmin || !hasUsedGeneration

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

      {!loadingHistory && history.length > 0 && (
        <div className="relative space-y-3 mb-5">
          {history.map((job) => (
            <div key={job.id}>
              {job.status === 'done' && job.scenes.length > 0 && <SceneReport job={job} />}
              {job.status === 'error' && (
                <p className="text-danger text-xs">
                  Falha ao gerar o roteiro para {job.objective}: {job.error ?? 'erro desconhecido'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {generating && (
        <p className="relative text-xs text-ink-soft mb-4">
          {STATUS_LABEL[generating.status] ?? 'Gerando...'}
        </p>
      )}

      {canGenerate && !isBusy && (
        <>
          {!isAdmin && (
            <p className="relative text-xs text-ink-soft bg-panel/60 border border-line rounded-lg px-3 py-2.5 mb-4">
              Esse roteiro só pode ser gerado <strong className="text-ink">uma vez por vídeo</strong> — escolha
              com atenção o objetivo antes de gerar. Pra tentar outro objetivo depois, só fazendo um novo
              upload, o que consome outra análise das disponíveis no seu plano.
            </p>
          )}

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
            className="relative w-full flex items-center justify-center gap-2 rounded-full bg-accent text-white px-6 py-3.5 font-medium text-sm shadow-glow hover:bg-accent-strong transition-all"
          >
            <SparkleIcon className="h-4 w-4" />
            Gerar roteiro de edição cena a cena para {objective}
          </button>
        </>
      )}

      {!canGenerate && !isBusy && (
        <p className="relative text-xs text-ink-faint">
          Você já gerou o roteiro de edição deste vídeo — disponível uma vez por vídeo.
        </p>
      )}

      {error && <p className="relative text-danger text-xs mt-3">{error}</p>}
    </div>
  )
}
