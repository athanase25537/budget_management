"""uptage user table 

Revision ID: cba4bc69f926
Revises: 896caec8dc5e
Create Date: 2026-06-18 12:15:28.803793

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cba4bc69f926'
down_revision: Union[str, Sequence[str], None] = '896caec8dc5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Rename table instead of dropping it
    op.rename_table('user', 'user_table')

    # 2. Drop old foreign keys
    op.drop_constraint('category_user_id_fkey', 'category', type_='foreignkey')
    op.drop_constraint('setting_user_id_fkey', 'setting', type_='foreignkey')
    op.drop_constraint('transaction_user_id_fkey', 'transaction', type_='foreignkey')

    # 3. Recreate foreign keys to new table name
    op.create_foreign_key(
        'category_user_id_fkey',
        'category', 'user_table',
        ['user_id'], ['id']
    )

    op.create_foreign_key(
        'setting_user_id_fkey',
        'setting', 'user_table',
        ['user_id'], ['id']
    )

    op.create_foreign_key(
        'transaction_user_id_fkey',
        'transaction', 'user_table',
        ['user_id'], ['id']
    )

def downgrade() -> None:
    """Downgrade schema."""

    # drop new constraints
    op.drop_constraint('category_user_id_fkey', 'category', type_='foreignkey')
    op.drop_constraint('setting_user_id_fkey', 'setting', type_='foreignkey')
    op.drop_constraint('transaction_user_id_fkey', 'transaction', type_='foreignkey')

    # rename back
    op.rename_table('user_table', 'user')

    # restore FK
    op.create_foreign_key('category_user_id_fkey', 'category', 'user', ['user_id'], ['id'])
    op.create_foreign_key('setting_user_id_fkey', 'setting', 'user', ['user_id'], ['id'])
    op.create_foreign_key('transaction_user_id_fkey', 'transaction', 'user', ['user_id'], ['id'])
