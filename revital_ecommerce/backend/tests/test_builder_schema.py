"""Tests de validación de los esquemas del CMS Builder."""
import pytest
from pydantic import ValidationError

from schemas.builder_schema import (
    BuilderPageCreatePayload,
    BuilderPageSavePayload,
    BuilderSection,
    BuilderSectionStyle,
    BuilderSeo,
)


def test_section_defaults():
    section = BuilderSection(id="hero-1", type="hero")
    assert section.visible is True
    assert section.props == {}
    assert isinstance(section.style, BuilderSectionStyle)
    assert section.style.bgColor == "transparent"
    assert section.style.align == "left"


def test_section_keeps_arbitrary_props():
    section = BuilderSection(
        id="hero-1",
        type="hero",
        props={"title": "Hola", "columns": 3},
        style={"bgColor": "#fff", "paddingTop": 12, "align": "center"},
    )
    assert section.props["title"] == "Hola"
    assert section.props["columns"] == 3
    assert section.style.bgColor == "#fff"
    assert section.style.align == "center"


def test_save_payload_parses_sections():
    payload = BuilderPageSavePayload(
        title="Home",
        seo=BuilderSeo(title="t", description="d"),
        sections=[{"id": "hero-1", "type": "hero", "props": {"title": "X"}}],
    )
    assert payload.title == "Home"
    assert len(payload.sections) == 1
    assert payload.sections[0].type == "hero"


def test_create_payload_normalizes_slug():
    payload = BuilderPageCreatePayload(slug="Sobre-Nosotros", title="Sobre")
    assert payload.slug == "sobre-nosotros"


@pytest.mark.parametrize("bad_slug", ["bad slug", "Acentós", "with/slash", "", "trailing-"])
def test_create_payload_rejects_invalid_slug(bad_slug):
    with pytest.raises(ValidationError):
        BuilderPageCreatePayload(slug=bad_slug, title="x")


@pytest.mark.parametrize("reserved", ["home", "p", "api"])
def test_create_payload_rejects_reserved_slug(reserved):
    with pytest.raises(ValidationError):
        BuilderPageCreatePayload(slug=reserved, title="x")


def test_seo_ignores_unknown_fields():
    seo = BuilderSeo(title="t", description="d", unexpected="x")  # type: ignore[call-arg]
    assert seo.title == "t"
    assert not hasattr(seo, "unexpected")
