from fastapi import APIRouter
from schemas.words import WordCheckRequest, WordCheckResponse
from services import dictionary

router = APIRouter(prefix="/words", tags=["words"])

@router.post("/check", response_model=WordCheckResponse)
async def check_word(payload: WordCheckRequest):
    word = payload.word.strip().lower()
    seq = payload.sequence.strip().lower()

    # 1. Is it a real word in our dictionary?
    if not dictionary.validate_word(word):
        return {
            "is_valid": False, 
            "is_common": False, 
            "message": "That's not in our dictionary!"
        }

    # 2. Does it follow the license plate sequence?
    if not dictionary.verify_word_against_sequence(word, seq):
        return {
            "is_valid": False, 
            "is_common": True, 
            "message": f"Word must contain {seq.upper()} in order."
        }

    return {
        "is_valid": True, 
        "is_common": True, 
        "message": "Nice one!"
    }