from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, cast, literal_column
from sqlalchemy.dialects.postgresql import insert, JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.metrics import GUESSES_COUNTER
from database import get_db
from db.models import DailyUserSummary
from logic import game
from schemas.words import WordCheckRequest, WordCheckResponse, TierTimesUpdateRequest
from services import dictionary

router = APIRouter(prefix="/words", tags=["words"])


@router.post("/check", response_model=WordCheckResponse)
async def check_word(payload: WordCheckRequest, db: AsyncSession = Depends(get_db)):
    word = payload.word.strip().lower()
    seq = payload.sequence.strip().lower()

    if not game.verify_word_against_sequence(word, seq):
        GUESSES_COUNTER.labels(status="invalid_sequence", app_name="license-plate-backend").inc()
        return {
            "is_valid": False, 
            "message": f"Word must contain {seq.upper()} in order."
        }
    
    is_valid_word = await dictionary.validate_word(db, word)
    if not is_valid_word:
        GUESSES_COUNTER.labels(status="invalid_word", app_name="license-plate-backend").inc()
        return {
            "is_valid": False, 
            "message": "That's not in our dictionary!"
        }

    # Parse puzzle_date into a python date object
    puzzle_date_obj: date | None = None
    if payload.puzzle_date:
        if isinstance(payload.puzzle_date, date):
            puzzle_date_obj = payload.puzzle_date
        elif isinstance(payload.puzzle_date, str):
            puzzle_date_obj = date.fromisoformat(payload.puzzle_date)

    # Cross-device duplicate check against daily summary
    if puzzle_date_obj and payload.user_id:
        existing_words = (
            await db.execute(
                select(DailyUserSummary.words_found).where(
                    DailyUserSummary.user_id == payload.user_id,
                    DailyUserSummary.date == puzzle_date_obj,
                )
            )
        ).scalar_one_or_none()

        if existing_words and word in existing_words:
            GUESSES_COUNTER.labels(status="already_found", app_name="license-plate-backend").inc()
            return {
                "is_valid": False,
                "message": "Already found!",
                "points": 0
            }

    points = game.calculate_points_for_word(word)
    GUESSES_COUNTER.labels(status="valid", app_name="license-plate-backend").inc()

    if puzzle_date_obj and payload.user_id:
        elapsed_sec = payload.elapsed_seconds or 0
        stmt = (
            insert(DailyUserSummary)
            .values(
                user_id=payload.user_id,
                date=puzzle_date_obj,
                points_earned=points,
                words_found=[word],
                elapsed_seconds=elapsed_sec,
            )
            .on_conflict_do_update(
                index_elements=["user_id", "date"],
                set_={
                    "points_earned": DailyUserSummary.points_earned + points,
                    "words_found": func.array_append(DailyUserSummary.words_found, word),
                    "elapsed_seconds": func.greatest(
                        func.coalesce(DailyUserSummary.elapsed_seconds, 0),
                        elapsed_sec,
                    ),
                },
            )
        )
        await db.execute(stmt)
        await db.commit()

    return {
        "is_valid": True,  
        "message": f"Nice one! +{points}",
        "points": points
    }

@router.post("/tier-times")
async def update_tier_times(
    payload: TierTimesUpdateRequest, db: AsyncSession = Depends(get_db)
):
    puzzle_date_obj = date.fromisoformat(payload.puzzle_date)

    stmt = (
        insert(DailyUserSummary)
        .values(
            user_id=payload.user_id,
            date=puzzle_date_obj,
            tier_times=payload.tier_times,
        )
        .on_conflict_do_update(
            index_elements=["user_id", "date"],
            set_={
                "tier_times": func.coalesce(
                    DailyUserSummary.tier_times, literal_column("'{}'::jsonb")
                ).op("||")(cast(payload.tier_times, JSONB)),
            },
        )
    )
    await db.execute(stmt)
    await db.commit()
    return {"status": "success"}