import os
import sys
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app
from database import get_db


@pytest.fixture
def sync_client():
    async def override_get_db():
        class MockDb:
            def execute(self, *args, **kwargs):
                return True

        yield MockDb()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_check_word_valid(monkeypatch, sync_client):
    import services.dictionary as dictionary
    
    async def mock_validate_word(db, word): return True
    monkeypatch.setattr(dictionary, "validate_word", mock_validate_word)
    
    payload = {
        "word": "leapfrog",
        "sequence": "LPG"
    }
    
    response = sync_client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is True
    assert "Nice one!" in data["message"]
    assert data["points"] == 13

def test_check_word_invalid_sequence(sync_client):
    # We do not need to mock dictionary for this because it fails the first
    # logic check `verify_word_against_sequence`
    
    payload = {
        "word": "goalpost",
        "sequence": "LPG"
    }
    
    response = sync_client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is False
    assert "Word must contain LPG in order." in data["message"]
    
def test_check_word_invalid_dictionary_word(monkeypatch, sync_client):
    import services.dictionary as dictionary
    
    async def mock_validate_word(db, word): return False
    monkeypatch.setattr(dictionary, "validate_word", mock_validate_word)
    
    payload = {
        "word": "alpoog",
        "sequence": "LPG"
    }
    
    response = sync_client.post("/api/words/check", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_valid"] is False
    assert "not in our dictionary" in data["message"]

def test_check_word_validation_error(sync_client):
    # FastAPI Pydantic schema validation failure (missing sequence)
    payload = {
        "word": "leapfrog",
    }
    
    response = sync_client.post("/api/words/check", json=payload)
    assert response.status_code == 422 # Unprocessable Entity
    
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_word_check_daily_creates_point_transaction(client, db, monkeypatch):
    import services.dictionary as dictionary

    async def mock_validate_word(session, word):
        return True

    monkeypatch.setattr(dictionary, 'validate_word', mock_validate_word)

    user_id = 'user-1234'
    puzzle_date = '2026-08-11'

    await db.execute(
        text("INSERT INTO users (id, display_name) VALUES (:id, :name)"),
        {"id": user_id, "name": "Test User"}
    )
    await db.commit()

    response = await client.post(
        '/api/words/check',
        json={
            'word': 'leapfrog',
            'sequence': 'LPG',
            'user_id': user_id,
            'puzzle_date': puzzle_date,
        },
    )

    assert response.status_code == 200
    assert response.json()['is_valid'] is True
    assert response.json()['points'] == 13

    result = await db.execute(
        text(
            'SELECT user_id, points, word, puzzle_date '
            'FROM point_transactions WHERE user_id = :user_id'
        ),
        {'user_id': user_id},
    )
    row = result.fetchone()

    assert row is not None
    assert row.user_id == user_id
    assert row.points == 13
    assert row.word == 'leapfrog'
    assert row.puzzle_date == date.fromisoformat(puzzle_date)


@pytest.mark.asyncio
async def test_word_check_daily_does_not_create_transaction_without_user_or_date(client, db, monkeypatch):
    import services.dictionary as dictionary

    async def mock_validate_word(session, word):
        return True

    monkeypatch.setattr(dictionary, 'validate_word', mock_validate_word)

    response = await client.post(
        '/api/words/check',
        json={
            'word': 'leapfrog',
            'sequence': 'LPG',
        },
    )

    assert response.status_code == 200
    assert response.json()['is_valid'] is True

    result = await db.execute(text('SELECT COUNT(*) FROM point_transactions'))
    count = result.scalar_one()
    assert count == 0
