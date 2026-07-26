import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

export function BillingSuccess() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md text-center space-y-3">
          <div className="text-2xl font-medium">Assinatura confirmada</div>
          <p className="text-ink-soft text-sm">Seu pagamento (modo teste) foi processado com sucesso.</p>
          <Link
            to="/"
            className="inline-block mt-4 rounded-full bg-accent text-white px-5 py-2.5 text-sm font-medium"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
