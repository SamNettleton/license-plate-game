from pydantic import BaseModel
from typing import Dict, List

class PlateChallenge(BaseModel):
    sequence: str
    total_count: int
    goal_points: int
    words_found: List[str] = []
    points_earned: int = 0
    elapsed_seconds: int = 0
    tier_times: Dict[str, int] = {}