from datetime import date
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from worker import run_summary_aggregation
from logic.summaries_test import seed_users


@pytest.mark.asyncio
async def test_run_summary_aggregation_picks_up_recent_activity(db: AsyncSession):
    """
    Tests that run_summary_aggregation successfully finds transactions created
    recently and aggregates them into daily_user_summaries.
    """
    await seed_users(db, ["worker-user-1"])
    puzzle_d = date(2026, 5, 15)

    # Insert transaction with created_at = NOW() inside the test session
    await db.execute(
        text("""
            INSERT INTO point_transactions (user_id, puzzle_date, points, word, created_at)
            VALUES ('worker-user-1', :p_date, 42, 'scheduler', NOW())
        """),
        {"p_date": puzzle_d}
    )
    await db.commit()

    # Pass the test session directly to the worker function
    await run_summary_aggregation(db)

    # Assert summary row was generated
    res = await db.execute(
        text("SELECT points_earned, words_found FROM daily_user_summaries WHERE user_id = 'worker-user-1' AND date = :p_date"),
        {"p_date": puzzle_d}
    )
    row = res.fetchone()
    assert row is not None
    assert row.points_earned == 42
    assert row.words_found == ['scheduler']