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

def get_order_by_id(db:Session, id_orden: Decimal, limit: int = 10):
    """
    Obtiene una orden específica por su identificador.
    """
    try:
        query = text("""
        SELECT fun_obtener_ordenes_usuario(
            :id_usuario,
            :limite
        )
        """)
        result = db.execute(query, {"id_usuario": id_orden, "limite": 1})
        return result.mappings().all()
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
        Decimal: El identificador de la orden creada.
    """
    try:
        params = order.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_crear_orden_desde_carrito(
            :id_usuario,
            :metodo_pago,
            :id_canje,
            :des_observaciones,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear la orden: {str(e)}")
    

