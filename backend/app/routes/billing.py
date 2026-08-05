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
    "start": 97.00,
    "platinum": 197.00,
    "gold": 297.00,
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
                name=db_user.email, cpf_cnpj=doc, email=db_user.email, external_reference=db_user.id
            )
            db_user.asaas_customer_id = customer["id"]
        customer_id = db_user.asaas_customer_id
        db.commit()

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

    if event in ("PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"):
        payment = body.get("payment") or {}
        subscription_id = payment.get("subscription")
        if subscription_id:
            with SessionLocal() as db:
                db_user = db.query(User).filter(User.asaas_subscription_id == subscription_id).first()
                if db_user is not None:
                    db_user.is_subscribed = True
                    db.commit()

    elif event in ("SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"):
        subscription = body.get("subscription") or {}
        subscription_id = subscription.get("id")
        if subscription_id:
            with SessionLocal() as db:
                db_user = db.query(User).filter(User.asaas_subscription_id == subscription_id).first()
                if db_user is not None:
                    db_user.is_subscribed = False
                    db.commit()

    return {"status": "ok"}
