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
ACTION_GET_STORE_SUMMARY = "get_store_summary"
ACTION_LIST_PRODUCTS = "list_products"
ACTION_GET_PRODUCT = "get_product"
ACTION_TOGGLE_PRODUCT_STATUS = "toggle_product_status"
ACTION_LIST_ORDERS = "list_orders"
ACTION_GET_ORDER = "get_order"
ACTION_UPDATE_ORDER_STATUS = "update_order_status"
ACTION_CHECK_LOW_STOCK = "check_low_stock"
ACTION_GET_TOP_STOCK_PRODUCTS = "get_top_stock_products"
ACTION_LIST_USERS = "list_users"
ACTION_GET_USER = "get_user"
ACTION_LIST_DISCOUNTS = "list_discounts"
ACTION_TOGGLE_DISCOUNT_STATUS = "toggle_discount_status"
# Analytics avanzados
ACTION_GET_TOP_CATEGORIES_BY_REVENUE = "get_top_categories_by_revenue"
ACTION_GET_CONVERSION_METRICS = "get_conversion_metrics"
ACTION_GET_GEOGRAPHIC_SALES = "get_geographic_sales"
ACTION_GET_HOURLY_TRAFFIC = "get_hourly_traffic"
ACTION_GET_CUSTOMER_DEMOGRAPHICS = "get_customer_demographics"


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

        ind_activo = params.get("ind_activo", True)
        brand = BrandCreate(nom_marca=nom)
        svc_create_brand(db, brand, str(user_id))
        estado = "activa" if ind_activo else "inactiva"
        return f"Marca «{nom}» creada correctamente ({estado})."
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
        # Intentar convertir teléfono a Decimal, limpiando caracteres no numéricos
        if tel:
            tel_clean = ''.join(filter(str.isdigit, str(tel)))
            tel_decimal = Decimal(tel_clean) if tel_clean else Decimal(0)
        else:
            tel_decimal = Decimal(0)
    except Exception:
        tel_decimal = Decimal(0)
    try:
        ind_activo = params.get("ind_activo", True)
        provider = ProviderCreate(
            nom_proveedor=nom,
            email=email,
            tel_proveedor=tel_decimal,
            ind_activo=ind_activo,
        )
        svc_create_provider(db, provider, Decimal(str(user_id)) if isinstance(user_id, str) else user_id)
        estado = "activo" if ind_activo else "inactivo"
        return f"Proveedor «{nom}» creado correctamente ({estado})."
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

        is_active = params.get("is_active", True)
        slug = _sanitize_string(params.get("slug"), max_len=200) if params.get("slug") else None
        
        category = CategoryCreate(
            name=name, 
            parent_id=parent_decimal,
            is_active=is_active,
            slug=slug,
        )
        category_id = category_service.create_category(
            db, category, Decimal(str(user_id)) if isinstance(user_id, str) else user_id
        )
        tipo = "categoría raíz" if parent_id is None else f"categoría hija de {parent_id}"
        estado = "activa" if is_active else "inactiva"
        return f"{tipo.capitalize()} «{name}» creada correctamente (ID: {category_id}, {estado})."
    except Exception as e:
        return f"No se pudo crear la categoría: {str(e)}"


