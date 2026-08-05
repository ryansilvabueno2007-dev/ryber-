"""add name to users

Revision ID: 5d8a2f0e9c1b
Revises: 7c2e4b8f1a3d
Create Date: 2026-08-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d8a2f0e9c1b'
down_revision: Union[str, None] = '7c2e4b8f1a3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('name', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'name')
