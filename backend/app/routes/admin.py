from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func

from app.auth import require_admin
from app.db import SessionLocal
from app.db_models import Analysis, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminStats(BaseModel):
    total_users: int
    subscribed_users: int
    total_analyses: int


class AdminUser(BaseModel):
    id: str
    email: str
    is_admin: bool
    is_subscribed: bool
    created_at: str
    analyses_count: int


@router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def stats() -> AdminStats:
    with SessionLocal() as db:
        total_users = db.query(func.count(User.id)).scalar() or 0
        subscribed_users = db.query(func.count(User.id)).filter(User.is_subscribed.is_(True)).scalar() or 0
        total_analyses = db.query(func.count(Analysis.id)).scalar() or 0
        return AdminStats(
            total_users=total_users,
            subscribed_users=subscribed_users,
            total_analyses=total_analyses,
        )


@router.get("/users", response_model=list[AdminUser], dependencies=[Depends(require_admin)])
async def list_users() -> list[AdminUser]:
    with SessionLocal() as db:
        counts = dict(
            db.query(Analysis.user_id, func.count(Analysis.id)).group_by(Analysis.user_id).all()
        )
        users = db.query(User).order_by(User.created_at.desc()).all()
        return [
            AdminUser(
                id=u.id,
                email=u.email,
                is_admin=u.is_admin,
                is_subscribed=u.is_subscribed,
                created_at=u.created_at.isoformat() if u.created_at else "",
                analyses_count=counts.get(u.id, 0),
            )
            for u in users
        ]
