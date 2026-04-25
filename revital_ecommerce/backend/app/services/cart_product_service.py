import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Any, Dict
from psycopg2.extras import Json

from schemas.cart_product_schemas import CalculateTotalCart, CartProductCreate, CartProductDelete, GetCartDetail, MigrateCartAnonymous, GetCartUser, CartItemWithBasicInfo, ProductBasicInfo

"""
Servicios de carrito (capa de negocio/persistencia).

Responsabilidades:
- obtener/crear carrito por usuario o sesión anónima,
- agregar/quitar/actualizar ítems del carrito,
- devolver detalle de ítems para UI,
- calcular totales de checkout con descuentos/canje.

Se consume principalmente desde:
- `routers/cart_product_router.py`
- flujos de pago/orden que necesitan total de carrito.
"""


def _imagen_url_por_color(
    img_producto: Any,
    spcf_producto: Any,
    opciones_elegidas: Dict[str, Any],
) -> Optional[str]:
    """
    Devuelve la URL de la imagen que corresponde al color elegido (opciones_elegidas.color).
    Si no hay color o no hay galería, devuelve la imagen principal (main).
    Misma lógica que en la página de producto: colores e imágenes pueden estar en orden inverso.
    """
    if not img_producto:
        return None
    if isinstance(img_producto, str):
        try:
            img_producto = json.loads(img_producto)
        except (TypeError, ValueError):
            return None
    if not isinstance(img_producto, dict):
        return None
    main_url = img_producto.get("main") or img_producto.get("url")
    gallery = img_producto.get("gallery") or []
    if not isinstance(gallery, list):
        gallery = []
    images = ([main_url] if main_url else []) + [u for u in gallery if u]
    if not images:
        return None
    selected_color = (opciones_elegidas or {}).get("color")
    if not selected_color or not spcf_producto:
        return main_url or images[0]
    # Parsear colores del producto
    colors = []
    if isinstance(spcf_producto, str):
        try:
            spcf_producto = json.loads(spcf_producto)
        except (TypeError, ValueError):
            return main_url or images[0]
    if isinstance(spcf_producto, dict):
        if "colors" in spcf_producto and isinstance(spcf_producto["colors"], list):
            for c in spcf_producto["colors"]:
                name = (c.get("name") or c.get("value") or "") if isinstance(c, dict) else str(c)
                if name:
                    colors.append(name.strip())
        elif "color" in spcf_producto and isinstance(spcf_producto["color"], str):
            colors = [s.strip() for s in spcf_producto["color"].split(",") if s.strip()]
    if not colors or len(images) == 0:
        return main_url or images[0]
    selected_clean = str(selected_color).strip().lower()
    color_index = next((i for i, c in enumerate(colors) if c.lower() == selected_clean), None)
    if color_index is None:
        return main_url or images[0]
    # Mismo producto: si misma cantidad de colores e imágenes, índice invertido
    if len(colors) == len(images):
        image_index = len(colors) - 1 - color_index
    else:
        image_index = min(color_index, len(images) - 1)
    return images[image_index] if 0 <= image_index < len(images) else (main_url or images[0])


def _opciones_elegidas_to_dict(value: Any) -> Dict[str, Any]:
    """Convierte opciones_elegidas (JSONB) a dict para la API."""
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value) or {}
        except (TypeError, ValueError):
            return {}
    return {}

