from fastapi.testclient import TestClient
import sys
import os
from sqlalchemy import text
from datetime import date

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pytest

@pytest.mark.asyncio
async def test_get_daily_plate(client, db):
    from sqlalchemy import text
    await db.execute(
        text(
            """
            INSERT INTO daily_plates (date, sequence, total_count, goal_points)
            VALUES ('2023-01-01', 'LPG', 10, 100)
            ON CONFLICT (date) DO NOTHING
            """
        )
    )
    await db.flush()

    response = await client.get("/api/plate/daily", params={"date": "2023-01-01"})
    assert response.status_code == 200
    
    data = response.json()
    
    assert "sequence" in data
    assert "total_count" in data
    assert "goal_points" in data
    
    assert len(data["sequence"]) == 3
    assert data["sequence"].isalpha()
    assert data["sequence"].isupper()
    
    assert isinstance(data["total_count"], int)
    assert isinstance(data["goal_points"], int)

    assert "words_found" in data
    assert "points_earned" in data
    assert "elapsed_seconds" in data
    assert "tier_times" in data

    assert isinstance(data["words_found"], list)
    assert data["words_found"] == []
    
    assert isinstance(data["points_earned"], int)
    assert data["points_earned"] == 0

    assert isinstance(data["elapsed_seconds"], int)
    assert data["elapsed_seconds"] == 0

    assert isinstance(data["tier_times"], dict)
    assert data["tier_times"] == {}

@pytest.mark.asyncio
async def test_get_user_stats_includes_archive_data(client, db):
    target_date = date(2026, 8, 18)
    user_id = "test-user"

    await db.execute(
        text(
            """
            INSERT INTO users (id, display_name) VALUES
                (:id, :name)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {
            "id": user_id,
            "name": "Test Name"
        },
    )

    await db.execute(
        text(
            """
            INSERT INTO daily_user_summaries (
                user_id, 
                date, 
                points_earned, 
                words_found, 
                elapsed_seconds, 
                tier_times, 
                archive_words_found, 
                archive_points_earned
            )
            VALUES (
                :user_id, 
                :target_date, 
                0, 
                '{}'::varchar[], 
                0, 
                '{}'::jsonb, 
                :archive_words, 
                :archive_points
            )
            ON CONFLICT (user_id, date) DO NOTHING
            """
        ),
        {
            "user_id": user_id,
            "target_date": target_date,
            "archive_words": ["plate", "license", "drive"],
            "archive_points": 150,
        },
    )
    await db.flush()

    response = await client.get(f"/api/plate/daily", params={"user_id": user_id, "date": target_date.isoformat()})

    assert response.status_code == 200
    data = response.json()

    assert "words_found" in data
    assert "points_earned" in data
    assert data["words_found"] == ["plate", "license", "drive"]
    assert data["points_earned"] == 150

# DEPRECATED: The random plate endpoint is no longer used in the game. 
# It has been commented out to avoid confusion, but may be used in the future if needed.
# def test_get_random_plate():
#     response = client.get("/api/plate/random")
#     assert response.status_code == 200
    
#     data = response.json()
#     assert "sequence" in data
#     assert "total_count" in data
#     assert "goal_points" in data
    
#     assert len(data["sequence"]) == 3
#     assert data["sequence"].isalpha()