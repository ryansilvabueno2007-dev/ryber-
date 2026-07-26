from pathlib import Path

from faster_whisper import WhisperModel

_model: WhisperModel | None = None


def _get_model(model_size: str) -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(model_size, device="cpu", compute_type="int8")
    return _model


def transcribe(audio_path: Path, model_size: str) -> list[dict]:
    model = _get_model(model_size)
    segments, _ = model.transcribe(str(audio_path))
    return [
        {"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip()}
        for seg in segments
    ]
