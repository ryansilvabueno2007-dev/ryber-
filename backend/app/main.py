import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from app.config import settings
from app.db import SessionLocal
from app.db_models import User
from app.rate_limit import limiter
from app.routes.admin import router as admin_router
from app.routes.analyses import router as analyses_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.optimize import router as optimize_router
from app.routes.stats import router as stats_router

# Sem SENTRY_DSN configurada (dev local), não inicializa nada — captura erros não
# tratados automaticamente em produção, sem precisar instrumentar rota por rota.
if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1, send_default_pii=False)

app = FastAPI(title="Ryber API")


class MaxBodySizeMiddleware:
    """Rejeita requisições cujo Content-Length já declarado passa do limite de upload,
    ANTES do Starlette começar a ler/spoolar o corpo pra disco — sem isso, o limite de
    max_upload_mb só era checado depois de já ter recebido o arquivo inteiro (analyses.py),
    permitindo esgotar disco/memória do servidor com uploads repetidos e grandes demais.
    Puro ASGI (não BaseHTTPMiddleware) pra não bufferizar o corpo de toda requisição."""

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            headers = dict(scope.get("headers") or [])
            content_length = headers.get(b"content-length")
            if content_length is not None:
                try:
                    if int(content_length) > self.max_bytes:
                        response = JSONResponse(
                            {"detail": f"Arquivo maior que {settings.max_upload_mb}MB."}, status_code=413
                        )
                        await response(scope, receive, send)
                        return
                except ValueError:
                    pass
        await self.app(scope, receive, send)


@app.on_event("startup")
def promote_configured_admins() -> None:
    emails = [e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()]
    if not emails:
        return
    with SessionLocal() as db:
        users = db.query(User).filter(User.email.in_(emails), User.is_admin.is_(False)).all()
        for user in users:
            user.is_admin = True
        if users:
            db.commit()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
# +2MB de margem pro overhead do multipart (boundaries/headers) em cima do arquivo em si.
app.add_middleware(MaxBodySizeMiddleware, max_bytes=(settings.max_upload_mb + 2) * 1024 * 1024)

app.add_middleware(
    CORSMiddleware,
    # CORS_ORIGIN aceita uma ou mais origens separadas por vírgula (ex: domínio da
    # Vercel + domínio próprio), pra não perder acesso por nenhum dos dois ao trocar.
    allow_origins=[o.strip() for o in settings.cors_origin.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyses_router)
app.include_router(billing_router)
app.include_router(admin_router)
app.include_router(optimize_router)
app.include_router(stats_router)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
