import { Header } from '../components/Header'
import { PlanCard } from '../components/PlanCard'
import { PLANS, PLAN_FEATURES } from '../data/plans'

const TRUST_POINTS = [
  { title: 'Sem fidelidade', text: 'Assinatura mensal, cancele quando quiser.' },
  { title: 'PIX, boleto ou cartão', text: 'Pagamento processado pela Asaas, com nota fiscal.' },
  { title: '1 análise grátis', text: 'Toda conta nova testa antes de assinar, sem cartão.' },
]

const FAQ = [
  {
    q: 'Como funciona a análise gratuita?',
    a: 'Toda conta nova recebe 1 análise gratuita, sem precisar de cartão de crédito. Depois de usá-la, é só escolher um dos planos abaixo para continuar analisando.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'PIX, boleto ou cartão de crédito, via Asaas — você escolhe a forma na hora de pagar a fatura.',
  },
  {
    q: 'Por que preciso informar CPF ou CNPJ?',
    a: 'É uma exigência da emissão da cobrança no Brasil. Pedimos apenas uma vez — as próximas cobranças reaproveitam o mesmo cadastro.',
  },
  {
    q: 'O que acontece se eu passar da minha cota de análises no mês?',
    a: 'Você pode aguardar o próximo ciclo mensal ou mudar para um plano com uma cota maior a qualquer momento.',
  },
]

function TrustIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-accent">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Plans() {
  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <Header />

      <div className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent border border-accent-line bg-accent-soft rounded-full px-3.5 py-1.5 mb-6">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Planos
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-ink">
            Escolha o plano pelo seu volume de criativos
          </h1>
          <p className="text-ink-soft text-base sm:text-lg leading-relaxed">
            Sem pacote de créditos avulso — cada plano dá um número de análises por mês, com relatório
            completo de performance, público, posicionamento e roteiro de edição por objetivo em cada uma.
          </p>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
          {TRUST_POINTS.map((t) => (
            <div key={t.title} className="flex items-start gap-3 rounded-2xl border border-line bg-panel p-5">
              <span className="mt-0.5 shrink-0">
                <TrustIcon />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{t.title}</div>
                <div className="text-xs text-ink-soft mt-0.5">{t.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch mb-20">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} highlight={plan.id === 'titanium'} features={PLAN_FEATURES} />
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold tracking-tight text-ink mb-6 text-center">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border border-line bg-panel p-5">
                <div className="text-sm font-medium text-ink mb-1.5">{item.q}</div>
                <p className="text-sm text-ink-soft leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
