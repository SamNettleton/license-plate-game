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
        class MockResult:
            def scalar_one_or_none(self):
                return None

        class MockDb:
            async def execute(self, *args, **kwargs):
                return MockResult()

            async def commit(self):
                pass

        yield MockDb()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_check_word_valid(monkeypatch, sync_client):
    import services.dictionary as dictionary

    async def mock_validate_word(db, word):
        return True

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

    async def mock_validate_word(db, word):
        return False

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
    payload = {
        "word": "leapfrog",
    }

    response = sync_client.post("/api/words/check", json=payload)
    assert response.status_code == 422

    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_word_check_daily_updates_daily_user_summary(client, db, monkeypatch):
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
            'elapsed_seconds': 45,
        },
    )

    assert response.status_code == 200
    assert response.json()['is_valid'] is True
    assert response.json()['points'] == 13

    result = await db.execute(
        text(
            'SELECT user_id, date, points_earned, words_found, elapsed_seconds '
            'FROM daily_user_summaries WHERE user_id = :user_id AND date = :puzzle_date'
        ),
        {
            'user_id': user_id,
            'puzzle_date': date.fromisoformat(puzzle_date)
        },
    )
    row = result.fetchone()

    assert row is not None
    assert row.user_id == user_id
    assert row.date == date.fromisoformat(puzzle_date)
    assert row.points_earned == 13
    assert row.words_found == ['leapfrog']
    assert row.elapsed_seconds == 45


@pytest.mark.asyncio
async def test_word_check_daily_rejects_already_found_word(client, db, monkeypatch):
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

    payload = {
        'word': 'leapfrog',
        'sequence': 'LPG',
        'user_id': user_id,
        'puzzle_date': puzzle_date,
    }

    # First attempt: succeeds
    first_res = await client.post('/api/words/check', json=payload)
    assert first_res.status_code == 200
    assert first_res.json()['is_valid'] is True

    # Second attempt (e.g. synced device or duplicate guess): fails duplicate check
    second_res = await client.post('/api/words/check', json=payload)
    assert second_res.status_code == 200

    data = second_res.json()
    assert data['is_valid'] is False
    assert "already found" in data['message'].lower()
    assert data['points'] == 0

    # Verify score did not double-increment in database
    result = await db.execute(
        text(
            'SELECT user_id, date, points_earned, words_found '
            'FROM daily_user_summaries WHERE user_id = :user_id AND date = :puzzle_date'
        ),
        {
            'user_id': user_id,
            'puzzle_date': date.fromisoformat(puzzle_date)
        },
    )
    row = result.fetchone()

    assert row.points_earned == 13
    assert row.words_found == ['leapfrog']


@pytest.mark.asyncio
async def test_word_check_daily_does_not_create_summary_without_user_or_date(client, db, monkeypatch):
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

    result = await db.execute(text('SELECT COUNT(*) FROM daily_user_summaries'))
    count = result.scalar_one()
    assert count == 0


@pytest.mark.asyncio
async def test_update_tier_times(client, db):
    user_id = 'user-1234'
    puzzle_date = '2026-08-11'

    await db.execute(
        text("INSERT INTO users (id, display_name) VALUES (:id, :name)"),
        {"id": user_id, "name": "Test User"}
    )
    await db.commit()

    # Initial update
    payload_1 = {
        'user_id': user_id,
        'puzzle_date': puzzle_date,
        'tier_times': {
            'Novice': 0,
            'Learner': 12,
        },
    }

    response_1 = await client.post('/api/words/tier-times', json=payload_1)
    assert response_1.status_code == 200
    assert response_1.json() == {'status': 'success'}

    # Verify initial tier_times
    result_1 = await db.execute(
        text(
            'SELECT tier_times FROM daily_user_summaries WHERE user_id = :user_id AND date = :puzzle_date'
        ),
        {'user_id': user_id, 'puzzle_date': date.fromisoformat(puzzle_date)},
    )
    row_1 = result_1.fetchone()
    assert row_1 is not None
    assert row_1.tier_times == {'Novice': 0, 'Learner': 12}

    # Consecutive update: Merge new tier records
    payload_2 = {
        'user_id': user_id,
        'puzzle_date': puzzle_date,
        'tier_times': {
            'Wordsmith': 45,
        },
    }

    response_2 = await client.post('/api/words/tier-times', json=payload_2)
    assert response_2.status_code == 200

    # Verify merged tier_times
    result_2 = await db.execute(
        text(
            'SELECT tier_times FROM daily_user_summaries WHERE user_id = :user_id AND date = :puzzle_date'
        ),
        {'user_id': user_id, 'puzzle_date': date.fromisoformat(puzzle_date)},
    )
    row_2 = result_2.fetchone()
    assert row_2.tier_times == {'Novice': 0, 'Learner': 12, 'Wordsmith': 45}