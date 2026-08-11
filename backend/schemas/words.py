from datetime import date
from typing import Optional

from pydantic import BaseModel

class WordCheckRequest(BaseModel):
    word: str
    sequence: str  # The 3-letter combo from the plate
    user_id: Optional[str] = None
    puzzle_date: Optional[date] = None

class WordCheckResponse(BaseModel):
    is_valid: bool
    message: str   # e.g., "Correct!", "Missing a letter", or "Not a real word",
    points: int = 0