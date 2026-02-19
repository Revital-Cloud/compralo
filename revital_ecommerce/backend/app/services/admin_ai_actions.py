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
ACTION_LIST_CATEGORIES = "list_categories"
ACTION_CREATE_CATEGORY = "create_category"
ACTION_CREATE_DISCOUNT = "create_discount"


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


def _execute_list_categories(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista categorías existentes. Si parent_id está presente, filtra por ese padre."""
    from services import category_service

    parent_id = params.get("parent_id")
    try:
        all_cats = category_service.get_categories(db)
        all_cats = [dict(c) for c in all_cats]  # Asegurar que son dicts
        
        if parent_id is not None:
            # Listar solo hijos de un parent_id específico
            parent_decimal = Decimal(str(parent_id))
            filtered = [
                c for c in all_cats
                if c.get("parent_id") == parent_decimal
            ]
            if not filtered:
                return f"No hay categorías hijas de la categoría con ID {parent_id}."
            lines = "\n".join([f"- {c.get('name')} (ID: {c.get('id')})" for c in filtered])
            return f"Categorías hijas de ID {parent_id}:\n{lines}"
        else:
            # Listar todas las categorías agrupadas por nivel
            roots = [c for c in all_cats if c.get("parent_id") is None]
            
            # Líneas: categorías cuyo parent_id es una categoría raíz
            root_ids = {r.get("id") for r in roots}
            lines = [c for c in all_cats if c.get("parent_id") in root_ids]
            
            # Sublíneas: categorías cuyo parent_id es una línea
            line_ids = {l.get("id") for l in lines}
            sublines = [c for c in all_cats if c.get("parent_id") in line_ids]
            
            result = []
            if roots:
                result.append("Categorías raíz:")
                for r in roots:
                    result.append(f"  - {r.get('name')} (ID: {r.get('id')})")
            if lines:
                result.append("\nLíneas:")
                for l in lines:
                    parent_name = next((r.get("name") for r in roots if r.get("id") == l.get("parent_id")), "N/A")
                    result.append(f"  - {l.get('name')} (ID: {l.get('id')}, padre: {parent_name})")
            if sublines:
                result.append("\nSublíneas:")
                for s in sublines:
                    parent_name = next((l.get("name") for l in lines if l.get("id") == s.get("parent_id")), "N/A")
                    result.append(f"  - {s.get('name')} (ID: {s.get('id')}, padre: {parent_name})")
            return "\n".join(result) if result else "No hay categorías registradas."
    except Exception as e:
        return f"Error al listar categorías: {str(e)}"


def _execute_create_category(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Valida params y crea la categoría usando el servicio existente."""
    from schemas.category_schema import CategoryCreate
    from services import category_service

    name = _sanitize_string(params.get("name"), max_len=200)
    if not name or name.lower() in {"nombre de la categoría", "name of the category"}:
        return "Para crear una categoría necesito el nombre real. Por ejemplo: crea la categoría Electrónica."
    
    parent_id = params.get("parent_id")
    parent_decimal = None
    if parent_id is not None:
        try:
            parent_decimal = Decimal(str(parent_id))
        except Exception:
            return f"El parent_id '{parent_id}' no es válido."

    try:
        # Verificar si ya existe una categoría con ese nombre (case-insensitive).
        # Si hay parent_id, verificar dentro de ese nivel; si no, verificar en raíz.
        exists_q = text(
            "SELECT 1 FROM tab_categories WHERE LOWER(name) = LOWER(:name) "
            "AND (COALESCE(parent_id, 0) = COALESCE(:parent_id, 0)) LIMIT 1"
        )
        exists_params = {"name": name, "parent_id": parent_decimal}
        if db.execute(exists_q, exists_params).first():
            tipo = "categoría raíz" if parent_id is None else f"categoría hija de {parent_id}"
            return f"La {tipo} «{name}» ya existe, no he creado una nueva."

        category = CategoryCreate(name=name, parent_id=parent_decimal)
        category_id = category_service.create_category(
            db, category, Decimal(str(user_id)) if isinstance(user_id, str) else user_id
        )
        tipo = "categoría raíz" if parent_id is None else f"categoría hija de {parent_id}"
        return f"{tipo.capitalize()} «{name}» creada correctamente (ID: {category_id})."
    except Exception as e:
        return f"No se pudo crear la categoría: {str(e)}"


def _execute_create_discount(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Valida params y crea el descuento usando el servicio existente."""
    from schemas.discount_schema import DiscountCreate
    from services import discount_service

    nom = _sanitize_string(params.get("nom_descuento"), max_len=200)
    des = _sanitize_string(params.get("des_descuento"), max_len=1000)
    tipo_calculo = params.get("tipo_calculo")
    
    if not nom:
        return "Para crear un descuento necesito el nombre."
    if not des:
        return "Para crear un descuento necesito la descripción."
    if tipo_calculo is None:
        return "Necesito saber si el descuento es porcentaje (true) o monto fijo (false)."

    val_porce = params.get("val_porce_descuento")
    val_monto = params.get("val_monto_descuento")
    
    if tipo_calculo and (val_porce is None or val_porce <= 0):
        return "Si el descuento es porcentaje, necesito un valor mayor a 0."
    if not tipo_calculo and (val_monto is None or val_monto <= 0):
        return "Si el descuento es monto fijo, necesito un valor mayor a 0."

    codigo = _sanitize_string(params.get("codigo_descuento"), max_len=50) or None
    if codigo:
        # Verificar si ya existe un descuento con ese código
        exists_q = text(
            "SELECT 1 FROM tab_descuentos WHERE UPPER(codigo_descuento) = UPPER(:codigo) LIMIT 1"
        )
        if db.execute(exists_q, {"codigo": codigo}).first():
            return f"Ya existe un descuento con el código «{codigo}», no he creado uno nuevo."

    aplica_a = _sanitize_string(params.get("aplica_a"), max_len=50) or "todos"
    min_valor = params.get("min_valor_pedido")
    fec_inicio = params.get("fec_inicio")
    fec_fin = params.get("fec_fin")

    try:
        discount = DiscountCreate(
            nom_descuento=nom,
            des_descuento=des,
            tipo_calculo=bool(tipo_calculo),
            val_porce_descuento=Decimal(str(val_porce)) if tipo_calculo and val_porce else None,
            val_monto_descuento=Decimal(str(val_monto)) if not tipo_calculo and val_monto else None,
            codigo_descuento=codigo,
            aplica_a=aplica_a,
            min_valor_pedido=Decimal(str(min_valor)) if min_valor else None,
            fec_inicio=fec_inicio,
            fec_fin=fec_fin,
            ind_activo=True,
        )
        discount_id = discount_service.create_discount(
            db, discount, Decimal(str(user_id)) if isinstance(user_id, str) else user_id
        )
        tipo_texto = f"{val_porce}%" if tipo_calculo else f"${val_monto}"
        return f"Descuento «{nom}» creado correctamente ({tipo_texto})."
    except Exception as e:
        return f"No se pudo crear el descuento: {str(e)}"


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
    if action_id == ACTION_LIST_CATEGORIES:
        return _execute_list_categories(db, params, user_id)
    if action_id == ACTION_CREATE_CATEGORY:
        return _execute_create_category(db, params, user_id)
    if action_id == ACTION_CREATE_DISCOUNT:
        return _execute_create_discount(db, params, user_id)
    return "Acción no permitida o no implementada."
