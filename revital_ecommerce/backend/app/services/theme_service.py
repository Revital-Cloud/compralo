"""
Servicio del Theme global + chrome del CMS Builder.

Persiste el theme (tokens + header + footer) como una única fila en
`tab_cms_content` (`nom_cms_content = 'site_theme'`), con borrador y versión
publicada en el JSONB. Mismo patrón de SQL parametrizado que `builder_service` y
`top_info_bar_service`.
"""
import json
from decimal import Decimal
from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from schemas.theme_schema import SiteThemePayload

NOM = "site_theme"


def default_theme() -> Dict[str, Any]:
    """Theme por defecto (espejo de los valores actuales del storefront)."""
    return {
        "theme": {
            "colors": {
                "primary": "#ec2538",
                "secondary": "#fec806",
                "accent": "#FF8C00",
                "background": "#F5F5F5",
                "foreground": "#000000",
                "dark_background": "#0b1220",
                "dark_foreground": "#FFFFFF",
            },
            "radius": "0.625rem",
            "fonts": {"heading": "Geist", "body": "Geist"},
            "logo_url": None,
        },
        "header": {
            "brand": "Compralo",
            "nav": [
                {"text": "Inicio", "href": "/"},
                {"text": "Productos", "href": "/products"},
                {"text": "Categorías", "href": "/categories"},
                {"text": "Contacto", "href": "/contacto"},
            ],
        },
        "footer": {
            "copyright": "© Compralo. Todos los derechos reservados.",
            "links": [],
        },
    }


def _fetch_row(db: Session):
    query = text(
        """
        SELECT id_cms_content, nom_cms_content, des_cms_content, num_version,
               ind_publicado, fec_insert, fec_update
        FROM tab_cms_content
        WHERE nom_cms_content = :nom
        """
    )
    return db.execute(query, {"nom": NOM}).mappings().first()


def _parse(row) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    des = row["des_cms_content"]
    if isinstance(des, str):
        des = json.loads(des)
    return {
        "doc": des or {},
        "num_version": int(row["num_version"] or 1),
        "ind_publicado": bool(row["ind_publicado"]),
    }


def _insert(db: Session, doc: Dict[str, Any], usr: Decimal, published: bool) -> None:
    db.execute(
        text(
            """
            INSERT INTO tab_cms_content
                (nom_cms_content, des_cms_content, num_version, ind_publicado, usr_insert, fec_insert)
            VALUES
                (:nom, CAST(:des AS JSONB), 1, :pub, :usr, NOW())
            """
        ),
        {"nom": NOM, "des": json.dumps(doc), "pub": published, "usr": usr},
    )


def _update(db: Session, doc: Dict[str, Any], usr: Decimal, published: bool, bump: bool) -> None:
    version_sql = "num_version = num_version + 1," if bump else ""
    db.execute(
        text(
            f"""
            UPDATE tab_cms_content
            SET des_cms_content = CAST(:des AS JSONB),
                {version_sql}
                ind_publicado = :pub,
                usr_update = :usr,
                fec_update = NOW()
            WHERE nom_cms_content = :nom
            """
        ),
        {"nom": NOM, "des": json.dumps(doc), "pub": published, "usr": usr},
    )


def get_theme_detail(db: Session) -> Dict[str, Any]:
    """Borrador del theme para el editor. Si no existe, devuelve el default."""
    parsed = _parse(_fetch_row(db))
    if parsed is None:
        draft = default_theme()
        return {**draft, "status": "draft", "num_version": 1, "has_published": False}
    doc = parsed["doc"]
    draft = doc.get("draft") or default_theme()
    has_published = bool(doc.get("published"))
    status = "published" if (parsed["ind_publicado"] and has_published) else "draft"
    return {**draft, "status": status, "num_version": parsed["num_version"], "has_published": has_published}


def get_public_theme(db: Session) -> Optional[Dict[str, Any]]:
    """Theme publicado para el storefront. None si no hay nada publicado."""
    parsed = _parse(_fetch_row(db))
    if parsed is None or not parsed["ind_publicado"]:
        return None
    published = (parsed["doc"] or {}).get("published")
    return published or None


def save_theme_draft(db: Session, payload: SiteThemePayload, usr: Decimal) -> None:
    """Guarda el borrador del theme (crea la fila si no existe)."""
    try:
        parsed = _parse(_fetch_row(db))
        draft = payload.model_dump()
        if parsed is None:
            _insert(db, {"draft": draft, "published": None}, usr, published=False)
        else:
            doc = parsed["doc"]
            doc["draft"] = draft
            _update(db, doc, usr, published=parsed["ind_publicado"], bump=False)
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al guardar el theme: {str(e)}")


def publish_theme(db: Session, usr: Decimal) -> None:
    """Publica el theme: copia el borrador a la versión publicada."""
    try:
        parsed = _parse(_fetch_row(db))
        if parsed is None:
            draft = default_theme()
            _insert(db, {"draft": draft, "published": draft}, usr, published=True)
        else:
            doc = parsed["doc"]
            draft = doc.get("draft") or default_theme()
            doc["published"] = draft
            _update(db, doc, usr, published=True, bump=True)
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al publicar el theme: {str(e)}")
