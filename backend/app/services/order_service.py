from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.order_schema import OrderCreate


def get_orders(db:Session):
    """
    Obtiene todas las órdenes registradas en la base de datos.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las órdenes: {str(e)}")


def get_all_orders_admin(db: Session, limit: int = 50, offset: int = 0):
    """
    Obtiene todas las órdenes para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        limit (int): Límite de resultados
        offset (int): Offset para paginación
        
    Returns:
        list: Lista de órdenes con información del usuario
    """
    try:
        query = text("""
        SELECT 
            o.id_orden, 
            o.fec_pedido, 
            o.id_usuario,
            u.nom_usuario, 
            u.ape_usuario, 
            u.email_usuario,
            COALESCE(o.val_total_productos, 0) as val_total_productos, 
            COALESCE(o.val_total_descuentos, 0) as val_total_descuentos, 
            COALESCE(o.val_total_pedido, 0) as val_total_pedido,
            o.ind_estado, 
            o.metodo_pago, 
            o.detalle_descuentos_aplicados,
            (SELECT COUNT(*) FROM tab_orden_productos op WHERE op.id_orden = o.id_orden) as items_count
        FROM tab_ordenes o
        INNER JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        ORDER BY o.fec_pedido DESC
        LIMIT :limit OFFSET :offset
        """)
        result = db.execute(query, {"limit": limit, "offset": offset})
        orders = result.mappings().all()
        
        # Convertir RowMapping a dict y normalizar valores
        orders_list = []
        for order in orders:
            order_dict = dict(order)  # Convertir RowMapping a dict
            
            # Convertir valores None a valores por defecto
            order_dict['val_total_productos'] = order_dict.get('val_total_productos') or 0
            order_dict['val_total_descuentos'] = order_dict.get('val_total_descuentos') or 0
            order_dict['val_total_pedido'] = order_dict.get('val_total_pedido') or 0
            order_dict['items_count'] = order_dict.get('items_count') or 0
            order_dict['nom_usuario'] = order_dict.get('nom_usuario') or ''
            order_dict['ape_usuario'] = order_dict.get('ape_usuario') or ''
            order_dict['email_usuario'] = order_dict.get('email_usuario') or ''
            order_dict['metodo_pago'] = order_dict.get('metodo_pago') or ''
            
            orders_list.append(order_dict)
            
        return orders_list
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener órdenes para admin: {str(e)}")


def get_order_stats_admin(db: Session):
    """
    Obtiene estadísticas de órdenes para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        
    Returns:
        dict: Estadísticas de órdenes
    """
    try:
        query = text("""
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ind_estado = 1) as pendiente,
            COUNT(*) FILTER (WHERE ind_estado = 2) as completada,
            COUNT(*) FILTER (WHERE ind_estado = 3) as cancelada,
            COALESCE(SUM(val_total_pedido) FILTER (WHERE ind_estado = 2), 0) as total_ventas
        FROM tab_ordenes
        """)
        result = db.execute(query)
        stats = result.mappings().first()
        
        # Convertir valores a los tipos correctos
        if stats:
            # Asegurar que todos los conteos sean int
            stats['total'] = int(stats.get('total', 0))
            stats['pendiente'] = int(stats.get('pendiente', 0))
            stats['completada'] = int(stats.get('completada', 0))
            stats['cancelada'] = int(stats.get('cancelada', 0))
            # total_ventas ya debería ser Decimal por defecto
            if stats.get('total_ventas') is None:
                stats['total_ventas'] = Decimal('0')
        
        return stats
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener estadísticas de órdenes: {str(e)}")


def get_order_detail_admin(db: Session, id_orden: int):
    """
    Obtiene el detalle completo de una orden para el panel de administración.
    
    Args:
        db (Session): Sesión de base de datos
        id_orden (int): ID de la orden
        
    Returns:
        dict: Detalle completo de la orden
    """
    try:
        # Información básica de la orden con usuario
        order_query = text("""
        SELECT 
            o.id_orden, 
            o.fec_pedido, 
            o.id_usuario,
            u.nom_usuario, 
            u.ape_usuario, 
            u.email_usuario,
            u.cel_usuario,
            o.val_total_productos, 
            o.val_total_descuentos, 
            o.val_total_pedido,
            o.ind_estado, 
            o.metodo_pago, 
            o.detalle_descuentos_aplicados,
            o.des_observaciones
        FROM tab_ordenes o
        JOIN tab_usuarios u ON o.id_usuario = u.id_usuario
        WHERE o.id_orden = :id_orden
        """)
        order_result = db.execute(order_query, {"id_orden": id_orden})
        order_data = order_result.mappings().first()
        
        if not order_data:
            return None
            
        # Productos de la orden
        products_query = text("""
        SELECT 
            op.id_producto,
            p.nom_producto,
            p.img_producto,
            op.cantidad,
            op.val_precio_unitario,
            op.val_subtotal
        FROM tab_orden_productos op
        JOIN tab_productos p ON op.id_producto = p.id_producto
        WHERE op.id_orden = :id_orden
        """)
        products_result = db.execute(products_query, {"id_orden": id_orden})
        products_data = products_result.mappings().all()
        
        # Dirección de envío (asumiendo que se guarda en la orden o se puede obtener del usuario)
        # Por ahora retornamos null, se puede implementar después
        
        # Puntos ganados por esta orden
        points_query = text("""
        SELECT SUM(cantidad_puntos) as puntos_ganados
        FROM tab_movimientos_puntos
        WHERE id_orden_origen = :id_orden AND tipo_movimiento = 1
        """)
        points_result = db.execute(points_query, {"id_orden": id_orden})
        points_data = points_result.scalar() or 0
        
        return {
            "orden": dict(order_data),
            "productos": [dict(p) for p in products_data],
            "direccion_envio": None,  # Se puede implementar después
            "puntos_ganados": points_data,
            "descuentos_aplicados": order_data.get("detalle_descuentos_aplicados")
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalle de orden: {str(e)}")


def update_order_status_admin(db: Session, id_orden: int, new_status: int, usr_update: Decimal):
    """
    Actualiza el estado de una orden.
    
    Args:
        db (Session): Sesión de base de datos
        id_orden (int): ID de la orden
        new_status (int): Nuevo estado (1=Pendiente, 2=Completada, 3=Cancelada)
        usr_update (Decimal): ID del usuario que actualiza
    """
    try:
        query = text("""
        UPDATE tab_ordenes 
        SET ind_estado = :new_status, usr_update = :usr_update, fec_update = NOW()
        WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {
            "id_orden": id_orden,
            "new_status": new_status,
            "usr_update": usr_update
        })
        db.commit()
        
        if result.rowcount == 0:
            raise Exception("Orden no encontrada")
            
        return True
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar estado de orden: {str(e)}")


