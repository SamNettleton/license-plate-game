from datetime import date
from unittest.mock import patch

import pytest
from sqlalchemy import text

TEST_TODAY = date(2026, 8, 18)


@pytest.mark.asyncio
async def test_get_monthly_archive_success(client, db):
    user_id = "test-user-archive"
    target_year = 2026
    target_month = 8

    # Insert test user
    await db.execute(
        text(
            "INSERT INTO users (id, display_name) VALUES (:id, :name) ON CONFLICT (id) DO NOTHING"
        ),
        {"id": user_id, "name": "Archive Player"},
    )

    # Insert daily plates for the dates
    await db.execute(
        text(
            """
            INSERT INTO daily_plates (date, sequence, total_count, goal_points)
            VALUES ('2026-08-10', 'XYZ', 26, 100),
                   ('2026-08-15', 'ABC', 26, 100)
            ON CONFLICT (date) DO NOTHING
            """
        )
    )

    # Insert daily summaries for the target month with non-nullable archive columns included
    # Insert daily summaries for the target month with non-nullable archive columns included
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
                :user_id, '2026-08-10', 50, :words_1, 120, '{"Novice": 15}'::jsonb, :archive_words_1, 0
            ),
            (
                :user_id, '2026-08-15', 75, :words_2, 90, '{"Wordsmith": 30}'::jsonb, :archive_words_2, 0
            )
            ON CONFLICT (user_id, date) DO NOTHING
            """
        ),
        {
            "user_id": user_id,
            "words_1": ["leap", "frog"],
            "archive_words_1": [],
            "words_2": ["plate", "game"],
            "archive_words_2": [],
        },
    )
    await db.flush()

    response = await client.get(
        f"/api/archive/users/{user_id}",
        params={"year": target_year, "month": target_month},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == user_id
    assert payload["year"] == target_year
    assert payload["month"] == target_month
    assert len(payload["summaries"]) == 2
    assert payload["summaries"][0]["date"] == "2026-08-10"
    assert payload["summaries"][0]["points_earned"] == 50
    assert payload["summaries"][1]["date"] == "2026-08-15"
    assert payload["summaries"][1]["points_earned"] == 75


@pytest.mark.asyncio
async def test_get_monthly_archive_empty_month_returns_empty_list(client, db):
    user_id = "test-user-empty"

    await db.execute(
        text(
            "INSERT INTO users (id, display_name) VALUES (:id, :name) ON CONFLICT (id) DO NOTHING"
        ),
        {"id": user_id, "name": "Empty Player"},
    )
    await db.flush()

    response = await client.get(
        f"/api/archive/users/{user_id}",
        params={"year": 2026, "month": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"] == user_id
    assert payload["year"] == 2026
    assert payload["month"] == 1
    assert payload["summaries"] == []


@pytest.mark.asyncio
async def test_get_monthly_archive_invalid_params(client):
    # Testing invalid month boundary
    response = await client.get(
        "/api/archive/users/some-user",
        params={"year": 2026, "month": 13},
    )

    assert response.status_code == 422