"""
Servicio del CMS Builder (páginas).

Encapsula la persistencia de las páginas del constructor visual sobre la tabla
`tab_cms_content`, usando SQL parametrizado (mismo patrón probado que
`top_info_bar_service`). Cada página es una fila con
`nom_cms_content = 'builder_page:<slug>'` y un documento JSONB con borrador y
versión publicada.

Responsabilidades:
- listar páginas (panel),
- obtener detalle/borrador (editor) y versión publicada (storefront),
- crear página, guardar borrador, publicar y eliminar.
"""
import json
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from schemas.builder_schema import (
    BlockTemplateCreate,
    BuilderPageCreatePayload,
    BuilderPageSavePayload,
)

NOM_PREFIX = "builder_page:"
BLOCK_PREFIX = "block_template:"
HOME_SLUG = "home"


def _nom(slug: str) -> str:
    return f"{NOM_PREFIX}{slug}"


def _default_style() -> Dict[str, Any]:
    return {
        "bgColor": "transparent",
        "paddingTop": 0,
        "paddingBottom": 0,
        "marginTop": 0,
        "marginBottom": 0,
        "align": "left",
    }


def default_home_sections() -> List[Dict[str, Any]]:
    """Layout por defecto de la home (espejo del editor en frontend).

    Se usa como semilla/fallback la primera vez que se abre o guarda la home,
    para que el constructor y el storefront tengan contenido coherente sin
    necesidad de seed manual.
    """
    defaults: Dict[str, Dict[str, Any]] = {
        "banner": {"text": "Envíos gratis en compras sobre $50.000"},
        "header": {
            "brand": "Compralo",
            "nav_1": "Inicio",
            "nav_2": "Productos",
            "nav_3": "Descuentos",
            "nav_4": "Contacto",
            "search_placeholder": "Buscar productos...",
        },
        "hero": {
            "title": "Descubre las ofertas especiales",
            "subtitle": "Descubre productos increíbles a precios imbatibles. Calidad garantizada en cada compra.",
            "cta_text": "Ver productos",
            "cta_link": "/coleccion",
            "image": "",
        },
        "categories": {"title": "Categorías", "columns": 3},
        "product_grid": {"title": "Productos destacados", "columns": 4},
        "carousel": {
            "title": "Lo que dicen nuestros clientes",
            "quote_1": "Excelente experiencia, entrega muy rápida y todo tal como esperaba.",
            "author_1": "María P.",
            "quote_2": "La calidad es buenísima y la atención fue impecable en todo momento.",
            "author_2": "Carlos G.",
            "quote_3": "Precios justos y una tienda fácil de usar. Definitivamente volveré a comprar.",
            "author_3": "Andrea R.",
        },
        "footer": {"copyright": "© Compralo. Todos los derechos reservados."},
    }
    order = ["banner", "header", "hero", "categories", "product_grid", "carousel", "footer"]
    return [
        {
            "id": f"{section_type}-default",
            "type": section_type,
            "visible": True,
            "props": defaults[section_type],
            "style": _default_style(),
        }
        for section_type in order
    ]


def _empty_page_sections() -> List[Dict[str, Any]]:
    """Layout inicial para una página nueva (no-home)."""
    return [
        {
            "id": "hero-default",
            "type": "hero",
            "visible": True,
            "props": {
                "title": "Nueva página",
                "subtitle": "Edita esta sección desde el constructor.",
                "cta_text": "Ver productos",
                "cta_link": "/products",
                "image": "",
            },
            "style": _default_style(),
        }
    ]


def _row_to_doc(row) -> Optional[Dict[str, Any]]:
    """Convierte una fila de tab_cms_content a su documento + metadatos."""
    if row is None:
        return None
    des = row["des_cms_content"]
    if isinstance(des, str):
        des = json.loads(des)
    return {
        "doc": des or {},
        "num_version": int(row["num_version"] or 1),
        "ind_publicado": bool(row["ind_publicado"]),
        "updated_at": (row["fec_update"] or row["fec_insert"]),
    }


