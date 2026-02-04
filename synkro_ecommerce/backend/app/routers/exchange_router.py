"""
Módulo de enrutador para la gestión de canjes.

Define las rutas y endpoints relacionados con la gestión de canjes,
incluyendo la funcionalidad para realizar canjes de puntos por descuentos.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.exchange_schema import ApplyExchangeOrder, ExchangePointsDiscount, Exchange, ResponseMessage, ExchangePointsDiscountResponse, CanjeDisponible
from services import exchange_service

router = APIRouter(tags=["Canjes"])

@router.get("/canjes", response_model=list[Exchange], status_code=status.HTTP_200_OK)
async def get_exchanges(db:Session = Depends(get_db)):
    """
    Obtiene todos los canjes de puntos y descuentos.
    """
    try:
        exchanges = exchange_service.get_exchanges(db)
        return exchanges
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    
@router.get("/canjes/mis-canjes", response_model=list[CanjeDisponible], status_code=status.HTTP_200_OK)
async def get_my_available_canjes(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Lista los canjes disponibles del usuario autenticado (canjeados, no utilizados y no vencidos).
    """
    try:
        canjes = exchange_service.get_my_available_canjes(db, int(current_user.id_usuario))
        return canjes
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/canjes-puntos-descuento", response_model=ExchangePointsDiscountResponse, status_code=status.HTTP_200_OK)
async def exchange_points_discount(
    exchange_points_discount_data: ExchangePointsDiscount = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Realiza un canje de puntos por descuento.
    """
    result = exchange_service.exchange_points_discount(
        db, exchange_points_discount_data, current_user.id_usuario
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el canje: la operación no devolvió un resultado."
        )

    if not result.get('success'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=result
        )
    
    return result
    
@router.post("/aplicar-canje-orden", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def apply_exchange_order(
    apply_exchange_order_data: ApplyExchangeOrder = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    """
    Aplica un canje de orden.
    """
    try:
        exchange_service.apply_exchange_order(db, apply_exchange_order_data, current_user.id_usuario)
        return ResponseMessage(message="Canje de orden aplicado correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))