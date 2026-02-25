from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.words import WordCheckRequest, WordCheckResponse
from services import dictionary
from logic import game

router = APIRouter(prefix="/words", tags=["words"])

@router.post("/check", response_model=WordCheckResponse)
async def check_word(payload: WordCheckRequest, db: Session = Depends(get_db)):
    word = payload.word.strip().lower()
    seq = payload.sequence.strip().lower()

    # 1. Does it follow the license plate sequence?
    if not game.verify_word_against_sequence(word, seq):
        return {
            "is_valid": False, 
            "is_common": True, 
            "message": f"Word must contain {seq.upper()} in order."
        }
    
    # 2. Is it a real word in our dictionary?
    if not dictionary.validate_word(db, word):
        return {
            "is_valid": False, 
            "is_common": False, 
            "message": "That's not in our dictionary!"
        }

    return {
        "is_valid": True, 
        "is_common": True, 
        "message": "Nice one!"
    }