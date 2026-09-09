from fastapi.testclient import TestClient
import sys
import os

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app

client = TestClient(app)

def test_get_daily_plate():
    # Provide a date to make the query deterministic
    response = client.get("/api/plate/daily?date=2023-01-01")
    assert response.status_code == 200
    
    data = response.json()
    
    # Core plate fields
    assert "sequence" in data
    assert "total_count" in data
    assert "goal_points" in data
    
    # We expect a string of 3 letters
    assert len(data["sequence"]) == 3
    assert data["sequence"].isalpha()
    assert data["sequence"].isupper()
    
    # Ensure they are integers
    assert isinstance(data["total_count"], int)
    assert isinstance(data["goal_points"], int)

    # User progression state fields (defaults when no user_id is supplied)
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