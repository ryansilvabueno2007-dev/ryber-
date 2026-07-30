import mimetypes
import traceback
from pathlib import Path

from app import storage, storage_r2
from app.config import settings
from app.pipeline import analyzer, audio, downloader, media, video


def _upload_to_r2_best_effort(key: str, path: Path) -> None:
    """Sobe uma cópia pra R2 sem derrubar o pipeline se falhar — é persistência extra,
    não o caminho crítico (o processamento sempre usa o arquivo local)."""
    if not storage_r2.is_configured():
        return
    try:
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        storage_r2.upload_file(key, path, content_type=content_type)
    except Exception:  # noqa: BLE001
        traceback.print_exc()


def run_full(analysis_id: str, video_path: Path | None, link: str | None, briefing: str | None) -> None:
    try:
        if video_path is None:
            storage.set_status(analysis_id, "reading", "Baixando do link")
            video_path = downloader.download_from_link(link, storage.UPLOADS_DIR, analysis_id)
        run_pipeline(analysis_id, video_path, briefing)
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        storage.set_status(
            analysis_id, "error", "Falha ao obter o criativo",
            error="Não foi possível obter o criativo. Tente novamente em instantes.",
        )


def run_pipeline(analysis_id: str, media_path: Path, briefing: str | None) -> None:
    try:
        raw_dir = storage.raw_dir(analysis_id)

        _upload_to_r2_best_effort(f"uploads/{analysis_id}{media_path.suffix}", media_path)

        if media.is_image(media_path):
            storage.set_status(analysis_id, "reading", "Processando imagem")
            image_path = media.normalize_image(media_path, raw_dir / "frames" / "frame_0001.jpg")
            frames = [(0.0, image_path)]
            transcript: list[dict] = []
            storage.save_transcript(analysis_id, transcript)
            media_type = "image"
        else:
            storage.set_status(analysis_id, "reading", "Extraindo frames e áudio do vídeo")
            frames = video.extract_frames(media_path, raw_dir / "frames", settings.max_frames)

            audio_path = raw_dir / "audio.wav"
            video.extract_audio(media_path, audio_path)

            storage.set_status(analysis_id, "reading", "Transcrevendo áudio")
            transcript = audio.transcribe(audio_path, settings.whisper_model_size)
            storage.save_transcript(analysis_id, transcript)
            audio_path.unlink(missing_ok=True)  # já temos o texto; não precisa guardar o áudio bruto
            media_type = "video"

        for t, frame_path in frames:
            _upload_to_r2_best_effort(f"raw/{analysis_id}/frames/{frame_path.name}", frame_path)
        _upload_to_r2_best_effort(f"raw/{analysis_id}/transcript.json", raw_dir / "transcript.json")

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
