"""
Servicios para la gestión de puntos por usuario.

"""

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.orders_schema import CalculatePointsPerOrder


def get_points_per_user(db: Session, CalculatePointsPerOrder: CalculatePointsPerOrder):
    """
    Obtiene los puntos por usuario.
    """
    try:
        query = text("""
            SELECT 
                fun_calcular_puntos_por_compra(:val_total_pedido)
        """)
        result = db.execute(query, {"val_total_pedido": CalculatePointsPerOrder.val_total_pedido})
        return result.fetchone()[0]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener puntos por orden de usuario: {str(e)}")

def add_points_per_user(db: Session, CalculatePointsPerOrder: CalculatePointsPerOrder):
    """
    Agrega puntos por orden de usuario.
    """
    try:
        query = text("""
            SELECT 
                fun_acumular_puntos_compra(:id_usuario, :id_orden, :val_total_pedido, :usr_insert)
        """)
        result = db.execute(query, {"id_usuario": CalculatePointsPerOrder.id_usuario, "id_orden": CalculatePointsPerOrder.id_orden, "val_total_pedido": CalculatePointsPerOrder.val_total_pedido, "usr_insert": CalculatePointsPerOrder.usr_insert})
        return result.fetchone()[0]
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al agregar puntos por orden de usuario: {str(e)}")
    

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