def _fetch_row(db: Session, slug: str):
    query = text(
        """
        SELECT id_cms_content, nom_cms_content, des_cms_content, num_version,
               ind_publicado, usr_insert, fec_insert, usr_update, fec_update
        FROM tab_cms_content
        WHERE nom_cms_content = :nom
        """
    )
    return db.execute(query, {"nom": _nom(slug)}).mappings().first()


def _default_doc(slug: str, title: str, is_home: bool, sections: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "slug": slug,
        "title": title,
        "is_home": is_home,
        "seo": {"title": None, "description": None, "og_image": None},
        "draft": {"sections": sections},
        "published": None,
    }


def _status(doc: Dict[str, Any], ind_publicado: bool) -> str:
    return "published" if (ind_publicado and doc.get("published")) else "draft"


# ---------------------------------------------------------------------------
# Lectura
# ---------------------------------------------------------------------------
def list_pages(db: Session) -> List[Dict[str, Any]]:
    """Lista todas las páginas del builder con metadatos para el panel."""
    query = text(
        """
        SELECT nom_cms_content, des_cms_content, num_version, ind_publicado,
               fec_insert, fec_update
        FROM tab_cms_content
        WHERE nom_cms_content LIKE :prefix
        ORDER BY fec_update DESC NULLS LAST, fec_insert DESC
        """
    )
    rows = db.execute(query, {"prefix": f"{NOM_PREFIX}%"}).mappings().all()

    pages: List[Dict[str, Any]] = []
    for row in rows:
        des = row["des_cms_content"]
        if isinstance(des, str):
            des = json.loads(des)
        des = des or {}
        slug = des.get("slug") or row["nom_cms_content"].replace(NOM_PREFIX, "", 1)
        draft_sections = (des.get("draft") or {}).get("sections") or []
        updated = row["fec_update"] or row["fec_insert"]
        pages.append(
            {
                "slug": slug,
                "title": des.get("title") or slug,
                "is_home": bool(des.get("is_home")),
                "status": _status(des, bool(row["ind_publicado"])),
                "num_version": int(row["num_version"] or 1),
                "section_count": len(draft_sections),
                "updated_at": updated.isoformat() if updated else None,
            }
        )

    # Garantiza que la home siempre aparezca, aunque aún no exista en DB.
    if not any(page["is_home"] for page in pages):
        pages.insert(
            0,
            {
                "slug": HOME_SLUG,
                "title": "Página Principal",
                "is_home": True,
                "status": "draft",
                "num_version": 1,
                "section_count": len(default_home_sections()),
                "updated_at": None,
            },
        )
    return pages


def get_page_detail(db: Session, slug: str) -> Optional[Dict[str, Any]]:
    """Detalle/borrador de una página para el editor.

    Para la home, si aún no existe, devuelve un documento por defecto (no
    persistido) para que el editor cargue contenido coherente.
    """
    parsed = _row_to_doc(_fetch_row(db, slug))
    if parsed is None:
        if slug == HOME_SLUG:
            doc = _default_doc(HOME_SLUG, "Página Principal", True, default_home_sections())
            return _detail_from_doc(doc, num_version=1, ind_publicado=False)
        return None
    return _detail_from_doc(parsed["doc"], parsed["num_version"], parsed["ind_publicado"])


def _detail_from_doc(doc: Dict[str, Any], num_version: int, ind_publicado: bool) -> Dict[str, Any]:
    draft = doc.get("draft") or {}
    return {
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "is_home": bool(doc.get("is_home")),
        "status": _status(doc, ind_publicado),
        "num_version": num_version,
        "seo": doc.get("seo") or {"title": None, "description": None, "og_image": None},
        "sections": draft.get("sections") or [],
        "has_published": bool(doc.get("published")),
    }


