"""add monthly budget to outcome categories

Revision ID: d4c91b0b8f21
Revises: cab3c1a5e2d0
Create Date: 2026-08-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4c91b0b8f21"
down_revision: Union[str, Sequence[str], None] = "cab3c1a5e2d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("category", sa.Column("budget_amount", sa.Float(), nullable=True))
    op.add_column(
        "category",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.alter_column("category", "created_at", nullable=False, server_default=None)


def downgrade() -> None:
    op.drop_column("category", "created_at")
    op.drop_column("category", "budget_amount")
