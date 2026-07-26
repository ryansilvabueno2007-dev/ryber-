import { useNavigate } from 'react-router-dom'
import { UploadHero } from '../components/UploadHero'
import { Header } from '../components/Header'
import { createAnalysis } from '../api/client'
import { useState } from 'react'

export function Home() {
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
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-accent bg-accent-soft rounded-full px-3 py-1 mb-5">
            Análise de criativos com IA
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
            Saiba como sua IA de publicidade vai ler seu anúncio
          </h1>
          <p className="text-ink-soft text-lg max-w-lg mx-auto leading-relaxed">
            Envie um vídeo ou imagem e veja produto, público, posicionamento e chance real de
            performar bem — antes de gastar em mídia.
          </p>
        </div>

        <UploadHero onSubmit={handleSubmit} />

        {error && <p className="mt-6 text-sm text-danger">{error}</p>}
      </div>
    </div>
  )
}
