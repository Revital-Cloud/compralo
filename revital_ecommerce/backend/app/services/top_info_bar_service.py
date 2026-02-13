"""
Servicio para la barra informativa superior (Top Info Bar).

Usa tab_cms_content con nom_cms_content = 'top_info_bar'.
des_cms_content (JSONB) almacena: des_mensaje, ind_visible, color_fondo, color_texto, fec_inicio, fec_fin.
ind_publicado equivale a activo.
"""
import json
from datetime import date
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from schemas.top_info_bar_schema import TopInfoBarPayload

TOP_INFO_BAR_NAME = "top_info_bar"


def _parse_payload_from_json(des_cms_content: Any) -> dict:
    """Extrae campos del JSONB des_cms_content con defaults."""
    if not des_cms_content:
        return {}
    if isinstance(des_cms_content, str):
        try:
            data = json.loads(des_cms_content)
        except (json.JSONDecodeError, TypeError):
            return {}
    else:
        data = dict(des_cms_content) if des_cms_content else {}
    return {
        "des_mensaje": data.get("des_mensaje") or "",
        "ind_visible": data.get("ind_visible", True),
        "color_fondo": data.get("color_fondo"),
        "color_texto": data.get("color_texto"),
        "fec_inicio": data.get("fec_inicio"),
        "fec_fin": data.get("fec_fin"),
        "boton_texto": data.get("boton_texto"),
        "boton_url": data.get("boton_url"),
        "boton_color_fondo": data.get("boton_color_fondo"),
        "boton_color_texto": data.get("boton_color_texto"),
    }


def _is_vigente(payload: dict) -> bool:
    """Comprueba ind_visible y fechas de vigencia."""
    if payload.get("ind_visible") is False:
        return False
    today = date.today().isoformat()
    fec_inicio = payload.get("fec_inicio")
    fec_fin = payload.get("fec_fin")
    if fec_inicio and today < fec_inicio:
        return False
    if fec_fin and today > fec_fin:
        return False
    return True


def get_active_bar(db: Session) -> Optional[dict]:
    """
    Obtiene la barra activa y vigente para el endpoint público.
    Retorna un dict con des_mensaje, color_fondo, color_texto o None.
    """
    import logging
    logger = logging.getLogger(__name__)
    try:
        query = text("""
            SELECT id_cms_content, des_cms_content
            FROM tab_cms_content
            WHERE nom_cms_content = :nom AND ind_publicado = true
            LIMIT 1
        """)
        result = db.execute(query, {"nom": TOP_INFO_BAR_NAME})
        row = result.mappings().first()
        logger.info(f"[TopInfoBar Service] Query result: {row is not None}")
        if not row:
            logger.info("[TopInfoBar Service] No row found or ind_publicado=false")
            return None
        payload = _parse_payload_from_json(row["des_cms_content"])
        logger.info(f"[TopInfoBar Service] Parsed payload: {payload}")
        if not payload.get("des_mensaje"):
            logger.info("[TopInfoBar Service] No des_mensaje in payload")
            return None
        is_vigente = _is_vigente(payload)
        logger.info(f"[TopInfoBar Service] Is vigente: {is_vigente}")
        if not is_vigente:
            logger.info("[TopInfoBar Service] Bar not vigente (ind_visible=false or dates)")
            return None
        result_dict = {
            "des_mensaje": payload["des_mensaje"],
            "color_fondo": payload.get("color_fondo"),
            "color_texto": payload.get("color_texto"),
            "boton_texto": payload.get("boton_texto"),
            "boton_url": payload.get("boton_url"),
            "boton_color_fondo": payload.get("boton_color_fondo"),
            "boton_color_texto": payload.get("boton_color_texto"),
        }
        logger.info(f"[TopInfoBar Service] Returning: {result_dict}")
        return result_dict
    except Exception as e:
        logger.error(f"[TopInfoBar Service] Error: {str(e)}")
        db.rollback()
        raise


