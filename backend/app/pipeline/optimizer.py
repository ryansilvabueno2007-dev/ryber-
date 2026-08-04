"""Gera uma versão de referência do criativo com os ajustes de um objetivo aplicados,
usando a Runway (recipe "product_ad") — não edita o vídeo original, gera um novo a
partir dos frames do produto + a leitura que a própria análise já fez.
"""
import tempfile
from pathlib import Path

import httpx
from runwayml import RunwayML
from runwayml.lib.polling import TaskFailedError, TaskTimeoutError

from app import storage, storage_r2
from app.config import settings
from app.models import AnalysisResult

MAX_PRODUCT_IMAGES = 5
DEFAULT_DURATION = 10
DEFAULT_RATIO = "720:1280"  # vertical (9:16) — formato padrão de anúncio em redes sociais
POLL_TIMEOUT_SECONDS = 60 * 8


def _client() -> RunwayML:
    return RunwayML(api_key=settings.runwayml_api_secret)


def _build_product_info(result: AnalysisResult) -> str:
    parts = [result.product.name, result.category]
    if result.materials:
        parts.append("Material: " + ", ".join(m.name for m in result.materials))
    return ". ".join(p for p in parts if p)


def _build_creative_direction(result: AnalysisResult, objective: str) -> str:
    entry = next((o for o in result.objective_fit if o.objective == objective), None)
    parts: list[str] = []
    if entry:
        if entry.note:
            parts.append(entry.note)
        if entry.improvements:
            parts.append("Ajustes específicos a aplicar: " + "; ".join(entry.improvements) + ".")
    if result.performance_improvements:
        parts.append(
            "Melhorias técnicas gerais: " + "; ".join(result.performance_improvements) + "."
        )
    if result.positioning.name:
        parts.append(f"Posicionamento: {result.positioning.name}.")
    if result.emotion.name:
        parts.append(f"Emoção a transmitir: {result.emotion.name}.")
    if not parts:
        parts.append(f"Otimize este criativo para o objetivo de campanha de {objective}.")
    return " ".join(parts)


def _pick_product_image_urls(analysis_id: str) -> list[str]:
    keys = storage_r2.list_keys_by_prefix(f"raw/{analysis_id}/frames/")
    if not keys:
        raise RuntimeError("Nenhum frame do produto encontrado para este criativo.")
    if len(keys) > MAX_PRODUCT_IMAGES:
        step = len(keys) / MAX_PRODUCT_IMAGES
        keys = [keys[int(i * step)] for i in range(MAX_PRODUCT_IMAGES)]
    return [storage_r2.presigned_url(k, expires=3600) for k in keys]


def process_optimization(optimization_id: str, analysis_id: str, objective: str) -> None:
    try:
        storage.set_optimization_status(optimization_id, "processing")

        result = storage.load_result(analysis_id)
        if result is None:
            raise RuntimeError("Análise original não encontrada ou ainda não concluída.")

        product_images = _pick_product_image_urls(analysis_id)
        product_info = _build_product_info(result)
        user_concept = _build_creative_direction(result, objective)

        client = _client()
        task = client.recipes.product_ad(
            version="2026-07",
            product_images=[{"uri": url} for url in product_images],
            product_info=product_info,
            user_concept=user_concept,
            duration=DEFAULT_DURATION,
            ratio=DEFAULT_RATIO,
        )
        storage.set_optimization_status(optimization_id, "processing", runway_task_id=task.id)

        task_details = task.wait_for_task_output(timeout=POLL_TIMEOUT_SECONDS)

        if not task_details.output:
            raise RuntimeError("A Runway concluiu a tarefa, mas não retornou nenhum vídeo.")

        video_url = task_details.output[0]
        with tempfile.TemporaryDirectory(prefix=f"optimize-{optimization_id}-") as tmp:
            resp = httpx.get(video_url, timeout=120, follow_redirects=True)
            resp.raise_for_status()
            local_path = Path(tmp) / "output.mp4"
            local_path.write_bytes(resp.content)

            video_key = f"raw/{analysis_id}/optimized/{optimization_id}.mp4"
            storage_r2.upload_file(video_key, local_path, content_type="video/mp4")

        storage.set_optimization_status(optimization_id, "done", video_key=video_key)

    except TaskFailedError as exc:
        failure = getattr(exc.task_details, "failure", None) or "A geração falhou na Runway."
        storage.set_optimization_status(optimization_id, "error", error=str(failure))
    except TaskTimeoutError:
        storage.set_optimization_status(
            optimization_id, "error", error="A geração demorou mais que o esperado. Tente novamente."
        )
    except Exception as exc:  # noqa: BLE001
        storage.set_optimization_status(optimization_id, "error", error=str(exc))
