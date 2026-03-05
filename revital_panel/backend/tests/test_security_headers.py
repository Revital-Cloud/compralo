import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

_backend_root = Path(__file__).resolve().parent.parent
_app_dir = _backend_root / "app"
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))

from middlewares.security_middleware import SecurityMiddleware


def _create_client() -> TestClient:
    app = FastAPI()
    app.add_middleware(SecurityMiddleware)

    @app.get("/")
    async def read_root():
        return {"ok": True}

    return TestClient(app)


def test_csp_script_src_does_not_allow_unsafe_directives_in_development(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    client = _create_client()

    response = client.get("/")
    csp = response.headers.get("Content-Security-Policy", "")
    script_src = next(
        (
            directive.strip()
            for directive in csp.split(";")
            if directive.strip().startswith("script-src ")
        ),
        "",
    )

    assert script_src
    assert "'unsafe-inline'" not in script_src
    assert "'unsafe-eval'" not in script_src
    assert "http://localhost:3000" in csp


def test_csp_script_src_does_not_allow_unsafe_directives_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    client = _create_client()

    response = client.get("/")
    csp = response.headers.get("Content-Security-Policy", "")
    script_src = next(
        (
            directive.strip()
            for directive in csp.split(";")
            if directive.strip().startswith("script-src ")
        ),
        "",
    )

    assert script_src
    assert "'unsafe-inline'" not in script_src
    assert "'unsafe-eval'" not in script_src
    assert "http://localhost:3000" not in csp
