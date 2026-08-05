"""replace stripe fields with asaas fields on users

Revision ID: 7c2e4b8f1a3d
Revises: 3f7b9d1a6c4e
Create Date: 2026-08-05 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2e4b8f1a3d'
down_revision: Union[str, None] = '3f7b9d1a6c4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('cpf_cnpj', sa.String(), nullable=True))
    op.add_column('users', sa.Column('asaas_customer_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('asaas_subscription_id', sa.String(), nullable=True))
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('stripe_customer_id')


def downgrade() -> None:
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(), nullable=True))
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('asaas_subscription_id')
        batch_op.drop_column('asaas_customer_id')
        batch_op.drop_column('cpf_cnpj')
