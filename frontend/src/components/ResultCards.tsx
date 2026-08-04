import type { AnalysisResult } from '../types'
import { Card } from './Card'
import { ConfidenceBar } from './ConfidenceBar'

export function ResultCards({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card title="Produto">
        <div className="text-xl font-medium mb-2 tracking-tight">{result.product.name}</div>
        <ConfidenceBar value={result.product.confidence} />
      </Card>

      <Card title="Categoria">
        <div className="text-xl font-medium tracking-tight">{result.category}</div>
      </Card>

      <Card title="Material">
        <div className="space-y-2.5">
          {result.materials.map((m) => (
            <div key={m.name}>
              <div className="text-sm mb-1">{m.name}</div>
              <ConfidenceBar value={m.confidence} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Público">
        <div className="space-y-1 text-lg font-medium mb-3 tracking-tight">
          <div>{result.audience.gender}</div>
          <div>{result.audience.age_range}</div>
          <div className="text-ink-soft text-sm font-normal">{result.audience.social_class}</div>
        </div>
        {result.audience.interests.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
              Interesses prováveis
            </div>
            <div className="flex flex-wrap gap-2">
              {result.audience.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-accent-line bg-accent-soft text-accent text-xs px-3 py-1 font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Posicionamento">
        <div className="text-xl font-medium mb-2 tracking-tight">{result.positioning.name}</div>
        <ConfidenceBar value={result.positioning.confidence} />
      </Card>

      <Card title="Emoção">
        <div className="text-xl font-medium mb-2 tracking-tight">{result.emotion.name}</div>
        <ConfidenceBar value={result.emotion.confidence} />
      </Card>

      <Card title="Benefício">
        <div className="space-y-2.5">
          {result.benefits.map((b) => (
            <div key={b.name}>
              <div className="text-sm mb-1">{b.name}</div>
              <ConfidenceBar value={b.confidence} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