def get_orders_by_user(db:Session, id_usuario: Decimal):
    """
    Obtiene todas las órdenes de un usuario específico.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        WHERE id_usuario = :id_usuario
        ORDER BY fec_insert DESC
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener las órdenes del usuario: {str(e)}")


def get_order_by_id(db:Session, id_orden: Decimal):
    """
    Obtiene una orden específica por su identificador.
    """
    try:
        query = text("""
        SELECT
            id_orden,
            fec_pedido,
            id_usuario,
            val_total_productos,
            val_total_descuentos,
            val_total_pedido,
            ind_estado,
            metodo_pago,
            id_descuento,
            detalle_descuentos_aplicados,
            des_observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_ordenes
        WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {"id_orden": id_orden})
        return result.mappings().first()
    except Exception as e:
        
        raise Exception(f"Error al obtener la orden: {str(e)}")


def get_order_detail(db:Session, id_orden: Decimal):
    """
    Obtiene los detalles de una orden específica.
    """
    try:
        query = text("""
        SELECT * FROM tab_ordenes WHERE id_orden = :id_orden
        """)
        result = db.execute(query, {"id_orden": id_orden})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener los detalles de la orden: {str(e)}")
    

def create_order(db:Session, order:OrderCreate, usr_insert: Decimal):
    """
    Crea una nueva orden en la base de datos.
    Utiliza la función de base de datos `fun_crear_orden_desde_carrito` para crear la orden.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        order (OrderCreate): Un objeto Pydantic `OrderCreate` con los datos a insertar.
        usr_insert (Decimal): El identificador del usuario que insertó la orden.
    Returns:
        dict: El diccionario completo con toda la información de la orden creada.
    """
    try:
        params = order.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_crear_orden_desde_carrito(
            :id_carrito,
            :id_direccion,
            :codigo_descuento,
            :des_observaciones,
            :usr_insert,
            :id_canje
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
                # La función devuelve un diccionario completo con toda la información
        if fetched_result and fetched_result[0]:
            response_data = fetched_result[0]
            # Devolver todo el diccionario con la información completa
            if isinstance(response_data, dict):
                return response_data

        return None
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        
        # Manejo específico para errores de actualización de stock automática
        if "fun_actualizar_stock_automatico" in error_msg and "usr_insert" in error_msg:
            raise Exception(
                "La orden se está procesando pero hay un problema con la actualización automática de stock. "
                "Por favor, contacta al administrador para verificar el inventario. "
                f"Detalles técnicos: {error_msg}"
            )
        
        # Para otros errores, mantener el mensaje original
        raise Exception(f"Error al crear la orden: {error_msg}")


def _pick_first_key(d: dict, keys: list, default=None):
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default


def get_order_with_items(db: Session, id_orden: Decimal):
    """
    Devuelve la orden y un arreglo `items` con el snapshot de productos comprados
    (nombre, cantidad, precio unitario, total y metadatos como imagen), evitando
    depender del estado actual del producto. Lee desde `tab_orden_productos` con LEFT JOIN a `tab_productos`
    sin filtrar por estado, o usa una función de fallback. Nunca falla: si no encuentra fuente, retorna items=[].
    """
    # 1) Obtener la orden base
    order = get_order_by_id(db, id_orden)
    if not order:
        return None

    items = []

    # 2) Intentar leer de tab_orden_productos + LEFT JOIN a tab_productos (para nombre/imagen)
    try:
        query_items = text(
            """
            SELECT 
                op.id_orden,
                op.id_orden_producto AS id_item,
                op.id_producto,
                p.nom_producto AS product_name,
                op.cant_producto AS quantity,
                op.precio_unitario_orden AS unit_price,
                op.subtotal AS total_price,
                p.img_producto AS product_image
            FROM tab_orden_productos op
            LEFT JOIN tab_productos p 
              ON p.id_categoria = op.id_categoria_producto
             AND p.id_linea = op.id_linea_producto
             AND p.id_sublinea = op.id_sublinea_producto
             AND p.id_producto = op.id_producto
            WHERE op.id_orden = :id_orden
            ORDER BY op.id_orden_producto ASC
            """
        )
        result_items = db.execute(query_items, {"id_orden": id_orden})
        items = [dict(row) for row in result_items.mappings().all()]
    except Exception:
        # 3) Fallback: intentar una función si existe
        try:
            query_fn = text("SELECT fun_obtener_orden_detalle(:id_orden)")
            fn_row = db.execute(query_fn, {"id_orden": id_orden}).fetchone()
            if fn_row and fn_row[0]:
                payload = fn_row[0]
                if isinstance(payload, list):
                    items = payload
                elif isinstance(payload, dict):
                    items = payload.get("items", payload.get("productos", []))
        except Exception:
            items = []

    # 4) Unir y devolver
    enriched = dict(order)
    enriched["items"] = items
    return enriched


def update_order_payment_info(db: Session, id_orden: Decimal, metodo_pago: str | None = None, ind_estado: int | None = None):
    """Actualiza `metodo_pago` y/o `ind_estado` de una orden."""
    try:
        sets = []
        params = {"id_orden": id_orden}
        if metodo_pago is not None:
            sets.append("metodo_pago = :metodo_pago")
            params["metodo_pago"] = metodo_pago
        if ind_estado is not None:
            sets.append("ind_estado = :ind_estado")
            params["ind_estado"] = ind_estado
        if not sets:
            return
        sets.append("fec_update = NOW()")
        query = text(f"UPDATE tab_ordenes SET {' , '.join(sets)} WHERE id_orden = :id_orden")
        db.execute(query, params)
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar la orden: {str(e)}")
    

