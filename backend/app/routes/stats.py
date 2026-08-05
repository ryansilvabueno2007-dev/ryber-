from collections import Counter

from fastapi import APIRouter, Depends

from app import storage
from app.auth import require_user
from app.db_models import User
from app.models import DashboardStats, ScoreTrendPoint
from app.routes.analyses import PLAN_QUOTAS
from app.subscription import is_plan_active

router = APIRouter(prefix="/api", tags=["stats"])


def _build_insights(
    total_analyses: int,
    average_score: float | None,
    best_score: float | None,
    most_used_objective: str | None,
    weakest_objective: str | None,
    weakest_ratio: tuple[int, int] | None,
    scores: list[float],
) -> list[str]:
    insights: list[str] = []
    if total_analyses == 0:
        return insights

    insights.append(f"Você já realizou {total_analyses} análise{'s' if total_analyses != 1 else ''}.")
    if average_score is not None:
        insights.append(f"Sua nota média de performance é {round(average_score * 100)}%.")
    if best_score is not None:
        insights.append(f"Sua melhor nota até agora foi {round(best_score * 100)}%.")
    if most_used_objective:
        insights.append(f"Seu objetivo mais usado nos roteiros de otimização é {most_used_objective}.")
    if weakest_objective and weakest_ratio:
        fraco, total = weakest_ratio
        insights.append(
            f"Seu maior gargalo tende a ser {weakest_objective} — avaliado como fraco em {fraco} de "
            f"{total} análises."
        )
    if len(scores) >= 4:
        half = len(scores) // 2
        first_avg = sum(scores[:half]) / half
        second_avg = sum(scores[half:]) / (len(scores) - half)
        delta = second_avg - first_avg
        if abs(delta) >= 0.03:
            direction = "melhorou" if delta > 0 else "caiu"
            insights.append(
                f"Sua média de performance {direction} {round(abs(delta) * 100)} pontos percentuais "
                "comparando suas análises mais recentes com as mais antigas."
            )
    return insights


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: User = Depends(require_user)) -> DashboardStats:
    analytics = storage.get_dashboard_analytics(user.id)
    scores = [p["score"] for p in analytics["trend"]]

    average_score = sum(scores) / len(scores) if scores else None
    best_score = max(scores) if scores else None

    most_used_objective = None
    if analytics["optimization_objectives"]:
        most_used_objective = Counter(analytics["optimization_objectives"]).most_common(1)[0][0]

    weakest_objective = None
    weakest_ratio = None
    fraco_counts: dict[str, int] = analytics["objective_fraco_counts"]
    if fraco_counts:
        weakest_objective = max(fraco_counts, key=fraco_counts.get)
        weakest_ratio = (fraco_counts[weakest_objective], analytics["objective_total_counts"][weakest_objective])

    plan_active = is_plan_active(user)
    if user.is_admin:
        quota, used = None, analytics["total_analyses"]
    elif user.plan and plan_active:
        # Assinante com plano ativo: cota mensal, reseta todo mês.
        quota, used = (
            PLAN_QUOTAS.get(user.plan),
            storage.count_analyses_this_month(user.id, plan_started_at=user.plan_started_at),
        )
    else:
        # Sem plano ativo (nunca assinou, ou assinatura cancelada e já expirada): a
        # única "cota" é a análise grátis vitalícia (1 análise, nunca reseta) — contar
        # por mês aqui mostraria "0 de 1" indevidamente pra quem já usou há tempos.
        quota, used = 1, analytics["total_analyses"]

    return DashboardStats(
        name=user.name,
        plan=user.plan,
        plan_renews_at=user.plan_renews_at.isoformat() if user.plan_renews_at else None,
        plan_canceled=user.plan_canceled,
        is_subscribed=plan_active,
        analyses_used=used,
        analyses_quota=quota,
        total_analyses=analytics["total_analyses"],
        average_score=average_score,
        best_score=best_score,
        most_used_objective=most_used_objective,
        weakest_objective=weakest_objective,
        last_analysis_at=analytics["last_analysis_at"],
        score_trend=[ScoreTrendPoint(**p) for p in analytics["trend"][-15:]],
        insights=_build_insights(
            analytics["total_analyses"],
            average_score,
            best_score,
            most_used_objective,
            weakest_objective,
            weakest_ratio,
            scores,
        ),
    )
