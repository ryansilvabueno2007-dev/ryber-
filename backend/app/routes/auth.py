from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session as DBSession

from app import auth
from app.config import settings
from app.db import get_db
from app.db_models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    invite_code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    is_subscribed: bool
    is_admin: bool
    plan: str | None


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
async def signup(payload: SignupRequest, response: Response, db: DBSession = Depends(get_db)) -> UserResponse:
    if not settings.signup_invite_code or payload.invite_code != settings.signup_invite_code:
        raise HTTPException(403, "Código de convite inválido.")
    if len(payload.password) < 8:
        raise HTTPException(400, "A senha precisa ter pelo menos 8 caracteres.")

    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(409, "Já existe uma conta com esse e-mail.")

    user = User(email=email, password_hash=auth.hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return UserResponse(
        id=user.id, email=user.email, is_subscribed=user.is_subscribed, is_admin=user.is_admin, plan=user.plan
    )


@router.post("/login", response_model=UserResponse)
async def login(payload: LoginRequest, response: Response, db: DBSession = Depends(get_db)) -> UserResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "E-mail ou senha inválidos.")

    token = auth.create_session(db, user)
    _set_session_cookie(response, token)
    return UserResponse(
        id=user.id, email=user.email, is_subscribed=user.is_subscribed, is_admin=user.is_admin, plan=user.plan
    )


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
    return UserResponse(
        id=user.id, email=user.email, is_subscribed=user.is_subscribed, is_admin=user.is_admin, plan=user.plan
    )
