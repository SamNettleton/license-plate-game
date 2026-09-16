from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app
from database import get_db

client = TestClient(app)

def test_system_health():
    class MockResult:
        def scalar(self):
            return 1

    class MockDb:
        async def execute(self, *args, **kwargs):
            return MockResult()

    async def override_get_db():
        yield MockDb()

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.get("/api/system/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "latency_ms" in data