def _parse_optional_date(s: Optional[str]) -> Optional[date]:
    """Convierte string ISO a date o retorna None."""
    if not s:
        return None
    try:
        return date.fromisoformat(s) if isinstance(s, str) else s
    except (ValueError, TypeError):
        return None


def get_bar(db: Session) -> Optional[dict]:
    """
    Obtiene la configuración de la barra para admin (GET /top-info-bar).
    Retorna el registro completo parseado o None si no existe.
    """
    try:
        query = text("""
            SELECT id_cms_content, nom_cms_content, des_cms_content, num_version, ind_publicado
            FROM tab_cms_content
            WHERE nom_cms_content = :nom
            LIMIT 1
        """)
        result = db.execute(query, {"nom": TOP_INFO_BAR_NAME})
        row = result.mappings().first()
        if not row:
            return None
        payload = _parse_payload_from_json(row["des_cms_content"])
        return {
            "id_cms_content": row["id_cms_content"],
            "nom_cms_content": row["nom_cms_content"],
            "num_version": row["num_version"],
            "ind_activo": bool(row["ind_publicado"]),
            "des_mensaje": payload.get("des_mensaje", ""),
            "ind_visible": payload.get("ind_visible", True),
            "color_fondo": payload.get("color_fondo"),
            "color_texto": payload.get("color_texto"),
            "fec_inicio": _parse_optional_date(payload.get("fec_inicio")),
            "fec_fin": _parse_optional_date(payload.get("fec_fin")),
            "boton_texto": payload.get("boton_texto"),
            "boton_url": payload.get("boton_url"),
            "boton_color_fondo": payload.get("boton_color_fondo"),
            "boton_color_texto": payload.get("boton_color_texto"),
        }
    except Exception:
        db.rollback()
        raise


def upsert_bar(db: Session, data: TopInfoBarPayload, id_usuario: Decimal) -> None:
    """
    Crea o actualiza el registro top_info_bar.
    Si existe: UPDATE des_cms_content, ind_publicado, num_version+1, usr_update, fec_update.
    Si no existe: INSERT.
    """
    try:
        des_cms = {
            "des_mensaje": data.des_mensaje,
            "ind_visible": data.ind_visible,
            "color_fondo": data.color_fondo,
            "color_texto": data.color_texto,
            "fec_inicio": data.fec_inicio.isoformat() if data.fec_inicio else None,
            "fec_fin": data.fec_fin.isoformat() if data.fec_fin else None,
            "boton_texto": data.boton_texto,
            "boton_url": data.boton_url,
            "boton_color_fondo": data.boton_color_fondo,
            "boton_color_texto": data.boton_color_texto,
        }
        des_cms_json = json.dumps(des_cms)

        # Comprobar si existe
        check = text("""
            SELECT id_cms_content, num_version FROM tab_cms_content WHERE nom_cms_content = :nom
        """)
        row = db.execute(check, {"nom": TOP_INFO_BAR_NAME}).mappings().first()

        if row:
            update_q = text("""
                UPDATE tab_cms_content SET
                    des_cms_content = :des_cms_content,
                    num_version = num_version + 1,
                    ind_publicado = :ind_publicado,
                    usr_update = :usr_update,
                    fec_update = NOW()
                WHERE nom_cms_content = :nom
            """)
            db.execute(update_q, {
                "nom": TOP_INFO_BAR_NAME,
                "des_cms_content": des_cms_json,
                "ind_publicado": data.ind_activo,
                "usr_update": id_usuario,
            })
        else:
            insert_q = text("""
                INSERT INTO tab_cms_content (nom_cms_content, des_cms_content, num_version, ind_publicado, usr_insert, fec_insert)
                VALUES (:nom, :des_cms_content, 1, :ind_publicado, :usr_insert, NOW())
            """)
            db.execute(insert_q, {
                "nom": TOP_INFO_BAR_NAME,
                "des_cms_content": des_cms_json,
                "ind_publicado": data.ind_activo,
                "usr_insert": id_usuario,
            })
        db.commit()
    except Exception:
        db.rollback()
        raise
