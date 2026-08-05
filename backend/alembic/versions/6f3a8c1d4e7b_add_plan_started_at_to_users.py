"""add plan_started_at to users

Revision ID: 6f3a8c1d4e7b
Revises: 4c7d2b8e9f1a
Create Date: 2026-08-05 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f3a8c1d4e7b'
down_revision: Union[str, None] = '4c7d2b8e9f1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan_started_at', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'plan_started_at')
