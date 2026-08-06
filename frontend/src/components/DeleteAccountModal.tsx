import { useState } from 'react'
import { deleteAccount } from '../api/client'
import { useAuth } from '../context/AuthContext'

const CONFIRM_PHRASE = 'EXCLUIR'

export function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void
  onDeleted: () => void
}) {
  const { refreshUser } = useAuth()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_PHRASE

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    setError(null)
    try {
      await deleteAccount()
      await refreshUser()
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir a conta agora.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-danger/30 bg-panel p-6 shadow-glow">
        <div className="text-sm font-semibold text-danger tracking-tight mb-1.5">Excluir conta permanentemente</div>
        <p className="text-xs text-ink-soft mb-4 leading-relaxed">
          Essa ação <strong className="text-ink">não pode ser desfeita</strong>. Ao confirmar:
        </p>
        <ul className="text-xs text-ink-soft space-y-1.5 mb-5 list-disc pl-4">
          <li>Sua assinatura ativa (se houver) é cancelada imediatamente.</li>
          <li>Todas as suas análises, vídeos/imagens enviados e roteiros gerados são apagados.</li>
          <li>Seus dados de cadastro são removidos da nossa plataforma.</li>
        </ul>

        <div className="mb-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
            Digite <span className="text-ink normal-case">{CONFIRM_PHRASE}</span> para confirmar
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full rounded-full border border-line bg-panel-raised px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-danger"
          />
        </div>

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
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  )
}
