from datetime import date, datetime
from unittest.mock import patch

import pytest
from sqlalchemy import text

TEST_TODAY = date(2026, 8, 18)


@pytest.mark.asyncio
async def test_get_daily_stats_live_window(client, db):
    live_date = date(2026, 8, 18)

    await db.execute(
        text(
            """
            INSERT INTO users (id, display_name) VALUES
                (:id_1, :name_1),
                (:id_2, :name_2)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {
            "id_1": "stats-user-1",
            "name_1": "Player One",
            "id_2": "stats-user-2",
            "name_2": "Player Two",
        },
    )

    await db.execute(
        text(
            """
            INSERT INTO point_transactions (user_id, points, word, puzzle_date)
            VALUES 
                ('stats-user-1', 10, 'cat', :target_date),
                ('stats-user-1', 20, 'house', :target_date),
                ('stats-user-2', 50, 'python', :target_date)
            """
        ),
        {"target_date": live_date},
    )
    await db.flush()

    with patch("router.stats.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/stats/daily",
            params={"date": live_date.isoformat(), "user_id": "stats-user-1"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["date"] == live_date.isoformat()

    global_stats = payload["global_stats"]
    assert global_stats["avg_word_length"] == 4.67
    assert global_stats["min_word_length"] == 3
    assert global_stats["max_word_length"] == 6
    assert global_stats["total_points"] == 40.0
    assert global_stats["words_found_count"] == 1.5

    user_stats = payload["user_stats"]
    assert user_stats is not None
    assert user_stats["avg_word_length"] == 4.0
    assert user_stats["min_word_length"] == 3
    assert user_stats["max_word_length"] == 5
    assert user_stats["total_points"] == 30.0
    assert user_stats["words_found_count"] == 2.0


@pytest.mark.asyncio
async def test_get_daily_stats_historical_summary(client, db):
    historical_date = date(2026, 8, 15)

    await db.execute(
        text(
            """
            INSERT INTO users (id, display_name) VALUES
                (:id_1, :name_1),
                (:id_2, :name_2)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {
            "id_1": "hist-user-1",
            "name_1": "Alpha",
            "id_2": "hist-user-2",
            "name_2": "Bravo",
        },
    )

    await db.execute(
        text(
            """
            INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found)
            VALUES (:user_1, :target_date, :points_1, :words_1),
                   (:user_2, :target_date, :points_2, :words_2)
            ON CONFLICT (user_id, date) DO NOTHING
            """
        ),
        {
            "user_1": "hist-user-1",
            "user_2": "hist-user-2",
            "target_date": historical_date,
            "points_1": 100,
            "points_2": 200,
            "words_1": ["code", "test"],
            "words_2": ["fastapi"],
        },
    )
    await db.flush()

    with patch("router.stats.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/stats/daily",
            params={"date": historical_date.isoformat(), "user_id": "hist-user-1"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["date"] == historical_date.isoformat()

    global_stats = payload["global_stats"]
    assert global_stats["avg_word_length"] == 5.0
    assert global_stats["min_word_length"] == 4
    assert global_stats["max_word_length"] == 7
    assert global_stats["total_points"] == 150.0
    assert global_stats["words_found_count"] == 1.5

    # Corrected assertion: hist-user-1 earned 100 points
    user_stats = payload["user_stats"]
    assert user_stats is not None
    assert user_stats["avg_word_length"] == 4.0
    assert user_stats["min_word_length"] == 4
    assert user_stats["max_word_length"] == 4
    assert user_stats["total_points"] == 100.0
    assert user_stats["words_found_count"] == 2.0


@pytest.mark.asyncio
async def test_get_daily_stats_historical_multi_word_points_accuracy(client, db):
    """Verifies that historical user points match points_earned exactly without multiplication from words_found array length."""
    historical_date = date(2026, 8, 10)

    await db.execute(
        text(
            """
            INSERT INTO users (id, display_name) VALUES ('multi-word-user', 'MultiWord')
            ON CONFLICT (id) DO NOTHING
            """
        )
    )

    # User with 5 words found and 42 total points
    await db.execute(
        text(
            """
            INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found)
            VALUES ('multi-word-user', :target_date, 42, :words)
            ON CONFLICT (user_id, date) DO NOTHING
            """
        ),
        {
            "target_date": historical_date,
            "words": ["apple", "banana", "cherry", "date", "elderberry"],
        },
    )
    await db.flush()

    with patch("router.stats.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/stats/daily",
            params={"date": historical_date.isoformat(), "user_id": "multi-word-user"},
        )

    assert response.status_code == 200
    user_stats = response.json()["user_stats"]
    assert user_stats is not None
    assert user_stats["words_found_count"] == 5.0
    assert user_stats["total_points"] == 42.0


@pytest.mark.asyncio
async def test_get_daily_stats_no_user_id_returns_null_user_stats(client, db):
    live_date = date(2026, 8, 18)

    await db.execute(
        text(
            """
            INSERT INTO users (id, display_name) VALUES ('anon-user', 'Anonymous')
            ON CONFLICT (id) DO NOTHING
            """
        )
    )

    await db.execute(
        text(
            """
            INSERT INTO point_transactions (user_id, points, word, puzzle_date)
            VALUES ('anon-user', 15, 'word', :target_date)
            """
        ),
        {"target_date": live_date},
    )
    await db.flush()

    with patch("router.stats.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/stats/daily",
            params={"date": live_date.isoformat()},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_stats"] is None
    assert payload["global_stats"]["words_found_count"] == 1.0


@pytest.mark.asyncio
async def test_get_daily_stats_empty_day_returns_zeroed_payload(client):
    live_date = date(2026, 8, 18)

    with patch("router.stats.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/stats/daily",
            params={"date": live_date.isoformat(), "user_id": "nonexistent-user"},
        )

    assert response.status_code == 200
    payload = response.json()
    zero_stats = {
        "avg_word_length": 0.0,
        "min_word_length": 0,
        "max_word_length": 0,
        "total_points": 0,
        "words_found_count": 0,
    }

    assert payload["global_stats"] == zero_stats
    assert payload["user_stats"] == zero_stats


@pytest.mark.asyncio
async def test_get_daily_stats_invalid_date_format(client):
    response = await client.get(
        "/api/stats/daily",
        params={"date": "18-08-2026"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Date must be in YYYY-MM-DD format."