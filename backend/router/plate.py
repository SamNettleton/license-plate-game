from fastapi import APIRouter
from datetime import datetime
import random
from schemas.plate import PlateChallenge
from logic import game

router = APIRouter(prefix="/plate", tags=["plate"])

@router.get("/daily", response_model=PlateChallenge)
async def get_daily_plate():
    # Set the seed ONCE at the start of the daily request
    today_str = datetime.now().strftime("%Y-%m-%d")
    random.seed(today_str)
    
    letters, count = game.generate_valid_plate()
    
    # Reset seed to None so subsequent 'random' calls aren't affected
    random.seed(None)
    
    return {
        "sequence": letters,
        "total_count": count
    }

@router.get("/random", response_model=PlateChallenge)
async def get_random_plate():
    letters, count = game.generate_valid_plate()
    
    return {
        "sequence": letters,
        "total_count": count
    }