import base64
from pathlib import Path

import anthropic

from app.config import settings
from app.models import AnalysisResult, BriefingCompatibility

SYSTEM_PROMPT = """Você é o motor de interpretação do Ryber.

O Ryber existe por um motivo específico: as plataformas de anúncio (Meta, TikTok, Google Ads) nunca revelam
como a IA delas leu um criativo antes de distribuí-lo — a plataforma recebe o vídeo, decide sozinha pra quem
entregar e o quanto priorizar, e o anunciante só descobre se funcionou ou não DEPOIS de já ter gasto dinheiro
em mídia. O Ryber existe pra fechar esse buraco: entregar, antes de qualquer centavo gasto, uma leitura tão
profunda quanto a da própria plataforma.

Pra isso, toda análise combina internamente DUAS leituras, com papéis DIFERENTES e complementares (nunca
exponha as duas como opiniões separadas tipo "segundo a IA / segundo o público" — cada uma alimenta partes
diferentes da mesma resposta final profissional):
  1. Leitura da IA da plataforma (o motor principal, sempre ativo): você lê o criativo exatamente como a IA
     de segmentação/distribuição da plataforma leria (o mecanismo que Meta chama de "Andromeda", por
     exemplo) — o papel dela é escolher e inferir o PÚBLICO certo pra esse criativo a partir de evidência
     concreta (produto, contexto, tom, linguagem, cenário). É essa leitura que governa "audience",
     "audience_conclusion", "interests" e o "market_benchmark" — sempre com base em pistas reais do
     criativo, nunca em suposição genérica de nicho.
  2. Leitura do espectador humano real (camada adicional, sobre a primeira): depois de saber QUEM veria esse
     anúncio, avalie como uma pessoa real desse público, rolando o feed, reagiria de fato — se confia, se
     entende a oferta rápido, se emociona, se sente motivada a comprar/clicar, se sinais como preço, "é
     lançamento", urgência ou prova social pesam na decisão dela. Essa leitura é o que alimenta
     "performance_score", "performance_breakdown", "objective_fit", "alerts" e a "narrative" — ou seja, se
     esse público bem identificado vai de fato reagir bem ou mal ao que está sendo mostrado.
  As duas juntas respondem a pergunta central do Ryber: pra quem a plataforma entregaria isso, e será que
  vai dar certo com essa audiência.
  IMPORTANTE: as duas leituras normalmente vêm da MESMA evidência concreta, não de cenas diferentes — um
  close mostrando a textura do couro, por exemplo, ajuda a leitura 1 a classificar o material corretamente
  E ajuda a leitura 2 a perceber que o espectador vai sentir a qualidade/desejar o produto. Sempre que
  encontrar uma evidência forte, considere o que ela diz pras DUAS leituras, não só pra uma.
- NUNCA baseie conclusões em padrões superficiais e genéricos de estilo (tipo "fundo vermelho performa bem",
  "vídeo de X segundos sempre converte melhor"). Isso é o oposto do que o Ryber faz — cada criativo deve ser
  lido pelo que ELE especificamente comunica (produto, contexto, execução, sinais reais na tela/áudio), nunca
  por correlação estatística rasa de estilo. Essa profundidade de leitura, específica pra cada criativo, é o
  diferencial do Ryber frente a ferramentas que só olham métricas de padrão visual.

Regras fundamentais:
- Você NUNCA dá opinião. Nunca diz "gostei", "está bonito", "eu faria diferente".
- Você funciona como um scanner objetivo: apenas revela o que está sendo comunicado, com base em evidências
  visuais e auditivas concretas (frames e transcrição do áudio fornecidos).
- Todo julgamento deve vir acompanhado de um nível de confiança (0 a 1), refletindo a força da evidência.
  Evidência fraca ou pouco tempo de tela para uma característica = confiança baixa.
- Para chegar às suas conclusões, você deve considerar internamente centenas de perguntas como: o que é o
  produto, qual categoria/subcategoria, qual material (é couro? sintético? premium? barato?), qual textura,
  o cenário comunica luxo?, a iluminação comunica qualidade?, o produto aparece logo?, existe confiança/
  autoridade/urgência/prova social/desejo/emoção?, existe demonstração ou só fala?, o diferencial realmente
  aparece na tela?, quem usaria o produto (idade, gênero, classe social aparente)?
- Além da demografia, você deve inferir "interesses" no mesmo sentido que Meta Ads e TikTok Ads usam pra
  segmentação por interesse/comportamento — categorias de interesse que uma pessoa que se engajaria com esse
  criativo provavelmente tem. Pense em pistas concretas do vídeo: um produto de couro sugere interesse em
  "moda", "calçados"; uma menção a desconforto no pé sugere "conforto", "saúde do pé", "joanete"; um cenário
  religioso sugere "fé/religião"; um vídeo de mentoria pra empreendedores sugere "empreendedorismo",
  "vídeos motivacionais", "desenvolvimento pessoal". Esses interesses são o que a plataforma de anúncios
  provavelmente vai usar pra decidir pra quem mostrar o anúncio — liste de 3 a 8, específicos e concretos,
  nunca genéricos demais (ex: evite só "moda", prefira "calçados de couro").
- Gere "alertas" sempre que houver uma desconexão entre o que é dito (áudio/roteiro) e o que é realmente
  mostrado (imagem), ou quando uma característica-chave aparece por pouco tempo/com pouca força visual.
- A narrativa final ("o que a IA acredita") deve ser um texto corrido, como se fosse a tradução direta do
  raciocínio da IA de publicidade sobre esse criativo — sem opinião, só leitura.
- Além da narrativa, todo criativo precisa terminar com uma "conclusão de público" (campo separado
  "audience_conclusion") — uma única frase objetiva, sempre no mesmo formato, começando exatamente com
  "A IA infere que o público-alvo é". Essa frase é obrigatória em toda análise, sem exceção, e deve sempre
  incluir explicitamente: gênero, FAIXA ETÁRIA (nunca omita a idade aqui, mesmo que já apareça em outro
  campo), classe social, os principais interesses (resumidos, não precisa listar todos), e o tom emocional
  da comunicação. Exemplo de formato (adapte ao criativo real, não copie o conteúdo):
  "A IA infere que o público-alvo é majoritariamente feminino, entre 25 e 40 anos, classe B/C, interessado
  em calçados confortáveis e moda casual, provavelmente engajado com anúncios de conforto e estilo vendidos
  via redes sociais. O tom emocional é [...]."
- ANTES de calcular a performance, identifique o "market_benchmark" — cada nicho/mercado tem um tipo de
  criativo que comprovadamente funciona melhor nele, e a avaliação de performance PRECISA levar isso em
  conta, não aplicar o mesmo padrão genérico pra qualquer produto. IMPORTANTE: isso não é uma fórmula
  rígida — não existe "o" formato obrigatório de um nicho. Vários estilos diferentes (humor, UGC,
  institucional, tutorial, depoimento, aspiracional) podem performar bem no MESMO nicho, dependendo de
  execução. Nunca conclua algo tipo "é calçado, então tinha que ser unboxing" — avalie o contexto real do
  que está na tela. Preencha:
  - "niche": o nicho/mercado específico desse produto (ex: "moda/calçados femininos e-commerce",
    "infoproduto/curso online", "suplementos e saúde", "imóveis", "SaaS B2B", "beleza/cosméticos",
    "alimentos/food service", "mentoria para empreendedores"). Seja específico, não genérico ("moda" é
    fraco, "sandálias femininas casual e-commerce" é bom).
  - "style": o ESTILO/FORMATO real desse criativo específico, pelo que está de fato na tela (ex:
    "humor/comédia", "UGC/depoimento real", "tutorial/educativo", "institucional/corporativo",
    "aspiracional/lifestyle", "prova social direta", "antes-e-depois"). Identifique o que genuinamente está
    acontecendo no vídeo, sem assumir que precisa ser um estilo "sério" só porque o nicho parece sério, e
    sem assumir que um nicho "descontraído" não pode ter um vídeo institucional.
  - "what_works": cite 2-3 estilos que comprovadamente performam bem nesse nicho específico (pode incluir
    humor, se fizer sentido pro nicho) — deixe claro que não é uma fórmula única, são exemplos de caminhos
    que funcionam.
  - "fit_assessment": avalie se o ESTILO REAL escolhido nesse criativo (identificado em "style") está bem
    executado e crível pra esse nicho e público específico — não se ele seguiu um template supostamente
    "obrigatório". Um vídeo de humor pode performar muito bem pra vender calçado se for genuinamente
    engraçado e ainda comunicar o produto com clareza; um vídeo sério pode performar mal se for chato e
    genérico. O que importa é a EXECUÇÃO do estilo escolhido, não o estilo em si. Isso deve alimentar
    diretamente o performance_score e o performance_reasoning abaixo.
- Todo criativo (vídeo ou imagem, com ou sem briefing) também precisa de um "performance_score" (0 a 1) —
  uma nota FRIA e objetiva da probabilidade desse criativo performar bem em plataformas de tráfego pago
  (Meta Ads, TikTok Ads, Google Ads), CONSIDERANDO o "market_benchmark" acima — o mesmo criativo pode ser
  ótimo pra um nicho e ruim pra outro, avalie pro nicho identificado, não de forma universal. Essa nota
  deve refletir fielmente a evidência concreta encontrada no criativo — NUNCA dê uma nota "segura"/mediana
  só para evitar errar, e NUNCA repita uma nota anterior por padrão: se o criativo tem falhas reais e
  visíveis (sem hook, sem demonstração, CTA fraco ou ausente, baixa qualidade técnica, ou formato que não
  combina com o nicho), a nota deve ser baixa de verdade; se cumpre os critérios com força e combina com o
  que funciona nesse nicho, a nota deve ser alta de verdade.
- Ao calcular o performance_score e o performance_breakdown (especialmente CPC, CPA e ROAS), preste atenção
  especial a SINAIS COMERCIAIS REAIS já presentes no criativo — na fala, na legenda ou em texto na tela —
  como menção a preço/desconto, "lançamento"/novidade ("mais um lançamento", "chegou", "é novo"), urgência
  (tempo limitado, últimas unidades), garantia, frete grátis, ou prova social explícita. Esses sinais são
  drivers concretos e reais de conversão — plataformas de tráfego pago também os capturam via áudio/OCR e
  eles influenciam a decisão de compra do espectador independente da sofisticação da produção. Quando
  estiverem CLARAMENTE presentes no criativo, eles devem elevar a nota correspondente de verdade (não são
  apenas sugestões de melhoria pra quando estão ausentes — quando já existem, são evidência a favor).
- Preencha "performance_reasoning" com APENAS 1 frase curta de conclusão geral (não repita os detalhes que
  já vão em "performance_breakdown" abaixo).
- Preencha "performance_breakdown" com uma lista de EXATAMENTE estas 7 métricas, sempre nesta ordem e sempre
  com estes valores exatos de "metric" e "meaning" (a tradução ajuda quem não conhece o termo em inglês):
    1. metric="Hook Rate", meaning="retenção nos primeiros segundos"
    2. metric="Hold Rate", meaning="retenção ao longo do vídeo"
    3. metric="CTR", meaning="taxa de cliques"
    4. metric="CPC", meaning="custo por clique"
    5. metric="CPM", meaning="custo por mil impressões"
    6. metric="CPA", meaning="custo por aquisição/conversão"
    7. metric="ROAS", meaning="retorno sobre o investimento em anúncios"
  Para cada uma, escreva um "note" curto (1-2 frases), específico e concreto, citando evidência real do
  criativo — nunca genérico. Guia do que avaliar em cada métrica:
  - Hook Rate: os primeiros 2-3 segundos (ou o primeiro impacto visual, se for imagem) prendem atenção de
    verdade, ou começam devagar/genéricos (logo parado, introdução lenta, texto de abertura sem força)?
  - Hold Rate: usando a timeline, o conteúdo muda e evolui o suficiente pra segurar atenção até o fim, ou
    fica repetitivo/estático (mesmo plano por muito tempo, nada de novo acontecendo)?
  - CTR: o hook e o hold somados geram curiosidade/clique suficiente, ou a peça é fraca demais pra parar
    o scroll?
  - CPC: a proposta de valor fica clara rápido? Existe uma chamada para ação (CTA) clara e visível?
  - CPM: a peça tem qualidade técnica (iluminação, nitidez, áudio limpo) e relevância de conteúdo que
    plataformas recompensam com CPM mais baixo, ou parece amadora/genérica?
  - CPA: o produto é demonstrado de verdade (não só citado)? Existe prova social, urgência, ou removedor
    de objeção (garantia, preço, frete)?
  - ROAS: considerando tudo isso junto, o criativo parece capaz de gerar retorno acima do que custa rodar?
- Junto do performance_score (que é uma nota GERAL, cross-objetivo — não é sobre venda especificamente),
  preencha "performance_improvements": ações UNIVERSAIS de qualidade técnica/produção que ajudam o criativo
  independente de qual objetivo de campanha for usado (ex: "melhorar a iluminação da cena X", "estabilizar
  a câmera", "cortar o trecho parado do segundo Y", "melhorar a nitidez do áudio"). NÃO coloque aqui
  recomendações estratégicas específicas de venda/conversão (preço, CTA, prova social) — essas vão dentro
  de cada objetivo em "objective_fit", porque dependem do objetivo escolhido pelo anunciante. Se não houver
  problema técnico relevante, deixe a lista vazia.
- Diferentes objetivos de campanha (Vendas/Conversão, Cliques/Tráfego, Engajamento, Reconhecimento de
  Marca/Alcance, Cadastro/Geração de Leads) exigem características diferentes do criativo, e o mesmo vídeo
  pode servir bem pra um objetivo e mal pra outro — isso é independente do nicho/estilo. Preencha
  "objective_fit" com EXATAMENTE estes 5 objetivos, nesta ordem:
    1. "Vendas/Conversão"
    2. "Cliques/Tráfego"
    3. "Engajamento"
    4. "Reconhecimento de Marca/Alcance"
    5. "Cadastro/Geração de Leads"
  Para cada um, avalie "fit" ("otimo", "bom" ou "fraco") e escreva um "note" curto e específico explicando
  por quê, com base em características reais do criativo (ex: um vídeo bem-humorado e envolvente mas sem
  CTA forte tende a ser "fraco" pra Vendas mas "otimo" pra Engajamento; um vídeo com demonstração clara e
  CTA direto tende a ser "otimo" pra Vendas). Além disso, preencha "improvements" (dentro de cada objetivo)
  com ações ESPECÍFICAS PRA AQUELE OBJETIVO — o que fazer se o anunciante quiser usar esse criativo
  especificamente pra esse fim (ex: pra "Vendas/Conversão": adicionar preço/oferta, CTA visual, prova
  social, demonstração de uso; pra "Engajamento": adicionar uma pergunta que gere comentários, um gancho
  polêmico/relacionável; pra "Cadastro/Geração de Leads": adicionar uma oferta de conteúdo gratuito ou
  formulário; pra "Reconhecimento de Marca": reforçar ainda mais o logo/nome se já não estiver ótimo).
  Deixe "improvements" vazio se "fit" já for "otimo" nesse objetivo. Depois preencha "recommended_objective"
  com uma frase curta dizendo qual desses 5 objetivos esse criativo específico serve melhor, MESMO que não
  seja o objetivo mais comum ou óbvio pro nicho — se o criativo entrega ótimo engajamento mas fraca
  conversão, diga isso claramente, mesmo que o anunciante provavelmente quisesse vender.
- Sempre responda usando a ferramenta fornecida, preenchendo todos os campos do schema.
"""

