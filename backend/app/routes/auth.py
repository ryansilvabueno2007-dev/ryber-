import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session as DBSession

from app import asaas_client, auth, email_client, storage_r2
from app.config import settings
from app.db import get_db
from app.db_models import Analysis, CancellationFeedback, EmailVerificationToken, Optimization, PasswordResetToken
from app.db_models import Session as SessionModel
from app.db_models import User
from app.rate_limit import limiter
from app.subscription import is_plan_active

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    terms_accepted: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str
    # False no login: não cria conta nova se o e-mail do Google não tiver cadastro,
    # só entra em quem já existe. True no cadastro: cria se não existir.
    create_if_missing: bool = True
    # Só é checado quando uma conta nova de fato vai ser criada (login nunca cria).
    terms_accepted: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    is_subscribed: bool
    is_admin: bool
    plan: str | None
    plan_renews_at: str | None
    plan_canceled: bool
    cpf_cnpj: str | None
    email_verified: bool


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        is_subscribed=is_plan_active(user),
        is_admin=user.is_admin,
        plan=user.plan,
        plan_renews_at=user.plan_renews_at.isoformat() if user.plan_renews_at else None,
        plan_canceled=user.plan_canceled,
        cpf_cnpj=user.cpf_cnpj,
        email_verified=user.email_verified_at is not None,
    )


def _password_reset_email_html(name: str | None, reset_link: str) -> str:
    greeting = f"Oi, {name}!" if name else "Oi!"
    return f"""
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <p style="font-size: 16px;">{greeting}</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Recebemos um pedido para redefinir a senha da sua conta na Ryber. Clique no botão
        abaixo para criar uma nova senha:
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{reset_link}"
           style="background: #5b46d6; color: #fff; padding: 12px 28px; border-radius: 999px;
                  text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Redefinir senha
        </a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">
        Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este
        e-mail — sua senha continua a mesma.
      </p>
    </div>
    """


def _verification_email_html(name: str | None, verify_link: str) -> str:
    greeting = f"Oi, {name}!" if name else "Oi!"
    return f"""
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
      <p style="font-size: 16px;">{greeting}</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Falta só confirmar seu e-mail pra garantir o acesso à sua conta na Ryber. Clique no
        botão abaixo:
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="{verify_link}"
           style="background: #5b46d6; color: #fff; padding: 12px 28px; border-radius: 999px;
                  text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          Confirmar e-mail
        </a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">
        Esse link expira em 24 horas. Se você não criou uma conta na Ryber, pode ignorar
        este e-mail.
      </p>
    </div>
    """


def _send_verification_email(db: DBSession, user: User) -> None:
    token = auth.create_email_verification_token(db, user)
    verify_link = f"{settings.frontend_url}/verificar-email?token={token}"
    email_client.send_email(
        to=user.email,
        subject="Confirme seu e-mail na Ryber",
        html=_verification_email_html(user.name, verify_link),
    )


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="none" if settings.session_cookie_secure else "lax",
        max_age=settings.session_ttl_days * 24 * 3600,
        path="/",
    )


@router.post("/signup", response_model=UserResponse)
@limiter.limit("3/day")
async def signup(
    request: Request, payload: SignupRequest, response: Response, db: DBSession = Depends(get_db)
) -> UserResponse:
    name = payload.name.strip()
    if not name:
        raise HTTPException(400, "Informe seu nome.")
    if len(payload.password) < 8:
        raise HTTPException(400, "A senha precisa ter pelo menos 8 caracteres.")
    if not payload.terms_accepted:
        raise HTTPException(400, "Você precisa aceitar os Termos de Uso e a Política de Privacidade.")

    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(409, "Já existe uma conta com esse e-mail.")

    user = User(
        name=name,
        email=email,
        password_hash=auth.hash_password(payload.password),
        terms_accepted_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _send_verification_email(db, user)

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return _to_user_response(user)


@router.post("/login", response_model=UserResponse)
async def login(payload: LoginRequest, response: Response, db: DBSession = Depends(get_db)) -> UserResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "E-mail ou senha inválidos.")

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return _to_user_response(user)


