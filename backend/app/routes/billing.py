from datetime import date

from fastapi import APIRouter, Body, Depends, HTTPException, Request

from app import asaas_client
from app.auth import require_user
from app.config import settings
from app.db import SessionLocal
from app.db_models import User

router = APIRouter(prefix="/api/billing", tags=["billing"])

# Preço mensal fixo por plano — a Asaas cobra por valor direto (não tem "Price" object
# de referência como a Stripe), então a fonte da verdade do preço é aqui, não no painel deles.
_PLAN_PRICES: dict[str, float] = {
    "start": 59.90,
    "gold": 179.90,
    "platinum": 349.90,
    "titanium": 569.90,
    "infinity": 1499.90,
}


@router.post("/checkout")
async def create_checkout_session(
    user: User = Depends(require_user),
    plan: str = Body(..., embed=True),
    cpf_cnpj: str | None = Body(None, embed=True),
) -> dict:
    value = _PLAN_PRICES.get(plan)
    if not settings.asaas_api_key or not value:
        raise HTTPException(503, "Pagamento ainda não configurado.")

    doc = (cpf_cnpj or user.cpf_cnpj or "").strip()
    if not doc:
        raise HTTPException(400, "Informe seu CPF ou CNPJ pra continuar.")

    with SessionLocal() as db:
        db_user = db.get(User, user.id)
        if doc != db_user.cpf_cnpj:
            # documento mudou (ou é a primeira vez) — o cliente na Asaas precisa bater
            # com o CPF/CNPJ informado, então não dá pra reaproveitar um id antigo.
            db_user.cpf_cnpj = doc
            db_user.asaas_customer_id = None
        if db_user.asaas_customer_id is None:
            customer = asaas_client.create_customer(
                name=db_user.name or db_user.email, cpf_cnpj=doc, email=db_user.email, external_reference=db_user.id
            )
            db_user.asaas_customer_id = customer["id"]
        customer_id = db_user.asaas_customer_id
        previous_subscription_id = db_user.asaas_subscription_id
        db.commit()

    if previous_subscription_id:
        # Troca de plano (ou reassinatura) — cancela a assinatura anterior antes de criar
        # a nova, senão as duas ficam cobrando em paralelo.
        try:
            asaas_client.cancel_subscription(previous_subscription_id)
        except Exception:  # noqa: BLE001
            pass

    subscription = asaas_client.create_subscription(
        customer_id=customer_id,
        value=value,
        external_reference=user.id,
        next_due_date=date.today().isoformat(),
    )
    subscription_id = subscription["id"]

    with SessionLocal() as db:
        db_user = db.get(User, user.id)
        db_user.asaas_subscription_id = subscription_id
        db_user.plan = plan
        db.commit()

    payments = asaas_client.get_subscription_payments(subscription_id)
    if not payments:
        raise HTTPException(502, "Não foi possível gerar a cobrança inicial da assinatura.")

    return {"url": payments[0]["invoiceUrl"]}


@router.post("/webhook")
async def asaas_webhook(request: Request) -> dict:
    if not settings.asaas_webhook_token:
        raise HTTPException(503, "Webhook ainda não configurado.")

    # Token estático configurado por nós no painel da Asaas (não é HMAC de corpo, como
    # na Stripe) — a própria Asaas devolve ele em todo webhook nesse header.
    token = request.headers.get("asaas-access-token", "")
    if token != settings.asaas_webhook_token:
        raise HTTPException(401, "Token inválido.")

    body = await request.json()
    event = body.get("event", "")

    def _set_subscribed(subscription_id: str | None, value: bool) -> None:
        if not subscription_id:
            return
        with SessionLocal() as db:
            db_user = db.query(User).filter(User.asaas_subscription_id == subscription_id).first()
            if db_user is not None:
                db_user.is_subscribed = value
                db.commit()

    # Dois sinais independentes pro mesmo estado — evento de cobrança (sempre chega,
    # já que gera a cada ciclo) e evento de assinatura (mais direto quando existe,
    # ex: cancelamento manual antes do próximo vencimento).
    if event in ("PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"):
        payment = body.get("payment") or {}
        _set_subscribed(payment.get("subscription"), True)

    elif event in ("PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED"):
        payment = body.get("payment") or {}
        _set_subscribed(payment.get("subscription"), False)

    elif event == "SUBSCRIPTION_DELETED" or event == "SUBSCRIPTION_INACTIVATED":
        subscription = body.get("subscription") or {}
        _set_subscribed(subscription.get("id"), False)

    return {"status": "ok"}
