import secrets

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session as DBSession

from app import auth
from app.config import settings
from app.db import get_db
from app.db_models import User
from app.rate_limit import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str
    # False no login: não cria conta nova se o e-mail do Google não tiver cadastro,
    # só entra em quem já existe. True no cadastro: cria se não existir.
    create_if_missing: bool = True


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    is_subscribed: bool
    is_admin: bool
    plan: str | None
    cpf_cnpj: str | None


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        is_subscribed=user.is_subscribed,
        is_admin=user.is_admin,
        plan=user.plan,
        cpf_cnpj=user.cpf_cnpj,
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

    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(409, "Já existe uma conta com esse e-mail.")

    user = User(name=name, email=email, password_hash=auth.hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

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
        # Conta criada via Google não usa senha própria — gera um hash aleatório
        # inutilizável só pra satisfazer a coluna NOT NULL, nunca é usado pra logar.
        user = User(
            email=email,
            name=idinfo.get("name") or None,
            password_hash=auth.hash_password(secrets.token_hex(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return _to_user_response(user)


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
