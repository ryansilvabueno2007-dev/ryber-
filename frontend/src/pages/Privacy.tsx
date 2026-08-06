import { Header } from '../components/Header'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-ink tracking-tight mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-ink-soft leading-relaxed">{children}</div>
    </section>
  )
}

export function Privacy() {
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
            Política de Privacidade
          </h1>
          <p className="text-sm text-ink-faint">Última atualização: 06 de agosto de 2026</p>
        </div>

        <p className="text-sm text-ink-soft leading-relaxed mb-10">
          Esta Política de Privacidade explica como a <strong className="text-ink">Ryber</strong> coleta, usa,
          armazena e protege os dados pessoais de quem usa nossa plataforma de análise de criativos
          publicitários. Ao criar uma conta ou usar a Ryber, você concorda com as práticas descritas aqui.
          Elaboramos esta política em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
          13.709/2018).
        </p>

        <Section title="1. Quem somos">
          <p>
            A Ryber é uma plataforma que analisa criativos publicitários (vídeos e imagens) e revela como
            algoritmos de plataformas de anúncios e o público real tendem a interpretar e reagir a eles. Somos
            os controladores dos dados pessoais tratados através da plataforma, nos termos da LGPD.
          </p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <p>Coletamos apenas os dados necessários para oferecer o serviço:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-ink">Dados de cadastro:</strong> nome, e-mail e senha (armazenada com
              hash criptográfico — nunca em texto puro). Se você entrar com sua conta Google, recebemos seu
              nome e e-mail diretamente do Google, sem acesso à sua senha.
            </li>
            <li>
              <strong className="text-ink">Dados de cobrança:</strong> CPF ou CNPJ, exigidos pela legislação
              brasileira para emissão de cobrança. Os dados de pagamento em si (cartão, PIX, boleto) são
              processados diretamente pelo nosso parceiro de pagamentos — a Ryber não armazena números de
              cartão de crédito.
            </li>
            <li>
              <strong className="text-ink">Conteúdo enviado por você:</strong> os vídeos, imagens e briefings
              de texto que você envia para análise, junto com os resultados gerados (leitura de público,
              performance prevista, roteiros de edição, etc.).
            </li>
            <li>
              <strong className="text-ink">Dados de uso:</strong> histórico de análises, plano de assinatura,
              cota utilizada, e interações com a plataforma.
            </li>
            <li>
              <strong className="text-ink">Dados técnicos:</strong> endereço IP e um cookie de sessão usado
              exclusivamente para manter você conectado à sua conta.
            </li>
          </ul>
        </Section>

        <Section title="3. Para que usamos seus dados">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Processar e entregar as análises de criativos solicitadas por você.</li>
            <li>Criar, autenticar e manter sua conta e sua assinatura.</li>
            <li>Processar cobranças e emitir os documentos fiscais exigidos por lei.</li>
            <li>Prevenir fraude, abuso e uso indevido da plataforma (ex.: limitar tentativas de cadastro).</li>
            <li>Enviar comunicações essenciais sobre sua conta (confirmações, avisos de cobrança e suporte).</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
          <p>Não usamos seus dados para publicidade de terceiros, e não vendemos dados pessoais.</p>
        </Section>

        <Section title="4. Com quem compartilhamos dados">
          <p>
            Compartilhamos dados apenas com prestadores de serviço estritamente necessários para operar a
            plataforma, todos sob obrigações contratuais de confidencialidade e segurança:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Processador de pagamentos, para cobrança de assinaturas.</li>
            <li>Provedores de infraestrutura em nuvem, para hospedagem, banco de dados e armazenamento dos
              arquivos enviados.</li>
            <li>Provedores de inteligência artificial, para processar e interpretar os criativos enviados e
              gerar os resultados da análise.</li>
            <li>Google, apenas se você optar por criar conta ou entrar usando login do Google.</li>
          </ul>
          <p>
            Podemos também divulgar dados quando exigido por lei, ordem judicial ou autoridade competente.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            Usamos apenas um cookie essencial de sessão, necessário para manter você autenticado na
            plataforma. Não utilizamos cookies de rastreamento publicitário ou de terceiros para marketing.
          </p>
        </Section>

        <Section title="6. Armazenamento e segurança">
          <p>
            Seus dados são armazenados em servidores com criptografia em trânsito (HTTPS). Senhas são
            armazenadas apenas como hash criptográfico, nunca em texto legível. O acesso aos sistemas internos
            é restrito e controlado. Apesar dos nossos esforços, nenhum sistema é 100% livre de risco — se
            identificarmos um incidente de segurança que afete seus dados, notificaremos você e as autoridades
            competentes conforme exigido pela LGPD.
          </p>
        </Section>

        <Section title="7. Por quanto tempo guardamos seus dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Dados de cobrança são mantidos pelo prazo
            exigido pela legislação fiscal brasileira. Você pode solicitar a exclusão da sua conta e dos dados
            associados a qualquer momento, conforme descrito na seção 8 — alguns registros podem ser
            retidos por período adicional quando exigido por obrigação legal (ex.: histórico fiscal).
          </p>
        </Section>

        <Section title="8. Seus direitos (LGPD)">
          <p>Como titular dos dados, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar os dados que temos sobre você.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
              desconformidade com a lei.</li>
            <li>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
            <li>Solicitar a exclusão dos dados tratados com base no seu consentimento.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Obter informação sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@ryber.app" className="text-accent hover:underline">
              contato@ryber.app
            </a>
            . Responderemos dentro do prazo estabelecido pela LGPD.
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente para refletir mudanças na plataforma ou na
            legislação. A data no topo desta página indica a versão mais recente. Alterações relevantes serão
            comunicadas por e-mail ou por aviso na plataforma.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados pessoais podem ser enviadas para{' '}
            <a href="mailto:contato@ryber.app" className="text-accent hover:underline">
              contato@ryber.app
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
