import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
class TestUserSyncEndpoint:

    async def test_sync_new_user_success(self, client: AsyncClient, db: AsyncSession):
        """Tests that a new user is inserted successfully when user_id does not exist."""
        user_id = str(uuid4())
        display_name = "Road Tripper"

        response = await client.post(
            "/api/users/sync",
            json={"user_id": user_id, "display_name": display_name},
        )

        assert response.status_code == 200
        assert response.json() == {"status": "synced"}

        # Verify the record was written to the database
        result = await db.execute(
            text("SELECT id, display_name FROM users WHERE id = :id"),
            {"id": user_id},
        )
        row = result.fetchone()

        assert row is not None
        assert str(row.id) == user_id
        assert row.display_name == display_name

    async def test_sync_existing_user_updates_display_name(
        self, client: AsyncClient, db: AsyncSession
    ):
        """Tests that ON CONFLICT triggers an update when the user_id already exists."""
        user_id = str(uuid4())
        initial_name = "Original Name"
        updated_name = "Updated Name"

        # 1. First sync call (creates the user)
        first_response = await client.post(
            "/api/users/sync",
            json={"user_id": user_id, "display_name": initial_name},
        )
        assert first_response.status_code == 200

        # 2. Second sync call with same user_id but new display_name
        second_response = await client.post(
            "/api/users/sync",
            json={"user_id": user_id, "display_name": updated_name},
        )
        assert second_response.status_code == 200
        assert second_response.json() == {"status": "synced"}

        # 3. Verify database reflects the updated display name and didn't create duplicate rows
        result = await db.execute(
            text("SELECT display_name FROM users WHERE id = :id"),
            {"id": user_id},
        )
        rows = result.fetchall()

        assert len(rows) == 1
        assert rows[0].display_name == updated_name

    async def test_sync_invalid_uuid_format(self, client: AsyncClient):
        """Tests that Pydantic rejects invalid UUID formats with a 422 error."""
        response = await client.post(
            "/api/users/sync",
            json={"user_id": "invalid-uuid-string", "display_name": "Test User"},
        )

        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any(error["loc"] == ["body", "user_id"] for error in errors)

    async def test_sync_missing_required_fields(self, client: AsyncClient):
        """Tests that requests missing required fields fail validation."""
        # Missing display_name
        response = await client.post(
            "/api/users/sync",
            json={"user_id": str(uuid4())},
        )

        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any(error["loc"] == ["body", "display_name"] for error in errors)