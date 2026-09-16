from calendar import monthrange
from datetime import date
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import DailyPlate, DailyUserSummary

async def get_user_monthly_summaries(
    db: AsyncSession, 
    user_id: str, 
    year: int, 
    month: int
) -> List[Dict[str, Any]]:
    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    stmt = (
        select(DailyPlate, DailyUserSummary)
        .outerjoin(
            DailyUserSummary,
            (DailyPlate.date == DailyUserSummary.date) & (DailyUserSummary.user_id == user_id)
        )
        .where(
            DailyPlate.date >= start_date,
            DailyPlate.date <= end_date,
        )
        .order_by(DailyPlate.date.asc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    combined_summaries = []
    for plate, summary in rows:
        if summary:
            live_words = summary.words_found or []
            archive_words = summary.archive_words_found or []
            combined_words = list(dict.fromkeys(live_words + archive_words))
            points_earned = (summary.points_earned or 0) + (summary.archive_points_earned or 0)
            elapsed_seconds = summary.elapsed_seconds or 0
            tier_times = summary.tier_times or {}
        else:
            combined_words = []
            points_earned = 0
            elapsed_seconds = 0
            tier_times = {}

        combined_summaries.append({
            "date": plate.date,
            "sequence": plate.sequence,
            "goal_points": plate.goal_points,
            "points_earned": points_earned,
            "words_found": combined_words,
            "elapsed_seconds": elapsed_seconds,
            "tier_times": tier_times,
        })

    return combined_summaries