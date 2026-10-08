"""cascade user deletion

Revision ID: f2c8b4d9a731
Revises: e4f7a9c2d6b1
Create Date: 2026-10-08
"""

from typing import Sequence, Union

from alembic import op


revision: str = "f2c8b4d9a731"
down_revision: Union[str, Sequence[str], None] = "e4f7a9c2d6b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("category_user_id_fkey", "category", type_="foreignkey")
    op.create_foreign_key(
        "category_user_id_fkey",
        "category",
        "user_table",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint("setting_user_id_fkey", "setting", type_="foreignkey")
    op.create_foreign_key(
        "setting_user_id_fkey",
        "setting",
        "user_table",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint("transaction_user_id_fkey", "transaction", type_="foreignkey")
    op.create_foreign_key(
        "transaction_user_id_fkey",
        "transaction",
        "user_table",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    for table_name, constraint_name in (
        ("transaction", "transaction_user_id_fkey"),
        ("setting", "setting_user_id_fkey"),
        ("category", "category_user_id_fkey"),
    ):
        op.drop_constraint(constraint_name, table_name, type_="foreignkey")

    op.create_foreign_key("category_user_id_fkey", "category", "user_table", ["user_id"], ["id"])
    op.create_foreign_key("setting_user_id_fkey", "setting", "user_table", ["user_id"], ["id"])
    op.create_foreign_key("transaction_user_id_fkey", "transaction", "user_table", ["user_id"], ["id"])
