from sqlalchemy.orm import Session
from sqlalchemy import text

from schemas.movements_inventory_schema import MovementInventoryBase

def get_movements_inventory(db: Session):
    """
    Obtiene todos los movimientos de inventario.
    """
    try:
        query = text("""
        SELECT * FROM tab_movimientos_inventario
        """)
        result = db.execute(query)
        return result.mappings().all()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error al obtener movimientos de inventario: {str(e)}")
