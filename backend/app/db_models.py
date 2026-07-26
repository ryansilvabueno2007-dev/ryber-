import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)
    stripe_customer_id = Column(String, nullable=True)
    is_subscribed = Column(Boolean, nullable=False, default=False)
    plan = Column(String, nullable=True)  # "start" | "platinum" | "gold"
    created_at = Column(DateTime(timezone=True), default=_now)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=_uuid)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="sessions")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    compared_to_id = Column(String, ForeignKey("analyses.id"), nullable=True)
    media_type = Column(String, nullable=True)
    stage = Column(String, nullable=False, default="reading")
    detail = Column(String, nullable=False, default="")
    error = Column(String, nullable=True)
    result_json = Column(JSON, nullable=True)
    correction_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

    user = relationship("User", back_populates="analyses")
