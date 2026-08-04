"""add report_json to optimizations

Revision ID: 3f7b9d1a6c4e
Revises: 9a1c4f5e2b7d
Create Date: 2026-08-04 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f7b9d1a6c4e'
down_revision: Union[str, None] = '9a1c4f5e2b7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('optimizations', sa.Column('report_json', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('optimizations', 'report_json')
