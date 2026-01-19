"""
Modulo de Servicios de Uso de Recursos.

Este modulo contiene la logica de negocio para gestionar el tracking
de uso de recursos por instancia.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.uso_recurso_schema import UsoRecursoCreate


def get_uso_recursos(db: Session, id_instancia: Decimal = None) -> List[dict]:
    """Obtiene todos los registros de uso de recursos."""
    try:
        query_str = """
        SELECT
            id_uso_recurso,
            id_instancia,
            id_suscripcion,
            fecha_medicion,
            productos_actuales,
            usuarios_actuales,
            almacenamiento_actual_gb,
            max_productos,
            max_usuarios,
            max_almacenamiento_gb,
            porcentaje_uso_productos,
            porcentaje_uso_usuarios,
            porcentaje_uso_almacenamiento,
            ind_alerta_productos,
            ind_alerta_usuarios,
            ind_alerta_almacenamiento,
            usr_insert,
            fec_insert
        FROM tab_uso_recursos
        """
        params = {}
        if id_instancia:
            query_str += " WHERE id_instancia = :id_instancia"
            params["id_instancia"] = id_instancia
        query_str += " ORDER BY fecha_medicion DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener uso de recursos: {str(e)}")


def get_uso_recurso(db: Session, id_uso_recurso: Decimal) -> Optional[dict]:
    """Obtiene un registro de uso de recursos especifico."""
    try:
        query = text("""
        SELECT
            id_uso_recurso,
            id_instancia,
            id_suscripcion,
            fecha_medicion,
            productos_actuales,
            usuarios_actuales,
            almacenamiento_actual_gb,
            max_productos,
            max_usuarios,
            max_almacenamiento_gb,
            porcentaje_uso_productos,
            porcentaje_uso_usuarios,
            porcentaje_uso_almacenamiento,
            ind_alerta_productos,
            ind_alerta_usuarios,
            ind_alerta_almacenamiento,
            usr_insert,
            fec_insert
        FROM tab_uso_recursos
        WHERE id_uso_recurso = :id_uso_recurso
        """)
        result = db.execute(query, {"id_uso_recurso": id_uso_recurso})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener uso de recursos: {str(e)}")


def create_uso_recurso(db: Session, uso_recurso: UsoRecursoCreate, usr_insert: str) -> dict:
    """Crea un nuevo registro de uso de recursos."""
    try:
        query = text("""
            SELECT fun_insert_uso_recurso(
                :id_instancia,
                :id_suscripcion,
                :productos_actuales,
                :usuarios_actuales,
                :almacenamiento_actual_gb,
                :max_productos,
                :max_usuarios,
                :max_almacenamiento_gb,
                :usr_insert
            )
        """)
        
        params = {
            "id_instancia": uso_recurso.id_instancia,
            "id_suscripcion": uso_recurso.id_suscripcion,
            "productos_actuales": uso_recurso.productos_actuales,
            "usuarios_actuales": uso_recurso.usuarios_actuales,
            "almacenamiento_actual_gb": uso_recurso.almacenamiento_actual_gb,
            "max_productos": uso_recurso.max_productos,
            "max_usuarios": uso_recurso.max_usuarios,
            "max_almacenamiento_gb": uso_recurso.max_almacenamiento_gb,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear uso de recursos: {str(e)}")


def delete_uso_recurso(db: Session, id_uso_recurso: Decimal) -> dict:
    """Elimina un registro de uso de recursos."""
    try:
        query = text("""SELECT fun_delete_uso_recurso(:id_uso_recurso)""")
        result = db.execute(query, {"id_uso_recurso": id_uso_recurso})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Registro eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar uso de recursos: {str(e)}")


def get_ultimo_uso_recurso(db: Session, id_instancia: Decimal) -> Optional[dict]:
    """Obtiene el ultimo registro de uso de recursos de una instancia."""
    try:
        query = text("""
        SELECT
            id_uso_recurso,
            id_instancia,
            id_suscripcion,
            fecha_medicion,
            productos_actuales,
            usuarios_actuales,
            almacenamiento_actual_gb,
            max_productos,
            max_usuarios,
            max_almacenamiento_gb,
            porcentaje_uso_productos,
            porcentaje_uso_usuarios,
            porcentaje_uso_almacenamiento,
            ind_alerta_productos,
            ind_alerta_usuarios,
            ind_alerta_almacenamiento
        FROM tab_uso_recursos
        WHERE id_instancia = :id_instancia
        ORDER BY fecha_medicion DESC
        LIMIT 1
        """)
        result = db.execute(query, {"id_instancia": id_instancia})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener ultimo uso de recursos: {str(e)}")


def get_instancias_con_alertas(db: Session) -> List[dict]:
    """Obtiene las instancias que tienen alertas de uso de recursos."""
    try:
        query = text("""
        SELECT DISTINCT ON (ur.id_instancia)
            ur.id_uso_recurso,
            ur.id_instancia,
            ur.id_suscripcion,
            ur.fecha_medicion,
            ur.productos_actuales,
            ur.usuarios_actuales,
            ur.almacenamiento_actual_gb,
            ur.porcentaje_uso_productos,
            ur.porcentaje_uso_usuarios,
            ur.porcentaje_uso_almacenamiento,
            ur.ind_alerta_productos,
            ur.ind_alerta_usuarios,
            ur.ind_alerta_almacenamiento,
            i.nom_instancia,
            i.identificacion_fiscal_cliente
        FROM tab_uso_recursos ur
        JOIN tab_instancias i ON ur.id_instancia = i.id_instancia
        WHERE ur.ind_alerta_productos = TRUE
           OR ur.ind_alerta_usuarios = TRUE
           OR ur.ind_alerta_almacenamiento = TRUE
        ORDER BY ur.id_instancia, ur.fecha_medicion DESC
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener instancias con alertas: {str(e)}")
