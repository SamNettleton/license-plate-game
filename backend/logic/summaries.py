from datetime import date
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def build_daily_summaries(db: AsyncSession, target_date: date | None = None) -> int:
    """
    Aggregates point transactions into daily user summaries.
    Merges legacy transaction data with direct summary writes without duplicates.
    """
    query = text("""
        WITH aggregated AS (
            SELECT 
                user_id,
                puzzle_date AS date,
                SUM(points) AS points_earned,
                array_agg(word ORDER BY id) AS words_found
            FROM point_transactions
            WHERE (CAST(:target_date AS DATE) IS NULL OR puzzle_date = CAST(:target_date AS DATE))
            GROUP BY user_id, puzzle_date
        )
        INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found)
        SELECT user_id, date, points_earned, words_found FROM aggregated
        ON CONFLICT (user_id, date) DO UPDATE SET
            words_found = (
                SELECT array_agg(DISTINCT w)
                FROM unnest(daily_user_summaries.words_found || EXCLUDED.words_found) AS w
            ),
            points_earned = daily_user_summaries.points_earned + COALESCE((
                SELECT SUM(pt.points)
                FROM point_transactions pt
                WHERE pt.user_id = EXCLUDED.user_id 
                  AND pt.puzzle_date = EXCLUDED.date
                  AND NOT (pt.word = ANY(daily_user_summaries.words_found))
            ), 0);
    """)
    
    result = await db.execute(query, {"target_date": target_date})
    await db.commit()
    return result.rowcount