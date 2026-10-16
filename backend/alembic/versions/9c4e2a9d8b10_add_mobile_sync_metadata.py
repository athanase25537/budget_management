"""add mobile sync metadata

Revision ID: 9c4e2a9d8b10
Revises: a7d3e6f1b928
Create Date: 2026-10-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c4e2a9d8b10"
down_revision: Union[str, Sequence[str], None] = "a7d3e6f1b928"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("category", "transaction"):
        op.add_column(table, sa.Column("client_id", sa.String(length=36), nullable=True))
        op.add_column(table, sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
        op.create_index(f"ix_{table}_client_id", table, ["client_id"], unique=True)
    op.execute("UPDATE category SET updated_at = created_at WHERE updated_at IS NULL")
    op.execute("UPDATE transaction SET updated_at = COALESCE(date, CURRENT_TIMESTAMP) WHERE updated_at IS NULL")


def downgrade() -> None:
    for table in ("transaction", "category"):
        op.drop_index(f"ix_{table}_client_id", table_name=table)
        op.drop_column(table, "updated_at")
        op.drop_column(table, "client_id")
