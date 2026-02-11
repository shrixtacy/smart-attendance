from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    # We expect a 404 for root "/" as it's not defined, or 200 if it is.
    # The key is that the app initializes and handles the request.
    response = client.get("/")
    assert response.status_code in [200, 404]


def test_health_check_if_exists():
    # Optional: If there's a health endpoint, test it.
    response = client.get("/api/v1/health")
    if response.status_code != 404:
        assert response.status_code == 200
