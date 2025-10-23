from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from schemas.cart_product_schemas import CalculateTotalCart, CartProductCreate, CartProductDelete, GetCartDetail, MigrateCartAnonymous, GetCartUser, CartItemWithBasicInfo, ProductBasicInfo

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
        
        print(f"🛒 [BACKEND] Agregando producto al carrito con parámetros: {params}")
        
        query = text("""
        SELECT fun_agregar_producto_carrito(
            :id_usuario,
            :session_id,
            :id_categoria_producto,
            :id_linea_producto,
            :id_sublinea_producto,
            :id_producto,
            :cantidad,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        print(f"✅ [BACKEND] Producto agregado exitosamente. Resultado: {fetched_result[0] if fetched_result else None}")
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        print(f"❌ [BACKEND] Error al crear producto en el carrito: {str(e)}")
        raise Exception(f"Error al crear producto en el carrito: {str(e)}")

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
    Obtiene a detalle el carrito de un usuario usando la función SQL fun_obtener_carrito_detalle.
    Args:
        db (Session): Sesión de base de datos.
        get_cart_detail (GetCartDetail): Datos del usuario (id_usuario o session_id).
    Returns:
        list[CartProduct]: Lista de productos en el carrito con stock disponible.
    """
    try:
        params = get_cart_detail.model_dump()
        print(f"🔍 [BACKEND] Obteniendo detalle del carrito con parámetros: {params}")
        
        query = text("""
        SELECT fun_obtener_carrito_detalle(:id_usuario, :session_id)
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        
        print(f"🔍 [BACKEND] Resultado de la consulta: {fetched_result}")
        
        if not fetched_result or not fetched_result[0]:
            print("🔍 [BACKEND] No se encontraron productos en el carrito")
            return []
        
        cart_data = fetched_result[0]
        print(f"🔍 [BACKEND] Datos del carrito obtenidos: {cart_data}")
        
        # Extraer la lista de productos del JSON
        productos = cart_data.get('productos', [])
        print(f"🔍 [BACKEND] Productos extraídos: {productos}")
        
        # Convertir productos a la estructura esperada por el frontend
        products_list = []
        for producto in productos:
            product_dict = {
                'id_carrito_producto': producto.get('id_carrito_producto'),
                'id_producto': producto.get('id_producto'),
                'nombre_producto': producto.get('nombre_producto'),
                'precio_unitario': float(producto.get('precio_unitario', 0)),
                'cantidad': int(producto.get('cantidad', 0)),
                'subtotal': float(producto.get('subtotal', 0)),
                'stock_disponible': int(producto.get('stock_disponible', 0)),
                'imagen_url': None,
                'categoria': None,
                'marca': None,
                'linea': None,
                'sublinea': None
            }
            
            # Procesar imagen_producto si existe
            if producto.get('imagen_producto'):
                try:
                    import json
                    img_data = producto.get('imagen_producto')
                    if isinstance(img_data, str):
                        img_data = json.loads(img_data)
                    if isinstance(img_data, dict) and 'main' in img_data:
                        product_dict['imagen_url'] = img_data['main']
                    elif isinstance(img_data, dict) and 'url' in img_data:
                        product_dict['imagen_url'] = img_data['url']
                except:
                    pass  # Si no se puede parsear, mantener None
            
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

