import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { UploadHero } from '../components/UploadHero'
import { Header } from '../components/Header'
import { createAnalysis } from '../api/client'

export function NewAnalysis() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: { file?: File; link?: string; briefing?: string }) {
    setError(null)
    try {
      const { id } = await createAnalysis(input)
      navigate(`/analysis/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar a análise.')
    }
  }

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <Header />
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent border border-accent-line bg-accent-soft rounded-full px-3.5 py-1.5 mb-6">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Análise de criativos com IA
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-ink">
            Saiba como sua IA de publicidade vai ler seu anúncio
          </h1>
          <p className="text-ink-soft text-lg max-w-lg mx-auto leading-relaxed">
            Envie um vídeo ou imagem e veja produto, público, posicionamento e chance real de
            performar bem — antes de gastar em mídia.
          </p>
        </div>

        <UploadHero onSubmit={handleSubmit} />

        {error && <p className="mt-6 text-sm text-danger text-center max-w-md">{error}</p>}
      </div>
    </div>
  )
}
