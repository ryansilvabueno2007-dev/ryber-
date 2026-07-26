import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getStatus, getAnalysis, getCorrection, saveCorrection, mediaUrl } from '../api/client'
import type { AnalysisResult, AnalysisStatus } from '../types'
import { Header } from '../components/Header'
import { SectionHeading } from '../components/SectionHeading'
import { StageProgress } from '../components/StageProgress'
import { MediaTimeline } from '../components/MediaTimeline'
import { ResultCards } from '../components/ResultCards'
import { AlertsList } from '../components/AlertsList'
import { NarrativeBlock } from '../components/NarrativeBlock'
import { BriefingCompat } from '../components/BriefingCompat'
import { PerformanceScore } from '../components/PerformanceScore'
import { MarketBenchmarkCard } from '../components/MarketBenchmarkCard'
import { ObjectiveFitCard } from '../components/ObjectiveFitCard'
import { CorrectionForm } from '../components/CorrectionForm'

export function Analysis() {
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [corrected, setCorrected] = useState(false)
  const [editing, setEditing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return

    async function poll() {
      try {
        const s = await getStatus(id!)
        setStatus(s)
        if (s.stage === 'done') {
          if (pollRef.current) clearInterval(pollRef.current)
          const correction = await getCorrection(id!)
          if (correction) {
            setResult(correction)
            setCorrected(true)
          } else {
            setResult(await getAnalysis(id!))
          }
        } else if (s.stage === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {
        // mantém tentando; a análise pode ainda não ter sido registrada
      }
    }

    poll()
    pollRef.current = setInterval(poll, 1500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id])

  if (!id) return null

  if (status?.stage === 'error') {
    return (
      <div className="min-h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-3">
            <div className="text-2xl font-medium">Não foi possível analisar este criativo</div>
            <p className="text-ink-soft">{status.error ?? status.detail}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result || !status) {
    return (
      <div className="min-h-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <StageProgress stage={status?.stage ?? 'reading'} detail={status?.detail ?? 'Preparando...'} />
        </div>
      </div>
    )
  }

  async function handleSaveCorrection(next: AnalysisResult) {
    const saved = await saveCorrection(id!, next)
    setResult(saved)
    setCorrected(true)
    setEditing(false)
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header
        right={
          <Link
            to="/"
            className="text-sm font-medium text-ink-soft hover:text-accent transition-colors"
          >
            + Nova análise
          </Link>
        }
      />

      <div className="max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <MediaTimeline src={mediaUrl(id)} timeline={result.timeline} mediaType={result.media_type} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {corrected ? (
              <span className="text-xs font-medium text-accent bg-accent-soft rounded-full px-3 py-1">
                ✓ Você corrigiu esta análise
              </span>
            ) : (
              <span />
            )}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-ink-soft hover:text-accent underline underline-offset-2"
              >
                Corrigir leitura
              </button>
            )}
          </div>

          {editing ? (
            <CorrectionForm
              initial={result}
              onSave={handleSaveCorrection}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <SectionHeading eyebrow="Diagnóstico de performance" />
              <div className="space-y-4">
                {result.market_benchmark && <MarketBenchmarkCard benchmark={result.market_benchmark} />}
                <PerformanceScore
                  score={result.performance_score}
                  reasoning={result.performance_reasoning}
                  breakdown={result.performance_breakdown}
                  improvements={result.performance_improvements}
                />
                {result.objective_fit.length > 0 && (
                  <ObjectiveFitCard
                    objectives={result.objective_fit}
                    recommended={result.recommended_objective}
                  />
                )}
              </div>

              <SectionHeading eyebrow="Leitura do criativo" />
              <ResultCards result={result} />

              <SectionHeading eyebrow="Resumo e alertas" />
              <div className="space-y-4">
                <AlertsList alerts={result.alerts} />
                <NarrativeBlock
                  narrative={result.narrative}
                  audienceConclusion={result.audience_conclusion}
                />
              </div>

              {result.briefing_compatibility && (
                <>
                  <SectionHeading eyebrow="Briefing" />
                  <BriefingCompat compat={result.briefing_compatibility} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
