import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app import storage
from app.auth import require_user
from app.config import settings
from app.db_models import User
from app.models import AnalysisResult, AnalysisStatus, AnalysisSummary, CreateAnalysisResponse
from app.pipeline import downloader, runner
from app.pipeline.executor import executor
from app.rate_limit import limiter

router = APIRouter(prefix="/api", tags=["analyses"])


def _require_owned(analysis_id: str, user: User) -> None:
    owner = storage.get_owner(analysis_id)
    if owner is None or owner != user.id:
        # 404 (não 403) para não confirmar pra um estranho que o ID existe.
        raise HTTPException(404, "Análise não encontrada.")


@router.post("/analyses", response_model=CreateAnalysisResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_analysis(
    request: Request,
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    briefing: Optional[str] = Form(None),
    user: User = Depends(require_user),
) -> CreateAnalysisResponse:
    if not file and not link:
        raise HTTPException(400, "Envie um arquivo de vídeo ou um link.")

    analysis_id = uuid.uuid4().hex

    video_path: Path | None = None
    if file:
        suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
        video_path = downloader.save_upload(file.file, storage.UPLOADS_DIR, analysis_id, suffix)
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if video_path.stat().st_size > max_bytes:
            video_path.unlink(missing_ok=True)
            raise HTTPException(413, f"Arquivo maior que {settings.max_upload_mb}MB.")

    storage.create_analysis(analysis_id, user.id)
    storage.set_status(analysis_id, "reading", "Preparando vídeo")

    executor.submit(runner.run_full, analysis_id, video_path, link, briefing)

    return CreateAnalysisResponse(id=analysis_id)


@router.get("/analyses", response_model=list[AnalysisSummary])
async def list_analyses(
    user: User = Depends(require_user), limit: int = 50, offset: int = 0
) -> list[AnalysisSummary]:
    limit = max(1, min(limit, 100))
    return storage.list_analyses(user.id, limit=limit, offset=offset)


@router.get("/analyses/{analysis_id}/status", response_model=AnalysisStatus)
async def get_status(analysis_id: str, user: User = Depends(require_user)) -> AnalysisStatus:
    _require_owned(analysis_id, user)
    status = storage.get_status(analysis_id)
    if status is None:
        raise HTTPException(404, "Análise não encontrada.")
    return status


@router.get("/analyses/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str, user: User = Depends(require_user)) -> AnalysisResult:
    _require_owned(analysis_id, user)
    result = storage.load_result(analysis_id)
    if result is None:
        raise HTTPException(404, "Resultado ainda não disponível.")
    return result


@router.get("/media/{analysis_id}")
async def get_media(analysis_id: str, user: User = Depends(require_user)) -> FileResponse:
    _require_owned(analysis_id, user)
    path = storage.find_upload(analysis_id)
    if path is None:
        raise HTTPException(404, "Vídeo não encontrado.")
    return FileResponse(path)


@router.get("/analyses/{analysis_id}/correction", response_model=AnalysisResult)
async def get_correction(analysis_id: str, user: User = Depends(require_user)) -> AnalysisResult:
    _require_owned(analysis_id, user)
    correction = storage.load_correction(analysis_id)
    if correction is None:
        raise HTTPException(404, "Nenhuma correção salva para esta análise.")
    return correction


@router.put("/analyses/{analysis_id}/correction", response_model=AnalysisResult)
async def save_correction(
    analysis_id: str, correction: AnalysisResult, user: User = Depends(require_user)
) -> AnalysisResult:
    _require_owned(analysis_id, user)
    if storage.load_result(analysis_id) is None:
        raise HTTPException(404, "Análise original não encontrada.")
    storage.save_correction(analysis_id, correction)
    return correction
