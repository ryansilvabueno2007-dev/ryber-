"""add optimizations table

Revision ID: 9a1c4f5e2b7d
Revises: 6e58189d031e
Create Date: 2026-08-04 14:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a1c4f5e2b7d'
down_revision: Union[str, None] = '6e58189d031e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'optimizations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('analysis_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('objective', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('video_key', sa.String(), nullable=True),
        sa.Column('error', sa.String(), nullable=True),
        sa.Column('runway_task_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('optimizations')
