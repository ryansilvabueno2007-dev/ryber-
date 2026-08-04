"""Gera um roteiro de edição cena a cena (um "diretor criativo de performance") a partir
da timeline que a própria análise da Ryber já extraiu do vídeo. Não gera nem edita vídeo
nenhum — é um documento estruturado, cena por cena, com o que fazer em cada trecho real
do criativo para o objetivo escolhido. Não altera nada da análise em si
(app.pipeline.analyzer) — só consome o resultado que ela já produziu.
"""
import json

import anthropic

from app import storage
from app.config import settings
from app.models import AnalysisResult, SceneDirection

# Cada objetivo de campanha olha pra métricas diferentes — a mesma cena pode pedir
# ajustes diferentes dependendo do que o usuário está otimizando.
OBJECTIVE_PRIORITY_METRICS: dict[str, list[str]] = {
    "Vendas/Conversão": ["ROAS", "CPA", "CTR", "Hold Rate", "Hook Rate"],
    "Cliques/Tráfego": ["CTR", "CPC", "Hook Rate", "Hold Rate"],
    "Engajamento": ["Hook Rate", "Hold Rate"],
    "Cadastro/Geração de Leads": ["CPA", "CTR", "Hook Rate"],
    "Reconhecimento de Marca/Alcance": ["Hook Rate", "Hold Rate", "CPM"],
}

DIRECTOR_SYSTEM_PROMPT = """\
Você é um Diretor Criativo sênior especializado em anúncios de performance (Meta Ads, \
TikTok Ads, Google Ads). Você recebe a análise que a Ryber já fez de um criativo — \
incluindo a timeline real de cenas que o vídeo tem — e transforma essa análise em um \
roteiro de edição cena a cena, pronto para um editor de vídeo aplicar.

Regras fundamentais:
- Você trabalha SOMENTE sobre as cenas reais fornecidas na timeline. Nunca invente, \
divida, junte ou reordene cenas que não foram passadas a você — cada cena que você \
recebe vira exatamente uma entrada na sua resposta, na mesma ordem e nos mesmos limites \
de tempo.
- Para cada cena, primeiro descreva objetivamente o que está acontecendo nela — \
elementos em tela, enquadramento, produto, pessoa, movimento de câmera, texto/legenda \
na tela, emoção transmitida, e qual o objetivo narrativo daquele trecho dentro do vídeo \
como um todo. Baseie-se no que a análise já identificou daquela cena (o "finding" \
daquele timestamp) e no contexto geral do criativo (produto, posicionamento, emoção, \
narrativa, público) — nunca invente elementos que não têm respaldo na análise.
- Depois, dê sugestões de edição SOMENTE para aquela cena específica, alinhadas ao \
objetivo de campanha escolhido pelo usuário. As sugestões devem ser instruções \
práticas e diretas de edição (o que adicionar, cortar, ajustar, aproximar, prolongar, \
encurtar, sobrepor) — nunca opinião vaga tipo "melhorar a cena" ou "deixar mais \
bonito".
- Use a análise de performance já existente (Hook Rate, Hold Rate, CTR, CPC, CPM, CPA, \
ROAS, pontos fortes, pontos fracos, alertas, recomendações por objetivo, recomendações \
gerais de produção) como base para as sugestões — mas NUNCA repita essas recomendações \
literalmente. Transforme cada uma na instrução de edição prática, aplicada ao trecho \
exato do vídeo onde ela se aplica. Se uma recomendação genérica da análise ("adicionar \
prova social", por exemplo) se aplica melhor a uma cena específica pelo que já acontece \
nela, coloque a sugestão nessa cena, não em todas.
- Preserve o que já funciona: quando uma cena já está bem avaliada pela análise (métrica \
forte, ponto forte identificado ali), a primeira sugestão dessa cena deve ser manter o \
que já funciona, e as demais sugestões devem ser incrementais, não uma reformulação da \
cena inteira.
- Toda cena tem um "motivo" — uma frase objetiva explicando por que aquele conjunto de \
ajustes tende a melhorar o objetivo escolhido, citando a métrica ou o comportamento de \
audiência que motiva a sugestão.
- Nunca dê sugestões genéricas de estilo (tipo "vídeos curtos convertem melhor"). Toda \
sugestão deve ser específica ao que está acontecendo NAQUELA cena desse criativo \
específico.
- O resultado final deve parecer um documento produzido por um diretor criativo de uma \
grande agência de performance: direto, específico, acionável, sem opinião estética \
vazia.
"""

