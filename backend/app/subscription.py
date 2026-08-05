"""Regra única de "a assinatura ainda vale?" — usada em qualquer lugar que precise
saber se o usuário tem acesso de assinante (cota de análise, badges de UI, etc). Depois
de cancelar, o acesso continua valendo até plan_renews_at (o período já pago), mesmo com
a assinatura já removida do lado da Asaas.
"""
from datetime import date

from app.db_models import User


def is_plan_active(user: User) -> bool:
    # Uma vez cancelado, o acesso passa a depender só da data (não do campo
    # is_subscribed cru) — evita que um webhook de eco do próprio cancelamento
    # (ex: SUBSCRIPTION_DELETED, disparado pela nossa própria chamada de cancelar)
    # corte o acesso antes da hora.
    if user.plan_canceled:
        return bool(user.plan_renews_at and date.today() <= user.plan_renews_at)
    return user.is_subscribed
