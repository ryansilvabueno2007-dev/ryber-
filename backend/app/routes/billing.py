import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import require_user
from app.config import settings
from app.db import SessionLocal
from app.db_models import User

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout_session(user: User = Depends(require_user)) -> dict:
    if not settings.stripe_secret_key or not settings.stripe_price_id:
        raise HTTPException(503, "Pagamento ainda não configurado.")

    stripe.api_key = settings.stripe_secret_key
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        client_reference_id=user.id,
        customer_email=user.email,
        success_url=f"{settings.frontend_url}/billing/success",
        cancel_url=f"{settings.frontend_url}/billing/cancel",
    )
    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict:
    if not settings.stripe_webhook_secret:
        raise HTTPException(503, "Webhook ainda não configurado.")

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(400, "Assinatura inválida.") from None

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        customer_id = session.get("customer")
        if user_id:
            with SessionLocal() as db:
                user = db.get(User, user_id)
                if user is not None:
                    user.is_subscribed = True
                    if customer_id:
                        user.stripe_customer_id = customer_id
                    db.commit()

    return {"status": "ok"}
