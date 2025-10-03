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
    

