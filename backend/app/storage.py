import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func

from app.config import settings
from app.db import SessionLocal
from app.db_models import Analysis, Optimization
from app.models import AnalysisResult, AnalysisStatus

DATA_DIR = Path(settings.data_dir)
UPLOADS_DIR = DATA_DIR / "uploads"
RAW_DIR = DATA_DIR / "raw"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)


def upload_path(analysis_id: str, suffix: str = ".mp4") -> Path:
    return UPLOADS_DIR / f"{analysis_id}{suffix}"


def raw_dir(analysis_id: str) -> Path:
    """Pasta persistida com os frames extraídos e a transcrição de uma análise.

    Isso não é apagado após o processamento: é a matéria-prima (input) que, junto
    com a correção humana (o "gabarito"), forma um exemplo de treino para um
    futuro modelo próprio.
    """
    d = RAW_DIR / analysis_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def create_analysis(analysis_id: str, user_id: str | None, compared_to_id: str | None = None) -> None:
    with SessionLocal() as db:
        db.add(
            Analysis(
                id=analysis_id, user_id=user_id, compared_to_id=compared_to_id, stage="reading", detail=""
            )
        )
        db.commit()


def get_owner(analysis_id: str) -> str | None:
    """user_id dono da análise, ou None se a análise não existir."""
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        return row.user_id if row else None


def get_comparison_pair(analysis_id: str) -> tuple[str, str] | None:
    """Resolve o par (before_id, after_id) de uma comparação, a partir de qualquer um dos dois lados.

    Retorna None se essa análise não faz parte de nenhuma comparação ainda.
    """
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None:
            return None
        if row.compared_to_id:
            return row.compared_to_id, analysis_id
        after = db.query(Analysis).filter(Analysis.compared_to_id == analysis_id).first()
        if after is not None:
            return analysis_id, after.id
        return None


def set_status(analysis_id: str, stage: str, detail: str = "", error: str | None = None) -> None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None:
            return
        row.stage = stage
        row.detail = detail
        row.error = error
        db.commit()


def get_status(analysis_id: str) -> AnalysisStatus | None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None:
            return None
        return AnalysisStatus(id=row.id, stage=row.stage, detail=row.detail, error=row.error)


def save_result(analysis_id: str, result: AnalysisResult) -> None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None:
            return
        row.media_type = result.media_type
        row.result_json = json.loads(result.model_dump_json())
        db.commit()


def load_result(analysis_id: str) -> AnalysisResult | None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None or row.result_json is None:
            return None
        return AnalysisResult.model_validate(row.result_json)


def save_correction(analysis_id: str, result: AnalysisResult) -> None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None:
            return
        row.correction_json = json.loads(result.model_dump_json())
        db.commit()


def load_correction(analysis_id: str) -> AnalysisResult | None:
    with SessionLocal() as db:
        row = db.get(Analysis, analysis_id)
        if row is None or row.correction_json is None:
            return None
        return AnalysisResult.model_validate(row.correction_json)


def save_transcript(analysis_id: str, transcript: list[dict]) -> None:
    (raw_dir(analysis_id) / "transcript.json").write_text(
        json.dumps(transcript, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def find_upload(analysis_id: str) -> Path | None:
    matches = list(UPLOADS_DIR.glob(f"{analysis_id}.*"))
    return matches[0] if matches else None


def list_analyses(user_id: str, limit: int = 50, offset: int = 0) -> list[dict]:
    with SessionLocal() as db:
        rows = (
            db.query(Analysis)
            .filter(Analysis.user_id == user_id)
            .order_by(Analysis.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        summaries = []
        for row in rows:
            product = None
            if row.result_json:
                product = (row.result_json.get("product") or {}).get("name")
            summaries.append(
                {
                    "id": row.id,
                    "media_type": row.media_type,
                    "stage": row.stage,
                    "product": product,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
            )
        return summaries


def count_analyses_this_month(user_id: str) -> int:
    """Quantas análises esse usuário já criou desde o início do mês corrente (UTC)."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    with SessionLocal() as db:
        return (
            db.query(func.count(Analysis.id))
            .filter(Analysis.user_id == user_id, Analysis.created_at >= month_start)
            .scalar()
            or 0
        )


def create_optimization(optimization_id: str, analysis_id: str, user_id: str, objective: str) -> None:
    with SessionLocal() as db:
        db.add(
            Optimization(
                id=optimization_id,
                analysis_id=analysis_id,
                user_id=user_id,
                objective=objective,
                status="queued",
            )
        )
        db.commit()


def set_optimization_status(
    optimization_id: str, status: str, error: str | None = None, video_key: str | None = None,
    runway_task_id: str | None = None,
) -> None:
    with SessionLocal() as db:
        row = db.get(Optimization, optimization_id)
        if row is None:
            return
        row.status = status
        if error is not None:
            row.error = error
        if video_key is not None:
            row.video_key = video_key
        if runway_task_id is not None:
            row.runway_task_id = runway_task_id
        db.commit()


def get_optimization(optimization_id: str) -> Optimization | None:
    with SessionLocal() as db:
        row = db.get(Optimization, optimization_id)
        if row is None:
            return None
        db.expunge(row)
        return row


def list_trainable_ids() -> list[str]:
    """IDs que têm tanto o resultado original quanto uma correção humana."""
    with SessionLocal() as db:
        rows = (
            db.query(Analysis.id)
            .filter(Analysis.result_json.isnot(None), Analysis.correction_json.isnot(None))
            .all()
        )
        return [r[0] for r in rows]
