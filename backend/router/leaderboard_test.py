from datetime import date, datetime
from unittest.mock import patch

import pytest
from sqlalchemy import text

TEST_TODAY = date(2026, 8, 18)


@pytest.mark.asyncio
async def test_get_daily_leaderboard_historical_summary(client, db):
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
            "id_1": "user-1",
            "name_1": "Alpha",
            "id_2": "user-2",
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
            "user_1": "user-1",
            "user_2": "user-2",
            "target_date": historical_date,
            "points_1": 900,
            "points_2": 1500,
            "words_1": ["alpha", "beta"],
            "words_2": ["gamma", "delta", "epsilon"],
        },
    )
    await db.flush()

    with patch("router.leaderboard.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/leaderboard/daily",
            params={"date": historical_date.isoformat(), "user_id": "user-1", "limit": 10},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["date"] == historical_date.isoformat()
    assert len(payload["entries"]) == 2
    assert payload["entries"][0]["name"] == "Bravo"
    assert payload["entries"][0]["score"] == 1500
    assert payload["entries"][0]["words_found_count"] == 3
    assert payload["entries"][0]["is_current_user"] is False
    assert payload["entries"][1]["name"] == "Alpha"
    assert payload["entries"][1]["score"] == 900
    assert payload["entries"][1]["words_found_count"] == 2
    assert payload["entries"][1]["is_current_user"] is True
    assert payload["current_user"] is None


@pytest.mark.asyncio
async def test_get_daily_leaderboard_live_transactions(client, db):
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
            "id_1": "live-user-1",
            "name_1": "Speedy",
            "id_2": "live-user-2",
            "name_2": "Steady",
        },
    )

    await db.execute(
        text(
            """
            INSERT INTO point_transactions (user_id, points, puzzle_date)
            VALUES 
                ('live-user-1', 100, :target_date),
                ('live-user-1', 150, :target_date),
                ('live-user-2', 500, :target_date)
            """
        ),
        {"target_date": live_date},
    )
    await db.flush()

    with patch("router.leaderboard.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/leaderboard/daily",
            params={"date": live_date.isoformat(), "user_id": "live-user-1", "limit": 10},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["date"] == live_date.isoformat()
    assert len(payload["entries"]) == 2
    assert payload["entries"][0]["name"] == "Steady"
    assert payload["entries"][0]["score"] == 500
    assert payload["entries"][0]["words_found_count"] == 1
    assert payload["entries"][1]["name"] == "Speedy"
    assert payload["entries"][1]["score"] == 250
    assert payload["entries"][1]["words_found_count"] == 2
    assert payload["entries"][1]["is_current_user"] is True


@pytest.mark.asyncio
async def test_get_daily_leaderboard_includes_user_rank_row_when_outside_top_ten(client, db):
    historical_date = date(2026, 8, 15)

    for index in range(11):
        user_id = f"user-{index}"
        await db.execute(
            text(
                "INSERT INTO users (id, display_name) VALUES (:id, :name) ON CONFLICT (id) DO NOTHING"
            ),
            {"id": user_id, "name": f"User {index}"},
        )
        await db.execute(
            text(
                "INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found) VALUES (:user_id, :target_date, :points, :words) ON CONFLICT (user_id, date) DO NOTHING"
            ),
            {"user_id": user_id, "target_date": historical_date, "points": 1000 + index, "words": [f"word-{index}"]},
        )

    await db.execute(
        text(
            "INSERT INTO users (id, display_name) VALUES (:id, :name) ON CONFLICT (id) DO NOTHING"
        ),
        {"id": "outside-user", "name": "Outside Player"},
    )
    await db.execute(
        text(
            "INSERT INTO daily_user_summaries (user_id, date, points_earned, words_found) VALUES (:user_id, :target_date, :points, :words) ON CONFLICT (user_id, date) DO NOTHING"
        ),
        {"user_id": "outside-user", "target_date": historical_date, "points": 500, "words": ["small"]},
    )
    await db.flush()

    with patch("router.leaderboard.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/leaderboard/daily",
            params={"date": historical_date.isoformat(), "user_id": "outside-user", "limit": 10},
        )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["entries"]) == 10
    assert payload["current_user"] is not None
    assert payload["current_user"]["rank"] == 12
    assert payload["current_user"]["name"] == "Outside Player"
    assert payload["current_user"]["score"] == 500
    assert payload["current_user"]["is_current_user"] is True


@pytest.mark.asyncio
async def test_get_daily_leaderboard_boundary_yesterday_is_live(client, db):
    yesterday = date(2026, 8, 17)

    await db.execute(
        text(
            "INSERT INTO users (id, display_name) VALUES ('boundary-user', 'Boundary Player') ON CONFLICT (id) DO NOTHING"
        )
    )
    await db.execute(
        text(
            """
            INSERT INTO point_transactions (user_id, points, puzzle_date)
            VALUES ('boundary-user', 300, :target_date)
            """
        ),
        {"target_date": yesterday},
    )
    await db.flush()

    with patch("router.leaderboard.datetime") as mock_datetime:
        mock_datetime.now.return_value.date.return_value = TEST_TODAY
        mock_datetime.strptime = datetime.strptime

        response = await client.get(
            "/api/leaderboard/daily",
            params={"date": yesterday.isoformat(), "limit": 10},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["date"] == yesterday.isoformat()
    assert len(payload["entries"]) == 1
    assert payload["entries"][0]["name"] == "Boundary Player"
    assert payload["entries"][0]["score"] == 300


@pytest.mark.asyncio
async def test_get_daily_leaderboard_invalid_date_format(client):
    response = await client.get(
        "/api/leaderboard/daily",
        params={"date": "17-08-2026"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Date must be in YYYY-MM-DD format."