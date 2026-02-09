"""
Modulo de Servicios de Instancias.

Este modulo contiene la logica de negocio para gestionar las instancias
de e-commerce de los clientes.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from core.config import settings
from schemas.instancia_schema import InstanciaCreate, InstanciaUpdate

from . import provisioning_hook


def get_instancias(db: Session, identificacion_fiscal_cliente: str = None) -> List[dict]:
    """Obtiene todas las instancias, opcionalmente filtradas por cliente."""
    try:
        query_str = """
        SELECT
            id_instancia,
            identificacion_fiscal_cliente,
            nom_instancia,
            slug_instancia,
            subdominio,
            dominio_personalizado,
            estado_instancia,
            version_instancia,
            db_nombre,
            db_host,
            db_puerto,
            db_usuario,
            backend_url,
            frontend_url,
            region_deployment,
            config_json,
            fecha_activacion,
            fecha_ultimo_deploy,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_instancias
        """
        params = {}
        if identificacion_fiscal_cliente:
            query_str += " WHERE identificacion_fiscal_cliente = :cliente"
            params["cliente"] = identificacion_fiscal_cliente
        query_str += " ORDER BY fec_insert DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener instancias: {str(e)}")


def get_instancia(db: Session, id_instancia: Decimal) -> Optional[dict]:
    """Obtiene una instancia especifica por su ID."""
    try:
        query = text("""
        SELECT
            id_instancia,
            identificacion_fiscal_cliente,
            nom_instancia,
            slug_instancia,
            subdominio,
            dominio_personalizado,
            estado_instancia,
            version_instancia,
            db_nombre,
            db_host,
            db_puerto,
            db_usuario,
            backend_url,
            frontend_url,
            region_deployment,
            config_json,
            fecha_activacion,
            fecha_ultimo_deploy,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_instancias
        WHERE id_instancia = :id_instancia
        """)
        result = db.execute(query, {"id_instancia": id_instancia})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la instancia: {str(e)}")


def create_instancia(db: Session, instancia: InstanciaCreate, usr_insert: str) -> dict:
    """Crea una nueva instancia llamando a la funcion SQL."""
    try:
        import json
        config_json_str = json.dumps(instancia.config_json) if instancia.config_json else None
        
        query = text("""
            SELECT fun_insert_instancia(
                :identificacion_fiscal_cliente,
                :nom_instancia,
                :slug_instancia,
                :subdominio,
                :dominio_personalizado,
                :estado_instancia::enum_estado_instancia,
                :version_instancia,
                :db_nombre,
                :db_host,
                :db_puerto,
                :db_usuario,
                :backend_url,
                :frontend_url,
                :region_deployment::enum_region_deployment,
                :config_json::jsonb,
                :usr_insert
            )
        """)
        
        params = {
            "identificacion_fiscal_cliente": instancia.identificacion_fiscal_cliente,
            "nom_instancia": instancia.nom_instancia,
            "slug_instancia": instancia.slug_instancia,
            "subdominio": instancia.subdominio,
            "dominio_personalizado": instancia.dominio_personalizado,
            "estado_instancia": instancia.estado_instancia or "creando",
            "version_instancia": instancia.version_instancia or "1.0.0",
            "db_nombre": instancia.db_nombre,
            "db_host": instancia.db_host,
            "db_puerto": instancia.db_puerto or 5432,
            "db_usuario": instancia.db_usuario,
            "backend_url": instancia.backend_url,
            "frontend_url": instancia.frontend_url,
            "region_deployment": instancia.region_deployment or "us-east-1",
            "config_json": config_json_str,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()

        create_result = fetched_result[0] if fetched_result else None
        if (
            create_result
            and isinstance(create_result, dict)
            and create_result.get("success")
            and settings.PROVISIONING_WEBHOOK_URL
        ):
            provisioning_hook.notify_provisioner(
                settings.PROVISIONING_WEBHOOK_URL, create_result, instancia
            )
        return create_result
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear instancia: {str(e)}")


def update_instancia(db: Session, id_instancia: Decimal, instancia: InstanciaUpdate, usr_update: str) -> dict:
    """Actualiza una instancia existente llamando a la funcion SQL."""
    try:
        import json
        config_json_str = json.dumps(instancia.config_json) if instancia.config_json else None
        
        query = text("""
            SELECT fun_update_instancia(
                :id_instancia,
                :nom_instancia,
                :subdominio,
                :dominio_personalizado,
                :estado_instancia::enum_estado_instancia,
                :version_instancia,
                :db_host,
                :db_puerto,
                :db_usuario,
                :backend_url,
                :frontend_url,
                :region_deployment::enum_region_deployment,
                :config_json::jsonb,
                :usr_update
            )
        """)
        
        params = {
            "id_instancia": id_instancia,
            "nom_instancia": instancia.nom_instancia,
            "subdominio": instancia.subdominio,
            "dominio_personalizado": instancia.dominio_personalizado,
            "estado_instancia": instancia.estado_instancia,
            "version_instancia": instancia.version_instancia,
            "db_host": instancia.db_host,
            "db_puerto": instancia.db_puerto,
            "db_usuario": instancia.db_usuario,
            "backend_url": instancia.backend_url,
            "frontend_url": instancia.frontend_url,
            "region_deployment": instancia.region_deployment,
            "config_json": config_json_str,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar instancia: {str(e)}")


def delete_instancia(db: Session, id_instancia: Decimal) -> dict:
    """Elimina una instancia (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_instancia(:id_instancia)""")
        result = db.execute(query, {"id_instancia": id_instancia})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Instancia eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar instancia: {str(e)}")


def get_instancias_by_cliente(db: Session, identificacion_fiscal: str) -> List[dict]:
    """Obtiene todas las instancias de un cliente."""
    return get_instancias(db, identificacion_fiscal)