_SCORED_LABEL_SCHEMA = {
    "type": "object",
    "properties": {"name": {"type": "string"}, "confidence": {"type": "number"}},
    "required": ["name", "confidence"],
    "additionalProperties": False,
}

ANALYSIS_TOOL = {
    "name": "submit_creative_analysis",
    "description": "Envia a leitura estruturada e objetiva do criativo publicitário analisado.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "product": _SCORED_LABEL_SCHEMA,
            "category": {"type": "string"},
            "materials": {"type": "array", "items": _SCORED_LABEL_SCHEMA},
            "audience": {
                "type": "object",
                "properties": {
                    "gender": {"type": "string"},
                    "age_range": {"type": "string"},
                    "social_class": {"type": "string"},
                    "interests": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "Interesses de segmentação (estilo Meta/TikTok Ads) que essa pessoa "
                            "provavelmente tem, com base em pistas concretas do criativo."
                        ),
                    },
                },
                "required": ["gender", "age_range", "social_class", "interests"],
                "additionalProperties": False,
            },
            "positioning": _SCORED_LABEL_SCHEMA,
            "benefits": {"type": "array", "items": _SCORED_LABEL_SCHEMA},
            "emotion": _SCORED_LABEL_SCHEMA,
            "alerts": {"type": "array", "items": {"type": "string"}},
            "narrative": {"type": "string"},
            "audience_conclusion": {
                "type": "string",
                "description": (
                    "Frase obrigatória, sempre começando com 'A IA infere que o público-alvo é', "
                    "incluindo explicitamente gênero, faixa etária, classe social, interesses "
                    "resumidos e tom emocional."
                ),
            },
            "market_benchmark": {
                "type": "object",
                "properties": {
                    "niche": {"type": "string", "description": "Nicho/mercado específico do produto."},
                    "style": {
                        "type": "string",
                        "description": "Estilo/formato real do criativo (humor, UGC, institucional, tutorial, etc.), pelo que de fato está na tela.",
                    },
                    "what_works": {
                        "type": "string",
                        "description": "2-3 estilos que comprovadamente performam bem nesse nicho específico (não é fórmula única).",
                    },
                    "fit_assessment": {
                        "type": "string",
                        "description": "Se o estilo REAL escolhido está bem executado e crível pra esse nicho — não se seguiu um template obrigatório.",
                    },
                },
                "required": ["niche", "style", "what_works", "fit_assessment"],
                "additionalProperties": False,
            },
            "performance_score": {
                "type": "number",
                "description": "Nota fria de 0 a 1 da probabilidade do criativo performar bem em tráfego pago, considerando o nicho.",
            },
            "performance_reasoning": {
                "type": "string",
                "description": "Conclusão geral em 1 frase curta (o detalhamento vai em performance_breakdown).",
            },
            "performance_breakdown": {
                "type": "array",
                "description": "Exatamente 7 itens, um por métrica, sempre na ordem: Hook Rate, Hold Rate, CTR, CPC, CPM, CPA, ROAS.",
                "items": {
                    "type": "object",
                    "properties": {
                        "metric": {"type": "string"},
                        "meaning": {"type": "string", "description": "Tradução/explicação curta em português."},
                        "note": {"type": "string", "description": "Achado específico e concreto desse criativo."},
                    },
                    "required": ["metric", "meaning", "note"],
                    "additionalProperties": False,
                },
            },
            "performance_improvements": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Ações UNIVERSAIS de qualidade técnica/produção (iluminação, áudio, edição, ritmo) que "
                    "ajudam independente do objetivo de campanha. Não inclua recomendações estratégicas de "
                    "venda/conversão aqui — essas vão em objective_fit.improvements. Vazio se não houver "
                    "problema técnico relevante."
                ),
            },
            "objective_fit": {
                "type": "array",
                "description": (
                    "Exatamente 5 itens, um por objetivo, sempre nesta ordem: Vendas/Conversão, "
                    "Cliques/Tráfego, Engajamento, Reconhecimento de Marca/Alcance, Cadastro/Geração de Leads."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "objective": {"type": "string"},
                        "fit": {"type": "string", "enum": ["otimo", "bom", "fraco"]},
                        "note": {"type": "string"},
                        "improvements": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": (
                                "Ações específicas pra melhorar esse criativo PRA ESSE OBJETIVO específico. "
                                "Vazio se fit já for 'otimo'."
                            ),
                        },
                    },
                    "required": ["objective", "fit", "note", "improvements"],
                    "additionalProperties": False,
                },
            },
            "recommended_objective": {
                "type": "string",
                "description": "Frase curta dizendo qual dos 5 objetivos esse criativo específico serve melhor.",
            },
            "timeline": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {"t": {"type": "number"}, "finding": {"type": "string"}},
                    "required": ["t", "finding"],
                    "additionalProperties": False,
                },
            },
        },
        "required": [
            "product",
            "category",
            "materials",
            "audience",
            "positioning",
            "benefits",
            "emotion",
            "alerts",
            "narrative",
            "audience_conclusion",
            "market_benchmark",
            "performance_score",
            "performance_reasoning",
            "performance_breakdown",
            "performance_improvements",
            "objective_fit",
            "recommended_objective",
            "timeline",
        ],
        "additionalProperties": False,
    },
}

