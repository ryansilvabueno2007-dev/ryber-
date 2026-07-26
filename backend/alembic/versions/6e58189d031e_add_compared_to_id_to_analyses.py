"""add compared_to_id to analyses

Revision ID: 6e58189d031e
Revises: 2450cf6f398e
Create Date: 2026-07-26 18:14:45.645680

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e58189d031e'
down_revision: Union[str, None] = '2450cf6f398e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # batch mode: SQLite não suporta ALTER TABLE pra adicionar foreign key direto
    with op.batch_alter_table("analyses") as batch_op:
        batch_op.add_column(sa.Column("compared_to_id", sa.String(), nullable=True))
        batch_op.create_foreign_key(
            "fk_analyses_compared_to_id", "analyses", ["compared_to_id"], ["id"]
        )


def downgrade() -> None:
    with op.batch_alter_table("analyses") as batch_op:
        batch_op.drop_constraint("fk_analyses_compared_to_id", type_="foreignkey")
        batch_op.drop_column("compared_to_id")
