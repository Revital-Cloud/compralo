"""
Esquemas del Theme global + chrome (header/footer) del CMS Builder.

El theme global controla tokens visuales (colores, tipografías, radius, logo) y el
"chrome" del storefront (marca + navegación del header, copyright + enlaces del
footer). Se persiste como una única fila en `tab_cms_content` con
`nom_cms_content = 'site_theme'`, con borrador y versión publicada en el JSONB.
"""
from __future__ import annotations

import re
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

_HEX_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")


def _validate_hex(value: str) -> str:
    v = value.strip()
    if not _HEX_RE.match(v):
        raise ValueError(f"Color inválido: '{value}'. Usa formato hex (#rgb, #rrggbb).")
    return v


class ThemeColors(BaseModel):
    primary: str = "#ec2538"
    secondary: str = "#fec806"
    accent: str = "#FF8C00"
    background: str = "#F5F5F5"
    foreground: str = "#000000"
    dark_background: str = "#0b1220"
    dark_foreground: str = "#FFFFFF"

    @field_validator(
        "primary", "secondary", "accent", "background", "foreground",
        "dark_background", "dark_foreground",
    )
    @classmethod
    def _hex(cls, v: str) -> str:
        return _validate_hex(v)

    class Config:
        extra = "ignore"


class ThemeFonts(BaseModel):
    heading: str = Field("Geist", max_length=80)
    body: str = Field("Geist", max_length=80)

    class Config:
        extra = "ignore"


class ThemeTokens(BaseModel):
    colors: ThemeColors = Field(default_factory=ThemeColors)
    radius: str = Field("0.625rem", max_length=20)
    fonts: ThemeFonts = Field(default_factory=ThemeFonts)
    logo_url: Optional[str] = Field(None, max_length=2000)

    class Config:
        extra = "ignore"


class NavItem(BaseModel):
    text: str = Field(..., min_length=1, max_length=60)
    href: str = Field(..., min_length=1, max_length=2000)

    class Config:
        extra = "ignore"


class HeaderConfig(BaseModel):
    brand: str = Field("Compralo", min_length=1, max_length=60)
    nav: List[NavItem] = Field(default_factory=list)

    class Config:
        extra = "ignore"


class FooterLink(BaseModel):
    text: str = Field(..., min_length=1, max_length=60)
    href: str = Field(..., min_length=1, max_length=2000)

    class Config:
        extra = "ignore"


class FooterConfig(BaseModel):
    copyright: str = Field("© Compralo. Todos los derechos reservados.", max_length=200)
    links: List[FooterLink] = Field(default_factory=list)

    class Config:
        extra = "ignore"


class SiteThemePayload(BaseModel):
    """Cuerpo del PUT: guarda el borrador del theme + chrome."""

    theme: ThemeTokens = Field(default_factory=ThemeTokens)
    header: HeaderConfig = Field(default_factory=HeaderConfig)
    footer: FooterConfig = Field(default_factory=FooterConfig)


class SiteThemeDetail(SiteThemePayload):
    """Respuesta admin: incluye estado y versión."""

    status: Literal["published", "draft"]
    num_version: int
    has_published: bool


class SiteThemePublic(SiteThemePayload):
    """Respuesta pública para el storefront (solo lo publicado)."""

    pass