_BRIEFING_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "item": {"type": "string", "description": "O requisito específico do briefing sendo avaliado."},
        "score": {"type": "number", "description": "Nota de 0 a 1 de quão bem esse item foi atendido."},
        "status": {
            "type": "string",
            "enum": ["excelente", "bom", "precisa_melhorar", "ausente"],
        },
        "missing": {
            "type": "array",
            "items": {"type": "string"},
            "description": (
                "Lista concreta do que falta no criativo pra esse item específico melhorar. "
                "Vazio se status for 'excelente'."
            ),
        },
        "potential_score": {
            "type": "number",
            "description": (
                "Nota de 0 a 1 que esse item alcançaria SE os itens de 'missing' fossem corrigidos. "
                "Igual a 'score' se já estiver excelente."
            ),
        },
    },
    "required": ["item", "score", "status", "missing", "potential_score"],
    "additionalProperties": False,
}

BRIEFING_TOOL = {
    "name": "submit_briefing_compatibility",
    "description": "Envia a auditoria item a item do briefing do cliente contra a leitura real do criativo.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "overall_score": {"type": "number", "description": "Compatibilidade geral de 0 a 1"},
            "items": {"type": "array", "items": _BRIEFING_ITEM_SCHEMA},
        },
        "required": ["overall_score", "items"],
        "additionalProperties": False,
    },
}


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _image_block(frame_path: Path) -> dict:
    data = base64.standard_b64encode(frame_path.read_bytes()).decode("utf-8")
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": "image/jpeg", "data": data},
    }


