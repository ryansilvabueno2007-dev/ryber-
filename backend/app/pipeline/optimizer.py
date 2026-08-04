"""Edita o vídeo original do criativo com os ajustes de um objetivo aplicados, via
Runway Aleph 2.0 (video_to_video) — preserva o que já funciona no vídeo e concentra
a edição nos pontos fracos daquele objetivo específico. Não altera nada da análise
em si (app.pipeline.analyzer) — só monta o prompt de edição a partir do resultado
que a análise já produziu.
"""
import subprocess
import tempfile
import traceback
from pathlib import Path

import httpx
from runwayml import RunwayML
from runwayml.lib.polling import TaskFailedError, TaskTimeoutError

from app import storage, storage_r2
from app.config import settings
from app.models import AnalysisResult
from app.pipeline import video

MAX_INPUT_SECONDS = 30  # limite da Aleph 2.0 pra vídeo de entrada
PROMPT_MAX_CHARS = 1000  # limite do campo promptText da Aleph 2.0
# Medido na prática: uma edição de ~28s ficou em 26% de progresso depois de 9 minutos
# rodando — o tempo real de uma edição da Aleph 2.0 é bem maior do que uma análise.
# Fica abaixo do job_timeout da fila (routes/optimize.py) pra sobrar margem pro
# download/upload do resultado depois que a Runway termina.
POLL_TIMEOUT_SECONDS = 60 * 40

# Quais métricas priorizar na edição, por objetivo de campanha — bate com o que
# cada objetivo de fato mede (ex: Reconhecimento não depende de CPA/ROAS).
OBJECTIVE_PRIORITY_METRICS: dict[str, list[str]] = {
    "Vendas/Conversão": ["ROAS", "CPA", "CTR", "Hold Rate", "Hook Rate"],
    "Cliques/Tráfego": ["CTR", "CPC", "Hook Rate", "Hold Rate"],
    "Engajamento": ["Hook Rate", "Hold Rate"],
    "Cadastro/Geração de Leads": ["CPA", "CTR", "Hook Rate"],
    "Reconhecimento de Marca/Alcance": ["Hook Rate", "Hold Rate", "CPM"],
}


def _client() -> RunwayML:
    return RunwayML(api_key=settings.runwayml_api_secret)


def _priority_metric_notes(result: AnalysisResult, objective: str, max_note_chars: int = 70) -> list[str]:
    priority = OBJECTIVE_PRIORITY_METRICS.get(objective, [])
    by_metric = {m.metric: m.note for m in result.performance_breakdown}
    notes = []
    for metric in priority:
        note = by_metric.get(metric)
        if not note:
            continue
        if len(note) > max_note_chars:
            note = note[: max_note_chars - 1].rsplit(" ", 1)[0] + "…"
        notes.append(f"{metric}: {note}")
    return notes


def _preserve_points(result: AnalysisResult, limit: int = 3) -> list[str]:
    """Pontos que a própria análise já avaliou bem — instrução pra IA não mexer neles.
    Ordenado por confiança e limitado, pra sobrar espaço pro que importa mais: o que editar."""
    scored = sorted(result.benefits, key=lambda b: b.confidence, reverse=True)
    points = [b.name for b in scored if b.confidence >= 0.75][:limit]
    if result.positioning.confidence >= 0.75:
        points.append(f"posicionamento ({result.positioning.name})")
    if result.emotion.confidence >= 0.75:
        points.append(f"emoção transmitida ({result.emotion.name})")
    return points


def _edit_instructions(result: AnalysisResult, objective: str) -> list[str]:
    """Recomendações da análise (específicas do objetivo + gerais) viram instrução de edição."""
    entry = next((o for o in result.objective_fit if o.objective == objective), None)
    instructions = list(entry.improvements) if entry else []
    instructions += result.performance_improvements
    return instructions


def _fit_blocks(blocks: list[str], budget: int) -> str:
    """Junta os blocos na ordem de prioridade recebida, truncando o primeiro que não
    couber inteiro e descartando o resto — garante que um bloco de prioridade mais alta
    nunca seja cortado por causa de um de prioridade mais baixa vindo depois."""
    used = 0
    fitted: list[str] = []
    for block in blocks:
        sep = 1 if fitted else 0
        if used + sep + len(block) <= budget:
            fitted.append(block)
            used += sep + len(block)
            continue
        remaining = budget - used - sep
        if remaining > 25:
            fitted.append(block[: remaining - 1].rsplit(" ", 1)[0] + "…")
        break
    return " ".join(fitted)


