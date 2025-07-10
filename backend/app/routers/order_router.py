"""
Módulo de enrutador para la gestión de órdenes.
Define las rutas y endpoints relacionados con la gestión de órdenes,
incluyendo la creación y visualización de órdenes.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.order_schema import OrderCreate, Order, ResponseMessage
from services import order_service

router = APIRouter(tags=["Órdenes"])

@router.get("/orders", response_model=list[Order])
async def get_orders(db:Session = Depends(get_db)):
    """
    Obtiene todas las órdenes registradas en la base de datos.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        list[Order]: Lista de órdenes registradas.
    """
    orders = order_service.get_orders(db)
    if orders is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron órdenes")
    return orders

@router.get("/orders/{id_orden}/{limit}", response_model=Order)
async def get_order_by_id(id_orden: Decimal, limit: int = 10, db:Session = Depends(get_db)):
    """
    Obtiene una orden específica por su identificador.
    Args:
        id_orden (Decimal): El identificador de la orden.
        limit (int): El límite de órdenes a obtener.
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        Order: La orden encontrada.
    """
    order = order_service.get_order_by_id(db, id_orden, limit)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró la orden")
    return order

@router.post("/orders", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate = Body(...),
    db:Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva orden en la base de datos.
    Args:
        order_data (OrderCreate): Los datos de la orden a crear.
        db (Session): La sesión de base de datos SQLAlchemy.
        current_user (UserInToken): El usuario autenticado.
    Returns:
        ResponseMessage: Mensaje de confirmación.
    """
    try:
        order_service.create_order(db, order_data, current_user.id_usuario)
        return ResponseMessage(message="Orden creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))