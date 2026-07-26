import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScoreGauge } from '../components/ScoreGauge'
import { ConfidenceBar } from '../components/ConfidenceBar'
import { SectionHeading } from '../components/SectionHeading'
import { ResultCards } from '../components/ResultCards'
import { AlertsList } from '../components/AlertsList'
import { NarrativeBlock } from '../components/NarrativeBlock'
import { MarketBenchmarkCard } from '../components/MarketBenchmarkCard'
import { PerformanceScore } from '../components/PerformanceScore'
import { ObjectiveFitCard } from '../components/ObjectiveFitCard'
import { BriefingCompat } from '../components/BriefingCompat'
import type { AnalysisResult } from '../types'

const EXAMPLE_RESULT: AnalysisResult = {
  media_type: 'video',
  product: { name: 'Tênis casual em couro sintético', confidence: 0.91 },
  category: 'Calçados femininos',
  materials: [
    { name: 'Couro sintético', confidence: 0.82 },
    { name: 'Sola em EVA', confidence: 0.67 },
  ],
  audience: {
    gender: 'Feminino',
    age_range: '25-40 anos',
    social_class: 'Classe B/C',
    interests: ['Moda casual', 'Conforto no dia a dia', 'Ofertas e promoções'],
  },
  positioning: { name: 'Custo-benefício', confidence: 0.7 },
  benefits: [
    { name: 'Conforto', confidence: 0.88 },
    { name: 'Durabilidade', confidence: 0.55 },
  ],
  emotion: { name: 'Confiança', confidence: 0.84 },
  alerts: [
    'A promessa de durabilidade só aparece no áudio, não em texto na tela.',
    'A chamada para ação aparece tarde — só nos últimos 2 segundos do vídeo.',
  ],
  narrative:
    'Um calçado do dia a dia pensado pra quem já conhece a marca e busca reforço de conforto, mais do que novidade.',
  audience_conclusion: 'tende a converter melhor com quem já teve contato prévio com a marca.',
  market_benchmark: {
    niche: 'Calçados femininos casuais',
    style: 'UGC, tom pessoal',
    what_works: 'Criativos com prova social e depoimento real nos primeiros 3 segundos.',
    fit_assessment: 'Esse criativo demora a mostrar o produto — abaixo da média do nicho nesse quesito.',
  },
  performance_score: 0.74,
  performance_reasoning: 'Hook forte, mas a chamada para ação tardia reduz a conversão esperada.',
  performance_breakdown: [
    { metric: 'Hook Rate', meaning: 'retenção nos 3 primeiros segundos', note: 'Bom — o gancho visual prende a atenção logo de início.' },
    { metric: 'Hold Rate', meaning: 'retenção até o final', note: 'Cai depois dos 8 segundos, quando o ritmo desacelera.' },
    { metric: 'CTR', meaning: 'taxa de cliques', note: 'Tende a ficar mediano — falta uma chamada clara mais cedo.' },
    { metric: 'CPC', meaning: 'custo por clique', note: 'Deve subir se a chamada para ação não for antecipada.' },
    { metric: 'CPM', meaning: 'custo por mil impressões', note: 'Neutro — não há elementos que penalizem o alcance.' },
    { metric: 'CPA', meaning: 'custo por aquisição', note: 'Depende de reforçar a prova social antes da chamada final.' },
    { metric: 'ROAS', meaning: 'retorno sobre o investimento em mídia', note: 'Potencial moderado até a chamada ser antecipada.' },
  ],
  performance_improvements: [
    'Antecipar a chamada para ação para os primeiros 5 segundos.',
    'Reforçar a promessa de durabilidade também em texto na tela.',
  ],
  objective_fit: [
    { objective: 'Vendas/Conversão', fit: 'bom', note: 'Boa prova de produto, mas a chamada tardia limita a conversão direta.', improvements: ['Antecipar a chamada para ação'] },
    { objective: 'Cliques/Tráfego', fit: 'otimo', note: 'O gancho inicial gera curiosidade suficiente pro clique.', improvements: [] },
    { objective: 'Engajamento', fit: 'bom', note: 'Tom pessoal favorece comentários e compartilhamento.', improvements: ['Fazer uma pergunta direta ao público'] },
    { objective: 'Reconhecimento de Marca/Alcance', fit: 'fraco', note: 'A marca aparece só no fim, com pouco reforço visual.', improvements: ['Inserir o logo mais cedo e de forma recorrente'] },
    { objective: 'Cadastro/Geração de Leads', fit: 'fraco', note: 'Não há oferta de valor imediata pra troca de contato.', improvements: ['Adicionar uma oferta (cupom, guia) pra captar contato'] },
  ],
  recommended_objective: 'Esse criativo serve melhor pra campanhas de Cliques/Tráfego.',
  timeline: [],
  briefing_compatibility: {
    overall_score: 0.68,
    items: [
      { item: 'Mostrar o produto em uso', score: 0.9, status: 'excelente', missing: [], potential_score: 0.9 },
      { item: 'Reforçar durabilidade em texto', score: 0.3, status: 'precisa_melhorar', missing: ['Texto na tela sobre durabilidade'], potential_score: 0.75 },
      { item: 'Chamada para ação nos primeiros 5s', score: 0.2, status: 'ausente', missing: ['Chamada para ação antecipada'], potential_score: 0.8 },
    ],
  },
}

