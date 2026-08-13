from datetime import date
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def build_daily_summaries(db: AsyncSession, target_date: date | None = None) -> int:
    """
    Aggregates point transactions into daily user summaries.
    - If target_date is provided, aggregates only for that specific puzzle date.
    - If target_date is None, aggregates across all historical dates.
    """
    query = text("""
        INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found)
        SELECT 
            user_id,
            puzzle_date AS date,
            SUM(points) AS points_earned,
            array_agg(word ORDER BY id) AS words_found
        FROM point_transactions
        WHERE (CAST(:target_date AS DATE) IS NULL OR puzzle_date = CAST(:target_date AS DATE))
        GROUP BY user_id, puzzle_date
        ON CONFLICT (user_id, date) DO UPDATE SET
            points_earned = EXCLUDED.points_earned,
            words_found = EXCLUDED.words_found;
    """)
    
    result = await db.execute(query, {"target_date": target_date})
    await db.commit()
    return result.rowcount