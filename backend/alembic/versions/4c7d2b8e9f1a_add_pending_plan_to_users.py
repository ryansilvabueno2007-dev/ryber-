"""add pending_plan to users

Revision ID: 4c7d2b8e9f1a
Revises: 1a9f3e7c5b2d
Create Date: 2026-08-05 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c7d2b8e9f1a'
down_revision: Union[str, None] = '1a9f3e7c5b2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('pending_plan', sa.String(), nullable=True))
    op.add_column('users', sa.Column('pending_cancel_subscription_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'pending_cancel_subscription_id')
    op.drop_column('users', 'pending_plan')
