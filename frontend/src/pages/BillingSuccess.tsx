import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { trackPixelEvent, CHECKOUT_INTENT_KEY } from '../lib/metaPixel'

export function BillingSuccess() {
  // Evita disparar duas vezes num re-render (StrictMode monta o efeito 2x em dev).
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    // Só dispara Purchase se achar a intenção de checkout salva no clique de
    // "Assinar" — remove na hora, então um refresh desta página (ou acesso direto
    // à URL) não conta uma segunda compra pro mesmo pagamento.
    let intent: { planId?: string; value?: number } | null = null
    try {
      const raw = sessionStorage.getItem(CHECKOUT_INTENT_KEY)
      if (raw) {
        intent = JSON.parse(raw)
        sessionStorage.removeItem(CHECKOUT_INTENT_KEY)
      }
    } catch {
      intent = null
    }

    if (intent?.value !== undefined) {
      trackPixelEvent('Purchase', { value: intent.value, currency: 'BRL', content_name: intent.planId })
    }
  }, [])

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md text-center space-y-3">
          <div className="text-2xl font-medium">Pagamento enviado</div>
          <p className="text-ink-soft text-sm">
            Recebemos seu pagamento. Assim que for confirmado (na hora, se foi PIX ou cartão; em até 1-2
            dias úteis, se foi boleto), seu plano é liberado automaticamente no seu dashboard.
          </p>
          <Link
            to="/app"
            className="inline-block mt-4 rounded-full bg-accent text-white px-5 py-2.5 text-sm font-medium"
          >
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