DIRECTOR_TOOL = {
    "name": "submit_creative_direction",
    "description": "Envia o roteiro de edição cena a cena com as sugestões do diretor criativo.",
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "scenes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "label": {
                            "type": "string",
                            "description": "Rótulo da cena, ex: '0–2s' ou '5s até o fim'.",
                        },
                        "start": {"type": "number"},
                        "end": {
                            "type": ["number", "null"],
                            "description": "Fim da cena em segundos, ou null se for a última cena e o fim exato não for conhecido.",
                        },
                        "observed": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "O que a cena mostra: elementos, enquadramento, produto, pessoa, movimento, texto/legenda, emoção, papel narrativo — cada item um fato curto e objetivo.",
                        },
                        "suggestions": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Instruções práticas de edição para essa cena, alinhadas ao objetivo escolhido.",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Por que esses ajustes ajudam o objetivo escolhido, citando a métrica/comportamento relevante.",
                        },
                    },
                    "required": ["label", "start", "end", "observed", "suggestions", "reason"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["scenes"],
        "additionalProperties": False,
    },
}


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _build_scene_bounds(result: AnalysisResult) -> list[tuple[float, float | None, str]]:
    """Cada entrada da timeline vira uma cena real: começa no timestamp dela e vai até
    o timestamp da próxima (ou fim do vídeo, se for a última) — sem inventar divisão
    nova, usando exatamente os pontos de corte que a análise já identificou."""
    entries = sorted(result.timeline, key=lambda e: e.t)
    bounds: list[tuple[float, float | None, str]] = []
    for i, entry in enumerate(entries):
        end = entries[i + 1].t if i + 1 < len(entries) else None
        bounds.append((entry.t, end, entry.finding))
    return bounds


def _format_scene_label(start: float, end: float | None) -> str:
    if end is None:
        return f"{start:g}s até o fim"
    return f"{start:g}–{end:g}s"


def _build_user_content(result: AnalysisResult, objective: str) -> str:
    scenes = _build_scene_bounds(result)
    scenes_text = "\n".join(
        f"- Cena [{_format_scene_label(start, end)}]: {finding}" for start, end, finding in scenes
    )

    priority_metrics = OBJECTIVE_PRIORITY_METRICS.get(objective, [])
    metrics_text = "\n".join(
        f"- {m.metric} ({m.meaning}): {m.note}"
        for m in result.performance_breakdown
        if m.metric in priority_metrics
    )

    fit = next((o for o in result.objective_fit if o.objective == objective), None)
    fit_text = (
        f"Avaliação atual para esse objetivo: {fit.fit} — {fit.note}\n"
        f"Melhorias já recomendadas pela análise para esse objetivo: "
        f"{'; '.join(fit.improvements) if fit.improvements else '(nenhuma)'}"
        if fit
        else "(sem avaliação específica desse objetivo na análise)"
    )

    benefits_text = ", ".join(b.name for b in sorted(result.benefits, key=lambda b: b.confidence, reverse=True))
    alerts_text = "; ".join(result.alerts) if result.alerts else "(nenhum)"
    benchmark = result.market_benchmark
    benchmark_text = (
        f"Nicho: {benchmark.niche}. Estilo real do criativo: {benchmark.style}. "
        f"O que funciona nesse nicho: {benchmark.what_works}. Avaliação de encaixe: {benchmark.fit_assessment}."
        if benchmark
        else "(sem benchmark de mercado)"
    )

    return f"""\
Objetivo de campanha escolhido pelo usuário: {objective}

Timeline real do vídeo (cenas na ordem em que aparecem — use exatamente estes cortes,
não invente outros):
{scenes_text}

Produto: {result.product.name}
Categoria: {result.category}
Posicionamento: {result.positioning.name}
Emoção transmitida: {result.emotion.name}
Pontos fortes já identificados: {benefits_text or '(nenhum com confiança suficiente)'}
Alertas da análise: {alerts_text}
Narrativa geral (o que a IA de anúncios entende desse criativo): {result.narrative}
Público: {result.audience_conclusion}
Benchmark de mercado: {benchmark_text}

Métricas mais relevantes para o objetivo "{objective}":
{metrics_text or '(sem dados suficientes)'}

{fit_text}

Recomendações gerais de produção já identificadas pela análise (qualidade técnica,
independente de objetivo): {'; '.join(result.performance_improvements) if result.performance_improvements else '(nenhuma)'}

Monte o roteiro de edição cena a cena, uma entrada para cada cena da timeline acima, na
mesma ordem, com os mesmos limites de tempo.
"""


def process_optimization(optimization_id: str, analysis_id: str, objective: str) -> None:
    try:
        storage.set_optimization_status(optimization_id, "processing")

        result = storage.load_result(analysis_id)
        if result is None:
            raise RuntimeError("Análise original não encontrada ou ainda não concluída.")
        if not result.timeline:
            raise RuntimeError("Essa análise não tem timeline de cenas disponível.")
        if not settings.anthropic_api_key:
            raise RuntimeError("Serviço de IA temporariamente indisponível.")

        message = _client().messages.create(
            model=settings.anthropic_model,
            max_tokens=8000,
            system=DIRECTOR_SYSTEM_PROMPT,
            tools=[DIRECTOR_TOOL],
            tool_choice={"type": "tool", "name": "submit_creative_direction"},
            messages=[{"role": "user", "content": _build_user_content(result, objective)}],
        )

        tool_use = next(block for block in message.content if block.type == "tool_use")
        scenes = [SceneDirection.model_validate(s) for s in tool_use.input["scenes"]]
        report_json = json.dumps([s.model_dump() for s in scenes], ensure_ascii=False)

        storage.set_optimization_status(optimization_id, "done", report_json=report_json)

    except Exception as exc:  # noqa: BLE001
        storage.set_optimization_status(optimization_id, "error", error=str(exc))