function Icon({ path, className = 'h-4 w-4 text-accent' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS = {
  check: 'M9 12.5 11.5 15 16 9.5 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  alert: 'M12 3 2 20h20L12 3Z M12 9.5v4 M12 17h.01',
}

const PLATFORMS = ['Meta', 'TikTok', 'YouTube', 'Instagram', 'Google Ads']

const STEPS = [
  { n: '1', title: 'Envie o criativo', text: 'Um vídeo, uma imagem, ou cole o link do anúncio (YouTube, TikTok, Instagram e mais).' },
  { n: '2', title: 'A IA interpreta', text: 'Extraímos frames e áudio, transcrevemos a fala e mandamos tudo para a IA analisar como uma plataforma de anúncios faria.' },
  { n: '3', title: 'Receba o dashboard', text: 'Em minutos: produto, público, posicionamento, alertas, narrativa e nota de performance — tudo num só lugar.' },
  { n: '4', title: 'Corrija e refine', text: 'Ajuste a leitura da IA quando achar necessário. Cada correção deixa a próxima análise mais afiada.' },
]

interface Bullet {
  lead: string
  text: string
}

const SECTIONS: { eyebrow: string; title: string; bullets: Bullet[]; view: 'info' | 'emotion' | 'score' }[] = [
  {
    eyebrow: 'Leitura do criativo',
    title: 'Entenda exatamente o que a IA vê.',
    bullets: [
      { lead: 'Produto & categoria:', text: 'o que está sendo vendido e onde ele compete no mercado.' },
      { lead: 'Público-alvo detalhado:', text: 'gênero, faixa etária, classe social e interesses prováveis.' },
      { lead: 'Posicionamento & benefícios:', text: 'o que o anúncio está de fato comunicando — nem sempre o que você imagina.' },
    ],
    view: 'info',
  },
  {
    eyebrow: 'Emoção & risco',
    title: 'Saiba o que ele desperta — e onde pode falhar.',
    bullets: [
      { lead: 'Emoção dominante:', text: 'confiança, urgência, desejo, humor — o sentimento que puxa o clique.' },
      { lead: 'Alertas de risco:', text: 'pontos que podem prejudicar a performance antes de você colocar verba.' },
      { lead: 'A narrativa da IA:', text: '"o que a IA acredita" sobre o seu anúncio, em texto corrido.' },
    ],
    view: 'emotion',
  },
  {
    eyebrow: 'Performance',
    title: 'Saiba como ele tende a performar em tráfego pago.',
    bullets: [
      { lead: 'Leitura por métrica:', text: 'Hook Rate, Hold Rate, CTR, CPC, CPM, CPA e ROAS — o que cada uma diz sobre esse criativo específico.' },
      { lead: 'Melhor objetivo de campanha:', text: 'entre Vendas, Tráfego, Engajamento, Reconhecimento e Geração de Leads, qual esse criativo serve melhor.' },
      { lead: 'Benchmark de mercado:', text: 'como ele se compara ao que costuma funcionar no seu nicho.' },
    ],
    view: 'score',
  },
]

function DashboardMockup({ view }: { view: 'info' | 'emotion' | 'score' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-line bg-panel shadow-elevated overflow-hidden max-w-md w-full"
    >
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-line/70 bg-canvas">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="ml-2.5 text-xs text-ink-soft">Análise · exemplo</span>
      </div>

      {view === 'info' && (
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1">Produto</div>
            <div className="text-sm font-medium">Sandália feminina em couro, salto anatômico</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1.5">Público-alvo</div>
            <div className="flex flex-wrap gap-1.5">
              {['Mulheres', '30-45 anos', 'Classe B', 'Conforto no dia a dia'].map((t) => (
                <span key={t} className="text-xs rounded-full bg-accent-soft text-accent px-2.5 py-1">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1.5">Posicionamento</div>
            <ConfidenceBar value={0.64} label="Premium" />
          </div>
        </div>
      )}

      {view === 'emotion' && (
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1.5">Emoção</div>
            <ConfidenceBar value={0.87} label="Confiança" />
          </div>
          <div className="rounded-lg bg-warn-soft border border-warn/20 px-3 py-2 text-xs text-warn flex gap-1.5">
            <Icon path={ICONS.alert} className="h-4 w-4 shrink-0" />
            <span>Promessa de durabilidade pouco reforçada no primeiro terço do vídeo.</span>
          </div>
          <div className="text-xs text-ink-soft leading-relaxed border-t border-line/70 pt-3">
            <span className="text-ink font-medium">Narrativa: </span>
            "Uma peça de conforto do dia a dia com apelo estético discreto, voltada a um público que já busca
            a marca..."
          </div>
        </div>
      )}

      {view === 'score' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-soft mb-1">Nota de performance</div>
              <div className="text-sm text-ink-soft">Acima da média do nicho</div>
            </div>
            <ScoreGauge pct={78} color="var(--color-accent)" size={56} strokeWidth={5} />
          </div>
          <div className="rounded-lg border border-line px-3 py-2.5 text-xs text-ink-soft">
            <span className="text-ink font-medium">Benchmark: </span>
            criativos com prova social no 1º segundo performam 30% melhor neste nicho.
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <Icon path={ICONS.check} className="h-4 w-4 text-success" />
            Compatível com o briefing em 4 de 5 itens
          </div>
        </div>
      )}
    </motion.div>
  )
}

function PersonaSection({
  eyebrow,
  title,
  bullets,
  view,
  reverse,
  tint,
}: {
  eyebrow: string
  title: string
  bullets: Bullet[]
  view: 'info' | 'emotion' | 'score'
  reverse: boolean
  tint: boolean
}) {
  return (
    <section className={tint ? 'px-4 sm:px-6 py-12 sm:py-16 bg-accent-soft/40' : 'px-4 sm:px-6 py-12 sm:py-16'}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className={reverse ? 'lg:order-2' : ''}>
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">{eyebrow}</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6 max-w-md">{title}</h2>
          <ul className="space-y-4 mb-7">
            {bullets.map((b) => (
              <li key={b.lead} className="text-sm sm:text-base leading-relaxed">
                <span className="font-semibold text-ink">{b.lead}</span>{' '}
                <span className="text-ink-soft">{b.text}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/signup"
            className="inline-block rounded-full bg-accent text-white px-6 py-3 font-medium uppercase tracking-wide text-xs shadow-card hover:shadow-card-hover hover:bg-accent-strong transition-all"
          >
            Criar conta
          </Link>
        </div>
        <div className={`flex justify-center ${reverse ? 'lg:order-1 lg:justify-start' : 'lg:justify-end'}`}>
          <DashboardMockup view={view} />
        </div>
      </div>
    </section>
  )
}

function AnnouncementBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-ink text-white text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
        <Link to="/signup" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="truncate">Ryber está em acesso antecipado — crie sua conta e teste agora</span>
          <Icon path={ICONS.arrow} className="h-3.5 w-3.5 shrink-0" />
        </Link>
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <Icon path={ICONS.close} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-panel/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-mark.png" alt="" className="h-6 w-6" />
          <span className="font-semibold tracking-tight text-ink text-sm">Ryber</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft">
          <a href="#recursos" className="hover:text-ink transition-colors">Recursos</a>
          <a href="#como-funciona" className="hover:text-ink transition-colors">Como funciona</a>
          <a href="#precos" className="hover:text-ink transition-colors">Preços</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap">
            Entrar
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-ink text-white px-4 py-2 text-sm font-medium whitespace-nowrap hover:bg-black transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">{title}</div>
      <div className="space-y-2 text-sm text-white/80">{children}</div>
    </div>
  )
}

export function Landing() {
  const [showBanner, setShowBanner] = useState(true)

  return (
    <div className="min-h-full flex flex-col">
      {showBanner && <AnnouncementBar onClose={() => setShowBanner(false)} />}
      <LandingNav />

      {/* Hero */}
      <section className="px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight mb-4 leading-[1.15]">
              Criativo decide se o anúncio performa.{' '}
              <span className="text-accent">A Ryber mostra isso antes de você gastar em mídia.</span>
            </h1>
            <p className="text-ink-soft text-base leading-relaxed mb-6 max-w-lg">
              Envie um vídeo, imagem ou link do seu anúncio e receba a leitura completa que uma IA de tráfego
              pago faria: produto, público, posicionamento, emoção, riscos e o quanto ele tende a performar.
            </p>
            <Link
              to="/signup"
              className="inline-block rounded-full bg-accent text-white px-6 py-3 font-medium uppercase tracking-wide text-xs shadow-card hover:shadow-card-hover hover:bg-accent-strong transition-all"
            >
              Criar conta
            </Link>
          </motion.div>

          <div className="flex justify-center lg:justify-end">
            <DashboardMockup view="score" />
          </div>
        </div>
      </section>

      {/* Bold stat band */}
      <section className="px-4 sm:px-6 py-10 bg-accent">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-white">
          {[
            { big: '9', label: 'dimensões analisadas em cada criativo' },
            { big: '3', label: 'formatos aceitos: vídeo, imagem ou link' },
            { big: '~5 min', label: 'do upload ao dashboard completo' },
            { big: '100%', label: 'dos seus dados ficam só na sua conta' },
          ].map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">{stat.big}</div>
              <div className="text-xs sm:text-sm text-white/80 leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Persona / deliverable sections (alternating, VidMob-style) */}
      <div id="recursos" className="scroll-mt-14">
        {SECTIONS.map((s, i) => (
          <PersonaSection key={s.eyebrow} {...s} reverse={i % 2 === 1} tint={i % 2 === 1} />
        ))}
      </div>

      {/* Exemplo completo do dashboard, com os componentes reais do app */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 border-t border-line/70">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Veja na prática</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2.5">
            Um dashboard de exemplo, com todas as partes
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            Dado ilustrativo, mas os componentes abaixo são os mesmos que aparecem no dashboard real da sua
            conta — é exatamente isso que você recebe a cada análise.
          </p>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-line bg-canvas shadow-elevated overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line/70 bg-panel">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="ml-3 text-xs text-ink-soft">Dashboard · exemplo ilustrativo</span>
          </div>
          <div className="p-4 sm:p-8 space-y-6">
            <SectionHeading eyebrow="Diagnóstico de performance" />
            <div className="space-y-4">
              <MarketBenchmarkCard benchmark={EXAMPLE_RESULT.market_benchmark!} />
              <PerformanceScore
                score={EXAMPLE_RESULT.performance_score}
                reasoning={EXAMPLE_RESULT.performance_reasoning}
                breakdown={EXAMPLE_RESULT.performance_breakdown}
                improvements={EXAMPLE_RESULT.performance_improvements}
              />
              <ObjectiveFitCard
                objectives={EXAMPLE_RESULT.objective_fit}
                recommended={EXAMPLE_RESULT.recommended_objective}
              />
            </div>

            <SectionHeading eyebrow="Leitura do criativo" />
            <ResultCards result={EXAMPLE_RESULT} />

            <SectionHeading eyebrow="Resumo e alertas" />
            <div className="space-y-4">
              <AlertsList alerts={EXAMPLE_RESULT.alerts} />
              <NarrativeBlock
                narrative={EXAMPLE_RESULT.narrative}
                audienceConclusion={EXAMPLE_RESULT.audience_conclusion}
              />
            </div>

            <SectionHeading eyebrow="Briefing" />
            <BriefingCompat compat={EXAMPLE_RESULT.briefing_compatibility!} />
          </div>
        </div>
        <div className="text-center mt-8">
          <Link
            to="/signup"
            className="inline-block rounded-full bg-accent text-white px-6 py-3 font-medium uppercase tracking-wide text-xs shadow-card hover:shadow-card-hover hover:bg-accent-strong transition-all"
          >
            Criar conta
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-4 sm:px-6 py-12 sm:py-16 border-t border-line/70 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Como funciona</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">
            Do upload ao dashboard, em poucos minutos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.n}>
                <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold mb-3 shadow-card">
                  {step.n}
                </div>
                <div className="text-sm font-medium mb-1">{step.title}</div>
                <p className="text-sm text-ink-soft leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plataformas */}
      <section className="px-4 sm:px-6 py-10 border-t border-line/70 bg-canvas">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-lg sm:text-xl font-medium mb-6 max-w-lg mx-auto">
            Feito para criativos pensados para as principais plataformas de anúncio
          </div>
          <div className="flex items-center justify-center gap-x-8 gap-y-3 flex-wrap text-base font-semibold text-ink-soft/70">
            {PLATFORMS.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Assinatura */}
      <section id="precos" className="px-4 sm:px-6 py-12 sm:py-16 border-t border-line/70 scroll-mt-14">
        <div className="max-w-md mx-auto text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">Assinatura</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2.5">
            Uma assinatura, análises ilimitadas
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mb-8 leading-relaxed">
            Sem pacote de créditos pra controlar. Enquanto sua assinatura estiver ativa, analise quantos
            criativos precisar.
          </p>
          <div className="rounded-2xl border border-line bg-panel shadow-elevated text-left overflow-hidden">
            <div className="bg-ink px-6 py-5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-white/60 mb-1.5">Ryber</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-white">R$ --</span>
                <span className="text-sm text-white/60">/mês</span>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-2.5 mb-6 text-sm">
                {[
                  'Análises ilimitadas de vídeo e imagem',
                  'Histórico completo de análises',
                  'Benchmark de mercado e nota de performance',
                  'Compatibilidade com briefing',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-ink-soft">
                    <Icon path={ICONS.check} />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="block text-center rounded-full bg-accent text-white px-5 py-3 font-medium uppercase tracking-wide text-xs shadow-card hover:shadow-card-hover hover:bg-accent-strong transition-all"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 border-t border-line/70 bg-ink text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-white max-w-xl mx-auto">
          Veja como a inteligência de criativos pode te deixar mais eficaz.
        </h2>
        <p className="text-white/60 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
          Saiba antes de gastar em mídia. Crie sua conta e analise seu primeiro criativo agora.
        </p>
        <Link
          to="/signup"
          className="inline-block rounded-full bg-accent text-white px-6 py-3 font-medium uppercase tracking-wide text-xs shadow-card hover:shadow-card-hover hover:bg-accent-strong transition-all"
        >
          Criar conta
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white px-4 sm:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/logo-mark.png" alt="" className="h-6 w-6" />
                <span className="font-semibold">Ryber</span>
              </div>
            </div>
            <FooterColumn title="Produto">
              <a href="#recursos" className="block hover:text-white transition-colors">Recursos</a>
              <a href="#como-funciona" className="block hover:text-white transition-colors">Como funciona</a>
              <a href="#precos" className="block hover:text-white transition-colors">Preços</a>
            </FooterColumn>
            <FooterColumn title="Conta">
              <Link to="/login" className="block hover:text-white transition-colors">Entrar</Link>
              <Link to="/signup" className="block hover:text-white transition-colors">Criar conta</Link>
            </FooterColumn>
            <FooterColumn title="Contato">
              <a href="mailto:contato@ryber.app" className="block hover:text-white transition-colors">contato@ryber.app</a>
            </FooterColumn>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-white/50 text-center">
            © {new Date().getFullYear()} Ryber. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
