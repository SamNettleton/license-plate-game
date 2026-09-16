from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db.models import DailyUserSummary

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/daily")
async def get_daily_stats(
    date: str | None = None,
    user_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    today = datetime.now(timezone.utc).date()

    if date is None:
        parsed_date = today
    else:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPException(
                status_code=400, detail="Date must be in YYYY-MM-DD format."
            ) from exc

    # Condition for global stats: must be on the target date and have active live play
    active_live_condition = (
        DailyUserSummary.date == parsed_date
    ) & (
        (DailyUserSummary.points_earned > 0) |
        (func.cardinality(DailyUserSummary.words_found) > 0)
    )

    # Unnest live words for global word length metrics across active live users only
    words_cte = (
        select(
            DailyUserSummary.user_id,
            DailyUserSummary.points_earned,
            func.unnest(DailyUserSummary.words_found).label("word"),
        )
        .where(active_live_condition)
        .cte("daily_words")
    )

    cte_word_len = func.length(words_cte.c.word)

    # Subqueries for average points and word counts per active live player
    global_user_avg_points = (
        select(func.coalesce(func.avg(DailyUserSummary.points_earned), 0))
        .where(active_live_condition)
        .scalar_subquery()
    )

    global_user_avg_words = (
        select(
            func.coalesce(
                func.avg(func.cardinality(DailyUserSummary.words_found)), 0
            )
        )
        .where(active_live_condition)
        .scalar_subquery()
    )

    global_query = select(
        func.coalesce(func.avg(cte_word_len), 0).label("avg_word_length"),
        func.coalesce(func.min(cte_word_len), 0).label("min_word_length"),
        func.coalesce(func.max(cte_word_len), 0).label("max_word_length"),
        global_user_avg_points.label("total_points"),
        global_user_avg_words.label("words_found_count"),
    )

    global_stats_row = (await db.execute(global_query)).mappings().one_or_none()

    # Compute individual user stats combining both live and archive metrics for personal view
    user_specific_row = None
    if user_id:
        user_summary = (
            await db.execute(
                select(DailyUserSummary).where(
                    DailyUserSummary.date == parsed_date,
                    DailyUserSummary.user_id == user_id,
                )
            )
        ).scalar_one_or_none()

        if user_summary:
            combined_words = list(
                dict.fromkeys(user_summary.words_found + user_summary.archive_words_found)
            )
            total_points = user_summary.points_earned + user_summary.archive_points_earned

            if combined_words or total_points > 0:
                word_lengths = [len(w) for w in combined_words] if combined_words else [0]
                user_specific_row = {
                    "avg_word_length": sum(word_lengths) / len(word_lengths) if combined_words else 0.0,
                    "min_word_length": min(word_lengths) if combined_words else 0,
                    "max_word_length": max(word_lengths) if combined_words else 0,
                    "total_points": total_points,
                    "words_found_count": len(combined_words),
                }

    def format_stats_payload(row):
        if not row or row["words_found_count"] is None or float(row["words_found_count"]) == 0:
            return {
                "avg_word_length": 0.0,
                "min_word_length": 0,
                "max_word_length": 0,
                "total_points": 0,
                "words_found_count": 0,
            }

        return {
            "avg_word_length": round(float(row["avg_word_length"] or 0), 2),
            "min_word_length": int(row["min_word_length"] or 0),
            "max_word_length": int(row["max_word_length"] or 0),
            "total_points": round(float(row["total_points"] or 0), 1),
            "words_found_count": round(float(row["words_found_count"] or 0), 1),
        }

    return {
        "date": parsed_date.isoformat(),
        "global_stats": format_stats_payload(global_stats_row),
        "user_stats": format_stats_payload(user_specific_row) if user_id else None,
    }