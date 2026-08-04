from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.db import SessionLocal
from app.db_models import User
from app.rate_limit import limiter
from app.routes.admin import router as admin_router
from app.routes.analyses import router as analyses_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.optimize import router as optimize_router

app = FastAPI(title="Ryber API")


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(analyses_router)
app.include_router(billing_router)
app.include_router(admin_router)
app.include_router(optimize_router)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
