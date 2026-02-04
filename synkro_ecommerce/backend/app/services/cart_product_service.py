import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, Any, Dict
from psycopg2.extras import Json

from schemas.cart_product_schemas import CalculateTotalCart, CartProductCreate, CartProductDelete, GetCartDetail, MigrateCartAnonymous, GetCartUser, CartItemWithBasicInfo, ProductBasicInfo


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

def get_cart_products(db:Session):
    """
    Obtiene todos los productos en el carrito.
    """
    try:
        query = text("""
        SELECT
            id_carrito_producto,
            id_carrito,
            id_categoria_producto,
            id_linea_producto,
            id_sublinea_producto,
            id_producto,
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
    Crea un nuevo producto en el carrito.
    Utiliza la función de base de datos `fun_agregar_producto_carrito` para insertar
    un nuevo producto en el carrito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        cart_product (CartProductCreate): Un objeto Pydantic `CartProductCreate` con los datos a insertar.
        Debe contener id_usuario (para usuarios autenticados) O session_id (para usuarios anónimos).
        usr_insert (Optional[Decimal]): El usuario que insertó el registro.
    
    Raises:
        Exception: Si no se proporciona ni id_usuario ni session_id en cart_product.
    """
    try:
        params = cart_product.model_dump()
        params["usr_insert"] = usr_insert
        opts = params.get("opciones_elegidas") or {}
        params["opciones_elegidas"] = Json(opts) if isinstance(opts, dict) else Json({})

        print(f"🛒 [BACKEND] Agregando producto al carrito con parámetros: {params}")

        # Casts para que coincidan con la firma en BD (cantidad es INTEGER por %TYPE en tab_carrito_productos).
        query = text("""
        SELECT fun_agregar_producto_carrito(
            CAST(:id_usuario AS NUMERIC),
            CAST(:session_id AS VARCHAR),
            CAST(:id_categoria_producto AS NUMERIC),
            CAST(:id_linea_producto AS NUMERIC),
            CAST(:id_sublinea_producto AS NUMERIC),
            CAST(:id_producto AS NUMERIC),
            CAST(:cantidad AS INTEGER),
            CAST(:usr_insert AS NUMERIC),
            CAST(:opciones_elegidas AS JSONB)
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        print(f"✅ [BACKEND] Producto agregado exitosamente. Resultado: {fetched_result[0] if fetched_result else None}")
        
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
    """
    try:
        # Primero, obtener información del producto para validar stock
        stock_query = text("""
        SELECT p.num_stock, cp.id_producto, cp.cantidad as cantidad_actual
        FROM tab_carrito_productos cp
        JOIN tab_productos p ON cp.id_producto = p.id_producto
        WHERE cp.id_carrito_producto = :id_carrito_producto
        """)
        stock_result = db.execute(stock_query, {"id_carrito_producto": id_carrito_producto})
        stock_info = stock_result.fetchone()
        
        if not stock_info:
            raise Exception("Producto no encontrado en el carrito")
        
        stock_disponible = stock_info[0]
        id_producto = stock_info[1]
        cantidad_actual = stock_info[2]
        
        # Validar que la nueva cantidad no exceda el stock disponible
        if nueva_cantidad > stock_disponible:
            raise Exception(f"Stock insuficiente. Disponible: {stock_disponible}, solicitado: {nueva_cantidad}")
        
        # Validar que la cantidad sea mayor a 0
        if nueva_cantidad <= 0:
            raise Exception("La cantidad debe ser mayor a 0")
        
        # Actualizar la cantidad en la base de datos
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

def delete_cart_product(db: Session, id_usuario: Optional[Decimal], session_id: Optional[str], id_categoria_producto: Decimal, id_linea_producto: Decimal, id_sublinea_producto: Decimal, id_producto: Decimal, cantidad: Decimal, usr_update: Decimal):
    """
    Elimina un producto en el carrito.
    Utiliza la función de base de datos `fun_eliminar_producto_carrito` para eliminar
    un producto en el carrito.
    
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_usuario (Optional[Decimal]): ID del usuario (para usuarios autenticados).
        session_id (Optional[str]): ID de la sesión (para usuarios anónimos, UUID v4).
        id_categoria_producto (Decimal): ID de la categoría del producto.
        id_linea_producto (Decimal): ID de la línea del producto.
        id_sublinea_producto (Decimal): ID de la sublínea del producto.
        id_producto (Decimal): ID del producto.
        cantidad (Decimal): Cantidad del producto.
        usr_update (Decimal): El usuario que actualizó el registro.
    
    Raises:
        Exception: Si no se proporciona ni id_usuario ni session_id.
    """
    try:
        query = text("""
        SELECT fun_eliminar_producto_carrito(
            :id_usuario,
            :session_id,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :cantidad,
            :usr_update
        )
        """)
        result = db.execute(query, {
            'id_usuario': id_usuario,
            'session_id': session_id,
            'id_categoria_producto': id_categoria_producto,
            'id_linea_producto': id_linea_producto,
            'id_sublinea_producto': id_sublinea_producto,
            'id_producto': id_producto,
            'cantidad': cantidad,
            'usr_update': usr_update
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
        

    """
    try:
        params = migrate_cart_anonymous.model_dump()
        params["id_usuario"] = usr_insert  # El usuario de destino es el mismo que hace la operación
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
    
def get_cart_detail(db:Session, get_cart_detail:GetCartDetail):
    """
    Obtiene a detalle el carrito de un usuario con JOIN a marcas y sublineas.
    Args:
        db (Session): Sesión de base de datos.
        get_cart_detail (GetCartDetail): Datos del usuario (id_usuario o session_id).
    Returns:
        list[CartProduct]: Lista de productos en el carrito con stock disponible.
    """
    try:
        params = get_cart_detail.model_dump()
        print(f"🔍 [BACKEND] Obteniendo detalle del carrito con parámetros: {params}")
        
        # Query directo con JOIN a marcas y sublineas
        query = text("""
        SELECT 
            cp.id_carrito_producto,
            cp.id_categoria_producto,
            cp.id_linea_producto,
            cp.id_sublinea_producto,
            cp.id_producto,
            p.nom_producto,
            cp.cantidad,
            cp.precio_unitario_carrito,
            (cp.cantidad * cp.precio_unitario_carrito) as subtotal,
            p.num_stock,
            p.img_producto,
            m.nom_marca,
            sl.nom_sublinea,
            cat.nom_categoria,
            COALESCE(cp.opciones_elegidas, '{}'::JSONB) as opciones_elegidas,
            p.spcf_producto
        FROM tab_carrito_productos cp
        JOIN tab_carritos c ON cp.id_carrito = c.id_carrito
        JOIN tab_productos p ON (
            cp.id_categoria_producto = p.id_categoria AND
            cp.id_linea_producto = p.id_linea AND
            cp.id_sublinea_producto = p.id_sublinea AND
            cp.id_producto = p.id_producto
            AND p.ind_activo = TRUE
        )
        LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
        LEFT JOIN tab_sublineas sl ON (
            p.id_categoria = sl.id_categoria AND
            p.id_linea = sl.id_linea AND
            p.id_sublinea = sl.id_sublinea
        )
        LEFT JOIN tab_categorias cat ON p.id_categoria = cat.id_categoria
        WHERE (c.id_usuario = :id_usuario OR c.session_id = :session_id)
        AND (c.id_usuario IS NOT NULL OR c.session_id IS NOT NULL)
        ORDER BY cp.fec_insert DESC
        """)
        
        result = db.execute(query, params)
        cart_items = result.fetchall()
        
        print(f"🔍 [BACKEND] Resultado de la consulta: {len(cart_items)} items")
        
        if not cart_items:
            print("🔍 [BACKEND] No se encontraron productos en el carrito")
            return []
        
        # Convertir productos a la estructura esperada por el frontend
        products_list = []
        for item in cart_items:
            opciones = _opciones_elegidas_to_dict(item[14]) if len(item) > 14 else {}
            # Imagen según color elegido (opciones_elegidas.color) o main por defecto
            imagen_url = _imagen_url_por_color(
                item[10],  # img_producto
                item[15] if len(item) > 15 else None,  # spcf_producto
                opciones,
            )
            
            product_dict = {
                'id_carrito_producto': item[0],
                'id_categoria_producto': item[1],
                'id_linea_producto': item[2],
                'id_sublinea_producto': item[3],
                'id_producto': item[4],
                'nombre_producto': item[5],
                'cantidad': int(item[6]),
                'precio_unitario': float(item[7]),
                'subtotal': float(item[8]),
                'stock_disponible': int(item[9]),
                'imagen_url': imagen_url,
                'marca': item[11],
                'sublinea': item[12],
                'categoria': item[13],
                'opciones_elegidas': opciones,
            }
            
            products_list.append(product_dict)
        
        print(f"📦 [BACKEND] Lista de productos procesada: {products_list}")
        
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
        
        # Si la respuesta ya tiene todos los campos necesarios, devolverla tal como está
        if isinstance(response_data, dict) and "success" in response_data:
            return response_data
        
        # Si la respuesta es un diccionario simple (carrito vacío), mapear a la estructura completa
        if isinstance(response_data, dict):
            return {
                "success": True,
                "total_final": response_data.get("total_final", 0),
                "total_productos": response_data.get("total_productos", 0),
                "total_descuentos": response_data.get("total_descuentos", 0),
                "ahorro_total": response_data.get("total_descuentos", 0),  # El ahorro es igual a los descuentos
                "resumen": {
                    "subtotal": response_data.get("total_productos", 0),
                    "descuentos": response_data.get("total_descuentos", 0),
                    "total": response_data.get("total_final", 0)
                },
                "descuentos_automaticos": response_data.get("descuentos_automaticos", []),
                "descuento_canjeado": response_data.get("descuento_canjeado"),
                "total_desc_automaticos": 0,  # Extraer de descuentos_automaticos si está disponible
                "total_desc_canjeado": 0,     # Extraer de descuento_canjeado si está disponible
                "es_primera_compra": False,   # Se determinaría con más lógica si es necesario
                "puntos_a_ganar": 0,          # Se calcularía basado en el total
                "id_canje_aplicado": None,
                "mensaje": response_data.get("message", "Carrito calculado exitosamente"),
                "mensaje_puntos": "Ganarás 0 puntos con esta compra" if response_data.get("total_final", 0) == 0 else f"Ganarás puntos con esta compra",
                "mensaje_resumen": f"Total a pagar: ${response_data.get('total_final', 0)}"
            }
        
        # Si no es un diccionario, devolver estructura por defecto
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
    Obtiene el carrito con información básica (marca y color) de los productos.
    
    Args:
        db (Session): Sesión de base de datos.
        get_cart_detail (GetCartDetail): Datos del usuario (id_usuario o session_id).
    
    Returns:
        list[CartItemWithBasicInfo]: Lista de productos en el carrito con información básica.
    """
    try:
        params = get_cart_detail.model_dump()
        
        # Query simple para obtener marca y color
        query = text("""
        SELECT 
            cp.id_carrito_producto,
            cp.id_carrito,
            cp.cantidad,
            cp.precio_unitario_carrito,
            (cp.cantidad * cp.precio_unitario_carrito) as subtotal,
            p.nom_producto,
            p.img_producto,
            p.num_stock,
            m.nom_marca,
            p.spcf_producto
        FROM tab_carrito_productos cp
        JOIN tab_carritos c ON cp.id_carrito = c.id_carrito
        JOIN tab_productos p ON (
            cp.id_categoria_producto = p.id_categoria AND
            cp.id_linea_producto = p.id_linea AND
            cp.id_sublinea_producto = p.id_sublinea AND
            cp.id_producto = p.id_producto
        )
        LEFT JOIN tab_marcas m ON p.id_marca = m.id_marca
        WHERE (c.id_usuario = :id_usuario OR c.session_id = :session_id)
        AND (c.id_usuario IS NOT NULL OR c.session_id IS NOT NULL)
        """)
        
        result = db.execute(query, params)
        cart_items = result.fetchall()
        
        if not cart_items:
            return []
        
        cart_with_basic_info = []
        for item in cart_items:
            # Extraer marca
            marca = item[8] if item[8] else "Sin marca"
            
            # Extraer color del JSONB
            spcf_data = item[9] if item[9] else {}
            color = None
            
            if spcf_data:
                if isinstance(spcf_data, str):
                    try:
                        import json
                        spcf_data = json.loads(spcf_data)
                    except:
                        spcf_data = {}
                
                color = spcf_data.get('color') if spcf_data else None
            
            # Extraer imagen principal
            img_data = item[6] if item[6] else {}
            imagen_url = None
            if img_data:
                try:
                    if isinstance(img_data, dict) and 'main' in img_data:
                        imagen_url = img_data['main']
                    elif isinstance(img_data, dict) and 'url' in img_data:
                        imagen_url = img_data['url']
                except:
                    pass
            
            # Crear información básica
            basic_info = ProductBasicInfo(
                marca=marca,
                color=color
            )
            
            # Crear item del carrito con información básica
            cart_item = CartItemWithBasicInfo(
                id_carrito_producto=item[0],
                id_carrito=item[1],
                cantidad=item[2],
                precio_unitario_carrito=item[3],
                subtotal=item[4],
                nombre_producto=item[5],
                imagen_url=imagen_url,
                stock_disponible=item[7],
                basic_info=basic_info
            )
            
            cart_with_basic_info.append(cart_item)
        
        return cart_with_basic_info
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener carrito con información básica: {str(e)}")

