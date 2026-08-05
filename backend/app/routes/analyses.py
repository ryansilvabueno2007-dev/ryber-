import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse

from app import storage, storage_r2
from app.auth import require_user
from app.config import settings
from app.db_models import User
from app.models import (
    AnalysisResult,
    AnalysisStatus,
    AnalysisSummary,
    ComparisonResponse,
    CreateAnalysisResponse,
)
from app.pipeline import tasks
from app.queue import queue
from app.rate_limit import limiter
from app.subscription import is_plan_active

router = APIRouter(prefix="/api", tags=["analyses"])

PLAN_QUOTAS = {"start": 10, "gold": 30, "platinum": 60, "titanium": 100, "infinity": 300}


def _require_owned(analysis_id: str, user: User) -> None:
    owner = storage.get_owner(analysis_id)
    if owner is None or owner != user.id:
        # 404 (não 403) para não confirmar pra um estranho que o ID existe.
        raise HTTPException(404, "Análise não encontrada.")


def _check_quota(user: User) -> None:
    if user.is_admin:
        return
    if not is_plan_active(user) or not user.plan:
        # Sem assinatura: libera exatamente 1 análise grátis (a vida inteira da conta,
        # não por mês) antes de exigir plano.
        if storage.count_all_analyses(user.id) >= 1:
            raise HTTPException(402, "Você já usou sua análise grátis. Assine um plano para continuar.")
        return
    quota = PLAN_QUOTAS.get(user.plan)
    if quota is None:
        return
    used = storage.count_analyses_this_month(user.id, plan_started_at=user.plan_started_at)
    if used >= quota:
        raise HTTPException(
            429,
            f"Você atingiu o limite de {quota} análises deste mês no seu plano. "
            "Aguarde o próximo ciclo ou mude de plano.",
        )


def _start_analysis(
    file: Optional[UploadFile],
    link: Optional[str],
    briefing: Optional[str],
    user: User,
    compared_to_id: Optional[str] = None,
) -> str:
    if not file and not link:
        raise HTTPException(400, "Envie um arquivo de vídeo ou um link.")

    _check_quota(user)

    analysis_id = uuid.uuid4().hex

    video_key: str | None = None
    if file:
        if not storage_r2.is_configured():
            raise HTTPException(503, "Armazenamento ainda não configurado.")

        suffix = Path(file.filename or "video.mp4").suffix or ".mp4"
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if size > max_bytes:
            raise HTTPException(413, f"Arquivo maior que {settings.max_upload_mb}MB.")

        video_key = f"uploads/{analysis_id}{suffix}"
        storage_r2.upload_fileobj(video_key, file.file, content_type=file.content_type or "application/octet-stream")

    storage.create_analysis(analysis_id, user.id, compared_to_id=compared_to_id)
    storage.set_status(analysis_id, "reading", "Preparando vídeo")

    queue.enqueue(tasks.process_analysis, analysis_id, video_key, link, briefing, job_timeout="30m")

    return analysis_id


@router.post("/analyses", response_model=CreateAnalysisResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_analysis(
    request: Request,
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    briefing: Optional[str] = Form(None),
    user: User = Depends(require_user),
) -> CreateAnalysisResponse:
    analysis_id = _start_analysis(file, link, briefing, user)
    return CreateAnalysisResponse(id=analysis_id)


@router.post("/analyses/{analysis_id}/compare", response_model=CreateAnalysisResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_comparison(
    request: Request,
    analysis_id: str,
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    briefing: Optional[str] = Form(None),
    user: User = Depends(require_user),
) -> CreateAnalysisResponse:
    """Sobe uma nova versão do criativo (o "depois"), vinculada a uma análise já existente (o "antes")."""
    _require_owned(analysis_id, user)
    new_id = _start_analysis(file, link, briefing, user, compared_to_id=analysis_id)
    return CreateAnalysisResponse(id=new_id)


@router.get("/analyses/{analysis_id}/comparison", response_model=ComparisonResponse)
async def get_comparison(analysis_id: str, user: User = Depends(require_user)) -> ComparisonResponse:
    _require_owned(analysis_id, user)
    pair = storage.get_comparison_pair(analysis_id)
    if pair is None:
        raise HTTPException(404, "Nenhuma comparação encontrada para esta análise.")
    before_id, after_id = pair

    before = storage.load_result(before_id)
    after = storage.load_result(after_id)
    if before is None or after is None:
        raise HTTPException(404, "Uma das análises da comparação ainda não está pronta.")

    return ComparisonResponse(before_id=before_id, after_id=after_id, before=before, after=after)


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
async def get_media(analysis_id: str, user: User = Depends(require_user)):
    _require_owned(analysis_id, user)

    if storage_r2.is_configured():
        key = storage_r2.find_key_by_prefix(f"uploads/{analysis_id}.")
        if key is not None:
            return RedirectResponse(storage_r2.presigned_url(key))

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
