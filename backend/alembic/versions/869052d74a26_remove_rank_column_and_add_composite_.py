"""remove rank column and add composite date points index

Revision ID: 869052d74a26
Revises: 13300239a8eb
Create Date: 2026-08-18 13:18:52.962190

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '869052d74a26'
down_revision: Union[str, Sequence[str], None] = '13300239a8eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        'ix_daily_summaries_date_points',
        'daily_user_summaries',
        ['date', 'points_earned'],
        unique=False
    )
    op.drop_column('daily_user_summaries', 'rank')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('daily_user_summaries', sa.Column('rank', sa.INTEGER(), autoincrement=False, nullable=True))
    op.drop_index('ix_daily_summaries_date_points', table_name='daily_user_summaries')