@router.post("/google", response_model=UserResponse)
@limiter.limit("10/minute")
async def google_auth(
    request: Request, payload: GoogleAuthRequest, response: Response, db: DBSession = Depends(get_db)
) -> UserResponse:
    if not settings.google_client_id:
        raise HTTPException(503, "Login com Google ainda não configurado.")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(401, "Token do Google inválido.") from None

    email = (idinfo.get("email") or "").lower()
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(401, "Não foi possível confirmar seu e-mail do Google.")

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        if not payload.create_if_missing:
            raise HTTPException(404, "Nenhuma conta encontrada com esse e-mail do Google. Crie uma conta primeiro.")
        if not payload.terms_accepted:
            raise HTTPException(400, "Você precisa aceitar os Termos de Uso e a Política de Privacidade.")
        # Conta criada via Google não usa senha própria — gera um hash aleatório
        # inutilizável só pra satisfazer a coluna NOT NULL, nunca é usado pra logar.
        # E-mail já sai verificado — o próprio Google confirmou (checado acima).
        now = datetime.now(timezone.utc)
        user = User(
            email=email,
            name=idinfo.get("name") or None,
            password_hash=auth.hash_password(secrets.token_hex(32)),
            terms_accepted_at=now,
            email_verified_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return _to_user_response(user)


@router.post("/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: DBSession = Depends(get_db)
) -> dict:
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    # Sempre responde com a mesma mensagem, exista ou não a conta — evita que alguém
    # descubra quais e-mails têm cadastro na Ryber (enumeração de contas).
    if user is not None:
        token = auth.create_password_reset_token(db, user)
        reset_link = f"{settings.frontend_url}/redefinir-senha?token={token}"
        email_client.send_email(
            to=user.email,
            subject="Redefinir sua senha na Ryber",
            html=_password_reset_email_html(user.name, reset_link),
        )
    return {"status": "ok"}


@router.post("/reset-password")
@limiter.limit("10/hour")
async def reset_password(
    request: Request, payload: ResetPasswordRequest, db: DBSession = Depends(get_db)
) -> dict:
    if len(payload.password) < 8:
        raise HTTPException(400, "A senha precisa ter pelo menos 8 caracteres.")

    user = auth.consume_password_reset_token(db, payload.token)
    if user is None:
        raise HTTPException(400, "Link inválido ou expirado. Solicite um novo.")

    user.password_hash = auth.hash_password(payload.password)
    # Derruba todas as sessões ativas — se alguém mais tinha acesso à conta, perde ao
    # trocar a senha.
    db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
    db.commit()
    return {"status": "ok"}


@router.post("/verify-email")
@limiter.limit("20/hour")
async def verify_email(
    request: Request, payload: VerifyEmailRequest, db: DBSession = Depends(get_db)
) -> dict:
    user = auth.consume_email_verification_token(db, payload.token)
    if user is None:
        raise HTTPException(400, "Link inválido ou expirado. Solicite um novo.")
    user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok"}


@router.post("/resend-verification")
@limiter.limit("3/hour")
async def resend_verification(
    request: Request, db: DBSession = Depends(get_db), user: User = Depends(auth.require_user)
) -> dict:
    if user.email_verified_at is not None:
        raise HTTPException(400, "Esse e-mail já está confirmado.")
    _send_verification_email(db, user)
    return {"status": "ok"}


@router.delete("/account")
@limiter.limit("3/hour")
async def delete_account(
    request: Request, response: Response, db: DBSession = Depends(get_db), user: User = Depends(auth.require_user)
) -> dict:
    """Exclusão de conta a pedido do titular (LGPD) — apaga a conta, as análises (e a
    mídia associada na R2, incluindo a cópia usada como dado de treino), e cancela
    qualquer assinatura ativa na Asaas antes de tudo, pra não deixar uma cobrança
    recorrente órfã rodando pra uma conta que não existe mais."""
    if user.asaas_subscription_id:
        try:
            asaas_client.cancel_subscription(user.asaas_subscription_id)
        except Exception:  # noqa: BLE001
            pass  # já capturado pelo Sentry — não pode travar a exclusão por isso

    analyses = db.query(Analysis).filter(Analysis.user_id == user.id).all()
    for analysis in analyses:
        try:
            storage_r2.delete_prefix(f"uploads/{analysis.id}")
            storage_r2.delete_prefix(f"raw/{analysis.id}/")
        except Exception:  # noqa: BLE001
            pass

    db.query(Optimization).filter(Optimization.user_id == user.id).delete()
    db.query(Analysis).filter(Analysis.user_id == user.id).delete()
    db.query(CancellationFeedback).filter(CancellationFeedback.user_id == user.id).delete()
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    db.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == user.id).delete()
    db.query(SessionModel).filter(SessionModel.user_id == user.id).delete()
    db.delete(user)
    db.commit()

    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"status": "ok"}


@router.post("/logout")
async def logout(
    response: Response,
    db: DBSession = Depends(get_db),
    token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> dict:
    if token:
        auth.destroy_session(db, token)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(auth.require_user)) -> UserResponse:
    return _to_user_response(user)
