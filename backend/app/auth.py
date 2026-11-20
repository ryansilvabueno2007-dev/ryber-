import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Cookie, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.db import get_db
from app.db_models import EmailVerificationToken, PasswordResetToken
from app.db_models import Session as SessionModel
from app.db_models import User

CSRF_COOKIE_NAME = "ryber_csrf"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(db: DBSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.session_ttl_days)
    db.add(SessionModel(token_hash=_hash_token(token), user_id=user.id, expires_at=expires_at))
    db.commit()
    return token


def destroy_session(db: DBSession, token: str) -> None:
    db.query(SessionModel).filter(SessionModel.token_hash == _hash_token(token)).delete()
    db.commit()


def create_password_reset_token(db: DBSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.add(PasswordResetToken(token_hash=_hash_token(token), user_id=user.id, expires_at=expires_at))
    db.commit()
    return token


def _consume_token(db: DBSession, model, token: str) -> User | None:
    """Valida um token de uso único (PasswordResetToken/EmailVerificationToken) e já
    marca como usado — retorna None se não existir, já tiver sido usado, ou expirado."""
    record = db.query(model).filter(model.token_hash == _hash_token(token)).first()
    if record is None or record.used_at is not None:
        return None
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    record.used_at = datetime.now(timezone.utc)
    db.commit()
    return db.get(User, record.user_id)


def consume_password_reset_token(db: DBSession, token: str) -> User | None:
    return _consume_token(db, PasswordResetToken, token)


def create_email_verification_token(db: DBSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(EmailVerificationToken(token_hash=_hash_token(token), user_id=user.id, expires_at=expires_at))
    db.commit()
    return token


def consume_email_verification_token(db: DBSession, token: str) -> User | None:
    return _consume_token(db, EmailVerificationToken, token)


def get_current_user(
    db: DBSession = Depends(get_db),
    token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> User | None:
    if not token:
        return None
    session = db.query(SessionModel).filter(SessionModel.token_hash == _hash_token(token)).first()
    if session is None:
        return None
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    return db.get(User, session.user_id)


def require_user(user: User | None = Depends(get_current_user)) -> User:
    if user is None:
        raise HTTPException(401, "Não autenticado.")
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if not user.is_admin:
        raise HTTPException(404)
    return user


def create_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response: Response, token: str) -> None:
    """Cookie legível por JS (não-HttpOnly, de propósito) — o padrão "double submit
    cookie": o frontend ecoa esse valor no header X-CSRF-Token em toda requisição que
    muda estado, e require_csrf() confere que os dois batem. Um site malicioso consegue
    fazer o navegador da vítima *enviar* o cookie de sessão automaticamente, mas não
    consegue *ler* este cookie (bloqueado pela mesma-origem) pra montar o header —
    por isso a checagem prova que a requisição partiu do próprio frontend da Ryber.

    domain=settings.csrf_cookie_domain (ex: "ryber.com.br") é essencial em produção:
    sem isso, o cookie fica preso ao host exato que o emitiu (api.ryber.com.br), e o
    JS do frontend (em www.ryber.com.br) nunca consegue ler via document.cookie —
    cookie de subdomínio não é visível pro JS de outro subdomínio, só o domínio pai
    compartilhado resolve isso."""
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=settings.session_cookie_secure,
        samesite="none" if settings.session_cookie_secure else "lax",
        max_age=settings.session_ttl_days * 24 * 3600,
        path="/",
        domain=settings.csrf_cookie_domain or None,
    )


def require_csrf(
    request: Request,
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE_NAME),
) -> None:
    header_token = request.headers.get("x-csrf-token")
    if not csrf_cookie or not header_token or not hmac.compare_digest(csrf_cookie, header_token):
        raise HTTPException(403, "Requisição bloqueada por proteção CSRF. Recarregue a página e tente de novo.")
