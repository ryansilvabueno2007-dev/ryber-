"""change plan_started_at to datetime for precision

Revision ID: 2b5e9f3a7c1d
Revises: 6f3a8c1d4e7b
Create Date: 2026-08-05 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b5e9f3a7c1d'
down_revision: Union[str, None] = '6f3a8c1d4e7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column(
            'plan_started_at',
            existing_type=sa.Date(),
            type_=sa.DateTime(timezone=True),
            existing_nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column(
            'plan_started_at',
            existing_type=sa.DateTime(timezone=True),
            type_=sa.Date(),
            existing_nullable=True,
        )
