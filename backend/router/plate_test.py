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
    
def test_get_random_plate():
    response = client.get("/api/plate/random")
    assert response.status_code == 200
    
    data = response.json()
    assert "sequence" in data
    assert "total_count" in data
    assert "goal_points" in data
    
    assert len(data["sequence"]) == 3
    assert data["sequence"].isalpha()
