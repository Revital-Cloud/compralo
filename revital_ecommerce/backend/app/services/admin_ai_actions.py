"""
Acciones ejecutables desde el chat de IA admin.

Flujo seguro:
1. El usuario escribe en lenguaje natural (ej: "crea la marca Nike").
2. parse_action_from_message() usa el LLM para extraer solo action + params (JSON).
3. execute_action() valida params contra un whitelist y llama a los servicios existentes.
4. Nunca se ejecuta nada sin validación; el LLM solo sugiere acción y parámetros.

Para añadir más acciones (descuentos, barra informativa, etc.):
- Añadir la acción en admin_ai_instructions.ACTION_EXTRACTION_SYSTEM.
- Añadir la constante ACTION_* y el branch en parse_action_from_message (whitelist).
- Implementar _execute_<action>() con validación de params y llamada al servicio existente.
- Registrar en execute_action() y añadir keywords en admin_ai_instructions.INTENT_ACTION.
"""
import re
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import text

# Nombres de acciones permitidas (whitelist)
ACTION_CREATE_BRAND = "create_brand"
ACTION_CREATE_PROVIDER = "create_provider"
ACTION_UPDATE_TOP_INFO_BAR = "update_top_info_bar"
# Futuro: create_discount, etc.


def _sanitize_string(value: Any, max_len: int = 500) -> str:
    """Normaliza un string para evitar inyecciones; limita longitud."""
    if value is None:
        return ""
    s = str(value).strip()
    return s[:max_len] if s else ""


def _execute_create_brand(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Valida params y crea la marca usando el servicio existente."""
    from schemas.brand_schema import BrandCreate
    from services.brand_service import create_brand as svc_create_brand

    nom = _sanitize_string(params.get("nom_marca"), max_len=200)
    # Evitar placeholders genéricos que el modelo pueda inventar
    if not nom or nom.lower() in {"nombre de la marca", "name of the brand"}:
        return "Para crear una marca necesito el nombre real. Por ejemplo: crea la marca Nike."
    try:
        # Comprobar si ya existe una marca con ese nombre (case-insensitive).
        exists_q = text(
            "SELECT 1 FROM tab_marcas WHERE LOWER(nom_marca) = LOWER(:nom_marca) LIMIT 1"
        )
        if db.execute(exists_q, {"nom_marca": nom}).first():
            return f"La marca «{nom}» ya existe, no he creado una nueva."

        brand = BrandCreate(nom_marca=nom)
        svc_create_brand(db, brand, str(user_id))
        return f"Marca «{nom}» creada correctamente."
    except Exception as e:
        return f"No se pudo crear la marca: {str(e)}"


def _execute_create_provider(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Valida params y crea el proveedor usando el servicio existente."""
    from schemas.provider_schema import ProviderCreate
    from services.provider_service import create_provider as svc_create_provider

    nom = _sanitize_string(params.get("nom_proveedor"), max_len=200)
    email = _sanitize_string(params.get("email"), max_len=320)
    tel = params.get("tel_proveedor")
    if not nom:
        return "Para crear un proveedor necesito al menos el nombre."
    if not email or "@" not in email:
        return "Necesito un email válido para el proveedor."
    try:
        tel_decimal = Decimal(str(tel)) if tel is not None else Decimal(0)
    except Exception:
        tel_decimal = Decimal(0)
    try:
        provider = ProviderCreate(
            nom_proveedor=nom,
            email=email,
            tel_proveedor=tel_decimal,
        )
        svc_create_provider(db, provider, Decimal(str(user_id)) if isinstance(user_id, str) else user_id)
        return f"Proveedor «{nom}» creado correctamente."
    except Exception as e:
        return f"No se pudo crear el proveedor: {str(e)}"


def _execute_update_top_info_bar(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Actualiza la barra informativa superior usando top_info_bar_service."""
    from schemas.top_info_bar_schema import TopInfoBarPayload
    from services import top_info_bar_service

    des_mensaje = _sanitize_string(params.get("des_mensaje"), max_len=2000)
    if not des_mensaje:
        return "Para actualizar la barra necesito el mensaje a mostrar."

    # Normalizamos algunos nombres de color en español a nombres CSS en inglés.
    spanish_to_css = {
        "verde": "green",
        "rojo": "red",
        "azul": "blue",
        "amarillo": "yellow",
        "negro": "black",
        "blanco": "white",
        "gris": "gray",
    }

    def _normalize_color(v: Any) -> Any:
        if not isinstance(v, str):
            return v
        raw = v.strip()
        if not raw:
            return None
        lower = raw.lower()
        if lower in spanish_to_css:
            return spanish_to_css[lower]
        return raw

    def _to_bool(v: Any, default: bool) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if v_lower in {"true", "sí", "si", "1"}:
                return True
            if v_lower in {"false", "no", "0"}:
                return False
        return default

    ind_activo = _to_bool(params.get("ind_activo"), True)
    ind_visible = _to_bool(params.get("ind_visible"), True)

    color_fondo = _normalize_color(params.get("color_fondo"))
    color_texto = _normalize_color(params.get("color_texto"))
    boton_color_fondo = _normalize_color(params.get("boton_color_fondo"))
    boton_color_texto = _normalize_color(params.get("boton_color_texto"))

    boton_texto = _sanitize_string(params.get("boton_texto"), max_len=80) or None
    boton_url = _sanitize_string(params.get("boton_url"), max_len=2000) or None

    fec_inicio = params.get("fec_inicio")
    fec_fin = params.get("fec_fin")

    try:
        payload = TopInfoBarPayload(
            des_mensaje=des_mensaje,
            ind_activo=ind_activo,
            ind_visible=ind_visible,
            color_fondo=color_fondo,
            color_texto=color_texto,
            fec_inicio=fec_inicio,
            fec_fin=fec_fin,
            boton_texto=boton_texto,
            boton_url=boton_url,
            boton_color_fondo=boton_color_fondo,
            boton_color_texto=boton_color_texto,
        )
        user_decimal = Decimal(str(user_id)) if not isinstance(user_id, Decimal) else user_id
        top_info_bar_service.upsert_bar(db, payload, user_decimal)
        return "La barra informativa superior se actualizó correctamente."
    except Exception as e:
        return f"No se pudo actualizar la barra informativa: {str(e)}"


def execute_action(
    db: Session,
    action_id: str,
    params: dict,
    user_id: str | Decimal,
) -> str:
    """
    Ejecuta una acción permitida. Valida y delega en el servicio correspondiente.
    Devuelve mensaje de éxito o error para mostrar al usuario.
    """
    if action_id == ACTION_CREATE_BRAND:
        return _execute_create_brand(db, params, user_id)
    if action_id == ACTION_CREATE_PROVIDER:
        return _execute_create_provider(db, params, user_id)
    if action_id == ACTION_UPDATE_TOP_INFO_BAR:
        return _execute_update_top_info_bar(db, params, user_id)
    return "Acción no permitida o no implementada."
