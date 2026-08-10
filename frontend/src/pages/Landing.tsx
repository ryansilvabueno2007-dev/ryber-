import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScoreGauge } from '../components/ScoreGauge'
import { ResultCards } from '../components/ResultCards'
import { AlertsList } from '../components/AlertsList'
import { NarrativeBlock } from '../components/NarrativeBlock'
import { MarketBenchmarkCard } from '../components/MarketBenchmarkCard'
import { PerformanceScore } from '../components/PerformanceScore'
import { ObjectiveFitCard } from '../components/ObjectiveFitCard'
import { BriefingCompat } from '../components/BriefingCompat'
import { PlanCard } from '../components/PlanCard'
import { useAuth } from '../context/AuthContext'
import { PLANS, PLAN_FEATURES } from '../data/plans'
import type { AnalysisResult } from '../types'

const EXAMPLE_RESULT: AnalysisResult = {
  media_type: 'video',
  product: { name: 'Vestido midi de linho — lançamento da coleção de verão', confidence: 0.94 },
  category: 'Moda feminina',
  materials: [
    { name: 'Linho com viscose', confidence: 0.84 },
    { name: 'Vídeo estilo provador (try-on)', confidence: 0.9 },
  ],
  audience: {
    gender: 'Feminino',
    age_range: '25-40 anos',
    social_class: 'Classe B',
    interests: ['Moda e tendências', 'Looks para trabalho', 'Compras online', 'Lançamentos de coleção'],
  },
  positioning: { name: 'Elegante e versátil no dia a dia', confidence: 0.82 },
  benefits: [
    { name: 'Veste bem em vários corpos', confidence: 0.88 },
    { name: 'Tecido fresco pro verão', confidence: 0.79 },
  ],
  emotion: { name: 'Desejo', confidence: 0.87 },
  alerts: [
    'O caimento do vestido em movimento — o que mais vende moda em vídeo — só aparece aos 12 segundos. Antes disso são takes parados, e boa parte do público abandona sem ver o tecido se mexer.',
    'O preço e o parcelamento são ditos no áudio mas nunca aparecem em texto na tela. Quem assiste sem som (a maioria do feed) termina o vídeo sem saber que o vestido é acessível.',
    'O vídeo mostra um único corpo. Nesse nicho, mostrar a mesma peça em 2-3 corpos diferentes é o que transforma "ficou lindo nela" em "vai ficar lindo em mim" — e é isso que destrava a compra.',
  ],
  narrative:
    'Este é um criativo de lançamento de coleção no formato provador: uma modelo experimenta o vestido em frente ao espelho, com transições de look e texto sobreposto anunciando a coleção nova. A estética é competente e o produto aparece bem — mas o vídeo se comporta como catálogo, não como anúncio: falta o gatilho de urgência do lançamento, falta preço visível e falta a prova de versatilidade (corpos e ocasiões diferentes) que faz esse público decidir.',
  audience_conclusion:
    'será entregue majoritariamente pra mulheres de 25 a 40 anos, classe B, que já compram moda online e acompanham lançamentos — um público que compra por desejo visual, mas fecha a compra quando vê caimento real, preço claro e facilidade de troca.',
  market_benchmark: {
    niche: 'Moda feminina — vestidos casuais',
    style: 'Provador / try-on com transições',
    what_works:
      'Nesse nicho, os criativos que mais convertem abrem com o tecido em movimento nos 3 primeiros segundos (giro, caminhada, vento), mostram a mesma peça em corpos e ocasiões diferentes ("do trabalho pro jantar"), e colocam preço parcelado e frete/troca grátis em texto na tela. O formato provador com transição de look é o mais forte do momento — quando começa pelo movimento, não pela pose.',
    fit_assessment:
      'Esse criativo domina o formato do momento (provador com transições) e a qualidade de imagem está acima da média do nicho. Está abaixo da média em antecipação do movimento — abre parado — e na visibilidade da oferta: preço, parcelamento e política de troca existem no áudio, mas o nicho inteiro compra com o som desligado.',
  },
  performance_score: 0.72,
  performance_reasoning:
    'O produto certo, o formato certo e o público certo estão todos aqui — a coleção nova com estética de provador tende a performar bem nesse nicho, e sinais como "lançamento" e "frete grátis" pesam na decisão desse público. O que segura a nota é o timing interno: o movimento que vende aparece tarde, e a oferta que fecha a venda nunca aparece em texto. São correções de montagem, não de produção — o material bruto já contém tudo que precisa.',
  performance_breakdown: [
    { metric: 'Hook Rate', meaning: 'retenção nos 3 primeiros segundos', level: 'bom', note: 'A transição de look logo na abertura é um bom gancho visual e segura a atenção inicial, mas o vestido aparece parado — abrir já com o giro que hoje está no segundo 12 tornaria o gancho irresistível pra esse público.' },
    { metric: 'Hold Rate', meaning: 'retenção até o final', level: 'bom', note: 'As transições mantêm o ritmo até a metade, mas os takes entre 8s e 14s repetem o mesmo ângulo e o mesmo cenário — variar ocasião de uso (escritório, jantar, passeio) seguraria até o final.' },
    { metric: 'CTR', meaning: 'taxa de cliques', level: 'bom', note: 'O desejo visual gera clique, mas sem preço na tela o clique vem desqualificado — parte do público clica só pra descobrir o valor e abandona na página. Preço visível filtra e qualifica quem clica.' },
    { metric: 'CPC', meaning: 'custo por clique', level: 'otimo', note: 'A estética limpa e o formato provador se destacam no feed desse público sem parecer anúncio — o custo de atenção tende a ficar abaixo da média da categoria.' },
    { metric: 'CPM', meaning: 'custo por mil impressões', level: 'otimo', note: 'Produção de alta qualidade, luz natural, sem texto em excesso nem elementos que penalizem a distribuição — a plataforma entrega esse tipo de criativo com prazer.' },
    { metric: 'CPA', meaning: 'custo por aquisição', level: 'fraco', note: 'A compra de moda online trava em três objeções: "será que veste bem em mim", "quanto custa" e "e se não servir". O vídeo responde só a primeira, e parcialmente — sem multi-corpos, sem preço na tela e sem menção à troca grátis, cada venda exige mais cliques do que deveria.' },
    { metric: 'ROAS', meaning: 'retorno sobre o investimento em mídia', level: 'bom', note: 'O cruzamento indica retorno positivo puxado pelo baixo custo de atenção, mas abaixo do teto: as objeções de compra não respondidas seguram a conversão final que o desejo visual já conquistou.' },
  ],
  performance_improvements: [
    'Reordenar a montagem pra abrir com o tecido em movimento (o giro do segundo 12 vira o segundo 1).',
    'Colocar preço parcelado, frete grátis e troca fácil em texto na tela durante a oferta.',
    'Incluir a mesma peça em pelo menos mais um corpo e uma ocasião de uso diferente.',
  ],
  objective_fit: [
    { objective: 'Vendas/Conversão', fit: 'bom', note: 'Os sinais comerciais existem — lançamento, frete grátis, parcelamento — mas estão só no áudio, invisíveis pra quem rola o feed sem som. Com a oferta em texto e o movimento antecipado, esse criativo vira máquina de conversão do nicho.', improvements: ['Preço e troca grátis em texto na tela antes do segundo 10'] },
    { objective: 'Cliques/Tráfego', fit: 'otimo', note: 'O desejo visual do formato provador gera curiosidade e clique mesmo em público frio — como está, já é um ótimo criativo de topo de funil pra coleção nova.', improvements: [] },
    { objective: 'Engajamento', fit: 'bom', note: 'Transições de look costumam puxar salvamentos e marcações de amigas ("olha esse pro casamento"). Fechar perguntando "com qual ocasião você usaria?" multiplicaria comentários.', improvements: ['Fechar com pergunta sobre ocasião de uso'] },
    { objective: 'Reconhecimento de Marca/Alcance', fit: 'fraco', note: 'A marca aparece só na tarja final — quem vê 80% do vídeo e sai não sabe de quem é o vestido. Pra alcance, a identidade precisaria aparecer cedo e se repetir.', improvements: ['Logo discreto desde o início e vinheta da coleção no fim'] },
    { objective: 'Cadastro/Geração de Leads', fit: 'fraco', note: 'Não há troca de valor pra capturar contato — nesse nicho funcionaria um "entre na lista VIP da coleção com 10% na primeira compra", mas o criativo atual não sustenta essa oferta.', improvements: ['Criar versão com oferta de lista VIP + cupom de primeira compra'] },
  ],
  recommended_objective:
    'Esse criativo, como está, serve melhor pra campanhas de Cliques/Tráfego — o desejo visual é o ponto forte. Com preço na tela e o movimento antecipado, passa a competir de igual em Vendas/Conversão, que é onde um lançamento de coleção mais rende.',
  timeline: [],
  briefing_compatibility: {
    overall_score: 0.66,
    items: [
      { item: 'Destacar o caimento e o movimento do tecido', score: 0.55, status: 'precisa_melhorar', missing: ['Movimento nos 3 primeiros segundos', 'Take de caminhada em plano aberto'], potential_score: 0.9 },
      { item: 'Comunicar lançamento da coleção de verão', score: 0.85, status: 'excelente', missing: [], potential_score: 0.85 },
      { item: 'Preço parcelado visível', score: 0.2, status: 'ausente', missing: ['Texto na tela com "6x de R$ 49,90"'], potential_score: 0.85 },
      { item: 'Mostrar versatilidade (trabalho ao jantar)', score: 0.35, status: 'precisa_melhorar', missing: ['Segunda ocasião de uso no mesmo vídeo', 'Styling com acessórios diferentes'], potential_score: 0.8 },
    ],
  },
}