def get_cart(db:Session):
    """
    Obtiene todos los carritos.

    Uso:
    - endpoint administrativo/técnico de inspección de carritos.
    """
    try:
        query = text("""
        SELECT 
            id_carrito,
            id_usuario,
            session_id,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_carritos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carritos: {str(e)}")

def get_cart_products(db: Session):
    """
    Obtiene todos los ítems del carrito (tab_carrito_productos usa variant_id).

    Nota:
    - devuelve estructura cruda de tabla, sin enriquecimiento de producto.
    """
    try:
        query = text("""
        SELECT
            id_carrito_producto,
            id_carrito,
            variant_id,
            cantidad,
            precio_unitario_carrito,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_carrito_productos
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener productos en el carrito: {str(e)}")

    
def create_cart_product(db: Session, cart_product: CartProductCreate, usr_insert: Optional[Decimal]):
    """
    Agrega una variante al carrito usando fun_agregar_producto_carrito(id_usuario, session_id, variant_id, cantidad, usr).
    Si se envía variant_id se usa; si solo id_producto, se toma la primera variante activa del producto.

    Flujo:
    1. Resolver `variant_id` (directo o derivado desde `id_producto`).
    2. Normalizar `opciones_elegidas` a JSON.
    3. Invocar función SQL `fun_agregar_producto_carrito`.
    4. Confirmar commit y retornar resultado de la función.
    """
    try:
        data = cart_product.model_dump()
        variant_id = data.get("variant_id")
        id_producto = data.get("id_producto")
        if variant_id is None and id_producto is not None:
            r = db.execute(
                text("""
                    SELECT c.id FROM tab_product_variant_combinations c
                    JOIN tab_product_variant_groups g ON g.id = c.group_id
                    WHERE g.product_id = :pid AND c.is_active = TRUE ORDER BY c.id LIMIT 1
                """),
                {"pid": id_producto},
            ).first()
            if not r:
                raise Exception(f"No hay variante activa para el producto id {id_producto}")
            variant_id = r[0]
        if variant_id is None:
            raise Exception("Se requiere variant_id o id_producto para agregar al carrito")

        opciones = data.get("opciones_elegidas")
        if opciones is not None and not isinstance(opciones, dict):
            opciones = {}
        opciones_json = json.dumps(opciones) if opciones else "{}"
        usr = usr_insert or data.get("id_usuario") or 0

        params = {
            "id_usuario": data.get("id_usuario"),
            "session_id": data.get("session_id") or "",
            "variant_id": variant_id,
            "cantidad": int(cart_product.cantidad),
            "opciones_elegidas": opciones_json,
            "usr_insert": usr,

        }
        # Log de diagnóstico: variante y cantidad agregada al carrito.
        print(f"🛒 [BACKEND] Agregando producto al carrito: variant_id={variant_id}, cantidad={params['cantidad']}")

        query = text("""
        SELECT fun_agregar_producto_carrito(
            CAST(:id_usuario AS NUMERIC),
            CAST(:session_id AS VARCHAR),
            CAST(:variant_id AS NUMERIC),
            CAST(:cantidad AS INTEGER),
            CAST(:opciones_elegidas AS JSONB),
            CAST(:usr_insert AS NUMERIC)
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        print(f"✅ [BACKEND] Producto agregado. Resultado: {fetched_result[0] if fetched_result else None}")
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        err_str = str(e)
        print(f"❌ [BACKEND] Error al crear producto en el carrito: {err_str}")
        raise Exception(f"Error al crear producto en el carrito: {err_str}")

def update_cart_product_quantity(db: Session, id_carrito_producto: int, nueva_cantidad: int, usr_update: Optional[int]):
    """
    Actualiza la cantidad de un producto en el carrito con validación de stock.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_carrito_producto (int): ID del producto en el carrito a actualizar.
        nueva_cantidad (int): Nueva cantidad del producto.
        usr_update (Optional[int]): Usuario que actualiza el registro.

    Validaciones:
    - item existe,
    - cantidad solicitada <= stock activo,
    - cantidad > 0.
    """
    try:
        # Obtener stock de variante para validar antes del update.
        stock_query = text("""
        SELECT pv.stock, cp.cantidad AS cantidad_actual
        FROM tab_carrito_productos cp
        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
        WHERE cp.id_carrito_producto = :id_carrito_producto
        """)
        stock_result = db.execute(stock_query, {"id_carrito_producto": id_carrito_producto})
        stock_info = stock_result.fetchone()
        if not stock_info:
            raise Exception("Producto no encontrado en el carrito")
        stock_disponible = stock_info[0]
        cantidad_actual = stock_info[1]
        
        # Validar que no exceda stock disponible.
        if nueva_cantidad > stock_disponible:
            raise Exception(f"Stock insuficiente. Disponible: {stock_disponible}, solicitado: {nueva_cantidad}")
        
        # Validar mínimo de cantidad.
        if nueva_cantidad <= 0:
            raise Exception("La cantidad debe ser mayor a 0")
        
        # Persistir cantidad en base de datos.
        update_query = text("""
        UPDATE tab_carrito_productos 
        SET cantidad = :nueva_cantidad, 
            usr_update = :usr_update, 
            fec_update = NOW()
        WHERE id_carrito_producto = :id_carrito_producto
        """)
        
        db.execute(update_query, {
            "id_carrito_producto": id_carrito_producto,
            "nueva_cantidad": nueva_cantidad,
            "usr_update": usr_update
        })
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar cantidad: {str(e)}")


def delete_cart_product_by_id(db: Session, id_carrito_producto: int) -> bool:
    """
    Elimina una sola línea del carrito por su id_carrito_producto.
    Así se quita solo ese ítem (ej. un color/talla) y no todos los del mismo producto.

    Args:
        db (Session): Sesión de base de datos.
        id_carrito_producto (int): ID de la fila en tab_carrito_productos.

    Returns:
        bool: True si se eliminó una fila, False si no existía.

    Recomendado para UI moderna:
    - elimina ítem exacto por identificador de línea de carrito.
    """
    try:
        query = text("""
            DELETE FROM tab_carrito_productos
            WHERE id_carrito_producto = :id_carrito_producto
        """)
        result = db.execute(query, {"id_carrito_producto": id_carrito_producto})
        db.commit()
        return result.rowcount > 0
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar ítem del carrito: {str(e)}")


def delete_cart_product(db: Session, id_usuario: Optional[Decimal], session_id: Optional[str], id_categoria_producto: Decimal, id_linea_producto: Decimal, id_sublinea_producto: Decimal, id_producto: Decimal, cantidad: Decimal, usr_update: Decimal):
    """
    Elimina (o reduce cantidad de) un producto en el carrito.
    La BD opera por `variant_id`; por eso se resuelve desde `product_id`.

    Compatibilidad:
    - ruta legacy que todavía usa identificadores compuestos.
    """
    try:
        id_carrito_row = db.execute(
            text("SELECT fun_obtener_carrito_usuario(:id_usuario, :session_id)"),
            {"id_usuario": id_usuario, "session_id": session_id or ""},
        ).first()
        if not id_carrito_row:
            raise Exception("No se pudo obtener el carrito")
        id_carrito = id_carrito_row[0]
        variant_row = db.execute(
            text("""
                SELECT cp.variant_id FROM tab_carrito_productos cp
                JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id
                JOIN tab_product_variant_groups g ON g.id = pv.group_id
                WHERE cp.id_carrito = :id_carrito AND g.product_id = :id_producto
                LIMIT 1
            """),
            {"id_carrito": id_carrito, "id_producto": id_producto},
        ).first()
        if not variant_row:
            raise Exception("El producto no está en el carrito")
        variant_id = variant_row[0]
        query = text("""
        SELECT fun_eliminar_producto_carrito(
            CAST(:id_usuario AS NUMERIC),
            CAST(:session_id AS VARCHAR),
            CAST(:variant_id AS NUMERIC),
            CAST(:cantidad AS INTEGER),
            CAST(:usr_update AS NUMERIC)
        )
        """)
        result = db.execute(query, {
            "id_usuario": id_usuario,
            "session_id": session_id or "",
            "variant_id": variant_id,
            "cantidad": cantidad,
            "usr_update": usr_update,
        })
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar producto en el carrito: {str(e)}")
    
def migrate_cart_anonymous(db: Session, migrate_cart_anonymous: MigrateCartAnonymous, usr_insert: Decimal):
    """
    Migra productos de un carrito anónimo a un usuario registrado.
    
    Utiliza la función de base de datos `fun_migrar_carrito_anonimo_a_usuario` para migrar
    productos de un carrito anónimo (id_usuario = NULL) al carrito de un usuario registrado.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        migrate_cart_anonymous (MigrateCartAnonymous): Datos de migración con id_carrito.
        usr_insert (Decimal): El usuario que realizó la operación (también es el id_usuario de destino).

    Resultado:
    - transfiere ítems del carrito anónimo al carrito del usuario autenticado.
    """
    try:
        params = migrate_cart_anonymous.model_dump()
        # El usuario destino coincide con quien ejecuta la operación.
        params["id_usuario"] = usr_insert
        params["usr_insert"] = usr_insert
        
        print(f"🔄 [SERVICE] Parámetros de migración: {params}")
        
        query = text("""
        SELECT fun_migrar_carrito_anonimo_a_usuario(
            :id_carrito,
            :id_usuario,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        print(f"✅ [SERVICE] Migración exitosa: {fetched_result[0] if fetched_result else None}")
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        print(f"❌ [SERVICE] Error en migración: {str(e)}")
        raise Exception(f"Error al migrar carrito anónimo a usuario: {str(e)}")
    
def get_cart_user(db:Session, get_cart_user:GetCartUser):
    """
    Obtiene o crea el carrito de un usuario registrado o anónimo.
    
    Args:
        db (Session): Sesión de base de datos.
        get_car_user (GetCarUser): Datos del usuario (id_usuario o session_id).
    
    Returns:
        int: ID del carrito obtenido o creado.

    Implementación:
    - delega en `fun_obtener_carrito_usuario`, que encapsula lógica de
      "buscar existente o crear nuevo".
    """
    try:
        params = get_cart_user.model_dump()
        print(f"🛒 [BACKEND] Obteniendo/creando carrito con parámetros: {params}")
        
        query = text("""
        SELECT fun_obtener_carrito_usuario(
            :id_usuario,
            :session_id
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        id_carrito = fetched_result[0] if fetched_result else None
        
        print(f"🛒 [BACKEND] ID del carrito obtenido: {id_carrito}")
        
        if id_carrito is None:
            raise Exception("No se pudo obtener o crear el carrito")
        
        db.commit()
        return int(id_carrito)
    except Exception as e:
        db.rollback()
        print(f"❌ [BACKEND] Error al obtener carrito de usuario: {str(e)}")
        raise Exception(f"Error al obtener carrito de usuario: {str(e)}")
    
def get_cart_detail(db: Session, get_cart_detail: GetCartDetail):
    """
    Obtiene el detalle del carrito usando tab_products, tab_product_variant_combinations y variant_id.
    Devuelve la misma estructura esperada por el frontend (id_categoria_producto = category_id, etc.).

    Incluye:
    - nombre, precio, subtotal, stock,
    - imagen principal,
    - marca/categoría,
    - opciones elegidas (color/talla u otras).
    """
    try:
        params = get_cart_detail.model_dump()
        print(f"🔍 [BACKEND] Obteniendo detalle del carrito con parámetros: {params}")

        query = text("""
        SELECT
            cp.id_carrito_producto,
            p.category_id,
            p.id AS id_producto,
            p.name AS nom_producto,
            cp.cantidad,
            cp.precio_unitario_carrito,
            (cp.cantidad * cp.precio_unitario_carrito) AS subtotal,
            pv.stock AS num_stock,
            COALESCE(cp.opciones_elegidas, '{}'::JSONB) AS opciones_elegidas,
            COALESCE(
                (SELECT pvi.image_url
                 FROM tab_product_variant_images pvi
                 WHERE pvi.variant_group_id = pv.group_id
                 ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                 LIMIT 1),
                (SELECT pvi.image_url
                 FROM tab_product_variant_images pvi
                 JOIN tab_product_variant_groups g2 ON g2.id = pvi.variant_group_id
                 WHERE g2.product_id = p.id
                 ORDER BY CASE WHEN LOWER(TRIM(COALESCE(g2.dominant_value, ''))) = 'sin color' THEN 0 ELSE 1 END,
                          g2.id, pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                 LIMIT 1)
            ) AS img_principal,
            m.nom_marca,
            cat.name AS nom_categoria
        FROM tab_carrito_productos cp
        JOIN tab_carritos c ON cp.id_carrito = c.id_carrito
        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
        LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
        LEFT JOIN tab_categories cat ON p.category_id = cat.id
        WHERE (c.id_usuario = :id_usuario OR c.session_id = :session_id)
        AND (c.id_usuario IS NOT NULL OR c.session_id IS NOT NULL)
        ORDER BY cp.fec_insert DESC
        """)

        result = db.execute(query, params)
        cart_items = result.mappings().all()

        print(f"🔍 [BACKEND] Resultado de la consulta: {len(cart_items)} items")

        if not cart_items:
            print("🔍 [BACKEND] No se encontraron productos en el carrito")
            return []

        products_list = []
        for row in cart_items:
            img_url = row.get("img_principal")
            opts = row.get("opciones_elegidas")
            if opts is None or (isinstance(opts, str) and not opts):
                opts = {}
            elif isinstance(opts, str):
                try:
                    import json
                    opts = json.loads(opts) if opts else {}
                except Exception:
                    opts = {}
            # Adaptar cada fila SQL al contrato esperado por frontend.
            product_dict = {
                "id_carrito_producto": row["id_carrito_producto"],
                "id_categoria_producto": int(row["category_id"]) if row["category_id"] is not None else 0,
                "id_linea_producto": 0,
                "id_sublinea_producto": 0,
                "id_producto": int(row["id_producto"]) if row["id_producto"] is not None else 0,
                "nombre_producto": row["nom_producto"] or "",
                "cantidad": int(row["cantidad"]),
                "precio_unitario": float(row["precio_unitario_carrito"]),
                "subtotal": float(row["subtotal"]),
                "stock_disponible": int(row["num_stock"] or 0),
                "imagen_url": img_url,
                "marca": row["nom_marca"] or "",
                "sublinea": None,
                "categoria": row["nom_categoria"] or "",
                "opciones_elegidas": opts if isinstance(opts, dict) else {},
            }
            products_list.append(product_dict)

        print(f"📦 [BACKEND] Lista de productos procesada: {len(products_list)} items")
        db.commit()
        return products_list
    except Exception as e:
        db.rollback()
        print(f"❌ [BACKEND] Error al obtener detalle del carrito: {str(e)}")
        raise Exception(f"Error al obtener detalle del carrito: {str(e)}")
    
def calculate_total_cart(db:Session, calculate_total_cart:CalculateTotalCart):
    """
    Calcula el total del carrito de un usuario.
    Soporta tanto usuarios registrados (id_usuario) como anónimos (session_id).

    Fuente principal:
    - función SQL `fun_calcular_total_carrito`.

    Estrategia de salida:
    - si la función ya retorna contrato completo, se devuelve intacto;
    - si retorna estructura simple, se adapta al contrato esperado por API.
    """
    try:
        params = calculate_total_cart.model_dump()
        query = text("""
        SELECT fun_calcular_total_carrito(:id_usuario, :session_id, :id_canje_aplicar)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        response_data = fetched_result[0] if fetched_result else None
        
        if response_data is None:
            return {
                "success": False,
                "total_final": 0,
                "total_productos": 0,
                "total_descuentos": 0,
                "ahorro_total": 0,
                "resumen": {},
                "descuentos_automaticos": [],
                "descuento_canjeado": None,
                "total_desc_automaticos": 0,
                "total_desc_canjeado": 0,
                "es_primera_compra": False,
                "puntos_a_ganar": 0,
                "id_canje_aplicado": None,
                "mensaje": "Error al calcular total del carrito",
                "mensaje_puntos": "",
                "mensaje_resumen": ""
            }
        
        # Si ya viene con contrato completo, retornar sin transformación.
        if isinstance(response_data, dict) and "success" in response_data:
            return response_data
        
        # Si es respuesta simple, mapear a estructura completa de API.
        if isinstance(response_data, dict):
            return {
                "success": True,
                "total_final": response_data.get("total_final", 0),
                "total_productos": response_data.get("total_productos", 0),
                "total_descuentos": response_data.get("total_descuentos", 0),
                "ahorro_total": response_data.get("total_descuentos", 0),  # Ahorro total equivalente a descuentos.
                "resumen": {
                    "subtotal": response_data.get("total_productos", 0),
                    "descuentos": response_data.get("total_descuentos", 0),
                    "total": response_data.get("total_final", 0)
                },
                "descuentos_automaticos": response_data.get("descuentos_automaticos", []),
                "descuento_canjeado": response_data.get("descuento_canjeado"),
                "total_desc_automaticos": 0,  # Placeholder si backend no envía detalle desagregado.
                "total_desc_canjeado": 0,     # Placeholder de descuento canjeado.
                "es_primera_compra": False,   # Placeholder para regla comercial.
                "puntos_a_ganar": 0,          # Placeholder para cálculo de fidelización.
                "id_canje_aplicado": None,
                "mensaje": response_data.get("message", "Carrito calculado exitosamente"),
                "mensaje_puntos": "Ganarás 0 puntos con esta compra" if response_data.get("total_final", 0) == 0 else f"Ganarás puntos con esta compra",
                "mensaje_resumen": f"Total a pagar: ${response_data.get('total_final', 0)}"
            }
        
        # Si el formato no es válido, devolver respuesta por defecto.
        return {
            "success": False,
            "total_final": 0,
            "total_productos": 0,
            "total_descuentos": 0,
            "ahorro_total": 0,
            "resumen": {},
            "descuentos_automaticos": [],
            "descuento_canjeado": None,
            "total_desc_automaticos": 0,
            "total_desc_canjeado": 0,
            "es_primera_compra": False,
            "puntos_a_ganar": 0,
            "id_canje_aplicado": None,
            "mensaje": "Formato de respuesta no válido",
            "mensaje_puntos": "",
            "mensaje_resumen": ""
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al calcular total del carrito: {str(e)}")

def get_cart_with_basic_info(db: Session, get_cart_detail: GetCartDetail):
    """
    Obtiene el carrito con información básica (marca, color desde combinación/grupo) usando tab_products/tab_product_variant_combinations.

    Pensado para:
    - vistas rápidas donde no se requiere el detalle completo del carrito.
    """
    try:
        params = get_cart_detail.model_dump()

        query = text("""
        SELECT
            cp.id_carrito_producto,
            cp.id_carrito,
            cp.cantidad,
            cp.precio_unitario_carrito,
            (cp.cantidad * cp.precio_unitario_carrito) AS subtotal,
            p.name AS nom_producto,
            COALESCE(
                (SELECT pvi.image_url
                 FROM tab_product_variant_images pvi
                 WHERE pvi.variant_group_id = pv.group_id
                 ORDER BY pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                 LIMIT 1),
                (SELECT pvi.image_url
                 FROM tab_product_variant_images pvi
                 JOIN tab_product_variant_groups g2 ON g2.id = pvi.variant_group_id
                 WHERE g2.product_id = p.id
                 ORDER BY CASE WHEN LOWER(TRIM(COALESCE(g2.dominant_value, ''))) = 'sin color' THEN 0 ELSE 1 END,
                          g2.id, pvi.is_primary DESC NULLS LAST, pvi.sort_order NULLS LAST, pvi.id
                 LIMIT 1)
            ) AS imagen_url,
            pv.stock AS num_stock,
            m.nom_marca,
            cp.variant_id
        FROM tab_carrito_productos cp
        JOIN tab_carritos c ON cp.id_carrito = c.id_carrito
        JOIN tab_product_variant_combinations pv ON pv.id = cp.variant_id AND pv.is_active = TRUE
        JOIN tab_product_variant_groups g ON g.id = pv.group_id
        JOIN tab_products p ON p.id = g.product_id AND p.is_active = TRUE
        LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
        WHERE (c.id_usuario = :id_usuario OR c.session_id = :session_id)
        AND (c.id_usuario IS NOT NULL OR c.session_id IS NOT NULL)
        ORDER BY cp.fec_insert DESC
        """)

        result = db.execute(query, params)
        rows = result.mappings().all()

        if not rows:
            return []

        cart_with_basic_info = []
        variant_ids = [row["variant_id"] for row in rows]
        color_by_variant = {}
        if variant_ids:
            color_rows = db.execute(
                text("""
                    SELECT c.id AS variant_id, g.dominant_value AS color
                    FROM tab_product_variant_combinations c
                    JOIN tab_product_variant_groups g ON g.id = c.group_id
                    WHERE c.id = ANY(:vids)
                """),
                {"vids": variant_ids},
            ).mappings().all()
            for r in color_rows:
                color_by_variant[r["variant_id"]] = r.get("color")

        for row in rows:
            marca = row["nom_marca"] or "Sin marca"
            color = color_by_variant.get(row["variant_id"]) if row.get("variant_id") else None

            basic_info = ProductBasicInfo(marca=marca, color=color)
            cart_item = CartItemWithBasicInfo(
                id_carrito_producto=row["id_carrito_producto"],
                id_carrito=row["id_carrito"],
                cantidad=int(row["cantidad"]),
                precio_unitario_carrito=float(row["precio_unitario_carrito"]),
                subtotal=float(row["subtotal"]),
                nombre_producto=row["nom_producto"] or "",
                imagen_url=row["imagen_url"],
                stock_disponible=int(row["num_stock"] or 0),
                basic_info=basic_info,
            )
            cart_with_basic_info.append(cart_item)

        return cart_with_basic_info

    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carrito con información básica: {str(e)}")

