import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, Date, DateTime, ForeignKey, String, Text
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
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)
    cpf_cnpj = Column(String, nullable=True)  # exigido pela Asaas pra criar o cliente/assinatura
    asaas_customer_id = Column(String, nullable=True)
    asaas_subscription_id = Column(String, nullable=True)
    is_subscribed = Column(Boolean, nullable=False, default=False)
    plan = Column(String, nullable=True)  # "start" | "gold" | "platinum" | "titanium" | "infinity"
    # Momento exato (não só a data) em que o plano atual foi confirmado por pagamento —
    # precisa da hora, não só do dia, pra separar corretamente do teste grátis feito
    # mais cedo no mesmo dia em que a pessoa assina.
    plan_started_at = Column(DateTime(timezone=True), nullable=True)
    # Plano escolhido no checkout, mas ainda não confirmado por pagamento — só vira
    # "plan" de fato quando o webhook confirma a primeira cobrança (PAYMENT_CONFIRMED/
    # RECEIVED). Evita mostrar um plano como "atual" antes de qualquer pagamento.
    pending_plan = Column(String, nullable=True)
    # Assinatura antiga a cancelar quando a nova (pending_plan) for confirmada por
    # pagamento — evita cancelar o plano atual antes de garantir que o novo foi pago
    # (senão, se a pessoa abandonar o checkout, fica sem nenhum plano ativo).
    pending_cancel_subscription_id = Column(String, nullable=True)
    # Enquanto não cancelado, é a próxima data de cobrança. Depois de cancelar
    # (plan_canceled=True), vira a data em que o acesso realmente termina.
    plan_renews_at = Column(Date, nullable=True)
    plan_canceled = Column(Boolean, nullable=False, default=False)
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


class PasswordResetToken(Base):
    """Token de recuperação de senha — só o hash é guardado (nunca o token puro,
    mesmo padrão de Session), expira em 1h e é de uso único: consumido é marcado
    com used_at em vez de apagado, pra não permitir reuso do mesmo link."""

    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=_uuid)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


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


class CancellationFeedback(Base):
    """Enquete respondida antes de liberar o cancelamento de vez — usada só pra
    entender motivo/experiência, não trava nem afeta o cancelamento em si depois de
    respondida."""

    __tablename__ = "cancellation_feedback"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan = Column(String, nullable=True)
    experience = Column(String, nullable=False)  # "boa" | "ruim"
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class Optimization(Base):
    """Roteiro de edição cena a cena gerado por IA a partir da timeline da análise."""

    __tablename__ = "optimizations"

    id = Column(String, primary_key=True, default=_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    objective = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued|processing|done|error
    video_key = Column(String, nullable=True)  # legado (fluxo antigo via Runway) — não usado mais
    report_json = Column(Text, nullable=True)  # lista de SceneDirection, quando status == done
    error = Column(String, nullable=True)
    runway_task_id = Column(String, nullable=True)  # legado (fluxo antigo via Runway) — não usado mais
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
