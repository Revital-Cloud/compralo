"""
Módulo de enrutador para la gestión de estadísticas.

Define las rutas y endpoints relacionados con la gestión de estadísticas.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from services import statistic_service

router = APIRouter(tags=["Estadísticas"])

@router.get("/estadisticas-productos")
async def get_products_stadistics(db:Session = Depends(get_db)):
    """
    Obtiene las estadísticas de los productos.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    """
    products_stadistics = statistic_service.get_products_stadistics(db)
    if products_stadistics is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay estadísticas de productos")
    return products_stadistics

@router.get("/estadisticas-categorias")
async def get_categories_stadistics(db:Session = Depends(get_db)):
    """
    Obtiene las estadísticas de las categorías.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    """
    categories_stadistics = statistic_service.get_categories_stadistics(db)
    if categories_stadistics is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay estadísticas de categorías")
    return categories_stadistics