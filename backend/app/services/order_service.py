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
        ORDER BY fec_pedido DESC
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
        db.rollback()
        raise Exception(f"Error al obtener la orden: {str(e)}")
    
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
    

