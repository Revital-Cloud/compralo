"""
Modulo de Servicios de Deployments.

Este modulo contiene la logica de negocio para gestionar los deployments
de instancias.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.deployment_schema import DeploymentCreate, DeploymentUpdate


def get_deployments(db: Session, id_instancia: Decimal = None) -> List[dict]:
    """Obtiene todos los deployments, opcionalmente filtrados por instancia."""
    try:
        query_str = """
        SELECT
            id_deployment,
            id_instancia,
            version_deploy,
            tipo_deploy,
            estado_deploy,
            ambiente,
            logs_deploy,
            fecha_inicio,
            fecha_fin,
            duracion_segundos,
            iniciado_por,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_deployments
        """
        params = {}
        if id_instancia:
            query_str += " WHERE id_instancia = :id_instancia"
            params["id_instancia"] = id_instancia
        query_str += " ORDER BY fecha_inicio DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener deployments: {str(e)}")


def get_deployment(db: Session, id_deployment: Decimal) -> Optional[dict]:
    """Obtiene un deployment especifico por su ID."""
    try:
        query = text("""
        SELECT
            id_deployment,
            id_instancia,
            version_deploy,
            tipo_deploy,
            estado_deploy,
            ambiente,
            logs_deploy,
            fecha_inicio,
            fecha_fin,
            duracion_segundos,
            iniciado_por,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_deployments
        WHERE id_deployment = :id_deployment
        """)
        result = db.execute(query, {"id_deployment": id_deployment})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el deployment: {str(e)}")


def create_deployment(db: Session, deployment: DeploymentCreate, usr_insert: str) -> dict:
    """Crea un nuevo deployment llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_insert_deployment(
                :id_instancia,
                :version_deploy,
                :tipo_deploy::enum_tipo_deploy,
                :estado_deploy::enum_estado_deploy,
                :ambiente::enum_ambiente,
                :iniciado_por,
                :usr_insert
            )
        """)
        
        params = {
            "id_instancia": deployment.id_instancia,
            "version_deploy": deployment.version_deploy,
            "tipo_deploy": deployment.tipo_deploy or "manual",
            "estado_deploy": deployment.estado_deploy or "iniciado",
            "ambiente": deployment.ambiente or "produccion",
            "iniciado_por": deployment.iniciado_por,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear deployment: {str(e)}")


def update_deployment(db: Session, id_deployment: Decimal, deployment: DeploymentUpdate, usr_update: str) -> dict:
    """Actualiza un deployment existente llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_update_deployment(
                :id_deployment,
                :estado_deploy::enum_estado_deploy,
                :logs_deploy,
                :fecha_fin,
                :duracion_segundos,
                :usr_update
            )
        """)
        
        params = {
            "id_deployment": id_deployment,
            "estado_deploy": deployment.estado_deploy,
            "logs_deploy": deployment.logs_deploy,
            "fecha_fin": deployment.fecha_fin,
            "duracion_segundos": deployment.duracion_segundos,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar deployment: {str(e)}")


def delete_deployment(db: Session, id_deployment: Decimal) -> dict:
    """Elimina un deployment (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_deployment(:id_deployment)""")
        result = db.execute(query, {"id_deployment": id_deployment})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Deployment eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar deployment: {str(e)}")


def get_ultimo_deployment(db: Session, id_instancia: Decimal) -> Optional[dict]:
    """Obtiene el ultimo deployment de una instancia."""
    try:
        query = text("""
        SELECT
            id_deployment,
            id_instancia,
            version_deploy,
            tipo_deploy,
            estado_deploy,
            ambiente,
            fecha_inicio,
            fecha_fin,
            duracion_segundos,
            iniciado_por
        FROM tab_deployments
        WHERE id_instancia = :id_instancia
        ORDER BY fecha_inicio DESC
        LIMIT 1
        """)
        result = db.execute(query, {"id_instancia": id_instancia})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener ultimo deployment: {str(e)}")
