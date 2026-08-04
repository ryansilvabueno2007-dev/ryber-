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


@router.post("/analyses/{analysis_id}/optimize", response_model=OptimizationStatus)
async def create_optimization(
    analysis_id: str, payload: CreateOptimizationRequest, user: User = Depends(require_user)
) -> OptimizationStatus:
    if storage.get_owner(analysis_id) != user.id:
        raise HTTPException(404, "Análise não encontrada.")

    # Geração por IA ainda em validação de qualidade — liberado só pra admin por enquanto.
    if not user.is_admin:
        raise HTTPException(403, "Recurso ainda em teste, disponível só para administradores.")

    if storage.load_result(analysis_id) is None:
        raise HTTPException(409, "A análise ainda não terminou de processar.")

    optimization_id = uuid.uuid4().hex
    storage.create_optimization(optimization_id, analysis_id, user.id, payload.objective)
    queue.enqueue(
        optimizer.process_optimization, optimization_id, analysis_id, payload.objective, job_timeout="10m"
    )

    return OptimizationStatus(id=optimization_id, status="queued", objective=payload.objective)


@router.get("/optimizations/{optimization_id}", response_model=OptimizationStatus)
async def get_optimization(optimization_id: str, user: User = Depends(require_user)) -> OptimizationStatus:
    row = storage.get_optimization(optimization_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(404, "Otimização não encontrada.")

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
