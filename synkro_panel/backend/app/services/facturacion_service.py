"""
Modulo de Servicios de Facturacion.

Este modulo contiene la logica de negocio para gestionar las facturas
de suscripciones.
"""
import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List, Any

from schemas.facturacion_schema import FacturaCabeceraCreate, FacturaCabeceraUpdate, FacturaDetalleCreate


def get_facturas(db: Session, identificacion_fiscal_cliente: str = None) -> List[dict]:
    """Obtiene todas las facturas, opcionalmente filtradas por cliente."""
    try:
        query_str = """
        SELECT
            id_factura,
            id_suscripcion,
            identificacion_fiscal_cliente,
            num_factura,
            subtotal,
            impuestos,
            descuentos,
            total,
            moneda,
            estado_pago,
            metodo_pago,
            fecha_emision,
            fecha_vencimiento,
            fecha_pago,
            referencia_pago,
            periodo_facturado_desde,
            periodo_facturado_hasta,
            notas,
            usr_insert,
            fec_insert
        FROM tab_facturacion_cabecera
        """
        params = {}
        if identificacion_fiscal_cliente:
            query_str += " WHERE identificacion_fiscal_cliente = :cliente"
            params["cliente"] = identificacion_fiscal_cliente
        query_str += " ORDER BY fecha_emision DESC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener facturas: {str(e)}")


def get_factura(db: Session, id_factura: Decimal) -> Optional[dict]:
    """Obtiene una factura especifica por su ID."""
    try:
        query = text("""
        SELECT
            id_factura,
            id_suscripcion,
            identificacion_fiscal_cliente,
            num_factura,
            subtotal,
            impuestos,
            descuentos,
            total,
            moneda,
            estado_pago,
            metodo_pago,
            fecha_emision,
            fecha_vencimiento,
            fecha_pago,
            referencia_pago,
            periodo_facturado_desde,
            periodo_facturado_hasta,
            notas,
            usr_insert,
            fec_insert
        FROM tab_facturacion_cabecera
        WHERE id_factura = :id_factura
        """)
        result = db.execute(query, {"id_factura": id_factura})
        return result.mappings().first()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener la factura: {str(e)}")


def get_factura_detalles(db: Session, id_factura: Decimal) -> List[dict]:
    """Obtiene los detalles de una factura."""
    try:
        query = text("""
        SELECT
            id_detalle,
            id_factura,
            num_linea,
            concepto,
            cantidad,
            precio_unitario,
            descuento_linea,
            subtotal_linea,
            impuesto_linea,
            total_linea,
            id_plan,
            id_instancia,
            metadata_json,
            usr_insert,
            fec_insert
        FROM tab_facturacion_detalle
        WHERE id_factura = :id_factura
        ORDER BY num_linea ASC
        """)
        result = db.execute(query, {"id_factura": id_factura})
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener detalles de factura: {str(e)}")


def create_factura(db: Session, factura: FacturaCabeceraCreate, usr_insert: str) -> dict:
    """Crea una nueva factura llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_insert_factura_cabecera(
                :id_suscripcion,
                :identificacion_fiscal_cliente,
                :usr_insert,
                NULL,
                CAST(:moneda AS enum_moneda),
                'pendiente',
                CAST(:metodo_pago AS enum_metodo_pago),
                CURRENT_TIMESTAMP,
                :fecha_vencimiento,
                :periodo_facturado_desde,
                :periodo_facturado_hasta,
                NULL,
                :notas
            )
        """)
        
        params = {
            "id_suscripcion": factura.id_suscripcion,
            "identificacion_fiscal_cliente": factura.identificacion_fiscal_cliente,
            "moneda": factura.moneda or "USD",
            "metodo_pago": factura.metodo_pago,
            "fecha_vencimiento": factura.fecha_vencimiento,
            "periodo_facturado_desde": factura.periodo_facturado_desde,
            "periodo_facturado_hasta": factura.periodo_facturado_hasta,
            "notas": factura.notas,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        raw = fetched_result[0] if fetched_result else None
        if raw is None:
            return None
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str):
            return json.loads(raw)
        return None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear factura: {str(e)}")


