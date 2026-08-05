"""Cliente HTTP mínimo pra API da Asaas (cobrança/assinatura) — usado só por
app/routes/billing.py. Autenticação via header "access_token" (não é Bearer/OAuth).
Base URL muda conforme o ambiente configurado (sandbox pra testes, produção pra valer).
"""
import httpx

from app.config import settings

_BASE_URLS = {
    "sandbox": "https://api-sandbox.asaas.com/v3",
    "production": "https://api.asaas.com/v3",
}


def _base_url() -> str:
    return _BASE_URLS.get(settings.asaas_env, _BASE_URLS["sandbox"])


def _headers() -> dict:
    return {"access_token": settings.asaas_api_key, "Content-Type": "application/json"}


def create_customer(name: str, cpf_cnpj: str, email: str, external_reference: str) -> dict:
    resp = httpx.post(
        f"{_base_url()}/customers",
        headers=_headers(),
        json={
            "name": name,
            "cpfCnpj": cpf_cnpj,
            "email": email,
            "externalReference": external_reference,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def create_subscription(
    customer_id: str, value: float, external_reference: str, next_due_date: str, success_url: str
) -> dict:
    resp = httpx.post(
        f"{_base_url()}/subscriptions",
        headers=_headers(),
        json={
            "customer": customer_id,
            "billingType": "UNDEFINED",  # deixa o cliente escolher PIX/boleto/cartão na fatura
            "value": value,
            "nextDueDate": next_due_date,
            "cycle": "MONTHLY",
            "externalReference": external_reference,
            # Sem isso, depois de pagar a pessoa fica parada na aba da fatura da Asaas,
            # sem voltar pro site sozinha.
            "callback": {"successUrl": success_url, "autoRedirect": True},
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def get_subscription_payments(subscription_id: str) -> list[dict]:
    resp = httpx.get(
        f"{_base_url()}/subscriptions/{subscription_id}/payments",
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def cancel_subscription(subscription_id: str) -> None:
    """Cancela uma assinatura — para de gerar cobrança nova e remove as pendentes.
    Usado ao trocar de plano, pra não deixar duas assinaturas cobrando em paralelo.
    Se a assinatura já não existir mais do lado da Asaas (404), não é erro pra nós."""
    resp = httpx.delete(f"{_base_url()}/subscriptions/{subscription_id}", headers=_headers(), timeout=30)
    if resp.status_code == 404:
        return
    resp.raise_for_status()
