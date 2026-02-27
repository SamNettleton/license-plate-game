from fastapi import APIRouter
from datetime import datetime, timezone
from random import Random
from schemas.plate import PlateChallenge
from logic import game
import hashlib

router = APIRouter(prefix="/plate", tags=["plate"])

@router.get("/daily", response_model=PlateChallenge)
async def get_daily_plate(date: str = None):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Create the stable seed
    seed_value = int(hashlib.sha256(date.encode()).hexdigest(), 16) % (10**8)
    
    # Create a LOCAL instance of the random generator
    local_rng = Random(seed_value)
    
    # Pass this instance into your generator
    # No more random.seed() or random.seed(None) required!
    letters, count, goal_points = game.generate_valid_plate(rng=local_rng)
    
    return {
        "sequence": letters,
        "total_count": count,
        "goal_points": goal_points,
    }

@router.get("/random", response_model=PlateChallenge)
async def get_random_plate():
    letters, count, goal_points = game.generate_valid_plate()
    
    return {
        "sequence": letters,
        "total_count": count,
        "goal_points": goal_points,
    }