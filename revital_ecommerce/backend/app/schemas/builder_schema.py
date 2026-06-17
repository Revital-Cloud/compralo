"""
Módulo de Esquemas del CMS Builder (páginas).

Define los modelos Pydantic para el constructor visual de páginas. Cada página se
persiste como una fila en `tab_cms_content` con `nom_cms_content = 'builder_page:<slug>'`
y el documento completo (borrador + publicado) vive en el JSONB `des_cms_content`.

Estructura del documento almacenado en `des_cms_content`:

    {
      "slug": "home",
      "title": "Página Principal",
      "is_home": true,
      "seo": { "title": "...", "description": "...", "og_image": "..." },
      "draft": { "sections": [ <BuilderSection>, ... ] },
      "published": { "sections": [ ... ] } | null
    }

El storefront consume `published.sections`; el editor consume `draft.sections`.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Tipos de sección soportados por el editor. Se mantiene permisivo (str) en el modelo
# de almacenamiento para no romper el guardado si el editor agrega tipos nuevos.
BuilderSectionType = Literal[
    "header",
    "banner",
    "hero",
    "categories",
    "product_grid",
    "carousel",
    "footer",
]

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class BuilderSectionStyle(BaseModel):
    """Estilos por sección (overrides visuales). Permisivo con valores por defecto."""

    bgColor: str = "transparent"
    paddingTop: float = 0
    paddingBottom: float = 0
    marginTop: float = 0
    marginBottom: float = 0
    align: Literal["left", "center", "right"] = "left"

    class Config:
        extra = "allow"


class BuilderSection(BaseModel):
    """Una sección del lienzo: tipo, contenido (props) y estilos."""

    id: str = Field(..., min_length=1, max_length=120)
    type: str = Field(..., min_length=1, max_length=40)
    visible: bool = True
    props: Dict[str, Any] = Field(default_factory=dict)
    style: BuilderSectionStyle = Field(default_factory=BuilderSectionStyle)

    class Config:
        extra = "allow"


class BuilderSeo(BaseModel):
    """Metadatos SEO por página."""

    title: Optional[str] = Field(None, max_length=160)
    description: Optional[str] = Field(None, max_length=320)
    og_image: Optional[str] = Field(None, max_length=2000)

    class Config:
        extra = "ignore"


class BuilderPageSavePayload(BaseModel):
    """Cuerpo del PUT: guarda el borrador de una página existente."""

    title: str = Field(..., min_length=1, max_length=120)
    seo: BuilderSeo = Field(default_factory=BuilderSeo)
    sections: List[BuilderSection] = Field(default_factory=list)


class BuilderPageCreatePayload(BaseModel):
    """Cuerpo del POST: crea una página nueva (con secciones opcionales)."""

    slug: str = Field(..., min_length=1, max_length=80)
    title: str = Field(..., min_length=1, max_length=120)
    seo: BuilderSeo = Field(default_factory=BuilderSeo)
    sections: List[BuilderSection] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def _validate_slug(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not SLUG_RE.match(normalized):
            raise ValueError(
                "El slug solo puede contener minúsculas, números y guiones (ej: 'sobre-nosotros')."
            )
        if normalized in {"home", "p", "api"}:
            raise ValueError("Ese slug está reservado.")
        return normalized


class BuilderPageSummary(BaseModel):
    """Item de la lista de páginas del panel admin."""

    slug: str
    title: str
    is_home: bool
    status: Literal["published", "draft"]
    num_version: int
    section_count: int
    updated_at: Optional[str] = None


class BuilderPageDetail(BaseModel):
    """Detalle completo de una página para el editor (incluye borrador)."""

    slug: str
    title: str
    is_home: bool
    status: Literal["published", "draft"]
    num_version: int
    seo: BuilderSeo
    sections: List[BuilderSection]
    has_published: bool


class BuilderPagePublic(BaseModel):
    """Respuesta pública para el storefront: solo lo publicado."""

    slug: str
    title: str
    seo: BuilderSeo
    sections: List[BuilderSection]
