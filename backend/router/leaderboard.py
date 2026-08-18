from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db.models import DailyUserSummary, PointTransaction, User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/daily")
async def get_daily_leaderboard(
    date: str | None = None,
    user_id: str | None = None,
    limit: int = Query(10, ge=1, le=100),
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

    # Treat dates within the 48-hour rolling global window as live active queries
    is_live_window = parsed_date >= (today - timedelta(days=1))

    if is_live_window:
        # Live aggregation from PointTransaction using puzzle_date
        base_subquery = (
            select(
                User.display_name.label("display_name"),
                PointTransaction.user_id.label("user_id"),
                func.coalesce(func.sum(PointTransaction.points), 0).label(
                    "points_earned"
                ),
                func.count(PointTransaction.id).label("words_found_count"),
            )
            .join(User, User.id == PointTransaction.user_id)
            .where(PointTransaction.puzzle_date == parsed_date)
            .group_by(User.display_name, PointTransaction.user_id)
        ).subquery()
    else:
        # Query pre-aggregated daily_user_summaries for historical dates using cardinality for ARRAY(String)
        base_subquery = (
            select(
                User.display_name.label("display_name"),
                DailyUserSummary.user_id.label("user_id"),
                DailyUserSummary.points_earned.label("points_earned"),
                func.coalesce(
                    func.cardinality(DailyUserSummary.words_found), 0
                ).label("words_found_count"),
            )
            .join(User, User.id == DailyUserSummary.user_id)
            .where(DailyUserSummary.date == parsed_date)
        ).subquery()

    ordered_query = select(
        base_subquery.c.display_name,
        base_subquery.c.user_id,
        base_subquery.c.points_earned,
        base_subquery.c.words_found_count,
        func.row_number()
        .over(
            order_by=(
                base_subquery.c.points_earned.desc(),
                base_subquery.c.words_found_count.desc(),
                base_subquery.c.display_name.asc(),
            )
        )
        .label("overall_rank"),
    )

    rows = (await db.execute(ordered_query)).mappings().all()

    entries = []
    for row in rows[:limit]:
        display_name = row["display_name"] or "Anonymous Traveler"
        current_user_id = str(row["user_id"])
        entries.append(
            {
                "rank": int(row["overall_rank"]),
                "name": display_name,
                "user_id": current_user_id,
                "score": int(row["points_earned"]),
                "solved_words": int(row["words_found_count"]),
                "is_current_user": bool(user_id and current_user_id == user_id),
            }
        )

    current_user = None
    if user_id:
        current_user_row = next(
            (row for row in rows if str(row["user_id"]) == user_id), None
        )
        if (
            current_user_row is not None
            and int(current_user_row["overall_rank"]) > limit
        ):
            display_name = current_user_row["display_name"] or "Anonymous Traveler"
            current_user = {
                "rank": int(current_user_row["overall_rank"]),
                "name": display_name,
                "user_id": user_id,
                "score": int(current_user_row["points_earned"]),
                "solved_words": int(current_user_row["words_found_count"]),
                "is_current_user": True,
            }

    return {
        "date": parsed_date.isoformat(),
        "entries": entries,
        "current_user": current_user,
    }