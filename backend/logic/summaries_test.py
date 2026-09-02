from datetime import date
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from logic.summaries import build_daily_summaries


async def seed_users(db: AsyncSession, user_ids: list[str]):
    """Helper to satisfy Foreign Key constraints on point_transactions."""
    for uid in user_ids:
        await db.execute(
            text("""
                INSERT INTO users (id, display_name)
                VALUES (:id, :name)
                ON CONFLICT (id) DO NOTHING;
            """),
            {"id": uid, "name": f"Test {uid}"}
        )
    await db.commit()


@pytest.mark.asyncio
async def test_build_daily_summaries_single_date(db: AsyncSession):
    await seed_users(db, ["user-1", "user-2"])
    target_date = date(2026, 8, 13)
    
    await db.execute(
        text("""
            INSERT INTO point_transactions (user_id, puzzle_date, points, word)
            VALUES 
                ('user-1', :p_date, 10, 'apple'),
                ('user-1', :p_date, 15, 'banana'),
                ('user-2', :p_date, 5, 'cherry');
        """),
        {"p_date": target_date}
    )
    await db.commit()

    rows_affected = await build_daily_summaries(db, target_date=target_date)
    assert rows_affected == 2

    # Assert user-1 summary
    res_user1 = await db.execute(
        text("SELECT points_earned, words_found FROM daily_user_summaries WHERE user_id = 'user-1' AND date = :p_date"),
        {"p_date": target_date}
    )
    row1 = res_user1.fetchone()
    assert row1 is not None
    assert row1.points_earned == 25
    assert sorted(row1.words_found) == ['apple', 'banana']


@pytest.mark.asyncio
async def test_build_daily_summaries_upsert_on_conflict(db: AsyncSession):
    await seed_users(db, ["user-1"])
    p_date = date(2026, 8, 13)

    await db.execute(
        text("INSERT INTO point_transactions (user_id, puzzle_date, points, word) VALUES ('user-1', :p_date, 10, 'first')"),
        {"p_date": p_date}
    )
    await db.commit()
    await build_daily_summaries(db, target_date=p_date)

    # Submit second word
    await db.execute(
        text("INSERT INTO point_transactions (user_id, puzzle_date, points, word) VALUES ('user-1', :p_date, 20, 'second')"),
        {"p_date": p_date}
    )
    await db.commit()

    await build_daily_summaries(db, target_date=p_date)

    res = await db.execute(
        text("SELECT points_earned, words_found FROM daily_user_summaries WHERE user_id = 'user-1' AND date = :p_date"),
        {"p_date": p_date}
    )
    row = res.fetchone()
    assert row.points_earned == 30
    assert sorted(row.words_found) == ['first', 'second']


@pytest.mark.asyncio
async def test_build_daily_summaries_merges_with_direct_writes(db: AsyncSession):
    """Verifies worker does NOT overwrite direct summary writes from updated clients."""
    await seed_users(db, ["user-1"])
    p_date = date(2026, 8, 13)

    # Direct write from new client route (e.g. 13 points for 'leapfrog')
    await db.execute(
        text("""
            INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found)
            VALUES ('user-1', :p_date, 13, ARRAY['leapfrog']);
        """),
        {"p_date": p_date}
    )
    await db.commit()

    # Legacy transaction write from older client (e.g. 10 points for 'apple')
    await db.execute(
        text("INSERT INTO point_transactions (user_id, puzzle_date, points, word) VALUES ('user-1', :p_date, 10, 'apple')"),
        {"p_date": p_date}
    )
    await db.commit()

    await build_daily_summaries(db, target_date=p_date)

    res = await db.execute(
        text("SELECT points_earned, words_found FROM daily_user_summaries WHERE user_id = 'user-1' AND date = :p_date"),
        {"p_date": p_date}
    )
    row = res.fetchone()

    # Should take the higher points and merge words without duplicates
    assert row.points_earned == 23
    assert sorted(row.words_found) == ['apple', 'leapfrog']


@pytest.mark.asyncio
async def test_build_daily_summaries_null_target_date_syncs_all(db: AsyncSession):
    await seed_users(db, ["user-1"])
    date1 = date(2026, 5, 10)
    date2 = date(2026, 8, 13)

    await db.execute(
        text("""
            INSERT INTO point_transactions (user_id, puzzle_date, points, word)
            VALUES 
                ('user-1', :d1, 12, 'archive'),
                ('user-1', :d2, 8, 'today');
        """),
        {"d1": date1, "d2": date2}
    )
    await db.commit()

    rows_affected = await build_daily_summaries(db, target_date=None)
    assert rows_affected == 2

    res = await db.execute(text("SELECT COUNT(*) FROM daily_user_summaries WHERE user_id = 'user-1'"))
    assert res.scalar() == 2


@pytest.mark.asyncio
async def test_build_daily_summaries_no_transactions(db: AsyncSession):
    rows_affected = await build_daily_summaries(db, target_date=date(2026, 8, 13))
    assert rows_affected == 0