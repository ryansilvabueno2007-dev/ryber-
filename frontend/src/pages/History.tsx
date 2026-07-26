import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { listAnalyses } from '../api/client'
import type { AnalysisSummary } from '../types'

const STAGE_LABEL: Record<string, string> = {
  reading: 'Processando',
  interpreting: 'Interpretando',
  building: 'Finalizando',
  done: 'Concluída',
  error: 'Falhou',
}

export function History() {
  const [items, setItems] = useState<AnalysisSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAnalyses()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao carregar histórico.'))
  }, [])

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Histórico de análises</h1>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {items === null && !error && <p className="text-ink-soft text-sm">Carregando...</p>}

        {items !== null && items.length === 0 && (
          <p className="text-ink-soft text-sm">
            Nenhuma análise ainda.{' '}
            <Link to="/app" className="text-accent hover:underline">
              Analisar um criativo
            </Link>
          </p>
        )}

        <div className="space-y-3">
          {items?.map((item) => (
            <Link
              key={item.id}
              to={`/analysis/${item.id}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-panel p-5 shadow-card shadow-card-hover transition-shadow"
            >
              <div>
                <div className="font-medium">{item.product ?? 'Análise sem produto identificado'}</div>
                <div className="text-xs text-ink-soft mt-1">
                  {item.media_type === 'image' ? 'Imagem' : 'Vídeo'}
                  {item.created_at ? ` · ${new Date(item.created_at).toLocaleString('pt-BR')}` : ''}
                </div>
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {STAGE_LABEL[item.stage] ?? item.stage}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
