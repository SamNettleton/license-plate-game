from datetime import date
from unittest.mock import AsyncMock, MagicMock
import pytest
from services.archive import get_user_monthly_summaries


# ==========================================
# Helpers & Mocks
# ==========================================

class MockDailyPlate:
    def __init__(self, plate_date: date, sequence: str = "ABC123", goal_points: int = 100):
        self.date = plate_date
        self.sequence = sequence
        self.goal_points = goal_points


class MockDailyUserSummary:
    def __init__(
        self,
        user_id: str,
        summary_date: date,
        points_earned=None,
        archive_points_earned=None,
        words_found=None,
        archive_words_found=None,
        elapsed_seconds=None,
        tier_times=None,
    ):
        self.user_id = user_id
        self.date = summary_date
        self.points_earned = points_earned
        self.archive_points_earned = archive_points_earned
        self.words_found = words_found
        self.archive_words_found = archive_words_found
        self.elapsed_seconds = elapsed_seconds
        self.tier_times = tier_times


def create_mock_db_session(records):
    # records should be a list of tuples: (plate, summary)
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = records

    mock_result = MagicMock()
    mock_result.all.return_value = records

    mock_db = AsyncMock()
    mock_db.execute.return_value = mock_result
    return mock_db


# ==========================================
# Unit Tests
# ==========================================

@pytest.mark.asyncio
async def test_get_user_monthly_summaries_combines_live_and_archive_metrics():
    user_id = "user-1234"
    d = date(2026, 8, 10)
    mock_plate = MockDailyPlate(d)
    mock_summary = MockDailyUserSummary(
        user_id=user_id,
        summary_date=d,
        points_earned=25,
        archive_points_earned=15,
        words_found=["LEAP", "FROG"],
        archive_words_found=["FROG", "POND"],  # "FROG" is duplicate
        elapsed_seconds=120,
        tier_times={"Novice": 10},
    )
    mock_records = [(mock_plate, mock_summary)]

    mock_db = create_mock_db_session(mock_records)

    result = await get_user_monthly_summaries(
        db=mock_db, user_id=user_id, year=2026, month=8
    )

    assert len(result) == 1
    summary = result[0]

    assert summary["date"] == date(2026, 8, 10)
    assert summary["points_earned"] == 40  # 25 + 15
    # Asserts order-preserving deduplication: "FROG" listed once
    assert summary["words_found"] == ["LEAP", "FROG", "POND"]
    assert summary["elapsed_seconds"] == 120
    assert summary["tier_times"] == {"Novice": 10}


@pytest.mark.asyncio
async def test_get_user_monthly_summaries_handles_null_fields_gracefully():
    user_id = "user-1234"
    d = date(2026, 8, 15)
    mock_plate = MockDailyPlate(d)
    # All nullable fields initialized to None
    mock_summary = MockDailyUserSummary(
        user_id=user_id,
        summary_date=d,
        points_earned=None,
        archive_points_earned=None,
        words_found=None,
        archive_words_found=None,
        elapsed_seconds=None,
        tier_times=None,
    )
    mock_records = [(mock_plate, mock_summary)]

    mock_db = create_mock_db_session(mock_records)

    result = await get_user_monthly_summaries(
        db=mock_db, user_id=user_id, year=2026, month=8
    )

    assert len(result) == 1
    summary = result[0]

    assert summary["date"] == date(2026, 8, 15)
    assert summary["points_earned"] == 0
    assert summary["words_found"] == []
    assert summary["elapsed_seconds"] == 0
    assert summary["tier_times"] == {}


@pytest.mark.asyncio
async def test_get_user_monthly_summaries_empty_month():
    mock_db = create_mock_db_session([])

    result = await get_user_monthly_summaries(
        db=mock_db, user_id="user-1234", year=2026, month=2
    )

    assert result == []
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_monthly_summaries_date_bounds_query_construction():
    mock_db = create_mock_db_session([])

    # Month 8 has 31 days -> 2026-08-01 to 2026-08-31
    await get_user_monthly_summaries(
        db=mock_db, user_id="user-1234", year=2026, month=8
    )

    mock_db.execute.assert_called_once()
    # Extract the executed query
    executed_stmt = mock_db.execute.call_args[0][0]
    
    # Verify bounds compiled in query
    compiled_stmt = str(executed_stmt.compile(compile_kwargs={"literal_binds": True}))
    assert "2026-08-01" in compiled_stmt
    assert "2026-08-31" in compiled_stmt