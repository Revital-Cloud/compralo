"""
Modulo de Servicios de Suscripciones.

Este modulo contiene la logica de negocio para gestionar las suscripciones
de clientes a planes.
"""
import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Literal, Any

from schemas.suscripcion_schema import SuscripcionCreate, SuscripcionUpdate


def _parse_json_result(raw: Any) -> Optional[dict]:
    """Normaliza el retorno de funciones SQL que devuelven JSON (dict o string)."""
    if raw is None:
        return None
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return None
    return None


def get_suscripciones(db: Session, identificacion_fiscal_cliente: str = None) -> List[dict]:
    """Obtiene todas las suscripciones, opcionalmente filtradas por cliente."""
    try:
        query_str = """
        SELECT
            id_suscripcion,
            identificacion_fiscal_cliente,
            id_plan,
            id_instancia,
            tipo_facturacion,
            precio_actual,
            fecha_inicio,
            fecha_fin,
            fecha_proximo_pago,
            estado_suscripcion,
            metodo_pago,
            fecha_cancelacion,
            motivo_cancelacion,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_suscripciones
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
        raise Exception(f"Error al obtener suscripciones: {str(e)}")


def get_suscripcion(db: Session, id_suscripcion: Decimal) -> Optional[dict]:
    """Obtiene una suscripcion especifica por su ID."""
    try:
        query = text("""
        SELECT
            id_suscripcion,
            identificacion_fiscal_cliente,
            id_plan,
            id_instancia,
            tipo_facturacion,
            precio_actual,
            fecha_inicio,
            fecha_fin,
            fecha_proximo_pago,
            estado_suscripcion,
            metodo_pago,
            fecha_cancelacion,
            motivo_cancelacion,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_suscripciones
        WHERE id_suscripcion = :id_suscripcion
        """)
        result = db.execute(query, {"id_suscripcion": id_suscripcion})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la suscripcion: {str(e)}")


def create_suscripcion(db: Session, suscripcion: SuscripcionCreate, usr_insert: str) -> dict:
    """Crea una nueva suscripcion llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_insert_suscripcion(
                CAST(:identificacion_fiscal_cliente AS VARCHAR),
                CAST(:id_plan AS DECIMAL(10,0)),
                :precio_actual,
                CAST(:usr_insert AS VARCHAR),
                CAST(:id_instancia AS DECIMAL(10,0)),
                CAST(:tipo_facturacion AS enum_tipo_facturacion),
                CAST(:fecha_inicio AS TIMESTAMP),
                CAST(:fecha_fin AS TIMESTAMP),
                CAST(:fecha_proximo_pago AS TIMESTAMP),
                CAST(:estado_suscripcion AS enum_estado_suscripcion),
                CAST(:metodo_pago AS enum_metodo_pago)
            )
        """)
        
        params = {
            "identificacion_fiscal_cliente": suscripcion.identificacion_fiscal_cliente,
            "id_plan": suscripcion.id_plan,
            "id_instancia": suscripcion.id_instancia,
            "tipo_facturacion": suscripcion.tipo_facturacion or "mensual",
            "precio_actual": suscripcion.precio_actual,
            "fecha_inicio": suscripcion.fecha_inicio,
            "fecha_fin": suscripcion.fecha_fin,
            "fecha_proximo_pago": suscripcion.fecha_proximo_pago,
            "estado_suscripcion": suscripcion.estado_suscripcion or "activa",
            "metodo_pago": suscripcion.metodo_pago,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        raw = fetched_result[0] if fetched_result else None
        return _parse_json_result(raw)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear suscripcion: {str(e)}")


def update_suscripcion(db: Session, id_suscripcion: Decimal, suscripcion: SuscripcionUpdate, usr_update: str) -> dict:
    """Actualiza una suscripcion existente llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_update_suscripcion(
                :id_suscripcion,
                :id_plan,
                :id_instancia,
                CAST(:tipo_facturacion AS enum_tipo_facturacion),
                :precio_actual,
                :fecha_fin,
                :fecha_proximo_pago,
                CAST(:estado_suscripcion AS enum_estado_suscripcion),
                CAST(:metodo_pago AS enum_metodo_pago),
                :fecha_cancelacion,
                :motivo_cancelacion,
                :usr_update
            )
        """)
        
        params = {
            "id_suscripcion": id_suscripcion,
            "id_plan": suscripcion.id_plan,
            "id_instancia": suscripcion.id_instancia,
            "tipo_facturacion": suscripcion.tipo_facturacion,
            "precio_actual": suscripcion.precio_actual,
            "fecha_fin": suscripcion.fecha_fin,
            "fecha_proximo_pago": suscripcion.fecha_proximo_pago,
            "estado_suscripcion": suscripcion.estado_suscripcion,
            "metodo_pago": suscripcion.metodo_pago,
            "fecha_cancelacion": suscripcion.fecha_cancelacion,
            "motivo_cancelacion": suscripcion.motivo_cancelacion,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        raw = fetched_result[0] if fetched_result else None
        return _parse_json_result(raw)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar suscripcion: {str(e)}")


def delete_suscripcion(db: Session, id_suscripcion: Decimal) -> dict:
    """Elimina una suscripcion (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_suscripcion(:id_suscripcion)""")
        result = db.execute(query, {"id_suscripcion": id_suscripcion})
        fetched_result = result.fetchone()
        db.commit()
        
        raw = fetched_result[0] if fetched_result else None
        parsed = _parse_json_result(raw)
        return parsed if parsed is not None else {"success": True, "message": "Suscripcion eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar suscripcion: {str(e)}")


def get_suscripciones_activas(db: Session, identificacion_fiscal_cliente: str = None) -> List[dict]:
    """Obtiene suscripciones activas, opcionalmente filtradas por cliente."""
    try:
        query_str = """
        SELECT
            s.id_suscripcion,
            s.identificacion_fiscal_cliente,
            s.id_plan,
            s.id_instancia,
            s.tipo_facturacion,
            s.precio_actual,
            s.fecha_inicio,
            s.fecha_fin,
            s.fecha_proximo_pago,
            s.estado_suscripcion,
            s.metodo_pago,
            p.nom_plan,
            p.max_productos,
            p.max_usuarios,
            p.max_almacenamiento_gb
        FROM tab_suscripciones s
        JOIN tab_planes p ON s.id_plan = p.id_plan
        WHERE s.estado_suscripcion = 'activa'
        """
        params = {}
        if identificacion_fiscal_cliente:
            query_str += " AND s.identificacion_fiscal_cliente = :cliente"
            params["cliente"] = identificacion_fiscal_cliente
        query_str += " ORDER BY s.fecha_inicio DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener suscripciones activas: {str(e)}")


def cambiar_plan_suscripcion(
    db: Session,
    id_suscripcion: Decimal,
    id_plan_nuevo: Decimal,
    usuario_email: str,
    motivo_cambio: Optional[str] = None,
    tipo_cambio: Literal["upgrade", "downgrade", "lateral"] = "lateral",
) -> dict:
    """
    Cambia el plan de una suscripción existente llamando a la función SQL dedicada.

    Esta función se apoya en la lógica de la base de datos para:
    - Validar límites del plan actual vs nuevo.
    - Calcular prorrateos y fechas efectivas.
    - Registrar el historial de cambio de plan.
    """
    try:
        query = text("""
            SELECT fun_cambiar_plan_suscripcion(
                :id_suscripcion,
                :id_plan_nuevo,
                :usuario_email,
                :motivo_cambio,
                CAST(:tipo_cambio AS enum_tipo_cambio)
            )
        """)

        params = {
            "id_suscripcion": id_suscripcion,
            "id_plan_nuevo": id_plan_nuevo,
            "usuario_email": usuario_email,
            "motivo_cambio": motivo_cambio,
            "tipo_cambio": tipo_cambio,
        }

        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()

        raw = fetched_result[0] if fetched_result else None
        return _parse_json_result(raw)
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al cambiar plan de suscripción: {str(e)}")