def _build_edit_prompt(result: AnalysisResult, objective: str) -> str:
    """Monta o prompt de edição dinamicamente a partir do resultado da análise — nunca
    texto fixo: cada vídeo gera um prompt diferente, de acordo com suas próprias
    métricas, recomendações e pontos fortes/fracos.

    Missão (o objetivo) e as regras de marca ficam sempre garantidas, no início e no
    fim. O que sobrar de orçamento de caracteres vai pro "corpo" — instruções de edição
    primeiro (é a parte mais acionável), depois o que preservar, leitura de métrica e
    alertas, nessa ordem de prioridade — cortando/descartando os últimos se precisar.
    """
    priority_metrics = OBJECTIVE_PRIORITY_METRICS.get(objective, [])
    preserve = _preserve_points(result)
    instructions = _edit_instructions(result, objective)
    alerts = result.alerts[:2]
    metric_notes = _priority_metric_notes(result, objective)

    mission = (
        f"Edite este anúncio em vídeo para maximizar performance no objetivo de campanha "
        f"de {objective}. O objetivo não é deixar o vídeo mais bonito — é aumentar o "
        f"potencial real de performance nas métricas: {', '.join(priority_metrics)}."
    )
    closing = (
        f"Regras obrigatórias: mantenha o produto ({result.product.name}), cores, marca, "
        "posicionamento e linguagem originais do vídeo. Não descaracterize o anúncio. "
        "O resultado deve ser uma versão claramente superior em performance para esse "
        "objetivo, preservando o que já funciona e corrigindo só os pontos fracos."
    )

    body_blocks = []
    if instructions:
        body_blocks.append("Edite especificamente adicionando/ajustando: " + "; ".join(instructions) + ".")
    if preserve:
        body_blocks.append("Preserve sem alterar (já funciona bem): " + ", ".join(preserve) + ".")
    if metric_notes:
        body_blocks.append("Leitura atual: " + " | ".join(metric_notes) + ".")
    if alerts:
        body_blocks.append("Corrija também: " + "; ".join(alerts) + ".")

    reserved = len(mission) + 1 + len(closing)  # +1 do espaço entre mission e o corpo
    body = _fit_blocks(body_blocks, PROMPT_MAX_CHARS - reserved) if PROMPT_MAX_CHARS > reserved else ""

    parts = [mission]
    if body:
        parts.append(body)
    parts.append(closing)

    prompt = " ".join(parts)
    if len(prompt) > PROMPT_MAX_CHARS:
        # Trava de segurança pro caso extremo de mission+closing sozinhos já estourarem
        # (ex: nome de produto muito longo) — não deveria acontecer na prática.
        prompt = prompt[: PROMPT_MAX_CHARS - 1].rsplit(" ", 1)[0] + "…"
    return prompt


def _prepare_video_uri(analysis_id: str, tmp_dir: Path) -> str:
    """Garante uma URL (presigned, HTTPS) de um vídeo com no máximo 30s — corta os
    primeiros 30s do original se ele for mais longo, já que é o limite da Aleph 2.0."""
    original_key = storage_r2.find_key_by_prefix(f"uploads/{analysis_id}.")
    if original_key is None:
        raise RuntimeError("Vídeo original não encontrado no armazenamento.")

    local_path = tmp_dir / f"source{Path(original_key).suffix}"
    storage_r2.download_to_path(original_key, local_path)

    duration = video.probe_duration(local_path)
    if duration <= MAX_INPUT_SECONDS:
        return storage_r2.presigned_url(original_key, expires=3600)

    trimmed_path = tmp_dir / "trimmed.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(local_path), "-t", str(MAX_INPUT_SECONDS), "-c", "copy", str(trimmed_path)],
        capture_output=True,
        check=True,
    )
    trimmed_key = f"raw/{analysis_id}/optimized/_source_trimmed_30s.mp4"
    storage_r2.upload_file(trimmed_key, trimmed_path, content_type="video/mp4")
    return storage_r2.presigned_url(trimmed_key, expires=3600)


def process_optimization(optimization_id: str, analysis_id: str, objective: str) -> None:
    try:
        storage.set_optimization_status(optimization_id, "processing")

        result = storage.load_result(analysis_id)
        if result is None:
            raise RuntimeError("Análise original não encontrada ou ainda não concluída.")
        if result.media_type != "video":
            raise RuntimeError("Otimização de criativo disponível só para vídeo, por enquanto.")

        prompt_text = _build_edit_prompt(result, objective)

        with tempfile.TemporaryDirectory(prefix=f"optimize-{optimization_id}-") as tmp:
            tmp_dir = Path(tmp)
            video_uri = _prepare_video_uri(analysis_id, tmp_dir)

            client = _client()
            task = client.video_to_video.create(
                model="aleph2",
                video_uri=video_uri,
                prompt_text=prompt_text,
            )
            # Sempre visível no log — sem isso, um erro/timeout deixa a tarefa da Runway
            # órfã: ela continua rodando (e cobrando) do lado deles sem a gente saber o ID.
            print(f"[optimizer] runway task {task.id} criada pra optimization {optimization_id}", flush=True)
            storage.set_optimization_status(optimization_id, "processing", runway_task_id=task.id)

            task_details = task.wait_for_task_output(timeout=POLL_TIMEOUT_SECONDS)

            if not task_details.output:
                raise RuntimeError("A Runway concluiu a tarefa, mas não retornou nenhum vídeo.")

            video_url = task_details.output[0]
            resp = httpx.get(video_url, timeout=120, follow_redirects=True)
            resp.raise_for_status()
            output_path = tmp_dir / "output.mp4"
            output_path.write_bytes(resp.content)

            video_key = f"raw/{analysis_id}/optimized/{optimization_id}.mp4"
            storage_r2.upload_file(video_key, output_path, content_type="video/mp4")

        storage.set_optimization_status(optimization_id, "done", video_key=video_key)

    except TaskFailedError as exc:
        failure = getattr(exc.task_details, "failure", None) or "A geração falhou na Runway."
        print(f"[optimizer] runway task {exc.task_details.id} falhou: {failure}", flush=True)
        storage.set_optimization_status(optimization_id, "error", error=str(failure))
    except TaskTimeoutError as exc:
        print(
            f"[optimizer] runway task {exc.task_details.id} não terminou dentro do timeout "
            f"({POLL_TIMEOUT_SECONDS}s) — pode continuar rodando do lado da Runway.",
            flush=True,
        )
        storage.set_optimization_status(
            optimization_id, "error", error="A geração demorou mais que o esperado. Tente novamente."
        )
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        storage.set_optimization_status(optimization_id, "error", error=str(exc))
