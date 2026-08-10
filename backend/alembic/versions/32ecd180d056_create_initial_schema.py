"""create initial schema

Revision ID: 32ecd180d056
Revises: 
Create Date: 2026-08-10 16:07:58.588684

"""
import json
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '32ecd180d056'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # Create and populate dictionary table if it doesn't exist yet
    if 'dictionary' not in existing_tables:
        dictionary_table = op.create_table(
            'dictionary',
            sa.Column('word', sa.String(), nullable=False),
            sa.PrimaryKeyConstraint('word')
        )

        # Locate words_dictionary.json relative to the backend root directory
        json_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "words_dictionary.json")
        )

        if os.path.exists(json_path):
            with open(json_path, "r") as f:
                data = json.load(f)
                all_words = [{"word": w.lower().strip()} for w in data.keys()]

            # Insert in chunks to avoid memory spikes
            chunk_size = 10000
            for i in range(0, len(all_words), chunk_size):
                batch = all_words[i : i + chunk_size]
                op.bulk_insert(dictionary_table, batch)

    op.create_table('daily_user_summaries',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('points_earned', sa.Integer(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('user_id', 'date')
    )
    
    op.create_table('point_transactions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('word', sa.String(length=100), nullable=True),
        sa.Column('puzzle_date', sa.Date(), nullable=False),  # <--- Added
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_point_transactions_user_id'), 'point_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_point_transactions_puzzle_date'), 'point_transactions', ['puzzle_date'], unique=False)
    op.create_index('ix_point_transactions_puzzle_date_user', 'point_transactions', ['puzzle_date', 'user_id'], unique=False)

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_point_transactions_user_id'), table_name='point_transactions')
    op.drop_index(op.f('ix_point_transactions_puzzle_date'), table_name='point_transactions')
    op.drop_index('ix_point_transactions_puzzle_date_user', table_name='point_transactions')
    op.drop_table('point_transactions')
    op.drop_table('daily_user_summaries')
    op.drop_table('dictionary')