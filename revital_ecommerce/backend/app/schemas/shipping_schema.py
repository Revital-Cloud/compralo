"""Schemas para cotización y respuesta de envío Envia."""

from pydantic import BaseModel, Field
from typing import List, Optional


class ShippingRatesRequest(BaseModel):
    id_direccion: int = Field(..., ge=1)
    weight_kg: float = Field(..., gt=0)
    length_cm: float = Field(..., gt=0)
    width_cm: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)


class ShippingRateOption(BaseModel):
    carrier: str
    service: str
    price: float
    currency: str = "COP"
    name: str = ""
    delivery_estimate: Optional[str] = None


class ShippingRatesResponse(BaseModel):
    rates: List[ShippingRateOption]


class OrderShippingResponse(BaseModel):
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    label_url: Optional[str] = None
    carrier: Optional[str] = None
    estado_envio: Optional[str] = None


class EnviaWebhookPayload(BaseModel):
    """Payload flexible: Envia puede enviar camelCase u otros anidados."""

    trackingNumber: Optional[str] = None
    status: Optional[str] = None
