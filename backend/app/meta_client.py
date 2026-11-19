"""Cliente mínimo pra Conversions API da Meta (Facebook/Instagram Ads) — hoje usado só
pro evento Purchase, disparado pelo webhook da Asaas quando o pagamento é confirmado de
verdade (nunca antes disso). Leva um event_id pra deduplicar com o Pixel do navegador,
caso o mesmo evento também seja mandado do frontend no futuro.

Nunca deve derrubar o fluxo de pagamento se a Meta estiver fora do ar ou o token for
inválido — por isso toda falha é só logada, nunca propagada.
"""
import hashlib
import time

import httpx

from app.config import settings

_API_VERSION = "v21.0"


def _hash(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def send_event(
    event_name: str,
    event_id: str,
    *,
    email: str | None = None,
    event_source_url: str | None = None,
    value: float | None = None,
    currency: str = "BRL",
) -> None:
    if not settings.meta_pixel_id or not settings.meta_capi_access_token:
        return

    user_data: dict = {}
    if email:
        user_data["em"] = [_hash(email)]

    event: dict = {
        "event_name": event_name,
        "event_time": int(time.time()),
        "event_id": event_id,
        "action_source": "website",
        "user_data": user_data,
    }
    if event_source_url:
        event["event_source_url"] = event_source_url
    if value is not None:
        event["custom_data"] = {"value": value, "currency": currency}

    payload: dict = {"data": [event]}
    if settings.meta_test_event_code:
        payload["test_event_code"] = settings.meta_test_event_code

    try:
        resp = httpx.post(
            f"https://graph.facebook.com/{_API_VERSION}/{settings.meta_pixel_id}/events",
            params={"access_token": settings.meta_capi_access_token},
            json=payload,
            timeout=10,
        )
        if resp.status_code >= 400:
            print(f"[meta_capi] {resp.status_code} em {event_name}: {resp.text}", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[meta_capi] falha ao enviar {event_name}: {exc}", flush=True)
