"""Test HTTP del endpoint público del CMS Builder (storefront).

Usa override de `get_db` con una sesión falsa; el GET público no requiere auth.
"""
from decimal import Decimal

from fastapi.testclient import TestClient

from main import app
from core.database import get_db
from schemas.builder_schema import BuilderPageSavePayload, BuilderSeo
from services import builder_service
from tests.builder_fakes import FakeSession

USR = Decimal("1")


def _override_db(db: FakeSession):
    def _gen():
        yield db

    return _gen


def test_public_endpoint_returns_published_sections():
    db = FakeSession()
    builder_service.save_draft(
        db,
        "home",
        BuilderPageSavePayload(
            title="Home",
            seo=BuilderSeo(),
            sections=[{"id": "h", "type": "hero", "props": {"title": "Hola"}}],
        ),
        USR,
    )
    builder_service.publish_page(db, "home", USR)

    app.dependency_overrides[get_db] = _override_db(db)
    try:
        client = TestClient(app)
        res = client.get("/api/builder/public/home")
        assert res.status_code == 200
        data = res.json()
        assert data is not None
        assert data["slug"] == "home"
        assert data["sections"][0]["props"]["title"] == "Hola"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_public_endpoint_returns_null_when_unpublished():
    db = FakeSession()
    app.dependency_overrides[get_db] = _override_db(db)
    try:
        client = TestClient(app)
        res = client.get("/api/builder/public/home")
        assert res.status_code == 200
        assert res.json() is None
    finally:
        app.dependency_overrides.pop(get_db, None)
