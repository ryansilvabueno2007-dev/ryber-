"""add known_emails table and trial_already_claimed on users

Revision ID: 7b1d4f9a2e6c
Revises: 3e8a5c2d7f19
Create Date: 2026-08-06 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b1d4f9a2e6c'
down_revision: Union[str, None] = '3e8a5c2d7f19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users', sa.Column('trial_already_claimed', sa.Boolean(), nullable=False, server_default=sa.false())
    )

    op.create_table(
        'known_emails',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_known_emails_email'), 'known_emails', ['email'], unique=True)

    # Backfill: todo e-mail que já existe hoje em `users` precisa entrar na lista,
    # senão excluir uma conta já existente hoje destravaria um teste grátis "novo"
    # pra esse e-mail via KnownEmail (o backfill fecha essa brecha retroativamente).
    op.execute("INSERT INTO known_emails (id, email, created_at) SELECT id, email, created_at FROM users")


def downgrade() -> None:
    op.drop_index(op.f('ix_known_emails_email'), table_name='known_emails')
    op.drop_table('known_emails')
    op.drop_column('users', 'trial_already_claimed')
