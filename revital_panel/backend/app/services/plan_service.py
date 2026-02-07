"""
Modulo de Servicios de Planes.

Este modulo contiene la logica de negocio para gestionar los planes
de suscripcion del SaaS.
"""
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from schemas.plan_schema import PlanCreate, PlanUpdate


def get_planes(db: Session, solo_activos: bool = False) -> List[dict]:
    """Obtiene todos los planes."""
    try:
        query_str = """
        SELECT
            id_plan,
            nom_plan,
            desc_plan,
            precio_mensual,
            precio_anual,
            moneda,
            max_productos,
            max_usuarios,
            max_almacenamiento_gb,
            features_json,
            estado_plan,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_planes
        """
        if solo_activos:
            query_str += " WHERE estado_plan = 'activo'"
        query_str += " ORDER BY precio_mensual ASC"
        
        result = db.execute(text(query_str))
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener planes: {str(e)}")


def get_plan(db: Session, id_plan: Decimal) -> Optional[dict]:
    """Obtiene un plan especifico por su ID."""
    try:
        query = text("""
        SELECT
            id_plan,
            nom_plan,
            desc_plan,
            precio_mensual,
            precio_anual,
            moneda,
            max_productos,
            max_usuarios,
            max_almacenamiento_gb,
            features_json,
            estado_plan,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_planes
        WHERE id_plan = :id_plan
        """)
        result = db.execute(query, {"id_plan": id_plan})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener el plan: {str(e)}")


def create_plan(db: Session, plan: PlanCreate, usr_insert: str) -> dict:
    """Crea un nuevo plan llamando a la funcion SQL."""
    try:
        import json
        features_json_str = json.dumps(plan.features_json) if plan.features_json else None
        
        query = text("""
            SELECT fun_insert_plan(
                :nom_plan,
                :desc_plan,
                :precio_mensual,
                :precio_anual,
                :moneda::enum_moneda,
                :max_productos,
                :max_usuarios,
                :max_almacenamiento_gb,
                :features_json::jsonb,
                :estado_plan::enum_estado_plan,
                :usr_insert
            )
        """)
        
        params = {
            "nom_plan": plan.nom_plan,
            "desc_plan": plan.desc_plan,
            "precio_mensual": plan.precio_mensual,
            "precio_anual": plan.precio_anual,
            "moneda": plan.moneda or "USD",
            "max_productos": plan.max_productos,
            "max_usuarios": plan.max_usuarios,
            "max_almacenamiento_gb": plan.max_almacenamiento_gb,
            "features_json": features_json_str,
            "estado_plan": plan.estado_plan or "activo",
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear plan: {str(e)}")


def update_plan(db: Session, id_plan: Decimal, plan: PlanUpdate, usr_update: str) -> dict:
    """Actualiza un plan existente llamando a la funcion SQL."""
    try:
        import json
        features_json_str = json.dumps(plan.features_json) if plan.features_json else None
        
        query = text("""
            SELECT fun_update_plan(
                :id_plan,
                :nom_plan,
                :desc_plan,
                :precio_mensual,
                :precio_anual,
                :moneda::enum_moneda,
                :max_productos,
                :max_usuarios,
                :max_almacenamiento_gb,
                :features_json::jsonb,
                :estado_plan::enum_estado_plan,
                :usr_update
            )
        """)
        
        params = {
            "id_plan": id_plan,
            "nom_plan": plan.nom_plan,
            "desc_plan": plan.desc_plan,
            "precio_mensual": plan.precio_mensual,
            "precio_anual": plan.precio_anual,
            "moneda": plan.moneda,
            "max_productos": plan.max_productos,
            "max_usuarios": plan.max_usuarios,
            "max_almacenamiento_gb": plan.max_almacenamiento_gb,
            "features_json": features_json_str,
            "estado_plan": plan.estado_plan,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar plan: {str(e)}")


def delete_plan(db: Session, id_plan: Decimal) -> dict:
    """Elimina un plan (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_plan(:id_plan)""")
        result = db.execute(query, {"id_plan": id_plan})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Plan eliminado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar plan: {str(e)}")