/* Roteiro por objetivo — amostra estática do relatório de otimização por cena que
   a plataforma gera de verdade (na conta, ele é gerado sob demanda pro objetivo escolhido). */
const EXAMPLE_SCRIPT = {
  objective: 'Vendas/Conversão',
  scenes: [
    {
      time: '0s – 3s',
      onScreen: 'Modelo parada em frente ao espelho, ajeitando o vestido; texto "coleção verão" surge.',
      verdict: 'trocar' as const,
      direction:
        'Abra com o vestido em movimento, não parado: o giro que hoje está no segundo 12 vira a primeira imagem do vídeo — tecido rodando, câmera acompanhando. É o take que faz o dedo parar de rolar nesse nicho. O texto "coleção verão" entra por cima do movimento, não antes dele.',
    },
    {
      time: '3s – 8s',
      onScreen: 'Transição de look: do jeans pro vestido, com corte seco no espelho.',
      verdict: 'manter' as const,
      direction:
        'A transição é o ponto forte do criativo — mantenha exatamente como está. Só adicione texto discreto com o nome da peça ("Vestido Midi Linho — coleção verão") pra quem chegou agora saber o que está vendo.',
    },
    {
      time: '8s – 14s',
      onScreen: 'Takes da modelo posando com o vestido no mesmo cenário, ângulos parecidos.',
      verdict: 'trocar' as const,
      direction:
        'Aqui o vídeo vira catálogo e perde gente: mesmo corpo, mesmo cenário, mesma luz. Troque por versatilidade — a mesma peça em outra ocasião (com blazer pro trabalho, com sandália pro jantar) e, se houver material, em outro corpo. É essa sequência que transforma "ficou lindo nela" em "vai ficar lindo em mim".',
    },
    {
      time: '14s – 20s',
      onScreen: 'Close no tecido e no caimento; narração fala preço parcelado e frete grátis.',
      verdict: 'refazer' as const,
      direction:
        'Tudo que fecha a venda está aqui — mas só no áudio, e o feed roda sem som. Refaça a cena com a oferta em texto na tela: "6x de R$ 49,90", "frete grátis" e "primeira troca grátis". Cada uma dessas linhas em texto é uma objeção respondida antes do clique, e é o que derruba o custo por venda.',
    },
    {
      time: '20s – 24s',
      onScreen: 'Tarja final com logo da marca e "arrase no verão", tela escurece.',
      verdict: 'manter' as const,
      direction:
        'O fechamento com a marca está correto — mantenha, trocando o genérico "arrase no verão" por um CTA de ação com o gatilho do lançamento: "a coleção acabou de chegar — toque pra ver". Lançamento é janela de oportunidade; o texto final precisa lembrar isso.',
    },
  ],
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
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
}

