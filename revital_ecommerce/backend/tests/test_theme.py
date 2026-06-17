"""Tests del Theme global + chrome del CMS Builder."""
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from core.database import get_db
from main import app
from schemas.theme_schema import SiteThemePayload, ThemeColors
from services import theme_service
from tests.builder_fakes import FakeSession

USR = Decimal("1")


# --- schema ---------------------------------------------------------------
def test_theme_colors_defaults_are_valid_hex():
    colors = ThemeColors()
    assert colors.primary == "#ec2538"
    assert colors.dark_background == "#0b1220"


@pytest.mark.parametrize("bad", ["red", "#12", "rgb(0,0,0)", "123456", "#xyzxyz"])
def test_theme_colors_reject_invalid_hex(bad):
    with pytest.raises(ValidationError):
        ThemeColors(primary=bad)


def test_theme_payload_defaults():
    payload = SiteThemePayload()
    assert payload.header.brand == "Compralo"
    assert payload.theme.radius == "0.625rem"
    assert payload.theme.fonts.body == "Geist"


# --- service --------------------------------------------------------------
def test_get_theme_detail_default_when_empty():
    db = FakeSession()
    detail = theme_service.get_theme_detail(db)
    assert detail["status"] == "draft"
    assert detail["has_published"] is False
    assert detail["theme"]["colors"]["primary"] == "#ec2538"


def test_save_then_publish_theme():
    db = FakeSession()
    payload = SiteThemePayload()
    payload.theme.colors.primary = "#123456"
    payload.header.brand = "MiTienda"

    theme_service.save_theme_draft(db, payload, USR)
    assert theme_service.get_public_theme(db) is None  # aún no publicado

    theme_service.publish_theme(db, USR)
    published = theme_service.get_public_theme(db)
    assert published is not None
    assert published["theme"]["colors"]["primary"] == "#123456"
    assert published["header"]["brand"] == "MiTienda"
    assert db.store["site_theme"]["num_version"] == 2


def test_publish_without_existing_seeds_default():
    db = FakeSession()
    theme_service.publish_theme(db, USR)
    published = theme_service.get_public_theme(db)
    assert published is not None
    assert published["header"]["brand"] == "Compralo"


def test_published_reflects_only_published_snapshot():
    db = FakeSession()
    p1 = SiteThemePayload()
    p1.theme.colors.primary = "#111111"
    theme_service.save_theme_draft(db, p1, USR)
    theme_service.publish_theme(db, USR)

    p2 = SiteThemePayload()
    p2.theme.colors.primary = "#222222"
    theme_service.save_theme_draft(db, p2, USR)  # nuevo borrador sin publicar

    assert theme_service.get_public_theme(db)["theme"]["colors"]["primary"] == "#111111"
    assert theme_service.get_theme_detail(db)["theme"]["colors"]["primary"] == "#222222"


# --- endpoint público -----------------------------------------------------
def _override_db(db: FakeSession):
    def _gen():
        yield db

    return _gen


def test_public_theme_endpoint():
    db = FakeSession()
    payload = SiteThemePayload()
    payload.theme.colors.primary = "#abcdef"
    theme_service.save_theme_draft(db, payload, USR)
    theme_service.publish_theme(db, USR)

    app.dependency_overrides[get_db] = _override_db(db)
    try:
        client = TestClient(app)
        res = client.get("/api/builder/theme/public")
        assert res.status_code == 200
        data = res.json()
        assert data["theme"]["colors"]["primary"] == "#abcdef"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_public_theme_endpoint_null_when_unpublished():
    db = FakeSession()
    app.dependency_overrides[get_db] = _override_db(db)
    try:
        client = TestClient(app)
        res = client.get("/api/builder/theme/public")
        assert res.status_code == 200
        assert res.json() is None
    finally:
        app.dependency_overrides.pop(get_db, None)
