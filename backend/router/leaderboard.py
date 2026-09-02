from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db.models import DailyUserSummary, User

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

    words_count_expr = func.coalesce(
        func.cardinality(DailyUserSummary.words_found), 0
    )

    base_query = (
        select(
            User.display_name.label("display_name"),
            DailyUserSummary.user_id.label("user_id"),
            DailyUserSummary.points_earned.label("points_earned"),
            words_count_expr.label("words_found_count"),
            func.row_number()
            .over(
                order_by=(
                    DailyUserSummary.points_earned.desc(),
                    words_count_expr.desc(),
                    User.display_name.asc(),
                )
            )
            .label("overall_rank"),
        )
        .join(User, User.id == DailyUserSummary.user_id)
        .where(DailyUserSummary.date == parsed_date)
    ).subquery()

    top_entries_query = (
        select(base_query)
        .order_by(base_query.c.overall_rank)
        .limit(limit)
    )
    top_rows = (await db.execute(top_entries_query)).mappings().all()

    entries = []
    user_in_top_list = False

    for row in top_rows:
        current_user_id = str(row["user_id"])
        is_me = bool(user_id and current_user_id == user_id)
        if is_me:
            user_in_top_list = True

        entries.append(
            {
                "rank": int(row["overall_rank"]),
                "name": row["display_name"] or "Anonymous Traveler",
                "user_id": current_user_id,
                "score": int(row["points_earned"]),
                "words_found_count": int(row["words_found_count"]),
                "is_current_user": is_me,
            }
        )

    current_user = None
    if user_id and not user_in_top_list:
        user_rank_query = select(base_query).where(base_query.c.user_id == user_id)
        user_row = (await db.execute(user_rank_query)).mappings().one_or_none()

        if user_row:
            current_user = {
                "rank": int(user_row["overall_rank"]),
                "name": user_row["display_name"] or "Anonymous Traveler",
                "user_id": str(user_row["user_id"]),
                "score": int(user_row["points_earned"]),
                "words_found_count": int(user_row["words_found_count"]),
                "is_current_user": True,
            }

    return {
        "date": parsed_date.isoformat(),
        "entries": entries,
        "current_user": current_user,
    }