const PLATFORMS = ['Meta', 'TikTok', 'YouTube', 'Instagram', 'Google Ads']

/* ------------------------------------------------------------------ */
/* Demo animada: o pipeline da Ryber trabalhando ao vivo               */
/* ------------------------------------------------------------------ */

const DEMO_STAGES = [
  { key: 'upload', label: 'Recebendo criativo' },
  { key: 'frames', label: 'Separando os frames' },
  { key: 'audio', label: 'Escutando o áudio' },
  { key: 'read', label: 'Interpretando o anúncio' },
  { key: 'verdict', label: 'Veredito pronto' },
] as const

const STAGE_DURATION_MS = 2600

function DemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-2xl glass shadow-elevated overflow-hidden w-full max-w-md">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2.5 text-xs text-ink-faint font-mono">Ryber · analisando ao vivo</span>
      </div>
      <div className="relative p-5 min-h-[340px]">{children}</div>
    </div>
  )
}

function StageDots({ stage }: { stage: number }) {
  return (
    <div className="absolute bottom-4 left-5 right-5 flex items-center gap-2">
      {DEMO_STAGES.map((s, i) => (
        <div key={s.key} className="flex-1 h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
          {i <= stage && (
            <motion.div
              layout
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: i === stage ? STAGE_DURATION_MS / 1000 : 0.2, ease: 'linear' }}
              className="h-full w-full origin-left rounded-full bg-gradient-to-r from-accent to-cyan"
            />
          )}
        </div>
      ))}
    </div>
  )
}

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
}

