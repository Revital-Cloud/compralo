"""
Módulo de enrutador para la gestión de movimientos de inventario.

Define las rutas y endpoints relacionados con la gestión de movimientos de inventario,
incluyendo la creación, actualización y visualización de movimientos de inventario.
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.movements_inventory_schema import MovementInventory
from services import movements_inventory_service

router = APIRouter(tags=["Movimientos de Inventario"])

@router.get("/movements-inventory", response_model=list[MovementInventory])
async def get_movements_inventory(db: Session = Depends(get_db)):
    """
    Obtiene todos los movimientos de inventario.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        list[MovementInventory]: Lista de movimientos de inventario.
    """
    movements_inventory = movements_inventory_service.get_movements_inventory(db)
    if not movements_inventory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron movimientos de inventario")
    return movements_inventory
