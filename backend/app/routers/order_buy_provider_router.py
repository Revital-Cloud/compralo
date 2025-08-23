"""
Módulo de enrutador para la gestión de ordenes de compra a proveedores.

Define las rutas y endpoints relacionados con la gestión de ordenes de compra a proveedores,
incluyendo la creación, actualización y visualización de ordenes de compra a proveedores.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.order_buy_provider_schema import OrderBuyProviderCreate, OrderBuyProviderUpdate, OrderBuyProvider, ResponseMessage
from services import order_buy_provider_services

router = APIRouter(tags=["Ordenes de Compra a Proveedores"])

@router.get("/orderbuyproviders", response_model=list[OrderBuyProvider])
async def get_order_buy_providers(db: Session = Depends(get_db)):
    """
    Obtiene todas las ordenes de compra a proveedores registradas en la base de datos.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
    Returns:
        list[OrderBuyProvider]: Lista de ordenes de compra a proveedores.
    """
    order_buy_providers = order_buy_provider_services.get_order_buy_provider(db)
    if not order_buy_providers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron ordenes de compra a proveedores")
    return order_buy_providers

#ruta para crear una nueva orden de compra a proveedor con JSON body
@router.post("/orderbuyproviders", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_order_buy_provider(
    db: Session = Depends(get_db),
    order_buy_provider_data: OrderBuyProviderCreate = Body(...),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Crea una nueva orden de compra a proveedor en la base de datos.
    Args:
        db (Session): La sesión de base de datos SQLAlchemy.
        order_buy_provider_data (OrderBuyProviderCreate): Los datos de la orden de compra a proveedor.
        current_user (UserInToken): El usuario que está creando la orden de compra a proveedor.
    Returns:
        ResponseMessage: Un mensaje de respuesta indicando el resultado de la operación.
    """
    try:
        order_buy_provider_services.create_order_buy_provider(db, order_buy_provider_data, current_user.id_usuario)
        return ResponseMessage(message="Orden de compra a proveedor creada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/orderbuyproviders/{id_orden_compra}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_order_buy_provider(
    id_orden_compra: Decimal,
    order_buy_provider_data: OrderBuyProviderUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Actualiza una orden de compra a proveedor existente en la base de datos.
    Args:
        id_orden_compra: El ID de la orden de compra a actualizar.
        order_buy_provider_data: Los datos de la orden de compra a actualizar.
        db: La sesión de base de datos SQLAlchemy.
        current_user: El usuario que está actualizando la orden de compra a proveedor.
    Returns:
        ResponseMessage: Un mensaje de respuesta indicando el resultado de la operación.
    """
    try:
        order_buy_provider_services.update_order_buy_provider(db, id_orden_compra, order_buy_provider_data, current_user.id)
        return ResponseMessage(message="Orden de compra a proveedor actualizada exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))