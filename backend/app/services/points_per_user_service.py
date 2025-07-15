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
        return result.scalar()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el historial de puntos por usuario: {str(e)}")    