from fastapi import APIRouter, Depends
from database import get_db
from schemas.words import WordCheckRequest, WordCheckResponse
from services import dictionary
from logic import game
from sqlalchemy.ext.asyncio import AsyncSession
from app.metrics import GUESSES_COUNTER, DB_QUERY_TIME

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

    points = game.calculate_points_for_word(word)
    GUESSES_COUNTER.labels(status="valid", app_name="license-plate-backend").inc()
    return {
        "is_valid": True,  
        "message": f"Nice one! +{points}",
        "points": points
    }