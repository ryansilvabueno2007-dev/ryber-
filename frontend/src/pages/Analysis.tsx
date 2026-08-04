import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getStatus,
  getAnalysis,
  getCorrection,
  saveCorrection,
  mediaUrl,
  getComparison,
  createComparison,
} from '../api/client'
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
import { OptimizeVideoCard } from '../components/OptimizeVideoCard'
import { CorrectionForm } from '../components/CorrectionForm'
import { exportElementToPdf } from '../lib/exportPdf'

export function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [corrected, setCorrected] = useState(false)
  const [editing, setEditing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasComparison, setHasComparison] = useState(false)
  const [uploadingCompare, setUploadingCompare] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const compareInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!id || status?.stage !== 'done') return
    getComparison(id)
      .then((comparison) => setHasComparison(comparison !== null))
      .catch(() => setHasComparison(false))
  }, [id, status?.stage])

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

  async function handleCompareFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !id) return
    setCompareError(null)
    setUploadingCompare(true)
    try {
      const { id: newId } = await createComparison(id, { file })
      navigate(`/analysis/${newId}/compare`)
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'Falha ao enviar a nova versão.')
      setUploadingCompare(false)
    }
  }

  async function handleExportPdf() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      await exportElementToPdf(reportRef.current, `ryber-analise-${id}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header
        right={
          <Link
            to="/app"
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
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft border border-accent-line rounded-full px-3 py-1.5">
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                  <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Você corrigiu esta análise
              </span>
            ) : (
              <span />
            )}
            {!editing && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="text-sm text-ink-soft hover:text-accent underline underline-offset-2 decoration-line disabled:opacity-60"
                >
                  {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
                </button>
                {hasComparison ? (
                  <Link
                    to={`/analysis/${id}/compare`}
                    className="text-sm text-ink-soft hover:text-accent underline underline-offset-2 decoration-line"
                  >
                    Ver antes/depois
                  </Link>
                ) : (
                  <>
                    <input
                      ref={compareInputRef}
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={handleCompareFileSelected}
                    />
                    <button
                      onClick={() => compareInputRef.current?.click()}
                      disabled={uploadingCompare}
                      className="text-sm text-ink-soft hover:text-accent underline underline-offset-2 decoration-line disabled:opacity-60"
                    >
                      {uploadingCompare ? 'Enviando nova versão...' : 'Comparar com nova versão'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-ink-soft hover:text-accent underline underline-offset-2 decoration-line"
                >
                  Corrigir leitura
                </button>
              </div>
            )}
          </div>
          {compareError && <p className="text-danger text-sm">{compareError}</p>}

          {editing ? (
            <CorrectionForm
              initial={result}
              onSave={handleSaveCorrection}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div ref={reportRef} className="space-y-6 bg-canvas">
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
                <OptimizeVideoCard analysisId={id} />
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