def create_factura_detalle(db: Session, id_factura: Decimal, detalle: FacturaDetalleCreate, usr_insert: str) -> dict:
    """Agrega un detalle a una factura."""
    try:
        import json
        metadata_json_str = json.dumps(detalle.metadata_json) if detalle.metadata_json else None
        
        # Calcular subtotal y total de linea
        subtotal_linea = (detalle.cantidad or 1) * detalle.precio_unitario - (detalle.descuento_linea or 0)
        total_linea = subtotal_linea + (detalle.impuesto_linea or 0)
        
        query = text("""
            INSERT INTO tab_facturacion_detalle (
                id_factura,
                num_linea,
                concepto,
                cantidad,
                precio_unitario,
                descuento_linea,
                subtotal_linea,
                impuesto_linea,
                total_linea,
                id_plan,
                id_instancia,
                metadata_json,
                usr_insert,
                fec_insert
            ) VALUES (
                :id_factura,
                :num_linea,
                :concepto,
                :cantidad,
                :precio_unitario,
                :descuento_linea,
                :subtotal_linea,
                :impuesto_linea,
                :total_linea,
                :id_plan,
                :id_instancia,
                CAST(:metadata_json AS jsonb),
                :usr_insert,
                CURRENT_TIMESTAMP
            ) RETURNING id_detalle
        """)
        
        params = {
            "id_factura": id_factura,
            "num_linea": detalle.num_linea,
            "concepto": detalle.concepto,
            "cantidad": detalle.cantidad or 1,
            "precio_unitario": detalle.precio_unitario,
            "descuento_linea": detalle.descuento_linea or 0,
            "subtotal_linea": subtotal_linea,
            "impuesto_linea": detalle.impuesto_linea or 0,
            "total_linea": total_linea,
            "id_plan": detalle.id_plan,
            "id_instancia": detalle.id_instancia,
            "metadata_json": metadata_json_str,
            "usr_insert": usr_insert
        }
        
        result = db.execute(query, params)
        id_detalle = result.fetchone()[0]
        db.commit()
        
        return {"success": True, "id_detalle": id_detalle, "message": "Detalle agregado correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear detalle de factura: {str(e)}")


def update_factura(db: Session, id_factura: Decimal, factura: FacturaCabeceraUpdate, usr_update: str) -> dict:
    """Actualiza una factura existente llamando a la funcion SQL."""
    try:
        query = text("""
            SELECT fun_update_factura(
                :id_factura,
                :estado_pago::enum_estado_pago,
                :metodo_pago::enum_metodo_pago,
                :fecha_pago,
                :referencia_pago,
                :notas,
                :usr_update
            )
        """)
        
        params = {
            "id_factura": id_factura,
            "estado_pago": factura.estado_pago,
            "metodo_pago": factura.metodo_pago,
            "fecha_pago": factura.fecha_pago,
            "referencia_pago": factura.referencia_pago,
            "notas": factura.notas,
            "usr_update": usr_update
        }
        
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar factura: {str(e)}")


def delete_factura(db: Session, id_factura: Decimal) -> dict:
    """Elimina una factura (soft delete) llamando a la funcion SQL."""
    try:
        query = text("""SELECT fun_delete_factura(:id_factura)""")
        result = db.execute(query, {"id_factura": id_factura})
        fetched_result = result.fetchone()
        db.commit()
        
        return fetched_result[0] if fetched_result else {"message": "Factura eliminada correctamente"}
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al eliminar factura: {str(e)}")


def get_facturas_pendientes(db: Session, identificacion_fiscal_cliente: str = None) -> List[dict]:
    """Obtiene facturas pendientes de pago."""
    try:
        query_str = """
        SELECT
            id_factura,
            id_suscripcion,
            identificacion_fiscal_cliente,
            num_factura,
            total,
            moneda,
            estado_pago,
            fecha_emision,
            fecha_vencimiento
        FROM tab_facturacion_cabecera
        WHERE estado_pago = 'pendiente'
        """
        params = {}
        if identificacion_fiscal_cliente:
            query_str += " AND identificacion_fiscal_cliente = :cliente"
            params["cliente"] = identificacion_fiscal_cliente
        query_str += " ORDER BY fecha_vencimiento ASC"
        
        result = db.execute(text(query_str), params)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener facturas pendientes: {str(e)}")
