from pydantic import BaseModel
from typing import List, Optional

class PlateChallenge(BaseModel):
    # The 3-letter prompt (e.g., "WTR")
    sequence: str
    
    # Helpful for showing "0 of 42 words found" in the UI
    total_count: int

    # used for showing goal number of points for progress bar in the UI
    goal_points: int
    
    # Optional: You could add a 'date' field for the Daily challenge
    date: Optional[str] = None