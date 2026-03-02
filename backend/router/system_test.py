from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from main import app

client = TestClient(app)

from database import get_db

# Helper function to override the database dependency
def override_get_db():
    class MockDb:
        def execute(self, *args, **kwargs):
            return True
            
    yield MockDb()

# Make the app use our override
app.dependency_overrides[get_db] = override_get_db

def test_system_health():
    response = client.get("/api/system/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "latency_ms" in data
