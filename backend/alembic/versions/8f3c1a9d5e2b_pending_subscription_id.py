"""replace pending_cancel_subscription_id with pending_subscription_id

Revision ID: 8f3c1a9d5e2b
Revises: 7b1d4f9a2e6c
Create Date: 2026-08-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f3c1a9d5e2b'
down_revision: Union[str, None] = '7b1d4f9a2e6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('pending_subscription_id', sa.String(), nullable=True))
    op.drop_column('users', 'pending_cancel_subscription_id')


def downgrade() -> None:
    op.add_column('users', sa.Column('pending_cancel_subscription_id', sa.String(), nullable=True))
    op.drop_column('users', 'pending_subscription_id')
