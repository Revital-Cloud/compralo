"""
Smoke tests for the FastAPI app (root and docs availability in dev).
"""
import pytest
from fastapi.testclient import TestClient

from main import app


def test_root_returns_welcome(client: TestClient):
    """Root endpoint returns welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "API" in data["message"] or "Compralo" in data["message"]


def test_app_import():
    """App can be imported (smoke check)."""
    assert app is not None
    assert app.title == "Compralo API"
