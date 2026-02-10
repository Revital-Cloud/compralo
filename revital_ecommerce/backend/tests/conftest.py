"""
Pytest configuration and shared fixtures for revital_ecommerce backend tests.

Ensures the app package is on sys.path so imports like `from services.*` and
`from routers.*` resolve when running pytest from the backend root.
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add backend/app to path so existing tests can use "from services.*" / "from routers.*"
_backend_root = Path(__file__).resolve().parent.parent
_app_dir = _backend_root / "app"
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))

# Import app after path is set (main lives in app/)
from main import app


@pytest.fixture
def client() -> TestClient:
    """FastAPI TestClient for HTTP endpoint tests."""
    return TestClient(app)
