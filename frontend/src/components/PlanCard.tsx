import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBRL, type Plan } from '../data/plans'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-accent shrink-0">
      <path
        d="M9 12.5 11.5 15 16 9.5 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlanCard({ plan, highlight, features }: { plan: Plan; highlight?: boolean; features: string[] }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCpfModal, setShowCpfModal] = useState(false)
  const [cpfInput, setCpfInput] = useState('')

  async function startCheckout(cpfCnpj?: string) {
    setError(null)
    setLoading(true)
    try {
      const { url } = await createCheckoutSession(plan.id, cpfCnpj)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir o checkout.')
      setLoading(false)
    }
  }

  function handleClick() {
    if (!user) {
      navigate('/signup')
      return
    }
    if (!user.cpf_cnpj) {
      setError(null)
      setShowCpfModal(true)
      return
    }
    startCheckout()
  }

  function handleConfirmCpf() {
    const doc = cpfInput.replace(/\D/g, '')
    if (doc.length !== 11 && doc.length !== 14) {
      setError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }
    setShowCpfModal(false)
    startCheckout(doc)
  }

  return (
    <div
      className={`relative rounded-2xl border bg-panel text-left overflow-hidden flex flex-col transition-all duration-300 ${
        highlight
          ? 'border-accent-line shadow-glow lg:-translate-y-2'
          : 'border-line shadow-card hover:border-white/[0.14]'
      }`}
    >
      {highlight && (
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <span className="rounded-b-lg bg-accent text-white text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1">
            Mais popular
          </span>
        </div>
      )}
      <div className="relative px-6 py-6 bg-panel-raised border-b border-line overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="relative text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
          {plan.name}
          {highlight && <span className="text-accent-strong ml-1.5">(Mais popular)</span>}
        </div>
        <div className="relative flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight text-ink">R$ {formatBRL(plan.price)}</span>
          <span className="text-sm text-ink-soft">/mês</span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <ul className="space-y-2.5 mb-6 text-sm flex-1">
          {[plan.quota, ...features].map((line) => (
            <li key={line} className="flex items-start gap-2 text-ink-soft">
              <CheckIcon />
              {line}
            </li>
          ))}
        </ul>
        {error && <p className="text-danger text-xs mb-3">{error}</p>}
        <button
          onClick={handleClick}
          disabled={loading}
          className="block text-center rounded-full px-5 py-3 font-medium uppercase tracking-wide text-xs transition-all disabled:opacity-60 bg-accent text-white shadow-glow hover:bg-accent-strong"
        >
          {loading ? 'Abrindo...' : 'Assinar'}
        </button>
      </div>

      {showCpfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-glow">
            <div className="text-sm font-semibold text-ink tracking-tight mb-1.5">CPF ou CNPJ pra pagamento</div>
            <p className="text-xs text-ink-soft mb-4">
              Precisamos do seu CPF ou CNPJ pra gerar a cobrança da assinatura. Só pedimos uma vez.
            </p>
            <input
              type="text"
              value={cpfInput}
              onChange={(e) => setCpfInput(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-lg border border-line bg-panel-raised text-ink text-sm px-3.5 py-2.5 mb-3 outline-none focus:border-accent-line"
              autoFocus
            />
            {error && <p className="text-danger text-xs mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCpfModal(false)}
                className="flex-1 rounded-full border border-line text-ink-soft hover:text-ink px-4 py-2.5 text-xs font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCpf}
                className="flex-1 rounded-full bg-accent text-white px-4 py-2.5 text-xs font-medium shadow-glow hover:bg-accent-strong transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