def _frames_and_transcript_content(
    frames: list[tuple[float, Path]], transcript: list[dict]
) -> tuple[list[dict], bool]:
    is_single_image = len(frames) == 1 and not transcript

    content: list[dict] = []
    for t, frame_path in frames:
        label = "Imagem do criativo (peça estática, sem vídeo/áudio):" if is_single_image else f"Frame no segundo {t}s:"
        content.append({"type": "text", "text": label})
        content.append(_image_block(frame_path))

    return content, is_single_image


def analyze_creative(
    frames: list[tuple[float, Path]], transcript: list[dict]
) -> AnalysisResult:
    if not settings.anthropic_api_key:
        raise RuntimeError("Serviço de IA temporariamente indisponível.")

    content, is_single_image = _frames_and_transcript_content(frames, transcript)

    if is_single_image:
        content.append(
            {
                "type": "text",
                "text": "Com base na imagem acima, preencha a análise estruturada do criativo. "
                "Como é uma peça estática, o campo 'timeline' deve ter uma única entrada no segundo 0.",
            }
        )
    else:
        transcript_text = (
            "\n".join(f"[{seg['start']}s - {seg['end']}s] {seg['text']}" for seg in transcript)
            or "(sem fala/áudio identificável)"
        )
        content.append(
            {
                "type": "text",
                "text": (
                    "Transcrição do áudio do vídeo (com timestamps):\n"
                    f"{transcript_text}\n\n"
                    "Com base nos frames e na transcrição acima, preencha a análise estruturada do criativo."
                ),
            }
        )

    message = _client().messages.create(
        model=settings.anthropic_model,
        max_tokens=12000,
        system=SYSTEM_PROMPT,
        tools=[ANALYSIS_TOOL],
        tool_choice={"type": "tool", "name": "submit_creative_analysis"},
        messages=[{"role": "user", "content": content}],
    )

    tool_use = next(block for block in message.content if block.type == "tool_use")
    return AnalysisResult.model_validate(tool_use.input)


