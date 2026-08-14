import { useState } from 'react'
import { cancelSubscription } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../lib/formatDate'

export function CancelSubscriptionModal({
  renewsAt,
  onClose,
  onCanceled,
}: {
  renewsAt: string | null
  onClose: () => void
  onCanceled: (accessUntil: string | null) => void
}) {
  const { refreshUser } = useAuth()
  const [experience, setExperience] = useState<'boa' | 'ruim' | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = experience !== null && reason.trim().length > 0

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    setError(null)
    try {
      const { access_until } = await cancelSubscription(experience!, reason.trim())
      await refreshUser()
      onCanceled(access_until)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cancelar agora.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-glow">
        <div className="text-sm font-semibold text-ink tracking-tight mb-1.5">Cancelar assinatura</div>
        <p className="text-xs text-ink-soft mb-5">
          As duas perguntas abaixo são <strong className="text-ink">obrigatórias</strong> — o botão de
          cancelar só libera depois de respondidas. É rapidinho, e ajuda a gente a melhorar a plataforma.
        </p>

        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
            Como foi sua experiência com a Ryber? <span className="text-danger normal-case">*obrigatório</span>
          </div>
          <div className="flex gap-2">
            {(['boa', 'ruim'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setExperience(option)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all ${
                  experience === option
                    ? 'bg-accent text-white border-accent shadow-glow'
                    : 'bg-panel-raised text-ink-soft border-line hover:border-accent-line hover:text-ink'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
            Qual o motivo do cancelamento? <span className="text-danger normal-case">*obrigatório</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Conta pra gente o que motivou o cancelamento..."
            className="w-full rounded-2xl border border-line bg-panel-raised px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
        </div>

        <p className="text-xs text-ink-soft mb-4">
          Ao confirmar, sua assinatura para de renovar, mas você continua com acesso ao plano até{' '}
          <span className="text-ink font-medium">{formatDate(renewsAt)}</span>.
        </p>

        {!canConfirm && (
          <p className="text-xs text-ink-faint mb-3">
            Responda a pergunta acima e conte o motivo para liberar o botão de cancelar.
          </p>
        )}

        {error && <p className="text-danger text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-line text-ink-soft hover:text-ink px-4 py-2.5 text-sm font-medium transition-all"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="flex-1 rounded-full bg-danger text-white px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
          >
            {loading ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        </div>
      </div>
    </div>
  )
}
