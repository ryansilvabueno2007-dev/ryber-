import json
import subprocess
from pathlib import Path

# Um arquivo corrompido ou malicioso disfarçado de vídeo pode fazer o ffmpeg/ffprobe
# travar (ou rodar por tempo desproporcional) em vez de simplesmente falhar rápido — sem
# timeout, isso prende o worker inteiro indefinidamente num único job. O caller (tasks.py)
# já captura qualquer exceção e marca a análise como erro, então estourar aqui é seguro.
_SUBPROCESS_TIMEOUT_SECONDS = 120


def probe_duration(video_path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(video_path),
        ],
        capture_output=True,
        text=True,
        check=True,
        timeout=_SUBPROCESS_TIMEOUT_SECONDS,
    )
    data = json.loads(out.stdout)
    return float(data["format"]["duration"])


def extract_audio(video_path: Path, out_path: Path) -> Path:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(out_path),
        ],
        capture_output=True,
        check=True,
        timeout=_SUBPROCESS_TIMEOUT_SECONDS,
    )
    return out_path


def extract_frames(video_path: Path, out_dir: Path, max_frames: int) -> list[tuple[float, Path]]:
    out_dir.mkdir(parents=True, exist_ok=True)
    duration = probe_duration(video_path)
    interval = max(duration / max_frames, 1.0)

    pattern = out_dir / "frame_%04d.jpg"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vf",
            f"fps=1/{interval}",
            "-q:v",
            "3",
            str(pattern),
        ],
        capture_output=True,
        check=True,
        timeout=_SUBPROCESS_TIMEOUT_SECONDS,
    )

    frames = sorted(out_dir.glob("frame_*.jpg"))
    return [(round(i * interval, 2), path) for i, path in enumerate(frames)]
