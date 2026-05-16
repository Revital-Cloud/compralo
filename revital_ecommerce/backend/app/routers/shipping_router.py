"""Cotización de envíos Envia (usuario autenticado)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken
from schemas.shipping_schema import ShippingRatesRequest, ShippingRatesResponse, ShippingRateOption
from services import shipping_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shipping", tags=["Shipping"])


@router.post("/rates", response_model=ShippingRatesResponse)
async def post_shipping_rates(
    body: ShippingRatesRequest,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user),
):
    uid = int(current_user.id_usuario)
    loaded = shipping_service.load_address_and_phone(db, body.id_direccion, uid)
    if not loaded:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dirección no encontrada o no pertenece al usuario",
        )
    addr_row, phone, email = loaded
    destination = shipping_service.destination_from_address_row(addr_row, phone, email)
    try:
        raw_rates = await shipping_service.get_shipping_rates(
            destination=destination,
            weight_kg=body.weight_kg,
            length_cm=body.length_cm,
            width_cm=body.width_cm,
            height_cm=body.height_cm,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        logger.exception("post_shipping_rates: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo obtener cotización de envío",
        )
    rates = [ShippingRateOption(**r) for r in raw_rates]
    return ShippingRatesResponse(rates=rates)
