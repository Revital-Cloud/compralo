"""Tests de la lógica de `builder_service` usando una sesión de DB falsa."""
from decimal import Decimal

import pytest

from schemas.builder_schema import BuilderPageCreatePayload, BuilderPageSavePayload, BuilderSeo
from services import builder_service
from tests.builder_fakes import FakeSession

USR = Decimal("1")


def _save_payload(title="Página Principal", sections=None, seo=None):
    return BuilderPageSavePayload(
        title=title,
        seo=seo or BuilderSeo(),
        sections=sections if sections is not None else [{"id": "hero-1", "type": "hero", "props": {"title": "Hola"}}],
    )


# --- helpers puros ---------------------------------------------------------
def test_default_home_sections_shape():
    sections = builder_service.default_home_sections()
    assert len(sections) == 7
    types = [s["type"] for s in sections]
    assert types == ["banner", "header", "hero", "categories", "product_grid", "carousel", "footer"]
    assert all({"id", "type", "props", "style", "visible"} <= set(s) for s in sections)


# --- lectura ---------------------------------------------------------------
def test_get_page_detail_home_defaults_when_empty():
    db = FakeSession()
    detail = builder_service.get_page_detail(db, "home")
    assert detail is not None
    assert detail["is_home"] is True
    assert detail["status"] == "draft"
    assert detail["has_published"] is False
    assert len(detail["sections"]) == 7


def test_get_page_detail_unknown_returns_none():
    db = FakeSession()
    assert builder_service.get_page_detail(db, "no-existe") is None


def test_get_public_page_none_when_nothing_published():
    db = FakeSession()
    assert builder_service.get_public_page(db, "home") is None


# --- escritura: guardar borrador ------------------------------------------
def test_save_draft_creates_home():
    db = FakeSession()
    builder_service.save_draft(db, "home", _save_payload(), USR)

    assert db.committed is True
    row = db.store["builder_page:home"]
    assert row["ind_publicado"] is False
    assert row["des_cms_content"]["is_home"] is True
    assert row["des_cms_content"]["draft"]["sections"][0]["props"]["title"] == "Hola"
    # Sin publicar todavía: el storefront no ve nada.
    assert builder_service.get_public_page(db, "home") is None


def test_save_draft_for_missing_nonhome_raises():
    db = FakeSession()
    with pytest.raises(Exception):
        builder_service.save_draft(db, "inexistente", _save_payload(title="X"), USR)
    assert db.rolled_back is True


# --- escritura: publicar ---------------------------------------------------
def test_publish_copies_draft_and_bumps_version():
    db = FakeSession()
    builder_service.save_draft(db, "home", _save_payload(), USR)
    builder_service.publish_page(db, "home", USR)

    row = db.store["builder_page:home"]
    assert row["ind_publicado"] is True
    assert row["num_version"] == 2  # 1 al crear + bump al publicar
    published = builder_service.get_public_page(db, "home")
    assert published is not None
    assert published["sections"][0]["props"]["title"] == "Hola"


def test_publish_home_without_existing_row_seeds_default():
    db = FakeSession()
    builder_service.publish_page(db, "home", USR)
    published = builder_service.get_public_page(db, "home")
    assert published is not None
    assert len(published["sections"]) == 7


def test_published_reflects_only_published_snapshot():
    db = FakeSession()
    builder_service.save_draft(db, "home", _save_payload(sections=[{"id": "h", "type": "hero", "props": {"title": "v1"}}]), USR)
    builder_service.publish_page(db, "home", USR)
    # Nuevo borrador sin publicar.
    builder_service.save_draft(db, "home", _save_payload(sections=[{"id": "h", "type": "hero", "props": {"title": "v2"}}]), USR)

    published = builder_service.get_public_page(db, "home")
    assert published["sections"][0]["props"]["title"] == "v1"  # sigue mostrando lo publicado
    detail = builder_service.get_page_detail(db, "home")
    assert detail["sections"][0]["props"]["title"] == "v2"  # el editor ve el borrador


# --- crear / listar / eliminar --------------------------------------------
def test_create_page_and_list():
    db = FakeSession()
    builder_service.create_page(db, BuilderPageCreatePayload(slug="about", title="Sobre"), USR)

    pages = builder_service.list_pages(db)
    slugs = {p["slug"] for p in pages}
    assert "about" in slugs
    assert any(p["is_home"] for p in pages)  # home siempre presente


def test_create_duplicate_raises():
    db = FakeSession()
    builder_service.create_page(db, BuilderPageCreatePayload(slug="about", title="Sobre"), USR)
    with pytest.raises(Exception):
        builder_service.create_page(db, BuilderPageCreatePayload(slug="about", title="Otra"), USR)


def test_list_pages_includes_home_when_absent():
    db = FakeSession()
    pages = builder_service.list_pages(db)
    homes = [p for p in pages if p["is_home"]]
    assert len(homes) == 1
    assert homes[0]["slug"] == "home"


def test_delete_page_blocks_home():
    db = FakeSession()
    builder_service.save_draft(db, "home", _save_payload(), USR)
    with pytest.raises(Exception):
        builder_service.delete_page(db, "home", USR)
    assert "builder_page:home" in db.store


def test_delete_page_removes_row():
    db = FakeSession()
    builder_service.create_page(db, BuilderPageCreatePayload(slug="about", title="Sobre"), USR)
    builder_service.delete_page(db, "about", USR)
    assert "builder_page:about" not in db.store
