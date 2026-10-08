"""use decimal for money

Revision ID: e4f7a9c2d6b1
Revises: d4c91b0b8f21
Create Date: 2026-10-08
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4f7a9c2d6b1"
down_revision: Union[str, Sequence[str], None] = "d4c91b0b8f21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    money = sa.Numeric(precision=14, scale=2)
    op.alter_column(
        "user_table",
        "solde",
        existing_type=sa.Float(),
        type_=money,
        existing_nullable=False,
        postgresql_using="solde::numeric(14, 2)",
    )
    op.alter_column(
        "transaction",
        "amount",
        existing_type=sa.Float(),
        type_=money,
        existing_nullable=False,
        postgresql_using="amount::numeric(14, 2)",
    )
    op.alter_column(
        "category",
        "budget_amount",
        existing_type=sa.Float(),
        type_=money,
        existing_nullable=True,
        postgresql_using="budget_amount::numeric(14, 2)",
    )


def downgrade() -> None:
    op.alter_column(
        "category",
        "budget_amount",
        existing_type=sa.Numeric(precision=14, scale=2),
        type_=sa.Float(),
        existing_nullable=True,
        postgresql_using="budget_amount::double precision",
    )
    op.alter_column(
        "transaction",
        "amount",
        existing_type=sa.Numeric(precision=14, scale=2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="amount::double precision",
    )
    op.alter_column(
        "user_table",
        "solde",
        existing_type=sa.Numeric(precision=14, scale=2),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using="solde::double precision",
    )
