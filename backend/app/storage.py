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
            performance_score = None
            recommended_objective = None
            if row.result_json:
                product = (row.result_json.get("product") or {}).get("name")
                performance_score = row.result_json.get("performance_score")
                recommended_objective = row.result_json.get("recommended_objective") or None
            summaries.append(
                {
                    "id": row.id,
                    "media_type": row.media_type,
                    "stage": row.stage,
                    "product": product,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "performance_score": performance_score,
                    "recommended_objective": recommended_objective,
                }
            )
        return summaries


def count_analyses_this_month(user_id: str, plan_started_at=None) -> int:
    """Quantas análises esse usuário já criou desde o início do mês corrente (UTC) —
    ou desde que o plano atual começou, se isso for mais recente que o início do mês.
    Sem isso, uma análise feita no teste grátis (antes de assinar) contaria contra a
    cota do plano pago se as duas acontecerem no mesmo mês calendário."""
    now = datetime.now(timezone.utc)
    since = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if plan_started_at and plan_started_at > since:
        since = plan_started_at
    with SessionLocal() as db:
        return (
            db.query(func.count(Analysis.id))
            .filter(Analysis.user_id == user_id, Analysis.created_at >= since)
            .scalar()
            or 0
        )


def count_all_analyses(user_id: str) -> int:
    """Quantas análises esse usuário já criou desde sempre — usada pro teste grátis
    (1 análise antes de assinar), que não reseta por mês."""
    with SessionLocal() as db:
        return db.query(func.count(Analysis.id)).filter(Analysis.user_id == user_id).scalar() or 0


def get_dashboard_analytics(user_id: str) -> dict:
    """Dados crus (sem interpretação) pro dashboard: notas ao longo do tempo e contagem
    de encaixe por objetivo — usado tanto pros cards de estatística quanto pros insights
    automáticos. Uma query só por tabela, tudo computado em Python a partir do
    result_json já salvo (não refaz nenhuma análise nem chama a IA de novo)."""
    with SessionLocal() as db:
        rows = (
            db.query(Analysis)
            .filter(Analysis.user_id == user_id, Analysis.result_json.isnot(None))
            .order_by(Analysis.created_at.asc())
            .all()
        )

        trend: list[dict] = []
        objective_fraco_counts: dict[str, int] = {}
        objective_total_counts: dict[str, int] = {}
        last_analysis_at = None

        for row in rows:
            result = row.result_json or {}
            score = result.get("performance_score")
            if isinstance(score, (int, float)) and row.created_at:
                trend.append({"date": row.created_at.isoformat(), "score": score})
            for fit in result.get("objective_fit") or []:
                obj = fit.get("objective")
                if not obj:
                    continue
                objective_total_counts[obj] = objective_total_counts.get(obj, 0) + 1
                if fit.get("fit") == "fraco":
                    objective_fraco_counts[obj] = objective_fraco_counts.get(obj, 0) + 1
            if row.created_at and (last_analysis_at is None or row.created_at > last_analysis_at):
                last_analysis_at = row.created_at

        optimization_objectives = [
            row[0]
            for row in db.query(Optimization.objective)
            .filter(Optimization.user_id == user_id, Optimization.status == "done")
            .all()
        ]

        return {
            "total_analyses": len(rows),
            "trend": trend,
            "last_analysis_at": last_analysis_at.isoformat() if last_analysis_at else None,
            "objective_fraco_counts": objective_fraco_counts,
            "objective_total_counts": objective_total_counts,
            "optimization_objectives": optimization_objectives,
        }


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
    optimization_id: str, status: str, error: str | None = None, report_json: str | None = None,
) -> None:
    with SessionLocal() as db:
        row = db.get(Optimization, optimization_id)
        if row is None:
            return
        row.status = status
        if error is not None:
            row.error = error
        if report_json is not None:
            row.report_json = report_json
        db.commit()


def get_optimization(optimization_id: str) -> Optimization | None:
    with SessionLocal() as db:
        row = db.get(Optimization, optimization_id)
        if row is None:
            return None
        db.expunge(row)
        return row


def list_optimizations_for_analysis(analysis_id: str, user_id: str) -> list[Optimization]:
    """Todo o histórico de roteiros já gerados pra essa análise (mais recente primeiro) —
    usada tanto pra mostrar o histórico completo quanto pra travar o recurso em uma
    geração por vídeo pra quem não é admin (cada chamada tem custo real de IA)."""
    with SessionLocal() as db:
        rows = (
            db.query(Optimization)
            .filter(Optimization.analysis_id == analysis_id, Optimization.user_id == user_id)
            .order_by(Optimization.created_at.desc())
            .all()
        )
        for row in rows:
            db.expunge(row)
        return rows


NICHE_BENCHMARK_MIN_SAMPLE = 10


def get_niche_benchmark(niche: str, min_sample: int = NICHE_BENCHMARK_MIN_SAMPLE) -> dict | None:
    """Média real de performance_score entre TODAS as análises já feitas na Ryber pro
    mesmo nicho (correspondência exata do texto gerado pela IA) — não é pesquisa de
    mercado externa, é dado real da própria base. Retorna None se a amostra for
    pequena demais pra significar algo (evita mostrar "média" calculada em cima de
    1-2 análises)."""
    with SessionLocal() as db:
        rows = (
            db.query(Analysis.result_json)
            .filter(Analysis.result_json.isnot(None))
            .all()
        )
        scores = []
        for (result_json,) in rows:
            row_niche = (result_json.get("market_benchmark") or {}).get("niche")
            score = result_json.get("performance_score")
            if row_niche == niche and isinstance(score, (int, float)):
                scores.append(score)

        if len(scores) < min_sample:
            return None
        return {
            "niche": niche,
            "average_score": sum(scores) / len(scores),
            "sample_size": len(scores),
        }


def list_trainable_ids() -> list[str]:
    """IDs que têm tanto o resultado original quanto uma correção humana."""
    with SessionLocal() as db:
        rows = (
            db.query(Analysis.id)
            .filter(Analysis.result_json.isnot(None), Analysis.correction_json.isnot(None))
            .all()
        )
        return [r[0] for r in rows]
