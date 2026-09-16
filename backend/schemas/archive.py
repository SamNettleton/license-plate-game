from datetime import date
from pydantic import BaseModel, ConfigDict
from typing import List, Dict

class DailySummaryArchiveItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    sequence: str
    goal_points: int
    points_earned: int = 0
    words_found: list[str] = []
    elapsed_seconds: int = 0
    tier_times: Dict[str, int] = {}

class MonthlyArchiveResponse(BaseModel):
    user_id: str
    year: int
    month: int
    summaries: List[DailySummaryArchiveItem]