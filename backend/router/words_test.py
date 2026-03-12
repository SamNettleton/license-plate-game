from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app
from database import get_db

client = TestClient(app)

# Helper function to override the database dependency
async def override_get_db():
    class MockDb:
        def execute(self, *args, **kwargs):
            return True
    yield MockDb()

# Make the app use our override
app.dependency_overrides[get_db] = override_get_db

def test_check_word_valid(monkeypatch):
    import services.dictionary as dictionary
    
    async def mock_validate_word(db, word): return True
    monkeypatch.setattr(dictionary, "validate_word", mock_validate_word)
    
    payload = {
        "word": "leapfrog",
        "sequence": "LPG"
    }
    
    response = client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is True
    assert "Nice one!" in data["message"]
    assert data["points"] == 13

def test_check_word_invalid_sequence():
    # We do not need to mock dictionary for this because it fails the first
    # logic check `verify_word_against_sequence`
    
    payload = {
        "word": "goalpost",
        "sequence": "LPG"
    }
    
    response = client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is False
    assert "Word must contain LPG in order." in data["message"]
    
def test_check_word_invalid_dictionary_word(monkeypatch):
    import services.dictionary as dictionary
    
    async def mock_validate_word(db, word): return False
    monkeypatch.setattr(dictionary, "validate_word", mock_validate_word)
    
    payload = {
        "word": "alpoog",
        "sequence": "LPG"
    }
    
    response = client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is False
    assert "not in our dictionary" in data["message"]

def test_check_word_validation_error():
    # FastAPI Pydantic schema validation failure (missing sequence)
    payload = {
        "word": "leapfrog",
    }
    
    response = client.post("/api/words/check", json=payload)
    assert response.status_code == 422 # Unprocessable Entity
    
    data = response.json()
    assert "detail" in data
