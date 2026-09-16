from datetime import date, datetime, timezone, timedelta

def is_date_currently_valid_somewhere(puzzle_date: date) -> bool:
    """
    Returns True if puzzle_date corresponds to Today somewhere on Earth.
    Earliest time zone: UTC+14 (e.g., Line Islands)
    Latest time zone: UTC-12 (e.g., Baker Island)
    """
    now_utc = datetime.now(timezone.utc)
    
    earliest_possible_date = (now_utc - timedelta(hours=12)).date()
    latest_possible_date = (now_utc + timedelta(hours=14)).date()

    return earliest_possible_date <= puzzle_date <= latest_possible_date