def get_public_page(db: Session, slug: str) -> Optional[Dict[str, Any]]:
    """Versión publicada para el storefront. None si no existe o no está publicada."""
    parsed = _row_to_doc(_fetch_row(db, slug))
    if parsed is None or not parsed["ind_publicado"]:
        return None
    doc = parsed["doc"]
    published = doc.get("published")
    if not published:
        return None
    return {
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "seo": doc.get("seo") or {"title": None, "description": None, "og_image": None},
        "sections": published.get("sections") or [],
    }


# ---------------------------------------------------------------------------
# Escritura
# ---------------------------------------------------------------------------
def _insert_row(db: Session, slug: str, doc: Dict[str, Any], usr: Decimal, published: bool) -> None:
    query = text(
        """
        INSERT INTO tab_cms_content
            (nom_cms_content, des_cms_content, num_version, ind_publicado, usr_insert, fec_insert)
        VALUES
            (:nom, CAST(:des AS JSONB), 1, :pub, :usr, NOW())
        """
    )
    db.execute(query, {"nom": _nom(slug), "des": json.dumps(doc), "pub": published, "usr": usr})


def _update_row(db: Session, slug: str, doc: Dict[str, Any], usr: Decimal,
                published: bool, bump_version: bool) -> None:
    version_sql = "num_version = num_version + 1," if bump_version else ""
    query = text(
        f"""
        UPDATE tab_cms_content
        SET des_cms_content = CAST(:des AS JSONB),
            {version_sql}
            ind_publicado = :pub,
            usr_update = :usr,
            fec_update = NOW()
        WHERE nom_cms_content = :nom
        """
    )
    db.execute(query, {"nom": _nom(slug), "des": json.dumps(doc), "pub": published, "usr": usr})


def create_page(db: Session, payload: BuilderPageCreatePayload, usr: Decimal) -> Dict[str, Any]:
    """Crea una página nueva (no publicada)."""
    try:
        if _fetch_row(db, payload.slug) is not None:
            raise ValueError(f"Ya existe una página con el slug '{payload.slug}'.")

        sections = [s.model_dump() for s in payload.sections] or _empty_page_sections()
        doc = {
            "slug": payload.slug,
            "title": payload.title,
            "is_home": False,
            "seo": payload.seo.model_dump(),
            "draft": {"sections": sections},
            "published": None,
        }
        _insert_row(db, payload.slug, doc, usr, published=False)
        db.commit()
        return {"slug": payload.slug}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear la página: {str(e)}")


def save_draft(db: Session, slug: str, payload: BuilderPageSavePayload, usr: Decimal) -> None:
    """Guarda el borrador de una página. Crea la home automáticamente si no existe."""
    try:
        parsed = _row_to_doc(_fetch_row(db, slug))
        sections = [s.model_dump() for s in payload.sections]

        if parsed is None:
            if slug != HOME_SLUG:
                raise ValueError(f"La página '{slug}' no existe.")
            doc = _default_doc(HOME_SLUG, payload.title, True, sections)
            doc["seo"] = payload.seo.model_dump()
            _insert_row(db, slug, doc, usr, published=False)
        else:
            doc = parsed["doc"]
            doc["slug"] = doc.get("slug") or slug
            doc["title"] = payload.title
            doc["seo"] = payload.seo.model_dump()
            doc.setdefault("is_home", slug == HOME_SLUG)
            doc["draft"] = {"sections": sections}
            _update_row(db, slug, doc, usr, published=parsed["ind_publicado"], bump_version=False)

        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al guardar el borrador: {str(e)}")


def publish_page(db: Session, slug: str, usr: Decimal) -> None:
    """Publica una página: copia el borrador a la versión publicada."""
    try:
        parsed = _row_to_doc(_fetch_row(db, slug))

        if parsed is None:
            if slug != HOME_SLUG:
                raise ValueError(f"La página '{slug}' no existe.")
            doc = _default_doc(HOME_SLUG, "Página Principal", True, default_home_sections())
            doc["published"] = {"sections": doc["draft"]["sections"]}
            _insert_row(db, slug, doc, usr, published=True)
        else:
            doc = parsed["doc"]
            draft_sections = (doc.get("draft") or {}).get("sections") or []
            doc["published"] = {"sections": draft_sections}
            _update_row(db, slug, doc, usr, published=True, bump_version=True)

        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al publicar la página: {str(e)}")


