import { Header } from '../components/Header'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-ink tracking-tight mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-ink-soft leading-relaxed">{children}</div>
    </section>
  )
}

export function Terms() {
  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <Header />

      <div className="relative flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent border border-accent-line bg-accent-soft rounded-full px-3.5 py-1.5 mb-5">
            <span className="h-1 w-1 rounded-full bg-accent shadow-glow" />
            Legal
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-2">
            Termos de Uso
          </h1>
          <p className="text-sm text-ink-faint">Última atualização: 06 de agosto de 2026</p>
        </div>

        <p className="text-sm text-ink-soft leading-relaxed mb-10">
          Estes Termos de Uso regem o acesso e uso da plataforma <strong className="text-ink">Ryber</strong>. Ao
          criar uma conta ou usar nossos serviços, você concorda integralmente com estes termos. Se não
          concordar, não utilize a plataforma. Recomendamos ler também nossa{' '}
          <a href="/privacidade" className="text-accent hover:underline">Política de Privacidade</a>.
        </p>

        <Section title="1. O que é a Ryber">
          <p>
            A Ryber é uma plataforma de análise de criativos publicitários (vídeos e imagens). Você envia um
            criativo e recebemos, processamos e devolvemos uma leitura sobre como algoritmos de plataformas de
            anúncios e o público real tendem a interpretar e reagir a ele, incluindo sugestões de edição e
            adequação a objetivos de campanha. As análises são geradas por inteligência artificial e têm
            caráter de apoio à decisão — não são garantia de resultado.
          </p>
        </Section>

        <Section title="2. Cadastro e conta">
          <p>
            Para usar a Ryber você precisa criar uma conta com e-mail e senha, ou entrar com sua conta Google.
            Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas
            na sua conta. Informe dados verdadeiros no cadastro — CPF/CNPJ é exigido para fins de emissão de
            cobrança, conforme a legislação brasileira.
          </p>
        </Section>

        <Section title="3. Teste gratuito">
          <p>
            Toda conta nova tem direito a 1 (uma) análise gratuita, sem necessidade de pagamento, para
            experimentar a plataforma. Após o uso da análise gratuita, é necessário assinar um dos planos pagos
            para continuar analisando novos criativos.
          </p>
        </Section>

        <Section title="4. Planos, preços e cobrança">
          <p>
            Os planos pagos são cobrados mensalmente, de forma recorrente, através do nosso processador de
            pagamentos (Asaas), aceitando PIX, cartão de crédito e boleto bancário. Cada plano concede uma cota
            mensal de análises, renovada a cada ciclo de cobrança. Os preços vigentes são sempre os exibidos na
            página <a href="/planos" className="text-accent hover:underline">Planos</a> no momento da
            assinatura.
          </p>
          <p>
            A assinatura renova automaticamente todo mês, na mesma data do pagamento inicial, até que seja
            cancelada. Alterações de plano (upgrade) entram em vigor imediatamente, com ajuste proporcional de
            cobrança quando aplicável.
          </p>
        </Section>

        <Section title="5. Cancelamento e reembolso">
          <p>
            Você pode cancelar sua assinatura a qualquer momento, diretamente na página{' '}
            <a href="/planos" className="text-accent hover:underline">Planos</a>, sem necessidade de justificar
            o motivo — embora possamos pedir um breve retorno sobre sua experiência para melhorar o produto.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-ink">Direito de arrependimento (Art. 49 do Código de Defesa do
              Consumidor):</strong> como a contratação é feita à distância, você tem até 7 (sete) dias corridos
              a partir da data do primeiro pagamento para desistir da assinatura e solicitar reembolso
              integral, sem necessidade de justificativa. Basta entrar em contato pelo e-mail informado na
              seção 12.
            </li>
            <li>
              <strong className="text-ink">Cancelamento após esse prazo:</strong> ao cancelar, você mantém
              acesso ao plano contratado até o fim do período já pago (a data exata é exibida na tela de
              cancelamento e no seu dashboard). Não há reembolso proporcional pelos dias restantes do período,
              já que o acesso ao serviço permanece disponível até essa data. A cobrança recorrente é
              interrompida e nenhuma nova cobrança é feita após o cancelamento.
            </li>
            <li>
              <strong className="text-ink">Pagamentos não identificados ou falhos:</strong> caso um pagamento
              seja cobrado indevidamente por erro técnico comprovado (ex.: cobrança duplicada), o valor será
              estornado integralmente mediante solicitação e verificação.
            </li>
          </ul>
        </Section>

        <Section title="6. Uso aceitável">
          <p>Ao usar a Ryber, você concorda em não:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Enviar conteúdo ilegal, que infrinja direitos autorais de terceiros, ou que viole leis
              aplicáveis.</li>
            <li>Tentar acessar áreas, dados ou contas de outros usuários sem autorização.</li>
            <li>Utilizar a plataforma para fins de engenharia reversa, extração em massa automatizada
              (scraping) ou revenda não autorizada do serviço.</li>
            <li>Criar múltiplas contas para burlar o limite do teste gratuito ou da cota de análises.</li>
          </ul>
          <p>O descumprimento pode levar à suspensão ou encerramento da conta, sem reembolso do período em curso.</p>
        </Section>

        <Section title="7. Propriedade intelectual">
          <p>
            O conteúdo que você envia (vídeos, imagens, briefings) continua sendo de sua propriedade. Ao
            enviá-lo, você concede à Ryber uma licença limitada para processá-lo exclusivamente com o objetivo
            de gerar sua análise — não usamos seu conteúdo para treinar modelos de terceiros nem o
            compartilhamos publicamente.
          </p>
          <p>
            A plataforma, marca, tecnologia e metodologia de análise da Ryber são de propriedade exclusiva da
            Ryber e protegidas por lei. Os relatórios e sugestões gerados são de uso do assinante, para fins
            próprios de marketing e publicidade.
          </p>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            As análises são geradas por inteligência artificial e representam uma interpretação probabilística,
            não uma garantia de performance, aprovação em plataformas de anúncios ou resultado de vendas. A
            Ryber é uma ferramenta de apoio à decisão criativa — a responsabilidade final sobre o uso do
            criativo e suas campanhas é sempre do usuário.
          </p>
          <p>
            Na máxima extensão permitida por lei, a Ryber não se responsabiliza por perdas indiretas, lucros
            cessantes ou danos decorrentes do uso ou da impossibilidade de uso da plataforma.
          </p>
        </Section>

        <Section title="9. Disponibilidade do serviço">
          <p>
            Nos esforçamos para manter a plataforma disponível de forma contínua, mas não garantimos
            disponibilidade ininterrupta. Podem ocorrer manutenções programadas ou instabilidades pontuais,
            sem que isso gere direito a reembolso, salvo indisponibilidade prolongada e injustificada.
          </p>
        </Section>

        <Section title="10. Alterações nestes termos">
          <p>
            Podemos atualizar estes Termos de Uso periodicamente. A data no topo desta página indica a versão
            mais recente. Mudanças relevantes serão comunicadas por e-mail ou aviso na plataforma antes de
            entrarem em vigor.
          </p>
        </Section>

        <Section title="11. Encerramento de conta pela Ryber">
          <p>
            Podemos suspender ou encerrar contas que violem estes termos, mediante aviso quando possível. Em
            casos de violação grave (fraude, conteúdo ilegal, abuso da plataforma), o encerramento pode ocorrer
            imediatamente e sem reembolso do período em curso.
          </p>
        </Section>

        <Section title="12. Lei aplicável e contato">
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
            domicílio do consumidor para dirimir eventuais controvérsias, conforme o Código de Defesa do
            Consumidor.
          </p>
          <p>
            Dúvidas, cancelamentos ou solicitações de reembolso podem ser enviados para{' '}
            <a href="mailto:rybertechnology@gmail.com" className="text-accent hover:underline">
              rybertechnology@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
