"""
Servicios para la gestión de puntos por usuario.

"""

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.order_schema import OrderBase


def get_points_per_user(db: Session, id_usuario: Decimal):
    """
    Obtiene el resumen de puntos de un usuario específico.
    
    Args:
        db (Session): Sesión de base de datos
        id_usuario (Decimal): ID del usuario
        
    Returns:
        dict: Resumen de puntos del usuario
    """
    try:
        query = text("""
        SELECT
            id_usuario,
            puntos_disponibles,
            puntos_totales_ganados,
            puntos_totales_canjeados,
            usr_insert,
            usr_update
        FROM tab_puntos_usuario
        WHERE id_usuario = :id_usuario
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener resumen de puntos del usuario: {str(e)}")


def calculate_points_for_buy(db: Session, order: OrderBase):
    """
    Calcula los puntos que se ganarían por una compra específica.
    
    Args:
        db (Session): Sesión de base de datos
        order (OrderBase): Objeto con datos de la orden
        
    Returns:
        int: Cantidad de puntos calculados
    """
    try:
        query = text("""
            SELECT 
                fun_calcular_puntos_por_compra(:val_total_pedido)
        """)
        result = db.execute(query, {"val_total_pedido": order.val_total_pedido})
        return result.fetchone()[0]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al calcular puntos por compra: {str(e)}")

def add_points_for_purchase(db: Session, order: OrderBase):
    """
    Agrega puntos al usuario por una compra realizada.
    
    Args:
        db (Session): Sesión de base de datos
        order (OrderBase): Objeto con datos de la orden
        
    Returns:
        resultado de la función de BD
    """
    try:
        query = text("""
            SELECT 
                fun_acumular_puntos_compra(:id_usuario, :id_orden, :val_total_pedido, :usr_insert)
        """)
        result = db.execute(query, {
            "id_usuario": order.id_usuario, 
            "id_orden": order.id_orden, 
            "val_total_pedido": order.val_total_pedido, 
            "usr_insert": order.usr_insert
        })
        return result.fetchone()[0]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al agregar puntos por compra: {str(e)}")



def get_points_per_user_history(db: Session, id_usuario: Decimal):
    """
    Obtiene el historial de puntos por usuario.
    """
    try:
        query = text("""
            SELECT 
                fun_obtener_historial_puntos(:id_usuario)
        """)
        result = db.execute(query, {"id_usuario": id_usuario})
        return result.fetchall()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el historial de puntos por usuario: {str(e)}")    