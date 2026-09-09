from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
from random import Random
from schemas.plate import PlateChallenge
from logic import game
from database import get_db
from db.models import DailyUserSummary
import hashlib

router = APIRouter(prefix="/plate", tags=["plate"])

@router.get("/daily", response_model=PlateChallenge)
async def get_daily_plate(
    date: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    parsed_date = datetime.strptime(date, "%Y-%m-%d").date()

    seed_value = int(hashlib.sha256(date.encode()).hexdigest(), 16) % (10**8)
    local_rng = Random(seed_value)
    letters, count, goal_points = game.generate_valid_plate(rng=local_rng)

    words_found = []
    points_earned = 0
    elapsed_seconds = 0
    tier_times = {}

    if user_id:
        stmt = select(DailyUserSummary).where(
            DailyUserSummary.user_id == user_id,
            DailyUserSummary.date == parsed_date
        )
        result = await db.execute(stmt)
        summary = result.scalars().first()

        if summary:
            words_found = summary.words_found or []
            points_earned = summary.points_earned or 0
            elapsed_seconds = summary.elapsed_seconds or 0
            tier_times = summary.tier_times or {}

    return {
        "sequence": letters,
        "total_count": count,
        "goal_points": goal_points,
        "words_found": words_found,
        "points_earned": points_earned,
        "elapsed_seconds": elapsed_seconds,
        "tier_times": tier_times,
    }

# DEPRECATED: The random plate endpoint is no longer used in the game. 
# It has been commented out to avoid confusion, but may be used in the future if needed.

# @router.get("/random", response_model=PlateChallenge)
# async def get_random_plate():
#     letters, count, goal_points = game.generate_valid_plate()
    
#     return {
#         "sequence": letters,
#         "total_count": count,
#         "goal_points": goal_points,
#     }