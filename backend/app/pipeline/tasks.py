"""Job executado pelo worker (RQ) — substitui o antigo runner.py inline.

Roda num processo/serviço separado do backend web. O arquivo de origem sempre
chega aqui como uma chave da R2 (upload direto) ou um link (baixado aqui mesmo);
ffmpeg e faster-whisper exigem arquivo local de verdade, então usamos um
diretório temporário só durante o processamento deste job — nada fica em disco
depois que ele termina. Frames e transcrição extraídos sobem pra R2 antes da
limpeza, pra servir de dado de treino no futuro (ver scripts/export_training_data.py).
"""

import json
import mimetypes
import tempfile
import traceback
from pathlib import Path

from app import storage, storage_r2
from app.config import settings
from app.pipeline import analyzer, audio, downloader, media, video


def _upload_to_r2_best_effort(key: str, path: Path) -> None:
    if not storage_r2.is_configured() or not path.exists():
        return
    try:
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        storage_r2.upload_file(key, path, content_type=content_type)
    except Exception:  # noqa: BLE001
        traceback.print_exc()


def process_analysis(
    analysis_id: str, video_key: str | None, link: str | None, briefing: str | None
) -> None:
    try:
        with tempfile.TemporaryDirectory(prefix=f"ryber-{analysis_id}-") as tmp:
            tmp_dir = Path(tmp)

            if video_key is not None:
                storage.set_status(analysis_id, "reading", "Baixando o criativo")
                suffix = Path(video_key).suffix or ".mp4"
                media_path = tmp_dir / f"source{suffix}"
                storage_r2.download_to_path(video_key, media_path)
            else:
                storage.set_status(analysis_id, "reading", "Baixando do link")
                media_path = downloader.download_from_link(link, tmp_dir, analysis_id)
                _upload_to_r2_best_effort(f"uploads/{analysis_id}{media_path.suffix}", media_path)

            _run_pipeline(analysis_id, media_path, briefing, tmp_dir)
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        storage.set_status(
            analysis_id, "error", "Falha ao obter o criativo",
            error="Não foi possível obter o criativo. Tente novamente em instantes.",
        )


def _run_pipeline(analysis_id: str, media_path: Path, briefing: str | None, tmp_dir: Path) -> None:
    try:
        frames_dir = tmp_dir / "frames"

        if media.is_image(media_path):
            storage.set_status(analysis_id, "reading", "Processando imagem")
            image_path = media.normalize_image(media_path, frames_dir / "frame_0001.jpg")
            frames = [(0.0, image_path)]
            transcript: list[dict] = []
            media_type = "image"
        else:
            storage.set_status(analysis_id, "reading", "Extraindo frames e áudio do vídeo")
            frames = video.extract_frames(media_path, frames_dir, settings.max_frames)

            audio_path = tmp_dir / "audio.wav"
            video.extract_audio(media_path, audio_path)

            storage.set_status(analysis_id, "reading", "Transcrevendo áudio")
            transcript = audio.transcribe(audio_path, settings.whisper_model_size)
            media_type = "video"

        transcript_path = tmp_dir / "transcript.json"
        transcript_path.write_text(
            json.dumps(transcript, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        for _, frame_path in frames:
            _upload_to_r2_best_effort(f"raw/{analysis_id}/frames/{frame_path.name}", frame_path)
        _upload_to_r2_best_effort(f"raw/{analysis_id}/transcript.json", transcript_path)

        storage.set_status(analysis_id, "interpreting", "Interpretando criativo com a IA da Ryber")
        result = analyzer.analyze_creative(frames, transcript)
        result.media_type = media_type

        storage.set_status(analysis_id, "building", "Construindo representação final")
        if briefing:
            result.briefing_compatibility = analyzer.compare_with_briefing(
                result, briefing, frames, transcript
            )

        storage.save_result(analysis_id, result)
        storage.set_status(analysis_id, "done", "Análise concluída")
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        storage.set_status(
            analysis_id, "error", "Falha ao processar o criativo",
            error="Não foi possível concluir a análise. Tente novamente em instantes.",
        )
