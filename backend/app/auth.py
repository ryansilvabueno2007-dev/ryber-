import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.db import get_db
from app.db_models import EmailVerificationToken, PasswordResetToken
from app.db_models import Session as SessionModel
from app.db_models import User


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
