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
import json
import re
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from services.groq_service import chat_completion
from services.admin_ai_instructions import ACTION_EXTRACTION_SYSTEM

# Nombres de acciones permitidas (whitelist)
ACTION_CREATE_BRAND = "create_brand"
ACTION_CREATE_PROVIDER = "create_provider"
# Futuro: create_discount, update_info_bar, etc.


def parse_action_from_message(message: str) -> dict[str, Any] | None:
    """
    Usa el LLM para extraer action + params del mensaje.
    Devuelve {"action": "...", "params": {...}} o None si no se reconoce acción.
    """
    if not message or len(message) > 1000:
        return None
    try:
        out = chat_completion(
            user_content=message.strip(),
            system_content=ACTION_EXTRACTION_SYSTEM,
            temperature=0.1,
        )
        out = (out or "").strip()
        # Quitar posibles bloques markdown
        if out.startswith("```"):
            out = re.sub(r"^```\w*\n?", "", out)
            out = re.sub(r"\n?```\s*$", "", out)
        data = json.loads(out)
        if not data or not isinstance(data, dict):
            return None
        action = data.get("action")
        params = data.get("params")
        if not action or not isinstance(params, dict):
            return None
        if action not in (ACTION_CREATE_BRAND, ACTION_CREATE_PROVIDER):
            return None
        return {"action": action, "params": params}
    except (json.JSONDecodeError, TypeError):
        return None


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
    if not nom:
        return "Para crear una marca necesito el nombre. Por ejemplo: crea la marca Nike."
    try:
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
    return "Acción no permitida o no implementada."
