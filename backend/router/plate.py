from fastapi import APIRouter
from datetime import datetime
import random
from services import dictionary
from schemas.plate import PlateChallenge

router = APIRouter(prefix="/plate", tags=["plate"])

@router.get("/daily", response_model=PlateChallenge)
async def get_daily_plate():
    # Use the date as a 'seed' so every user gets the same letters today
    today_str = datetime.now().strftime("%Y-%m-%d")
    random.seed(today_str)
    
    letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
    solutions = dictionary.find_matches_for_sequence(letters)
    
    return {
        "sequence": letters,
        "total_count": len(solutions)
    }

@router.get("/random", response_model=PlateChallenge)
async def get_random_plate():
    # No seed here, so it's different every time you hit refresh
    letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
    solutions = dictionary.find_matches_for_sequence(letters)
    
    return {
        "sequence": letters,
        "total_count": len(solutions)
    }