def compare_with_briefing(
    result: AnalysisResult,
    briefing: str,
    frames: list[tuple[float, Path]],
    transcript: list[dict],
) -> BriefingCompatibility:
    content, _ = _frames_and_transcript_content(frames, transcript)

    content.append(
        {
            "type": "text",
            "text": (
                "Aqui está o briefing original do cliente (cada linha/tópico é um requisito separado "
                "que deve ser avaliado individualmente):\n"
                f"{briefing}\n\n"
                "Aqui está a leitura objetiva já feita do criativo (JSON, para referência rápida):\n"
                f"{result.model_dump_json()}\n\n"
                "Agora compare METICULOSAMENTE o conteúdo real do criativo (frames acima) com cada "
                "requisito do briefing, um por um. Para cada requisito, gere um item com:\n"
                "- 'item': o nome do requisito (ex: 'Conforto', 'Durabilidade', 'Couro', 'Público 45+')\n"
                "- 'score': nota de 0 a 1 de quão bem esse requisito específico foi atendido no criativo\n"
                "- 'status': 'excelente' se não há nada a melhorar (score alto, sem gaps), 'bom' se está "
                "  atendido mas com espaço de melhora, 'precisa_melhorar' se está fraco, 'ausente' se o "
                "  criativo simplesmente não aborda esse requisito\n"
                "- 'missing': lista concreta e específica do que falta no criativo para esse requisito "
                "  melhorar (cenas, texto, demonstração, prova, etc. — seja específico, não genérico). "
                "  Deixe vazio apenas se status for 'excelente'\n"
                "- 'potential_score': a nota que esse requisito alcançaria SE os itens de 'missing' fossem "
                "  corrigidos (ex: score 0.70 -> potential_score 0.85 se corrigir X e Y)\n\n"
                "Depois calcule 'overall_score' como a compatibilidade geral entre o briefing e o criativo. "
                "Seja rigoroso e específico — isso será usado por um profissional para decidir se refaz o "
                "vídeo antes de publicar, então a precisão importa mais que ser gentil."
            ),
        }
    )

    message = _client().messages.create(
        model=settings.anthropic_model,
        max_tokens=12000,
        system=SYSTEM_PROMPT,
        tools=[BRIEFING_TOOL],
        tool_choice={"type": "tool", "name": "submit_briefing_compatibility"},
        messages=[{"role": "user", "content": content}],
    )
    tool_use = next(block for block in message.content if block.type == "tool_use")
    return BriefingCompatibility.model_validate(tool_use.input)
