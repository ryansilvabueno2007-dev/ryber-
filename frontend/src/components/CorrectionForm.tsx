import { useState } from 'react'
import type { AnalysisResult, ScoredLabel } from '../types'

function ScoredListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: ScoredLabel[]
  onChange: (items: ScoredLabel[]) => void
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={item.name}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...next[i], name: e.target.value }
                onChange(next)
              }}
              className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={Math.round(item.confidence * 100)}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...next[i], confidence: Number(e.target.value) / 100 }
                onChange(next)
              }}
              className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-ink-soft">%</span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-danger text-sm px-2"
            >
              remover
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { name: '', confidence: 0.5 }])}
        className="mt-2 text-xs text-accent underline underline-offset-2"
      >
        + adicionar
      </button>
    </div>
  )
}

function ScoredFieldEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: ScoredLabel
  onChange: (value: ScoredLabel) => void
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="flex gap-2 items-center">
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(value.confidence * 100)}
          onChange={(e) => onChange({ ...value, confidence: Number(e.target.value) / 100 })}
          className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
        />
        <span className="text-xs text-ink-soft">%</span>
      </div>
    </div>
  )
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
              className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-danger text-sm px-2"
            >
              remover
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-2 text-xs text-accent underline underline-offset-2"
      >
        + adicionar
      </button>
    </div>
  )
}

export function CorrectionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AnalysisResult
  onSave: (result: AnalysisResult) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<AnalysisResult>(initial)

  function update<K extends keyof AnalysisResult>(key: K, value: AnalysisResult[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          ...draft,
          alerts: draft.alerts.filter((a) => a.trim()),
          materials: draft.materials.filter((m) => m.name.trim()),
          benefits: draft.benefits.filter((b) => b.name.trim()),
          audience: { ...draft.audience, interests: draft.audience.interests.filter((i) => i.trim()) },
        })
      }}
      className="rounded-2xl border border-accent bg-panel p-6 space-y-6"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-accent">
        Corrigindo a leitura da IA
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium mb-2">Produto</div>
          <input
            value={draft.product.name}
            onChange={(e) => update('product', { ...draft.product, name: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Categoria</div>
          <input
            value={draft.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <ScoredListEditor
        label="Material"
        items={draft.materials}
        onChange={(v) => update('materials', v)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium mb-2">Público (gênero)</div>
          <input
            value={draft.audience.gender}
            onChange={(e) => update('audience', { ...draft.audience, gender: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Idade</div>
          <input
            value={draft.audience.age_range}
            onChange={(e) => update('audience', { ...draft.audience, age_range: e.target.value })}
            className="w-full rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Classe social</div>
          <input
            value={draft.audience.social_class}
            onChange={(e) =>
              update('audience', { ...draft.audience, social_class: e.target.value })
            }
            className="w-full rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <StringListEditor
        label="Interesses prováveis"
        items={draft.audience.interests}
        onChange={(v) => update('audience', { ...draft.audience, interests: v })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoredFieldEditor
          label="Posicionamento"
          value={draft.positioning}
          onChange={(v) => update('positioning', v)}
        />
        <ScoredFieldEditor
          label="Emoção"
          value={draft.emotion}
          onChange={(v) => update('emotion', v)}
        />
      </div>

      <ScoredListEditor
        label="Benefícios"
        items={draft.benefits}
        onChange={(v) => update('benefits', v)}
      />

      <StringListEditor label="Alertas" items={draft.alerts} onChange={(v) => update('alerts', v)} />

      <div>
        <div className="text-sm font-medium mb-2">O que a IA acredita (narrativa)</div>
        <textarea
          value={draft.narrative}
          onChange={(e) => update('narrative', e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Conclusão de público (destacada)</div>
        <textarea
          value={draft.audience_conclusion}
          onChange={(e) => update('audience_conclusion', e.target.value)}
          rows={3}
          placeholder="A IA infere que o público-alvo é..."
          className="w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-full bg-accent text-white px-5 py-2.5 text-sm font-medium"
        >
          Salvar correção
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
