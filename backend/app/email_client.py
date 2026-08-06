"""Cliente HTTP mínimo pra API da Resend (envio de e-mail transacional) — usado pra
recuperação de senha e outros avisos do sistema. Autenticação via Bearer token.
Sem RESEND_API_KEY configurada (dev local), só loga no console em vez de enviar de
verdade, pra não travar o fluxo por falta de credencial."""
import httpx

from app.config import settings

_BASE_URL = "https://api.resend.com"


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        print(f"[email] RESEND_API_KEY não configurada — e-mail p/ {to} não enviado.\nAssunto: {subject}\n{html}", flush=True)
        return

    resp = httpx.post(
        f"{_BASE_URL}/emails",
        headers={"Authorization": f"Bearer {settings.resend_api_key}", "Content-Type": "application/json"},
        json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
        timeout=30,
    )
    if resp.status_code >= 400:
        print(f"[email] {resp.status_code} ao enviar pra {to}: {resp.text}", flush=True)
    resp.raise_for_status()