def _execute_create_discount(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Valida params y crea el descuento usando el servicio existente con todos los campos disponibles."""
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
    
    # Validar que si aplica_a requiere un ID, ese ID esté presente
    if aplica_a == "categoria" and not params.get("id_categoria_aplica"):
        return "Si el descuento aplica a una categoría, necesito el id_categoria_aplica."
    if aplica_a == "producto" and not params.get("id_producto_aplica"):
        return "Si el descuento aplica a un producto, necesito el id_producto_aplica."
    if aplica_a == "marca" and not params.get("id_marca_aplica"):
        return "Si el descuento aplica a una marca, necesito el id_marca_aplica."
    
    # Validar ind_canjeable_puntos y costo_puntos_canje
    ind_canjeable_puntos = params.get("ind_canjeable_puntos", False)
    costo_puntos_canje = params.get("costo_puntos_canje")
    if ind_canjeable_puntos and (costo_puntos_canje is None or costo_puntos_canje <= 0):
        return "Si el descuento es canjeable por puntos, necesito el costo_puntos_canje (cantidad de puntos requeridos)."

    try:
        # Construir el objeto DiscountCreate con todos los campos disponibles
        discount_data = {
            "nom_descuento": nom,
            "des_descuento": des,
            "tipo_calculo": bool(tipo_calculo),
            "val_porce_descuento": Decimal(str(val_porce)) if tipo_calculo and val_porce else None,
            "val_monto_descuento": Decimal(str(val_monto)) if not tipo_calculo and val_monto else None,
            "codigo_descuento": codigo,
            "aplica_a": aplica_a,
            "min_valor_pedido": Decimal(str(params.get("min_valor_pedido"))) if params.get("min_valor_pedido") else None,
            "monto_minimo_producto": Decimal(str(params.get("monto_minimo_producto"))) if params.get("monto_minimo_producto") else None,
            "cantidad_minima_producto": params.get("cantidad_minima_producto"),
            "fec_inicio": params.get("fec_inicio"),
            "fec_fin": params.get("fec_fin"),
            "ind_activo": params.get("ind_activo", True),
            "max_usos_total": params.get("max_usos_total"),
            "max_usos_por_usuario": params.get("max_usos_por_usuario"),
            "ind_canjeable_puntos": ind_canjeable_puntos,
            "costo_puntos_canje": costo_puntos_canje,
            "ind_es_para_cumpleanos": params.get("ind_es_para_cumpleanos", False),
            "solo_primera_compra": params.get("solo_primera_compra", False),
            "requiere_codigo": params.get("requiere_codigo", False),
            "dias_semana_aplica": _sanitize_string(params.get("dias_semana_aplica"), max_len=20) if params.get("dias_semana_aplica") else None,
            "horas_inicio": params.get("horas_inicio"),
            "horas_fin": params.get("horas_fin"),
        }
        
        # Agregar IDs de aplicación según el tipo
        if aplica_a == "categoria" and params.get("id_categoria_aplica"):
            discount_data["id_categoria_aplica"] = Decimal(str(params.get("id_categoria_aplica")))
        if aplica_a == "producto" and params.get("id_producto_aplica"):
            discount_data["id_producto_aplica"] = Decimal(str(params.get("id_producto_aplica")))
        if aplica_a == "marca" and params.get("id_marca_aplica"):
            discount_data["id_marca_aplica"] = Decimal(str(params.get("id_marca_aplica")))
        
        discount = DiscountCreate(**discount_data)
        discount_id = discount_service.create_discount(
            db, discount, Decimal(str(user_id)) if isinstance(user_id, str) else user_id
        )
        
        # Construir mensaje de confirmación con detalles
        tipo_texto = f"{val_porce}%" if tipo_calculo else f"${val_monto}"
        detalles = []
        if aplica_a != "todos":
            detalles.append(f"aplica a {aplica_a}")
        if codigo:
            detalles.append(f"código: {codigo}")
        if params.get("max_usos_total"):
            detalles.append(f"máximo {params.get('max_usos_total')} usos")
        if ind_canjeable_puntos:
            detalles.append(f"canjeable por {costo_puntos_canje} puntos")
        
        detalles_str = f" ({', '.join(detalles)})" if detalles else ""
        return f"Descuento «{nom}» creado correctamente ({tipo_texto}){detalles_str}."
    except Exception as e:
        return f"No se pudo crear el descuento: {str(e)}"


def _execute_get_store_summary(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene un resumen completo de la tienda usando dashboard_service."""
    from services.dashboard_service import get_dashboard_data
    from services.admin_ai_service import get_alerts
    import json
    
    time_range = params.get("time_range", "monthly")
    if time_range not in ("daily", "weekly", "monthly"):
        time_range = "monthly"
    
    try:
        data = get_dashboard_data(db, time_range)
        alerts = get_alerts(db)
        kpis = data.get("kpis", {})
        best_sellers = data.get("bestSellers", [])[:5]
        recent_orders = data.get("recentOrders", [])[:5]
        
        # Construir resumen estructurado
        summary_parts = []
        
        # KPIs principales
        summary_parts.append("📊 KPIs Principales:")
        summary_parts.append(f"  • Total de órdenes: {kpis.get('totalOrders', {}).get('formatted', '0')}")
        summary_parts.append(f"  • Unidades vendidas: {kpis.get('unitsSold', {}).get('formatted', '0')}")
        summary_parts.append(f"  • Órdenes enviadas: {kpis.get('shippedOrders', {}).get('formatted', '0')}")
        summary_parts.append(f"  • Ingresos totales: {kpis.get('totalRevenue', {}).get('formatted', '$0')}")
        
        # Productos más vendidos
        if best_sellers:
            summary_parts.append("\n🏆 Productos Más Vendidos:")
            for i, product in enumerate(best_sellers[:3], 1):
                name = product.get("name", "N/A")
                sales = product.get("sales", 0)
                summary_parts.append(f"  {i}. {name}: {sales} unidades vendidas")
        
        # Órdenes recientes
        if recent_orders:
            summary_parts.append(f"\n📦 Órdenes Recientes ({len(recent_orders)}):")
            for order in recent_orders[:3]:
                customer = order.get("customer", "Cliente")
                amount = order.get("amount", 0)
                date = order.get("date", "")[:10] if order.get("date") else ""
                summary_parts.append(f"  • {customer}: ${amount:.2f} ({date})")
        
        # Alertas
        if alerts:
            summary_parts.append("\n⚠️ Alertas:")
            for alert in alerts:
                summary_parts.append(f"  • {alert}")
        
        return "\n".join(summary_parts)
    except Exception as e:
        return f"Error al obtener el resumen de la tienda: {str(e)}"


def _resolve_product_id_by_name(db: Session, product_name: str):
    """
    Busca un producto por nombre. Si hay uno solo que coincida (o coincidencia exacta), devuelve su ID.
    Si hay varios, devuelve (None, mensaje) para que el usuario indique ID o nombre completo.
    """
    from services import product_service

    name = _sanitize_string(product_name, max_len=200).strip()
    if not name:
        return None, "El nombre del producto no puede estar vacío."
    try:
        products = product_service.get_products_admin(db, {"search": name, "limit": 25, "offset": 0})
        if not products:
            return None, f"No hay ningún producto que coincida con «{name}»."
        name_lower = name.lower()
        exact = [p for p in products if (p.get("nom_producto") or p.get("name") or "").strip().lower() == name_lower]
        if len(exact) == 1:
            pid = exact[0].get("product_id") or exact[0].get("id_producto") or exact[0].get("id")
            return (Decimal(str(pid)), None)
        if len(products) == 1:
            pid = products[0].get("product_id") or products[0].get("id_producto") or products[0].get("id")
            return (Decimal(str(pid)), None)
        lines = [f"  - {p.get('nom_producto') or p.get('name')} (ID: {p.get('product_id') or p.get('id')})" for p in products[:10]]
        return None, f"Hay varios productos que coinciden con «{name}»:\n" + "\n".join(lines) + "\nIndica el ID o el nombre completo del producto."
    except Exception as e:
        return None, f"Error al buscar el producto: {str(e)}"


def _execute_list_products(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista productos con filtros opcionales."""
    from services import product_service

    search = _sanitize_string(params.get("search"), max_len=200) if params.get("search") else None
    limit = min(int(params.get("limit", 20)), 50)
    try:
        p_params = {
            "ordenar_por": "nombre",
            "orden": "ASC",
            "limit": limit,
            "offset": 0,
            "search": search,
        }
        products = product_service.get_products_admin(db, p_params)
        if not products:
            return "No hay productos que coincidan con los filtros."
        lines = []
        for p in products[:15]:
            nom = p.get("nom_producto") or p.get("name") or "N/A"
            pid = p.get("product_id") or p.get("id_producto") or p.get("id")
            stock = p.get("stock_total") or p.get("num_stock") or 0
            precio = p.get("precio_min") or p.get("price_min") or p.get("val_precio") or 0
            lines.append(f"- {nom} (ID: {pid}, stock: {stock}, precio: ${precio})")
        return "Productos:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al listar productos: {str(e)}"


def _execute_get_product(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene detalle de un producto por ID o por nombre."""
    from services import product_service

    pid = params.get("product_id")
    product_name = _sanitize_string(params.get("product_name"), max_len=200) if params.get("product_name") else None
    if pid is None and not product_name:
        return "Necesito el ID o el nombre del producto."
    if pid is None and product_name:
        pid_resolved, err = _resolve_product_id_by_name(db, product_name)
        if err:
            return err
        pid = pid_resolved
    try:
        product = product_service.get_product_by_id(db, Decimal(str(pid)))
        if not product:
            return f"No existe un producto con ID {pid}."
        nom = product.get("nom_producto") or product.get("name") or "N/A"
        stock = product.get("num_stock") or product.get("stock_total") or 0
        precio = product.get("val_precio") or product.get("price_min") or 0
        cat = product.get("nom_categoria") or product.get("category_name") or "N/A"
        marca = product.get("nom_marca") or "N/A"
        activo = "activo" if product.get("ind_activo", product.get("is_active", True)) else "inactivo"
        return (
            f"Producto: {nom} (ID: {pid})\n"
            f"  Precio: ${precio} | Stock: {stock} | Categoría: {cat} | Marca: {marca} | Estado: {activo}"
        )
    except Exception as e:
        return f"Error al obtener producto: {str(e)}"


def _execute_toggle_product_status(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Activa o desactiva un producto (por ID o por nombre)."""
    from services import product_service

    pid = params.get("product_id")
    product_name = _sanitize_string(params.get("product_name"), max_len=200) if params.get("product_name") else None
    activar = params.get("activar")
    if pid is None and not product_name:
        return "Necesito el ID o el nombre del producto."
    if pid is None and product_name:
        pid_resolved, err = _resolve_product_id_by_name(db, product_name)
        if err:
            return err
        pid = pid_resolved
    if activar is None:
        return "Necesito indicar si activar (true) o desactivar (false)."
    try:
        product_service.deactivate_activate_product(
            db, Decimal(0), Decimal(0), Decimal(0),
            Decimal(str(pid)),
            Decimal(str(user_id)) if isinstance(user_id, str) else user_id,
            bool(activar),
        )
        estado = "activado" if activar else "desactivado"
        return f"Producto con ID {pid} {estado} correctamente."
    except Exception as e:
        return f"No se pudo cambiar el estado: {str(e)}"


def _execute_list_orders(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista órdenes recientes."""
    from services import order_service

    limit = min(int(params.get("limit", 15)), 30)
    try:
        orders = order_service.get_all_orders_admin(db, limit=limit, offset=0)
        if not orders:
            return "No hay órdenes registradas."
        estado_map = {1: "Pendiente", 2: "Completada", 3: "Cancelada", 4: "Cancelada"}
        lines = []
        for o in orders[:10]:
            oid = o.get("id_orden")
            cliente = f"{o.get('nom_usuario', '')} {o.get('ape_usuario', '')}".strip() or o.get("email_usuario", "Cliente")
            total = float(o.get("val_total_pedido") or 0)
            est = estado_map.get(o.get("ind_estado"), str(o.get("ind_estado")))
            lines.append(f"- Orden #{oid}: {cliente} - ${total:.2f} ({est})")
        return "Órdenes recientes:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al listar órdenes: {str(e)}"


def _execute_get_order(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene detalle de una orden por ID."""
    from services import order_service

    oid = params.get("order_id")
    if oid is None:
        return "Necesito el ID de la orden."
    try:
        detail = order_service.get_order_detail_admin(db, int(oid))
        if not detail:
            return f"No existe una orden con ID {oid}."
        orden = detail.get("orden", {})
        cliente = f"{orden.get('nom_usuario', '')} {orden.get('ape_usuario', '')}".strip() or orden.get("email_usuario", "Cliente")
        total = float(orden.get("val_total_pedido") or 0)
        est = orden.get("ind_estado", 1)
        estado_map = {1: "Pendiente", 2: "Completada", 3: "Cancelada", 4: "Cancelada"}
        productos = detail.get("productos", [])
        items = ", ".join([f"{p.get('nom_producto', 'Item')} x{p.get('cantidad', 1)}" for p in productos[:3]])
        if len(productos) > 3:
            items += f" (+{len(productos) - 3} más)"
        return (
            f"Orden #{oid}: {cliente}\n"
            f"  Total: ${total:.2f} | Estado: {estado_map.get(est, est)}\n"
            f"  Productos: {items}"
        )
    except Exception as e:
        return f"Error al obtener orden: {str(e)}"


def _execute_update_order_status(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Actualiza el estado de una orden."""
    from services import order_service

    oid = params.get("order_id")
    new_status = params.get("new_status")
    if oid is None:
        return "Necesito el ID de la orden."
    if new_status is None or new_status not in (1, 2, 3):
        return "Necesito el nuevo estado: 1=Pendiente, 2=Completada, 3=Cancelada."
    try:
        order_service.update_order_status_admin(
            db, int(oid), int(new_status),
            Decimal(str(user_id)) if isinstance(user_id, str) else user_id,
        )
        estado_map = {1: "Pendiente", 2: "Completada", 3: "Cancelada"}
        return f"Orden #{oid} actualizada a estado «{estado_map.get(new_status, new_status)}»."
    except Exception as e:
        return f"No se pudo actualizar la orden: {str(e)}"


def _execute_check_low_stock(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista productos con stock bajo o sin stock."""
    threshold = int(params.get("threshold", 10))
    if threshold < 0:
        threshold = 10
    try:
        q = text("""
            WITH product_stock AS (
                SELECT p.id, p.name,
                    COALESCE(SUM(c.stock), 0)::BIGINT AS stock_total
                FROM tab_products p
                LEFT JOIN tab_product_variant_groups g ON g.product_id = p.id
                LEFT JOIN tab_product_variant_combinations c ON c.group_id = g.id AND c.is_active = TRUE
                WHERE p.is_active = TRUE
                GROUP BY p.id, p.name
            )
            SELECT id, name, stock_total
            FROM product_stock
            WHERE stock_total <= :threshold
            ORDER BY stock_total ASC
            LIMIT 25
        """)
        rows = db.execute(q, {"threshold": threshold}).mappings().all()
        if not rows:
            return f"No hay productos con stock bajo o igual a {threshold}."
        lines = []
        for r in rows:
            lines.append(f"- {r.get('name', 'N/A')} (ID: {r.get('id')}, stock: {r.get('stock_total', 0)})")
        return f"Productos con stock ≤ {threshold}:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al verificar stock: {str(e)}"


def _execute_get_top_stock_products(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista los productos con mayor stock total (variantes activas)."""
    limit = min(int(params.get("limit", 10)), 25)
    if limit <= 0:
        limit = 10
    try:
        q = text("""
            WITH product_stock AS (
                SELECT p.id, p.name,
                    COALESCE(SUM(c.stock), 0)::BIGINT AS stock_total
                FROM tab_products p
                LEFT JOIN tab_product_variant_groups g ON g.product_id = p.id
                LEFT JOIN tab_product_variant_combinations c ON c.group_id = g.id AND c.is_active = TRUE
                WHERE p.is_active = TRUE
                GROUP BY p.id, p.name
            )
            SELECT id, name, stock_total
            FROM product_stock
            ORDER BY stock_total DESC, name ASC
            LIMIT :limit
        """)
        rows = db.execute(q, {"limit": limit}).mappings().all()
        if not rows:
            return "No hay productos activos con stock registrado."
        lines = []
        for r in rows:
            lines.append(f"- {r.get('name', 'N/A')} (ID: {r.get('id')}, stock: {int(r.get('stock_total', 0) or 0)})")
        top = rows[0]
        top_name = top.get("name", "N/A")
        top_stock = int(top.get("stock_total", 0) or 0)
        return (
            f"El producto con mayor stock ahora es «{top_name}» ({top_stock} unidades). "
            "Top por stock:\n" + "\n".join(lines)
        )
    except Exception as e:
        return f"Error al obtener productos con mayor stock: {str(e)}"


def _execute_list_users(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista usuarios con puntos de fidelización."""
    from services import points_per_user_service

    limit = min(int(params.get("limit", 20)), 50)
    try:
        users = points_per_user_service.get_all_users_with_points(db)
        if not users:
            return "No hay usuarios registrados."
        lines = []
        for u in users[:limit]:
            nom = f"{u.get('nom_usuario', '')} {u.get('ape_usuario', '')}".strip() or u.get("email_usuario", "N/A")
            pts = int(u.get("puntos_disponibles") or 0)
            lines.append(f"- {nom} (ID: {u.get('id_usuario')}, puntos: {pts})")
        return "Usuarios (con puntos):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al listar usuarios: {str(e)}"


def _execute_get_user(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene detalle de un usuario por ID."""
    from services import user_service
    from services import points_per_user_service
    from services import order_service

    uid = params.get("user_id")
    if uid is None:
        return "Necesito el ID del usuario."
    try:
        user = user_service.get_user(db, Decimal(str(uid)))
        if not user:
            return f"No existe un usuario con ID {uid}."
        nom = f"{user.get('nom_usuario', '')} {user.get('ape_usuario', '')}".strip()
        email = user.get("email_usuario", "N/A")
        pts_data = points_per_user_service.get_points_per_user(db, Decimal(str(uid)))
        pts = int(pts_data.get("puntos_disponibles", 0)) if pts_data else 0
        orders = order_service.get_orders_by_user(db, Decimal(str(uid)))
        num_orders = len(orders) if orders else 0
        return (
            f"Usuario: {nom} (ID: {uid})\n"
            f"  Email: {email} | Puntos: {pts} | Órdenes: {num_orders}"
        )
    except Exception as e:
        return f"Error al obtener usuario: {str(e)}"


def _execute_list_discounts(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Lista descuentos existentes."""
    from services import discount_service

    limit = min(int(params.get("limit", 20)), 50)
    try:
        discounts = discount_service.get_discounts(db)
        if not discounts:
            return "No hay descuentos registrados."
        lines = []
        for d in discounts[:limit]:
            nom = d.get("nom_descuento", "N/A")
            did = d.get("id_descuento")
            activo = "activo" if d.get("ind_activo", True) else "inactivo"
            cod = d.get("codigo_descuento") or ""
            cod_str = f" código: {cod}" if cod else ""
            lines.append(f"- {nom} (ID: {did}{cod_str}, {activo})")
        return "Descuentos:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al listar descuentos: {str(e)}"


def _execute_toggle_discount_status(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Activa o desactiva un descuento."""
    from services import discount_service

    did = params.get("discount_id")
    activar = params.get("activar")
    if did is None:
        return "Necesito el ID del descuento."
    if activar is None:
        return "Necesito indicar si activar (true) o desactivar (false)."
    try:
        discount_service.deactivate_activate_discount(
            db, Decimal(str(did)), bool(activar),
            Decimal(str(user_id)) if isinstance(user_id, str) else user_id,
        )
        estado = "activado" if activar else "desactivado"
        return f"Descuento con ID {did} {estado} correctamente."
    except Exception as e:
        return f"No se pudo cambiar el estado del descuento: {str(e)}"


def _execute_get_top_categories_by_revenue(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene categorías más vendidas por ingresos usando analytics_service."""
    from services import analytics_service

    limit = min(int(params.get("limit", 10)), 20)
    try:
        data = analytics_service.get_analytics_data(db)
        perf = data.get("productPerformance") or []
        if not perf:
            return "No hay datos de ventas por categoría aún."
        lines = []
        for i, row in enumerate(perf[:limit], 1):
            cat = row.get("category", "N/A")
            sales = float(row.get("sales", 0) or 0)
            pct = float(row.get("percentage", 0) or 0)
            growth = float(row.get("growth", 0) or 0)
            lines.append(f"{i}. {cat}: ${sales:,.0f} ({pct:.1f}% del total, crecimiento: {growth:+.1f}%)")
        return "Categorías más vendidas por ingresos (últimos 30 días):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al obtener categorías: {str(e)}"


def _execute_get_conversion_metrics(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene métricas de conversión."""
    from services import analytics_service

    try:
        data = analytics_service.get_analytics_data(db)
        metrics = data.get("conversionMetrics") or []
        if not metrics:
            return "No hay métricas de conversión disponibles."
        lines = []
        for m in metrics:
            title = m.get("title", "N/A")
            value = m.get("value", "0")
            change = m.get("change", "0%")
            lines.append(f"• {title}: {value} ({change} vs período anterior)")
        return "Métricas de conversión (últimos 30 días):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al obtener métricas: {str(e)}"


def _execute_get_geographic_sales(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene ventas por región geográfica."""
    from services import analytics_service

    limit = min(int(params.get("limit", 10)), 15)
    try:
        data = analytics_service.get_analytics_data(db)
        geo = data.get("geoData") or []
        if not geo:
            return "No hay datos de ventas por región aún."
        lines = []
        for row in geo[:limit]:
            region = row.get("region", "Sin especificar")
            orders = int(row.get("orders", 0) or 0)
            revenue = float(row.get("revenue", 0) or 0)
            lines.append(f"• {region}: {orders} órdenes, ${revenue:,.0f}")
        return "Ventas por región (últimos 30 días):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al obtener datos geográficos: {str(e)}"


def _execute_get_hourly_traffic(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene tráfico/órdenes por hora."""
    from services import analytics_service

    try:
        data = analytics_service.get_analytics_data(db)
        hourly = data.get("hourlyTraffic") or []
        if not hourly:
            return "No hay datos de tráfico por hora aún."
        # Encontrar las horas con más órdenes
        sorted_hours = sorted(hourly, key=lambda x: int(x.get("visitors", 0) or 0), reverse=True)
        top = sorted_hours[:5]
        lines = [f"• {h.get('hour', '?')}:00 - {h.get('visitors', 0)} órdenes" for h in top]
        return "Horas con más órdenes (últimos 30 días):\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al obtener tráfico por hora: {str(e)}"


def _execute_get_customer_demographics(db: Session, params: dict, user_id: str | Decimal) -> str:
    """Obtiene demografía de clientes por edad."""
    from services import analytics_service

    try:
        data = analytics_service.get_analytics_data(db)
        demo = data.get("customerDemographics") or []
        if not demo:
            return "No hay datos demográficos de clientes aún."
        lines = []
        for row in demo:
            age = row.get("ageGroup", "N/A")
            pct = float(row.get("percentage", 0) or 0)
            revenue = float(row.get("revenue", 0) or 0)
            lines.append(f"• {age} años: {pct:.1f}% de ingresos (${revenue:,.0f})")
        return "Demografía de clientes por grupo de edad:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error al obtener demografía: {str(e)}"


def _get_affected_entities(action_id: str) -> list[str]:
    """
    Devuelve la lista de entidades afectadas por una acción.
    Usado para invalidar queries en el frontend después de acciones del AI.
    """
    # Mapeo de acciones a entidades afectadas
    ACTION_TO_ENTITIES: dict[str, list[str]] = {
        ACTION_CREATE_BRAND: ["brands", "filter-options"],
        ACTION_CREATE_PROVIDER: ["providers", "filter-options"],
        ACTION_CREATE_CATEGORY: ["categories", "filter-options"],
        ACTION_CREATE_DISCOUNT: ["discounts"],
        ACTION_TOGGLE_DISCOUNT_STATUS: ["discounts"],
        ACTION_TOGGLE_PRODUCT_STATUS: ["products"],
        ACTION_UPDATE_TOP_INFO_BAR: [],  # No afecta queries de datos
        ACTION_UPDATE_ORDER_STATUS: [],  # Las órdenes se refrescan automáticamente
    }
    return ACTION_TO_ENTITIES.get(action_id, [])


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
    if action_id == ACTION_GET_STORE_SUMMARY:
        return _execute_get_store_summary(db, params, user_id)
    if action_id == ACTION_LIST_PRODUCTS:
        return _execute_list_products(db, params, user_id)
    if action_id == ACTION_GET_PRODUCT:
        return _execute_get_product(db, params, user_id)
    if action_id == ACTION_TOGGLE_PRODUCT_STATUS:
        return _execute_toggle_product_status(db, params, user_id)
    if action_id == ACTION_LIST_ORDERS:
        return _execute_list_orders(db, params, user_id)
    if action_id == ACTION_GET_ORDER:
        return _execute_get_order(db, params, user_id)
    if action_id == ACTION_UPDATE_ORDER_STATUS:
        return _execute_update_order_status(db, params, user_id)
    if action_id == ACTION_CHECK_LOW_STOCK:
        return _execute_check_low_stock(db, params, user_id)
    if action_id == ACTION_GET_TOP_STOCK_PRODUCTS:
        return _execute_get_top_stock_products(db, params, user_id)
    if action_id == ACTION_LIST_USERS:
        return _execute_list_users(db, params, user_id)
    if action_id == ACTION_GET_USER:
        return _execute_get_user(db, params, user_id)
    if action_id == ACTION_LIST_DISCOUNTS:
        return _execute_list_discounts(db, params, user_id)
    if action_id == ACTION_TOGGLE_DISCOUNT_STATUS:
        return _execute_toggle_discount_status(db, params, user_id)
    if action_id == ACTION_GET_TOP_CATEGORIES_BY_REVENUE:
        return _execute_get_top_categories_by_revenue(db, params, user_id)
    if action_id == ACTION_GET_CONVERSION_METRICS:
        return _execute_get_conversion_metrics(db, params, user_id)
    if action_id == ACTION_GET_GEOGRAPHIC_SALES:
        return _execute_get_geographic_sales(db, params, user_id)
    if action_id == ACTION_GET_HOURLY_TRAFFIC:
        return _execute_get_hourly_traffic(db, params, user_id)
    if action_id == ACTION_GET_CUSTOMER_DEMOGRAPHICS:
        return _execute_get_customer_demographics(db, params, user_id)
    return "Acción no permitida o no implementada."


def execute_action_with_metadata(
    db: Session,
    action_id: str,
    params: dict,
    user_id: str | Decimal,
) -> dict[str, any]:
    """
    Ejecuta una acción y devuelve tanto el mensaje como metadata sobre entidades afectadas.
    Usado para invalidar queries en el frontend automáticamente.
    """
    message = execute_action(db, action_id, params, user_id)
    affected_entities = _get_affected_entities(action_id)
    return {
        "message": message,
        "affected_entities": affected_entities,
    }
