"""
Modulo de Servicios de Dominios.

Este modulo contiene la logica de negocio para gestionar los dominios
asociados a instancias.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.dominio_schema import DominioCreate, DominioUpdate


def get_dominios(db: Session, id_instancia: Decimal = None) -> List[dict]:
    """Obtiene todos los dominios, opcionalmente filtrados por instancia."""
    try:
        query_str = """
        SELECT
            id_dominio,
            id_instancia,
            nom_dominio,
            tipo_dominio,
            estado_dominio,
            ssl_habilitado,
            fecha_ssl_emision,
            fecha_ssl_vencimiento,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_dominios
        """
        params = {}
        if id_instancia:
            query_str += " WHERE id_instancia = :id_instancia"
            params["id_instancia"] = id_instancia
        query_str += " ORDER BY fec_insert DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener dominios: {str(e)}")


def get_dominio(db: Session, id_dominio: Decimal) -> Optional[dict]:
    """Obtiene un dominio especifico por su ID."""
    try:
        query = text("""
        SELECT
            id_dominio,
            id_instancia,
            nom_dominio,
            tipo_dominio,
            estado_dominio,
            ssl_habilitado,
            fecha_ssl_emision,
            fecha_ssl_vencimiento,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_dominios
        WHERE id_dominio = :id_dominio
        """)
        result = db.execute(query, {"id_dominio": id_dominio})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el dominio: {str(e)}")


def create_dominio(db: Session, dominio: DominioCreate, usr_insert: str) -> dict:
    """Crea un nuevo dominio llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_insert_dominio(
                :id_instancia,
                :nom_dominio,
                :tipo_dominio::enum_tipo_dominio,
                :estado_dominio::enum_estado_dominio,
                :ssl_habilitado,
                :usr_insert
            )
        """)
        
        params = {
            "id_instancia": dominio.id_instancia,
            "nom_dominio": dominio.nom_dominio,
            "tipo_dominio": dominio.tipo_dominio or "subdominio",
            "estado_dominio": dominio.estado_dominio or "pendiente",
            "ssl_habilitado": dominio.ssl_habilitado or False,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear dominio: {str(e)}")


def update_dominio(db: Session, id_dominio: Decimal, dominio: DominioUpdate, usr_update: str) -> dict:
    """Actualiza un dominio existente llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_update_dominio(
                :id_dominio,
                :nom_dominio,
                :tipo_dominio::enum_tipo_dominio,
                :estado_dominio::enum_estado_dominio,
                :ssl_habilitado,
                :fecha_ssl_emision,
                :fecha_ssl_vencimiento,
                :usr_update
            )
        """)
        
        params = {
            "id_dominio": id_dominio,
            "nom_dominio": dominio.nom_dominio,
            "tipo_dominio": dominio.tipo_dominio,
            "estado_dominio": dominio.estado_dominio,
            "ssl_habilitado": dominio.ssl_habilitado,
            "fecha_ssl_emision": dominio.fecha_ssl_emision,
            "fecha_ssl_vencimiento": dominio.fecha_ssl_vencimiento,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar dominio: {str(e)}")


def delete_dominio(db: Session, id_dominio: Decimal) -> dict:
    """Elimina un dominio (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_dominio(:id_dominio)""")
        result = db.execute(query, {"id_dominio": id_dominio})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Dominio eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar dominio: {str(e)}")
