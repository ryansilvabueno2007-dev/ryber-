import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getStatus,
  getAnalysis,
  getCorrection,
  mediaUrl,
  getComparison,
  createComparison,
} from '../api/client'
import type { AnalysisResult, AnalysisStatus } from '../types'
import { Header } from '../components/Header'
import { StageProgress } from '../components/StageProgress'
import { ScoreGauge } from '../components/ScoreGauge'
import { MetricRadar } from '../components/MetricRadar'
import { MediaTimeline } from '../components/MediaTimeline'
import { ResultCards } from '../components/ResultCards'
import { AlertsList } from '../components/AlertsList'
import { NarrativeBlock } from '../components/NarrativeBlock'
import { BriefingCompat } from '../components/BriefingCompat'
import { PerformanceScore } from '../components/PerformanceScore'
import { BottleneckCallout } from '../components/BottleneckCallout'
import { NicheBenchmark } from '../components/NicheBenchmark'
import { MarketBenchmarkCard } from '../components/MarketBenchmarkCard'
import { ObjectiveFitCard } from '../components/ObjectiveFitCard'
import { OptimizeVideoCard } from '../components/OptimizeVideoCard'
import { CompareCostModal } from '../components/CompareCostModal'
import { exportElementToPdf } from '../lib/exportPdf'

/* ------------------------------------------------------------------ */
/* Estrutura do relatório: capa de veredito + capítulos numerados      */
/* ------------------------------------------------------------------ */

function bandFor(pct: number) {
  if (pct >= 75) return { label: 'Alto potencial', text: 'text-success', bg: 'bg-success-soft', line: 'border-success/25', ring: 'var(--color-success)' }
  if (pct >= 50) return { label: 'Potencial moderado', text: 'text-warn', bg: 'bg-warn-soft', line: 'border-warn/25', ring: 'var(--color-warn)' }
  return { label: 'Baixo potencial', text: 'text-danger', bg: 'bg-danger-soft', line: 'border-danger/25', ring: 'var(--color-danger)' }
}

function ReportCover({ result }: { result: AnalysisResult }) {
  const pct = Math.round(result.performance_score * 100)
  const band = bandFor(pct)
  const chips = [
    result.category,
    result.emotion?.name && `Emoção: ${result.emotion.name}`,
    result.audience?.gender && result.audience?.age_range && `${result.audience.gender} · ${result.audience.age_range}`,
    result.positioning?.name && `Posicionamento: ${result.positioning.name}`,
  ].filter(Boolean) as string[]

  return (
    <div data-pdf-block className="relative rounded-2xl glass shadow-elevated overflow-hidden p-6 sm:p-8">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-3">
            Relatório de análise · {new Date().toLocaleDateString('pt-BR')}
          </div>
          <h1 className="font-display text-2xl sm:text-[1.75rem] font-bold tracking-tight leading-tight text-ink mb-3">
            {result.product.name}
          </h1>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="text-xs rounded-full border border-accent-line bg-accent-soft text-accent px-2.5 py-1">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="flex sm:flex-col items-center gap-4 sm:gap-2 shrink-0">
          <ScoreGauge pct={pct} color={band.ring} size={92} strokeWidth={8} />
          <span className={`inline-block rounded-full border ${band.line} ${band.bg} ${band.text} text-xs font-medium px-3 py-1 whitespace-nowrap`}>
            {band.label}
          </span>
        </div>
      </div>
    </div>
  )
}

const REPORT_SECTIONS = [
  { id: 'sec-performance', n: '01', label: 'Performance' },
  { id: 'sec-leitura', n: '02', label: 'Leitura do criativo' },
  { id: 'sec-resumo', n: '03', label: 'Resumo e alertas' },
  { id: 'sec-briefing', n: '04', label: 'Briefing' },
]

