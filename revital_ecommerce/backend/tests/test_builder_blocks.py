"""Tests de bloques reutilizables ("Mis bloques") y slugs públicos del builder."""
from decimal import Decimal

import pytest

from schemas.builder_schema import (
    BlockTemplateCreate,
    BuilderPageCreatePayload,
    BuilderPageSavePayload,
    BuilderSeo,
)
from services import builder_service
from tests.builder_fakes import FakeSession

USR = Decimal("1")


def _section(type_="cta"):
    return {
        "id": "x1",
        "type": type_,
        "visible": True,
        "props": {"title": "Hola"},
        "style": {"bgColor": "transparent", "paddingTop": 0, "paddingBottom": 0, "marginTop": 0, "marginBottom": 0, "align": "left"},
    }


def test_create_and_list_blocks():
    db = FakeSession()
    payload = BlockTemplateCreate(name="Banner promo", section=_section("cta"))
    res = builder_service.create_block(db, payload, USR)
    assert "id" in res

    blocks = builder_service.list_blocks(db)
    assert len(blocks) == 1
    assert blocks[0]["name"] == "Banner promo"
    assert blocks[0]["section"]["type"] == "cta"
    assert blocks[0]["id"] == res["id"]


def test_delete_block():
    db = FakeSession()
    res = builder_service.create_block(db, BlockTemplateCreate(name="B", section=_section()), USR)
    builder_service.delete_block(db, res["id"], USR)
    assert builder_service.list_blocks(db) == []


def test_blocks_isolated_from_pages():
    db = FakeSession()
    builder_service.create_block(db, BlockTemplateCreate(name="B", section=_section()), USR)
    builder_service.save_draft(db, "home", BuilderPageSavePayload(title="Home", seo=BuilderSeo(), sections=[_section("hero")]), USR)
    # list_pages no debe incluir bloques; list_blocks no debe incluir páginas
    assert all(not p["slug"].startswith("block") for p in builder_service.list_pages(db))
    assert len(builder_service.list_blocks(db)) == 1


def test_list_published_slugs_only_published():
    db = FakeSession()
    builder_service.create_page(db, BuilderPageCreatePayload(slug="about", title="Sobre"), USR)  # solo borrador
    builder_service.create_page(db, BuilderPageCreatePayload(slug="promo", title="Promo"), USR)
    builder_service.publish_page(db, "promo", USR)

    slugs = builder_service.list_published_slugs(db)
    published = {s["slug"] for s in slugs}
    assert "promo" in published      # publicada
    assert "about" not in published  # solo borrador


def test_section_type_is_permissive():
    # El backend acepta tipos de bloque nuevos sin cambios (type es texto libre).
    db = FakeSession()
    payload = BuilderPageSavePayload(
        title="Home",
        seo=BuilderSeo(),
        sections=[_section("faq"), _section("gallery"), _section("richtext")],
    )
    builder_service.save_draft(db, "home", payload, USR)
    detail = builder_service.get_page_detail(db, "home")
    assert [s["type"] for s in detail["sections"]] == ["faq", "gallery", "richtext"]
