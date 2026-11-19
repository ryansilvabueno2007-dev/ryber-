import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from app import storage
from app.auth import require_csrf, require_user
from app.config import settings
from app.db_models import User
from app.models import CreateOptimizationRequest, OptimizationStatus, SceneDirection
from app.pipeline import optimizer
from app.queue import queue
from app.rate_limit import limiter

router = APIRouter(prefix="/api", tags=["optimize"])


def _to_status(row) -> OptimizationStatus:
    scenes = []
    if row.status == "done" and row.report_json:
        scenes = [SceneDirection.model_validate(s) for s in json.loads(row.report_json)]

    return OptimizationStatus(
        id=row.id,
        status=row.status,
        objective=row.objective,
        error=row.error,
        scenes=scenes,
    )


@router.post(
    "/analyses/{analysis_id}/optimize", response_model=OptimizationStatus, dependencies=[Depends(require_csrf)]
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_optimization(
    request: Request, analysis_id: str, payload: CreateOptimizationRequest, user: User = Depends(require_user)
) -> OptimizationStatus:
    if storage.get_owner(analysis_id) != user.id:
        raise HTTPException(404, "Análise não encontrada.")

    if storage.load_result(analysis_id) is None:
        raise HTTPException(409, "A análise ainda não terminou de processar.")

    # Cada chamada tem custo real de IA — libera só uma geração por vídeo pra quem não é
    # admin (senão a pessoa gera de novo trocando o objetivo e o custo escala sem
    # controle). Conta de admin pode gerar quantas vezes quiser, pra continuar testando.
    # create_optimization_if_allowed checa e cria numa única transação travada, pra
    # requisições concorrentes não furarem esse limite (ver storage.py).
    optimization_id = uuid.uuid4().hex
    created = storage.create_optimization_if_allowed(
        optimization_id, analysis_id, user.id, payload.objective, allow_multiple=user.is_admin
    )
    if not created:
        raise HTTPException(409, "Você já gerou o roteiro de edição para este vídeo — só é permitido uma vez.")

    queue.enqueue(
        optimizer.process_optimization, optimization_id, analysis_id, payload.objective, job_timeout="10m"
    )

    return OptimizationStatus(id=optimization_id, status="queued", objective=payload.objective)


@router.get("/analyses/{analysis_id}/optimizations", response_model=list[OptimizationStatus])
async def list_optimizations(analysis_id: str, user: User = Depends(require_user)) -> list[OptimizationStatus]:
    if storage.get_owner(analysis_id) != user.id:
        raise HTTPException(404, "Análise não encontrada.")

    rows = storage.list_optimizations_for_analysis(analysis_id, user.id)
    return [_to_status(row) for row in rows]


@router.get("/optimizations/{optimization_id}", response_model=OptimizationStatus)
async def get_optimization(optimization_id: str, user: User = Depends(require_user)) -> OptimizationStatus:
    row = storage.get_optimization(optimization_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(404, "Otimização não encontrada.")

    return _to_status(row)
