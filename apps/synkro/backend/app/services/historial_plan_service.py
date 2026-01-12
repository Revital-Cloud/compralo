"""
Modulo de Servicios de Historial de Planes.

Este modulo contiene la logica de negocio para gestionar el historial
de cambios de plan en suscripciones.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.historial_plan_schema import HistorialPlanCreate


def get_historial_planes(db: Session, id_suscripcion: Decimal = None) -> List[dict]:
    """Obtiene el historial de cambios de plan."""
    try:
        query_str = """
        SELECT
            id_historial,
            id_suscripcion,
            id_plan_anterior,
            id_plan_nuevo,
            precio_anterior,
            precio_nuevo,
            tipo_cambio,
            fecha_cambio,
            fecha_efectiva,
            diferencia_precio,
            porcentaje_cambio,
            motivo_cambio,
            usuario_email,
            usr_insert,
            fec_insert
        FROM tab_historial_planes
        """
        params = {}
        if id_suscripcion:
            query_str += " WHERE id_suscripcion = :id_suscripcion"
            params["id_suscripcion"] = id_suscripcion
        query_str += " ORDER BY fecha_cambio DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener historial de planes: {str(e)}")


def get_historial_plan(db: Session, id_historial: Decimal) -> Optional[dict]:
    """Obtiene un registro de historial especifico."""
    try:
        query = text("""
        SELECT
            id_historial,
            id_suscripcion,
            id_plan_anterior,
            id_plan_nuevo,
            precio_anterior,
            precio_nuevo,
            tipo_cambio,
            fecha_cambio,
            fecha_efectiva,
            diferencia_precio,
            porcentaje_cambio,
            motivo_cambio,
            usuario_email,
            usr_insert,
            fec_insert
        FROM tab_historial_planes
        WHERE id_historial = :id_historial
        """)
        result = db.execute(query, {"id_historial": id_historial})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener historial: {str(e)}")


def create_historial_plan(db: Session, historial: HistorialPlanCreate, usr_insert: str) -> dict:
    """Crea un nuevo registro de historial de plan."""
    try:
        query = text("""
            SELECT fun_insert_historial_plan(
                :id_suscripcion,
                :id_plan_anterior,
                :id_plan_nuevo,
                :precio_anterior,
                :precio_nuevo,
                :tipo_cambio::enum_tipo_cambio,
                :fecha_efectiva,
                :motivo_cambio,
                :usuario_email,
                :usr_insert
            )
        """)
        
        params = {
            "id_suscripcion": historial.id_suscripcion,
            "id_plan_anterior": historial.id_plan_anterior,
            "id_plan_nuevo": historial.id_plan_nuevo,
            "precio_anterior": historial.precio_anterior,
            "precio_nuevo": historial.precio_nuevo,
            "tipo_cambio": historial.tipo_cambio,
            "fecha_efectiva": historial.fecha_efectiva,
            "motivo_cambio": historial.motivo_cambio,
            "usuario_email": historial.usuario_email,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear historial de plan: {str(e)}")


def delete_historial_plan(db: Session, id_historial: Decimal) -> dict:
    """Elimina un registro de historial de plan."""
    try:
        query = text("""SELECT fun_delete_historial_plan(:id_historial)""")
        result = db.execute(query, {"id_historial": id_historial})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Historial eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar historial: {str(e)}")


def get_historial_por_cliente(db: Session, identificacion_fiscal: str) -> List[dict]:
    """Obtiene el historial de cambios de plan de un cliente."""
    try:
        query = text("""
        SELECT
            hp.id_historial,
            hp.id_suscripcion,
            hp.id_plan_anterior,
            hp.id_plan_nuevo,
            hp.precio_anterior,
            hp.precio_nuevo,
            hp.tipo_cambio,
            hp.fecha_cambio,
            hp.fecha_efectiva,
            hp.diferencia_precio,
            hp.porcentaje_cambio,
            hp.motivo_cambio,
            pa.nom_plan AS nom_plan_anterior,
            pn.nom_plan AS nom_plan_nuevo
        FROM tab_historial_planes hp
        JOIN tab_suscripciones s ON hp.id_suscripcion = s.id_suscripcion
        LEFT JOIN tab_planes pa ON hp.id_plan_anterior = pa.id_plan
        JOIN tab_planes pn ON hp.id_plan_nuevo = pn.id_plan
        WHERE s.identificacion_fiscal_cliente = :identificacion_fiscal
        ORDER BY hp.fecha_cambio DESC
        """)
        result = db.execute(query, {"identificacion_fiscal": identificacion_fiscal})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener historial por cliente: {str(e)}")
