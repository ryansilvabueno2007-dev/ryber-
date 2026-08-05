"""add plan_renews_at to users

Revision ID: 8e1c6a4f2d9b
Revises: 5d8a2f0e9c1b
Create Date: 2026-08-05 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e1c6a4f2d9b'
down_revision: Union[str, None] = '5d8a2f0e9c1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan_renews_at', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'plan_renews_at')