def delete_page(db: Session, slug: str, usr: Decimal) -> None:
    """Elimina una página. La home no se puede eliminar."""
    try:
        if slug == HOME_SLUG:
            raise ValueError("La página principal no se puede eliminar.")
        if _fetch_row(db, slug) is None:
            raise ValueError(f"La página '{slug}' no existe.")
        db.execute(
            text("DELETE FROM tab_cms_content WHERE nom_cms_content = :nom"),
            {"nom": _nom(slug)},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar la página: {str(e)}")


def list_published_slugs(db: Session) -> List[Dict[str, Any]]:
    """Slugs de páginas publicadas (para sitemap/SEO). Solo con versión publicada."""
    query = text(
        """
        SELECT nom_cms_content, des_cms_content, fec_update, fec_insert
        FROM tab_cms_content
        WHERE nom_cms_content LIKE :prefix AND ind_publicado = true
        """
    )
    rows = db.execute(query, {"prefix": f"{NOM_PREFIX}%"}).mappings().all()
    result: List[Dict[str, Any]] = []
    for row in rows:
        des = row["des_cms_content"]
        if isinstance(des, str):
            des = json.loads(des)
        des = des or {}
        if not des.get("published"):
            continue
        slug = des.get("slug") or row["nom_cms_content"].replace(NOM_PREFIX, "", 1)
        updated = row["fec_update"] or row["fec_insert"]
        result.append(
            {
                "slug": slug,
                "is_home": bool(des.get("is_home")),
                "updated_at": updated.isoformat() if updated else None,
            }
        )
    return result


# ---------------------------------------------------------------------------
# Bloques reutilizables ("Mis bloques")
# ---------------------------------------------------------------------------
def list_blocks(db: Session) -> List[Dict[str, Any]]:
    """Lista los bloques reutilizables guardados por el admin."""
    rows = db.execute(
        text(
            """
            SELECT nom_cms_content, des_cms_content, fec_insert
            FROM tab_cms_content
            WHERE nom_cms_content LIKE :prefix
            ORDER BY fec_insert DESC
            """
        ),
        {"prefix": f"{BLOCK_PREFIX}%"},
    ).mappings().all()

    blocks: List[Dict[str, Any]] = []
    for row in rows:
        des = row["des_cms_content"]
        if isinstance(des, str):
            des = json.loads(des)
        des = des or {}
        if des.get("section"):
            blocks.append(
                {
                    "id": des.get("id") or row["nom_cms_content"].replace(BLOCK_PREFIX, "", 1),
                    "name": des.get("name") or "Bloque",
                    "section": des["section"],
                }
            )
    return blocks


def create_block(db: Session, payload: BlockTemplateCreate, usr: Decimal) -> Dict[str, Any]:
    """Guarda un bloque reutilizable a partir de una sección."""
    try:
        block_id = uuid.uuid4().hex[:12]
        doc = {"id": block_id, "name": payload.name, "section": payload.section.model_dump()}
        db.execute(
            text(
                """
                INSERT INTO tab_cms_content
                    (nom_cms_content, des_cms_content, num_version, ind_publicado, usr_insert, fec_insert)
                VALUES
                    (:nom, CAST(:des AS JSONB), 1, true, :usr, NOW())
                """
            ),
            {"nom": f"{BLOCK_PREFIX}{block_id}", "des": json.dumps(doc), "usr": usr},
        )
        db.commit()
        return {"id": block_id}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al guardar el bloque: {str(e)}")


def delete_block(db: Session, block_id: str, usr: Decimal) -> None:
    """Elimina un bloque reutilizable."""
    try:
        db.execute(
            text("DELETE FROM tab_cms_content WHERE nom_cms_content = :nom"),
            {"nom": f"{BLOCK_PREFIX}{block_id}"},
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar el bloque: {str(e)}")