function PipelineDemo() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % DEMO_STAGES.length), STAGE_DURATION_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <DemoShell>
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={DEMO_STAGES[stage].key}
            {...fadeSlide}
            className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft"
          >
            {DEMO_STAGES[stage].label}
          </motion.span>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {/* 1 — upload */}
        {stage === 0 && (
          <motion.div key="upload" {...fadeSlide} className="space-y-4">
            <div className="rounded-xl border border-dashed border-accent-line bg-accent-soft/40 px-4 py-8 flex flex-col items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-accent-soft border border-accent-line flex items-center justify-center">
                <Icon path={ICONS.play} className="h-5 w-5 text-accent" />
              </div>
              <div className="text-sm font-medium text-ink">anuncio-lancamento.mp4</div>
              <div className="w-full max-w-[220px] h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2.1, ease: 'easeInOut' }}
                  className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-cyan"
                />
              </div>
              <div className="text-[11px] text-ink-faint">34 MB · vídeo vertical · 21s</div>
            </div>
          </motion.div>
        )}

        {/* 2 — frames */}
        {stage === 1 && (
          <motion.div key="frames" {...fadeSlide} className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.14, duration: 0.3 }}
                  className="relative aspect-[3/4] rounded-lg bg-gradient-to-br from-panel-raised to-accent-soft border border-white/[0.07] overflow-hidden"
                >
                  <div className="absolute bottom-1 left-1.5 text-[9px] font-mono text-ink-faint">{(i * 3).toFixed(0)}s</div>
                  {i === 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="absolute inset-1 rounded border border-cyan/60"
                    >
                      <div className="absolute -top-0.5 left-1 -translate-y-full text-[8px] font-semibold text-cyan whitespace-nowrap">produto</div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="text-[11px] text-ink-faint">8 de 40 frames extraídos…</div>
          </motion.div>
        )}

        {/* 3 — áudio */}
        {stage === 2 && (
          <motion.div key="audio" {...fadeSlide} className="space-y-4">
            <div className="flex items-end justify-center gap-[3px] h-16">
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0.2 }}
                  animate={{ scaleY: [0.2, 0.4 + Math.abs(Math.sin(i * 1.7)) * 0.6, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.045, ease: 'easeInOut' }}
                  className="w-[5px] origin-bottom rounded-full bg-gradient-to-t from-accent to-cyan"
                />
              ))}
            </div>
            <div className="space-y-2">
              {[
                '"Chegou o lançamento que vocês pediram…"',
                '"couro legítimo, palmilha anatômica…"',
                '"toca no link e garante o seu."',
              ].map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.55 }}
                  className="text-xs text-ink-soft font-mono"
                >
                  <span className="text-ink-faint mr-2">{`0${i * 7}s`}</span>
                  {line}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4 — leitura */}
        {stage === 3 && (
          <motion.div key="read" {...fadeSlide} className="space-y-2.5">
            {[
              { k: 'Produto', v: 'Tênis casual em couro' },
              { k: 'Público', v: 'Mulheres · 25-40 · Classe B/C' },
              { k: 'Emoção', v: 'Confiança' },
              { k: 'Gatilho', v: 'Lançamento + urgência' },
              { k: 'Risco', v: 'CTA só no final do vídeo', warn: true },
            ].map((row, i) => (
              <motion.div
                key={row.k}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.32 }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                  row.warn ? 'border-warn/25 bg-warn-soft text-warn' : 'border-white/[0.07] bg-white/[0.02]'
                }`}
              >
                <span className={row.warn ? 'font-semibold' : 'text-ink-faint font-semibold uppercase tracking-wide text-[10px]'}>
                  {row.k}
                </span>
                <span className={row.warn ? '' : 'text-ink font-medium'}>{row.v}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 5 — veredito */}
        {stage === 4 && (
          <motion.div key="verdict" {...fadeSlide} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1">
                  Chance de performar
                </div>
                <div className="text-sm text-ink-soft">Boa base — 2 correções destravam mais</div>
              </div>
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
                <ScoreGauge pct={74} color="var(--color-accent)" size={64} strokeWidth={6} />
              </motion.div>
            </div>
            <div className="space-y-2">
              {[
                { t: 'Hook forte nos 3 primeiros segundos', ok: true },
                { t: 'Antecipar a chamada pra ação', ok: false },
                { t: 'Reforçar durabilidade em texto na tela', ok: false },
              ].map((item, i) => (
                <motion.div
                  key={item.t}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.25 }}
                  className="flex items-center gap-2 text-xs text-ink-soft"
                >
                  <Icon path={item.ok ? ICONS.check : ICONS.alert} className={`h-4 w-4 shrink-0 ${item.ok ? 'text-success' : 'text-warn'}`} />
                  {item.t}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StageDots stage={stage} />
    </DemoShell>
  )
}

/* ------------------------------------------------------------------ */
/* Seções de narrativa por scroll                                      */
/* ------------------------------------------------------------------ */

interface StorySection {
  eyebrow: string
  title: string
  text: string
  points: { lead: string; text: string }[]
}

const STORY: StorySection[] = [
  {
    eyebrow: 'O problema',
    title: 'Hoje você só descobre que o anúncio era ruim depois que o dinheiro acabou.',
    text: 'A plataforma recebe seu vídeo, decide sozinha pra quem entregar e te devolve o resultado só depois da verba gasta. O criativo é 70% do resultado — e é exatamente a parte que ninguém te deixa auditar antes.',
    points: [
      { lead: 'Verba queimada em teste cego:', text: 'cada criativo fraco que vai pro ar é orçamento que não volta.' },
      { lead: 'Diagnóstico tardio:', text: 'quando o CPA explode, o estrago já aconteceu.' },
      { lead: 'Achismo no lugar de leitura:', text: '"acho que o vídeo tá bom" não é critério pra investir mídia.' },
    ],
  },
  {
    eyebrow: 'A virada',
    title: 'A Ryber lê seu anúncio como a plataforma lê. Antes de você pagar pra descobrir.',
    text: 'Produto, público provável, posicionamento, emoção dominante, ganchos, riscos — a mesma leitura que decide a entrega do seu anúncio, aberta na sua frente em minutos.',
    points: [
      { lead: 'Pra quem esse anúncio vai:', text: 'gênero, faixa etária, classe social e interesses que o algoritmo vai inferir.' },
      { lead: 'O que ele comunica de verdade:', text: 'nem sempre é o que você imaginou ao gravar — e essa diferença custa caro.' },
      { lead: 'Onde ele vaza dinheiro:', text: 'alertas específicos do que derruba a performance, cena por cena.' },
    ],
  },
  {
    eyebrow: 'A decisão',
    title: 'Publique sabendo. Corrija antes. Escale o que tem chance real.',
    text: 'Nota de performance, leitura métrica a métrica (Hook, Hold, CTR, CPC, CPM, CPA, ROAS), melhor objetivo de campanha e um plano de correção por cena — tudo acionável, nada genérico.',
    points: [
      { lead: 'Veredito por métrica:', text: 'o que cada indicador diz sobre esse criativo específico, não teoria.' },
      { lead: 'Plano de otimização por cena:', text: 'o que trocar, em qual segundo, e por quê.' },
      { lead: 'Benchmark do seu nicho:', text: 'como você se compara com o que já passou pela Ryber no seu mercado.' },
    ],
  },
]

function StoryBlock({ section, index }: { section: StorySection; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="relative grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-14 items-start"
    >
      <div className="lg:sticky lg:top-28">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-4 flex items-center gap-2.5">
          <span className="font-mono text-ink-faint">0{index + 1}</span>
          <span className="h-px w-8 bg-gradient-to-r from-accent to-transparent" />
          {section.eyebrow}
        </div>
        <h2 className="font-display text-2xl sm:text-[2rem] font-semibold tracking-tight leading-[1.15] text-ink mb-4">
          {section.title}
        </h2>
        <p className="text-ink-soft text-sm sm:text-base leading-relaxed">{section.text}</p>
      </div>
      <div className="space-y-3">
        {section.points.map((p, i) => (
          <motion.div
            key={p.lead}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group rounded-2xl glass p-5 shadow-card transition-all duration-300 hover:border-accent-line hover:shadow-glow"
          >
            <div className="text-sm sm:text-[15px] leading-relaxed">
              <span className="font-semibold text-ink">{p.lead}</span>{' '}
              <span className="text-ink-soft">{p.text}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Vitrine do relatório em abas — compacta, com o conteúdo real        */
/* ------------------------------------------------------------------ */

const SCRIPT_VERDICT = {
  manter: { label: 'Manter', cls: 'bg-success-soft text-success border-success/25' },
  trocar: { label: 'Trocar', cls: 'bg-warn-soft text-warn border-warn/25' },
  refazer: { label: 'Refazer', cls: 'bg-danger-soft text-danger border-danger/25' },
} as const

function ScriptShowcase() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent-line bg-accent-soft/60 p-4 text-sm text-ink-soft leading-relaxed">
        <span className="font-semibold text-accent">Roteiro de edição pro objetivo: {EXAMPLE_SCRIPT.objective}.</span>{' '}
        Cena por cena, o que manter, trocar ou refazer no seu vídeo — gerado sob demanda pro objetivo de
        campanha que você escolher.
      </div>
      <div className="space-y-3">
        {EXAMPLE_SCRIPT.scenes.map((scene) => {
          const v = SCRIPT_VERDICT[scene.verdict]
          return (
            <div key={scene.time} className="rounded-2xl border border-line bg-panel p-5 shadow-card">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="font-mono text-xs text-accent font-semibold">{scene.time}</span>
                <span className={`rounded-full border text-xs font-medium px-2.5 py-0.5 ${v.cls}`}>{v.label}</span>
              </div>
              <div className="text-xs text-ink-faint mb-2 leading-relaxed">
                <span className="font-semibold uppercase tracking-wide text-[10px]">Na tela hoje: </span>
                {scene.onScreen}
              </div>
              <p className="text-sm text-ink leading-relaxed">{scene.direction}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SHOWCASE_TABS = [
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'leitura', label: 'Leitura do criativo' },
  { id: 'roteiro', label: 'Roteiro por objetivo' },
  { id: 'resumo', label: 'Resumo & briefing' },
] as const

type ShowcaseTab = (typeof SHOWCASE_TABS)[number]['id']

function ExampleShowcase() {
  const [tab, setTab] = useState<ShowcaseTab>('diagnostico')

  return (
    <div className="rounded-2xl glass shadow-elevated overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-2.5 text-xs text-ink-faint font-mono truncate">
          Relatório · Vestido midi de linho · exemplo ilustrativo
        </span>
      </div>

      <div className="px-4 sm:px-6 pt-4 border-b border-white/[0.06]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
          {SHOWCASE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-xl border border-b-0 transition-all ${
                tab === t.id
                  ? 'bg-panel text-ink border-white/[0.08]'
                  : 'bg-transparent text-ink-soft border-transparent hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-h-[540px] overflow-y-auto p-4 sm:p-6 bg-panel/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {tab === 'diagnostico' && (
              <>
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
              </>
            )}
            {tab === 'leitura' && <ResultCards result={EXAMPLE_RESULT} />}
            {tab === 'roteiro' && <ScriptShowcase />}
            {tab === 'resumo' && (
              <>
                <AlertsList alerts={EXAMPLE_RESULT.alerts} />
                <NarrativeBlock
                  narrative={EXAMPLE_RESULT.narrative}
                  audienceConclusion={EXAMPLE_RESULT.audience_conclusion}
                />
                <BriefingCompat compat={EXAMPLE_RESULT.briefing_compatibility!} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nav, banner, footer                                                 */
/* ------------------------------------------------------------------ */

function AnnouncementBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-b border-white/[0.06] bg-white/[0.02] text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
        <Link to="/signup" className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors">
          <span className="truncate">Primeira análise grátis — veja seu anúncio pelos olhos da plataforma</span>
          <Icon path={ICONS.arrow} className="h-3.5 w-3.5 shrink-0 text-accent" />
        </Link>
        <button onClick={onClose} className="shrink-0 text-ink-faint hover:text-ink transition-colors">
          <Icon path={ICONS.close} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function LandingNav() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-canvas/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-mark.png" alt="" className="h-6 w-6" />
          <span className="font-display font-semibold tracking-tight text-ink text-sm">Ryber</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-soft">
          <a href="#historia" className="hover:text-ink transition-colors">Por que a Ryber</a>
          <a href="#demonstracao" className="hover:text-ink transition-colors">Veja na prática</a>
          <a href="#como-funciona" className="hover:text-ink transition-colors">Como funciona</a>
          <a href="#precos" className="hover:text-ink transition-colors">Planos</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link to="/app" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap">
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors whitespace-nowrap">
                Entrar
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-accent text-white px-4 py-2 text-sm font-medium whitespace-nowrap shadow-glow hover:bg-accent-strong hover:-translate-y-px transition-all"
              >
                Analisar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-3">{title}</div>
      <div className="space-y-2 text-sm text-ink-soft">{children}</div>
    </div>
  )
}

function CtaButton({ children = 'Analisar meu anúncio grátis' }: { children?: ReactNode }) {
  return (
    <Link
      to="/signup"
      className="group relative inline-flex items-center gap-2 rounded-full bg-accent text-white px-7 py-3.5 font-semibold text-sm shadow-glow overflow-hidden hover:bg-accent-strong hover:-translate-y-0.5 transition-all duration-300"
    >
      <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <span className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-beam" />
      </span>
      <span className="relative">{children}</span>
      <Icon path={ICONS.arrow} className="relative h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function Landing() {
  const [showBanner, setShowBanner] = useState(true)

  return (
    <div className="min-h-full flex flex-col overflow-x-clip">
      {showBanner && <AnnouncementBar onClose={() => setShowBanner(false)} />}
      <LandingNav />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="aurora animate-aurora h-[420px] w-[420px] -top-32 left-[8%] bg-accent/25" />
        <div className="aurora animate-aurora h-[360px] w-[360px] top-10 right-[4%] bg-violet/20" style={{ animationDelay: '-6s' }} />
        <div className="aurora animate-aurora h-[300px] w-[300px] top-64 left-[45%] bg-cyan/10" style={{ animationDelay: '-11s' }} />

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              Inteligência de criativos
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight mb-5 leading-[1.08] text-ink">
              Seu anúncio vai vender ou vai queimar verba?{' '}
              <span className="text-gradient">Descubra antes de investir.</span>
            </h1>
            <p className="text-ink-soft text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              Envie o vídeo, imagem ou link do anúncio e receba em minutos a leitura completa que decide o
              destino dele: pra quem a plataforma vai entregar, o que está travando a conversão e o que corrigir
              antes de colocar um real em mídia.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <CtaButton />
              <a href="#demonstracao" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
                Ver a análise acontecendo ↓
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-ink-faint">
              <Icon path={ICONS.check} className="h-4 w-4 text-success" />
              Primeira análise grátis · sem cartão de crédito
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="animate-float w-full max-w-md">
              <PipelineDemo />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
        <hr className="glow-divider" />
      </div>

      {/* Prova em números */}
      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[
            { big: '21', label: 'vereditos individuais em cada análise — 9 dimensões, 7 métricas de tráfego e 5 objetivos de campanha, um por um' },
            { big: '100%', label: 'do criativo auditado: frame a frame no vídeo, palavra por palavra no áudio' },
            { big: '~5 min', label: 'do envio ao relatório completo, com roteiro de correção cena por cena' },
            { big: 'R$ 0', label: 'de verba queimada pra descobrir tudo isso — o veredito sai antes do investimento em mídia' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center lg:text-left"
            >
              <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-gradient">{stat.big}</div>
              <div className="text-xs sm:text-sm text-ink-soft leading-snug max-w-[220px] mx-auto lg:mx-0">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* História em 3 atos */}
      <section id="historia" className="relative px-4 sm:px-6 py-16 sm:py-24 scroll-mt-14">
        <div className="max-w-6xl mx-auto space-y-24 sm:space-y-32">
          {STORY.map((s, i) => (
            <StoryBlock key={s.eyebrow} section={s} index={i} />
          ))}
        </div>
      </section>

      {/* Exemplo completo do dashboard, com os componentes reais do app */}
      <section id="demonstracao" className="relative px-4 sm:px-6 py-16 sm:py-24 scroll-mt-14 overflow-hidden">
        <div className="aurora animate-aurora h-[380px] w-[380px] top-0 right-[10%] bg-accent/15" />
        <div className="relative max-w-3xl mx-auto text-center mb-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-3 flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Veja na prática
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-ink">
            O relatório que você recebe, por dentro
          </h2>
          <p className="text-ink-soft text-sm sm:text-base leading-relaxed">
            Dado ilustrativo — mas os componentes abaixo são exatamente os do relatório real da sua conta.
            É isso que chega a cada análise.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-3xl mx-auto"
        >
          <ExampleShowcase />
        </motion.div>
        <div className="relative text-center mt-10">
          <CtaButton>Quero esse relatório do meu anúncio</CtaButton>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-4 sm:px-6 py-16 sm:py-24 scroll-mt-14">
        <div className="max-w-6xl mx-auto">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-3 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Como funciona
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-12 text-ink">
            Do envio ao veredito, em quatro passos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[
              { n: '01', title: 'Envie o criativo', text: 'Vídeo, imagem ou o link direto do anúncio — Instagram, TikTok, Facebook.' },
              { n: '02', title: 'A leitura acontece', text: 'Frames, áudio e fala são destrinchados como a plataforma de anúncios faria na entrega.' },
              { n: '03', title: 'Receba o veredito', text: 'Nota de performance, público, riscos, benchmark do nicho e a leitura métrica a métrica.' },
              { n: '04', title: 'Corrija e publique', text: 'Plano de otimização por cena: o que trocar, em qual segundo, e por quê — antes da verba.' },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl glass p-5 shadow-card hover:border-accent-line hover:shadow-glow transition-all duration-300"
              >
                <div className="font-mono text-xs text-accent mb-4">{step.n}</div>
                <div className="text-sm font-semibold mb-1.5 text-ink">{step.title}</div>
                <p className="text-sm text-ink-soft leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plataformas */}
      <section className="px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-sm text-ink-faint mb-6">
            Pensada pra criativos que rodam nas principais plataformas de anúncio
          </div>
          <div className="flex items-center justify-center gap-x-10 gap-y-3 flex-wrap text-base font-semibold text-ink-faint">
            {PLATFORMS.map((p) => (
              <span key={p} className="hover:text-ink-soft transition-colors cursor-default">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Assinatura */}
      <section id="precos" className="relative px-4 sm:px-6 py-16 sm:py-24 scroll-mt-14 overflow-hidden">
        <div className="aurora animate-aurora h-[420px] w-[420px] -bottom-40 left-[30%] bg-violet/15" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-3 flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Planos
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-ink">
            Custa menos que um único criativo mal publicado
          </h2>
          <p className="text-ink-soft text-sm sm:text-base mb-14 leading-relaxed max-w-lg mx-auto">
            Cada plano dá um número de análises por mês. Cancele quando quiser.
            A primeira análise é grátis, sem compromisso e sem cartão.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch pt-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} highlight={plan.id === 'titanium'} features={PLAN_FEATURES} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto relative rounded-3xl glass overflow-hidden shadow-glow text-center px-6 sm:px-10 py-14 sm:py-20"
        >
          <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
          <div className="aurora animate-aurora h-[300px] w-[300px] -top-24 left-1/2 -translate-x-1/2 bg-accent/20" />
          <h2 className="relative font-display text-2xl sm:text-[2.15rem] font-bold tracking-tight mb-4 text-ink max-w-xl mx-auto leading-tight">
            O próximo anúncio que você publicar pode ser o que converte —{' '}
            <span className="text-gradient">ou o que queima a verba.</span>
          </h2>
          <p className="relative text-ink-soft text-sm sm:text-base max-w-md mx-auto mb-9 leading-relaxed">
            Saiba qual dos dois antes de investir. Sua primeira análise é grátis e fica pronta em minutos.
          </p>
          <div className="relative">
            <CtaButton />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/logo-mark.png" alt="" className="h-6 w-6" />
                <span className="font-display font-semibold text-ink">Ryber</span>
              </div>
              <p className="mt-3 text-xs text-ink-faint leading-relaxed max-w-[200px]">
                A leitura do seu anúncio antes do investimento em mídia.
              </p>
            </div>
            <FooterColumn title="Produto">
              <a href="#historia" className="block hover:text-ink transition-colors">Por que a Ryber</a>
              <a href="#como-funciona" className="block hover:text-ink transition-colors">Como funciona</a>
              <a href="#precos" className="block hover:text-ink transition-colors">Planos</a>
            </FooterColumn>
            <FooterColumn title="Conta">
              <Link to="/login" className="block hover:text-ink transition-colors">Entrar</Link>
              <Link to="/signup" className="block hover:text-ink transition-colors">Criar conta</Link>
            </FooterColumn>
            <FooterColumn title="Contato">
              <a href="mailto:contato@ryber.app" className="block hover:text-ink transition-colors">contato@ryber.app</a>
              <Link to="/privacidade" className="block hover:text-ink transition-colors">Política de Privacidade</Link>
              <Link to="/termos" className="block hover:text-ink transition-colors">Termos de Uso</Link>
            </FooterColumn>
          </div>
          <div className="border-t border-white/[0.06] pt-6 text-xs text-ink-faint text-center">
            © {new Date().getFullYear()} Ryber. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
