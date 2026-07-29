"""add type for category

Revision ID: 3bffc0d49c7a
Revises: cba4bc69f926
Create Date: 2026-07-19 12:42:12.031849

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "3bffc0d49c7a"
down_revision: Union[str, Sequence[str], None] = "cba4bc69f926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


category_type = postgresql.ENUM(
    "INCOME",
    "OUTCOME",
    name="categorytype",
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""

    # Crée le type ENUM PostgreSQL s'il n'existe pas
    category_type.create(op.get_bind(), checkfirst=True)

    # Ajoute la colonne
    op.add_column(
        "category",
        sa.Column(
            "type",
            category_type,
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("category", "type")

    # Supprime le type ENUM s'il n'est plus utilisé
    category_type.drop(op.get_bind(), checkfirst=True)