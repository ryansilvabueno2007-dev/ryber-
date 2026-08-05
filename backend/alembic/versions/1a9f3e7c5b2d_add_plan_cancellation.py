"""add plan cancellation fields and feedback table

Revision ID: 1a9f3e7c5b2d
Revises: 8e1c6a4f2d9b
Create Date: 2026-08-05 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a9f3e7c5b2d'
down_revision: Union[str, None] = '8e1c6a4f2d9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan_canceled', sa.Boolean(), nullable=False, server_default=sa.false()))

    op.create_table(
        'cancellation_feedback',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), nullable=True),
        sa.Column('experience', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('cancellation_feedback')
    op.drop_column('users', 'plan_canceled')
