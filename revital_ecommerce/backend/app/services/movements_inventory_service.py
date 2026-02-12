from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.movements_inventory_schema import MovementInventoryBase

def get_movements_inventory(db: Session):
    """
    Obtiene todos los movimientos de inventario.
    """
    try:
        query = text("""
        SELECT
            id_movimiento,
            id_categoria_producto,
            id_linea_producto,
            id_sublinea_producto,
            id_producto,
            tipo_movimiento,
            cantidad,
            costo_unitario_movimiento,
            stock_anterior,
            saldo_costo_total_anterior_mov,
            stock_actual,
            saldo_costo_total_actual_mov,
            costo_promedio_ponderado_mov,
            id_orden_usuario_detalle,
            id_orden_compra,
            descripcion,
            observaciones,
            usr_insert,
            fec_insert,
            usr_update,
            fec_update
        FROM tab_movimientos_inventario
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener movimientos de inventario: {str(e)}")
