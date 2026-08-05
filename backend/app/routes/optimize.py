import json
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app import storage
from app.auth import require_user
from app.db_models import User
from app.models import CreateOptimizationRequest, OptimizationStatus, SceneDirection
from app.pipeline import optimizer
from app.queue import queue

router = APIRouter(prefix="/api", tags=["optimize"])

# Status que já consumiram (ou estão consumindo) a chamada de IA — uma vez que exista um
# desses pra uma análise, não deixamos gerar outro. Só "error" não conta: nada foi
# produzido, então vale deixar tentar de novo.
_LOCKING_STATUSES = ("queued", "processing", "done")


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


@router.post("/analyses/{analysis_id}/optimize", response_model=OptimizationStatus)
async def create_optimization(
    analysis_id: str, payload: CreateOptimizationRequest, user: User = Depends(require_user)
) -> OptimizationStatus:
    if storage.get_owner(analysis_id) != user.id:
        raise HTTPException(404, "Análise não encontrada.")

    if storage.load_result(analysis_id) is None:
        raise HTTPException(409, "A análise ainda não terminou de processar.")

    # Cada chamada tem custo real de IA — libera só uma geração por vídeo pra quem não é
    # admin (senão a pessoa gera de novo trocando o objetivo e o custo escala sem
    # controle). Conta de admin pode gerar quantas vezes quiser, pra continuar testando.
    if not user.is_admin:
        existing = storage.list_optimizations_for_analysis(analysis_id, user.id)
        if any(o.status in _LOCKING_STATUSES for o in existing):
            raise HTTPException(
                409, "Você já gerou o roteiro de edição para este vídeo — só é permitido uma vez."
            )

    optimization_id = uuid.uuid4().hex
    storage.create_optimization(optimization_id, analysis_id, user.id, payload.objective)
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
