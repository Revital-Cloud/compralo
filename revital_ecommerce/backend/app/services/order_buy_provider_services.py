from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.order_buy_provider_schema import OrderBuyProviderCreate, OrderBuyProviderUpdate

def get_order_buy_provider(db: Session):
    """
    Obtiene todas las ordenes de compra a proveedores registradas en la base de datos.

    """
    try:
        query = text("""
        SELECT
            id_orden_compra,
            id_proveedor,
            fec_orden_compra,
            fec_esperada_entrega,
            observaciones_orden,
            id_categoria,
            id_linea,
            id_sublinea,
            id_producto,
            cantidad_solicitada,
            cantidad_recibida,
            costo_unitario,
            subtotal_producto,
            ind_estado_producto,
            fec_recepcion_completa,
            observaciones_producto,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_orden_compra_proveedor
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener ordenes de compra a proveedores: {str(e)}")
    
def create_order_buy_provider(db: Session, order_buy_provider: OrderBuyProviderCreate, usr_insert: Decimal):
    """
    Crea una nueva orden de compra a proveedor en la base de datos.
    Utiliza la función de base de datos `fun_insert_orden_compra_proveedor` para insertar
    una nueva orden de compra a proveedor, identificado por `id_orden_compra`. Los datos para la
    inserción se toman del esquema `OrderBuyProviderCreate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        order_buy_provider (OrderBuyProviderCreate): Un objeto Pydantic `OrderBuyProviderCreate` con los datos a insertar.
        usr_insert (Decimal): El usuario que insertó el registro.
    """
    try:
        params = order_buy_provider.model_dump()
        params["usr_insert"] = usr_insert
        query = text("""
        SELECT fun_insert_orden_compra_proveedor(
            :id_orden_compra,
            :id_proveedor,
            :fec_esperada_entrega,
            :observaciones_orden,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto,
            :cantidad_solicitada,
            :cantidad_recibida,
            :costo_unitario,
            :ind_estado_producto,
            :observaciones_producto,
            :usr_insert
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al crear orden de compra a proveedor: {str(e)}")
    
def update_order_buy_provider(db: Session, id_orden_compra: Decimal, order_buy_provider: OrderBuyProviderUpdate, usr_update: Decimal):
    """
    Actualiza una orden de compra a proveedor existente en la base de datos.
    Utiliza la función de base de datos `fun_update_orden_compra_proveedor` para actualizar
    una orden de compra a proveedor existente, identificado por `id_orden_compra`. Los datos para la
    actualización se toman del esquema `OrderBuyProviderUpdate` (solo campos proporcionados).
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        id_orden_compra (Decimal): El ID de la orden de compra a actualizar.
        order_buy_provider (OrderBuyProviderUpdate): Un objeto Pydantic `OrderBuyProviderUpdate` con los datos a actualizar.
        usr_update (Decimal): El usuario que actualizó el registro.
    """
    try:
        params = order_buy_provider.model_dump(exclude_unset=True)
        params["id_orden_compra"] = id_orden_compra
        params["usr_update"] = usr_update
        query = text("""
        SELECT fun_update_orden_compra_proveedor(
            :id_orden_compra,
            :id_proveedor,
            :fec_esperada_entrega,
            :observaciones_orden,
            :id_categoria,
            :id_linea,
            :id_sublinea,
            :id_producto,
            :cantidad_solicitada,
            :cantidad_recibida,
            :costo_unitario,
            :ind_estado_producto,
            :observaciones_producto,
            :usr_update
        )
        """)
        result = db.execute(query, params)
        fetched_result = result.fetchone()
        db.commit()
        return fetched_result[0] if fetched_result else None
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al actualizar orden de compra a proveedor: {str(e)}")