function SectionNav({ hasBriefing }: { hasBriefing: boolean }) {
  const sections = hasBriefing ? REPORT_SECTIONS : REPORT_SECTIONS.slice(0, 3)
  return (
    <nav className="sticky top-16 z-10 -mx-1 px-1 py-2 bg-canvas/85 backdrop-blur-xl">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-ink-soft rounded-full border border-line bg-panel px-3.5 py-1.5 hover:text-ink hover:border-accent-line transition-all"
          >
            <span className="font-mono text-accent text-[10px]">{s.n}</span>
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

function ChapterHeading({ n, title, subtitle }: { n: string; title: string; subtitle: string }) {
  return (
    <div className="pt-4 pb-1">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display font-bold text-2xl text-gradient">{n}</span>
        <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-ink">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-xs text-ink-faint">{subtitle}</p>
        <span className="h-px flex-1 bg-gradient-to-r from-accent-line to-transparent" />
      </div>
    </div>
  )
}

export function Analysis() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [corrected, setCorrected] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasComparison, setHasComparison] = useState(false)
  const [uploadingCompare, setUploadingCompare] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [showCompareCostModal, setShowCompareCostModal] = useState(false)
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="text-xs font-medium text-ink-soft rounded-full border border-line bg-panel px-3.5 py-1.5 hover:text-ink hover:border-accent-line hover:-translate-y-px transition-all disabled:opacity-60"
              >
                {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
              </button>
              {hasComparison ? (
                <Link
                  to={`/analysis/${id}/compare`}
                  className="text-xs font-medium text-ink-soft rounded-full border border-line bg-panel px-3.5 py-1.5 hover:text-ink hover:border-accent-line hover:-translate-y-px transition-all"
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
                    onClick={() => setShowCompareCostModal(true)}
                    disabled={uploadingCompare}
                    className="text-xs font-medium text-ink-soft rounded-full border border-line bg-panel px-3.5 py-1.5 hover:text-ink hover:border-accent-line hover:-translate-y-px transition-all disabled:opacity-60"
                  >
                    {uploadingCompare ? 'Enviando nova versão...' : 'Comparar com nova versão'}
                  </button>
                </>
              )}
            </div>
          </div>
          {compareError && <p className="text-danger text-sm">{compareError}</p>}

          {showCompareCostModal && (
            <CompareCostModal
              onClose={() => setShowCompareCostModal(false)}
              onConfirm={() => {
                setShowCompareCostModal(false)
                compareInputRef.current?.click()
              }}
            />
          )}

          <div className="space-y-6">
            <SectionNav hasBriefing={Boolean(result.briefing_compatibility)} />

              <div ref={reportRef} className="space-y-6 bg-canvas">
                <div className="pdf-only pb-5 mb-1 border-b border-line">
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/logo-mark.png" alt="" className="h-7 w-7" />
                    <span className="font-semibold tracking-tight text-lg">Ryber</span>
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">Relatório de Análise de Criativo</div>
                  <div className="text-sm text-ink-soft mt-1">
                    {result.product.name} · {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <ReportCover result={result} />

                <section id="sec-performance" className="scroll-mt-32 space-y-4">
                  <ChapterHeading
                    n="01"
                    title="Diagnóstico de performance"
                    subtitle="Como esse criativo tende a se comportar em tráfego pago, métrica a métrica"
                  />
                  {result.performance_breakdown.length > 0 && (
                    <BottleneckCallout breakdown={result.performance_breakdown} />
                  )}
                  {result.market_benchmark && <MarketBenchmarkCard benchmark={result.market_benchmark} />}
                  <div className="grid grid-cols-1 md:grid-cols-[290px_1fr] gap-4 items-start">
                    {result.performance_breakdown.length > 0 && (
                      <div className="md:sticky md:top-32 max-w-[340px] md:max-w-none mx-auto md:mx-0 w-full">
                        <MetricRadar breakdown={result.performance_breakdown} />
                      </div>
                    )}
                    <PerformanceScore
                      score={result.performance_score}
                      reasoning={result.performance_reasoning}
                      breakdown={result.performance_breakdown}
                      improvements={result.performance_improvements}
                    />
                  </div>
                  {result.objective_fit.length > 0 && (
                    <ObjectiveFitCard
                      objectives={result.objective_fit}
                      recommended={result.recommended_objective}
                    />
                  )}
                  <OptimizeVideoCard analysisId={id} />
                </section>

                <section id="sec-leitura" className="scroll-mt-32 space-y-4">
                  <ChapterHeading
                    n="02"
                    title="Leitura do criativo"
                    subtitle="O que o algoritmo de distribuição enxerga no seu anúncio"
                  />
                  <ResultCards result={result} />
                </section>

                <section id="sec-resumo" className="scroll-mt-32 space-y-4">
                  <ChapterHeading
                    n="03"
                    title="Resumo e alertas"
                    subtitle="Os riscos que derrubam performance e a narrativa completa"
                  />
                  <AlertsList alerts={result.alerts} />
                  <NarrativeBlock
                    narrative={result.narrative}
                    audienceConclusion={result.audience_conclusion}
                  />
                </section>

                {result.briefing_compatibility && (
                  <section id="sec-briefing" className="scroll-mt-32 space-y-4">
                    <ChapterHeading
                      n="04"
                      title="Compatibilidade com o briefing"
                      subtitle="Requisito por requisito, o que foi atendido e o que falta"
                    />
                    <BriefingCompat compat={result.briefing_compatibility} />
                  </section>
                )}

                {result.market_benchmark && (
                  <NicheBenchmark niche={result.market_benchmark.niche} score={result.performance_score} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
