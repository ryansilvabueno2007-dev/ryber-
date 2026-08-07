import type { PerformanceMetricNote } from '../types'

// Ordem de prioridade: métricas mais "cedo" no funil pesam mais, porque travam tudo
// que vem depois — não tem outra fonte de dado aqui além do que a análise já gerou.
const PRIORITY = ['Hook Rate', 'Hold Rate', 'CTR', 'CPC', 'CPM', 'CPA', 'ROAS']

const DOWNSTREAM_HINT: Record<string, string> = {
  'Hook Rate': 'Melhorar essa etapa tende a elevar o Hold Rate e o CTR, já que mais gente continua assistindo e chega perto do CTA.',
  'Hold Rate': 'Melhorar essa etapa tende a elevar o CTR e reduzir o CPC, já que mais gente chega até a chamada para ação.',
  CTR: 'Melhorar essa etapa tende a reduzir o CPC e aumentar o volume de cliques qualificados.',
  CPC: 'Melhorar essa etapa tende a reduzir o custo por clique e elevar o ROAS.',
  CPM: 'Melhorar essa etapa tende a reduzir o custo de exibição, ampliando o alcance com o mesmo orçamento.',
  CPA: 'Melhorar essa etapa tende a elevar diretamente o retorno sobre o investimento (ROAS).',
  ROAS: 'É a métrica que mais está penalizando o retorno esperado desse criativo.',
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3.5 21 19H3L12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9.5v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  )
}

export function BottleneckCallout({ breakdown }: { breakdown: PerformanceMetricNote[] }) {
  const bottleneck = PRIORITY.map((name) => breakdown.find((m) => m.metric === name)).find(
    (m) => m?.level === 'fraco'
  )

  if (!bottleneck) return null

  return (
    <div
      data-pdf-block
      className="relative overflow-hidden rounded-2xl border border-danger/25 bg-gradient-to-br from-danger-soft/70 to-danger-soft/10 p-6 shadow-card"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft border border-danger/30 text-danger shrink-0">
          <AlertIcon />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-danger">
          Maior oportunidade encontrada
        </span>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-ink mb-2 leading-snug">
        Seu <span className="text-danger">{bottleneck.metric}</span> está limitando o restante da performance
      </h2>
      <p className="text-sm text-ink-soft leading-relaxed max-w-xl">{bottleneck.note}</p>
      <p className="text-sm text-ink leading-relaxed max-w-xl mt-2 font-medium">
        {DOWNSTREAM_HINT[bottleneck.metric]}
      </p>
    </div>
  )
}
