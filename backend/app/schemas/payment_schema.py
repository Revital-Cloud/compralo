from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

# Esquemas para la creación de Preferencias en MercadoPago

class PaymentItem(BaseModel):
    id: str = Field(..., description="ID del producto en nuestro sistema")
    title: str = Field(..., description="Nombre del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    picture_url: Optional[str] = Field(None, description="URL de la imagen del producto")
    quantity: int = Field(..., gt=0, description="Cantidad del producto")
    unit_price: Decimal = Field(..., gt=0, description="Precio unitario del producto")
    currency_id: str = Field("COP", description="Moneda")

class Payer(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    email: EmailStr
    # Se pueden agregar más campos si son necesarios

class BackUrls(BaseModel):
    success: str = Field(..., description="URL de redirección en caso de pago exitoso")
    failure: str = Field(..., description="URL de redirección en caso de pago fallido")
    pending: str = Field(..., description="URL de redirección en caso de pago pendiente")

class PaymentPreferenceRequest(BaseModel):
    items: List[PaymentItem]
    payer: Payer
    back_urls: BackUrls
    notification_url: Optional[str] = Field(None, description="URL para recibir notificaciones de webhook")

class PaymentPreferenceResponse(BaseModel):
    id: str = Field(..., description="ID de la preferencia de pago de MercadoPago")
    init_point: str = Field(..., description="URL a la que se debe redirigir al usuario para pagar")

# Esquemas para Webhooks de MercadoPago

class MercadoPagoWebhookData(BaseModel):
    id: str = Field(..., description="ID del evento (ej. el ID del pago)")

class MercadoPagoWebhookNotification(BaseModel):
    action: str = Field(..., description="Acción del evento (ej. 'payment.updated')")
    api_version: str
    data: MercadoPagoWebhookData
    date_created: datetime
    id: int = Field(..., description="ID de la notificación")
    live_mode: bool
    type: str = Field(..., description="Tipo de evento (ej. 'payment')")
    user_id: int = Field(..., description="ID del usuario vendedor en MercadoPago")


# Esquemas para la tabla de Pagos (tab_pagos)

class PagoBase(BaseModel):
    id_orden: Decimal
    provider_payment_id: str
    provider_preference_id: Optional[str] = None
    provider_name: str = "mercadopago"
    status: str
    status_detail: Optional[str] = None
    amount: Decimal
    currency_id: str = "COP"
    installments: Optional[int] = None
    payment_method_id: Optional[str] = None
    payment_type_id: Optional[str] = None
    fee_amount: Decimal = Field(0.00)
    net_received_amount: Optional[Decimal] = None
    provider_date_created: Optional[datetime] = None
    provider_date_approved: Optional[datetime] = None
    raw_response: Optional[Dict[str, Any]] = None
    estado_procesamiento: str = "pendiente"

class PagoCreate(PagoBase):
    usr_insert: Decimal

class PagoUpdate(BaseModel):
    status: Optional[str] = None
    status_detail: Optional[str] = None
    provider_date_approved: Optional[datetime] = None
    raw_response: Optional[Dict[str, Any]] = None
    estado_procesamiento: Optional[str] = None
    fee_amount: Optional[Decimal] = None
    net_received_amount: Optional[Decimal] = None
    usr_update: Decimal

class Pago(PagoBase):
    id_pago: int
    usr_insert: Decimal
    fec_insert: datetime
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None

    class Config:
        orm_mode = True


# Esquemas para Métodos de Pago de Usuario (tab_metodos_pago_usuario)

class MetodoPagoUsuarioBase(BaseModel):
    provider_card_id: str = Field(..., description="ID de la tarjeta en MercadoPago")
    brand: str = Field(..., description="Marca de la tarjeta (e.g., 'Visa')")
    last_four_digits: str = Field(..., description="Últimos 4 dígitos de la tarjeta")
    expiration_month: int
    expiration_year: int
    is_default: bool = False

class MetodoPagoUsuarioCreate(MetodoPagoUsuarioBase):
    id_usuario: Decimal
    usr_insert: Decimal
    provider_name: str = "mercadopago"

class MetodoPagoUsuarioUpdate(BaseModel):
    is_default: Optional[bool] = None
    usr_update: Decimal

class MetodoPagoUsuario(MetodoPagoUsuarioBase):
    id_metodo_pago: int
    id_usuario: Decimal
    provider_name: str
    usr_insert: Decimal
    fec_insert: datetime
    usr_update: Optional[Decimal] = None
    fec_update: Optional[datetime] = None

    class Config:
        orm_mode = True

class CardTokenRequest(BaseModel):
    token: str = Field(..., description="Token de la tarjeta generado por el frontend")

class SavedCardPaymentRequest(BaseModel):
    token: str = Field(..., description="ID de la tarjeta guardada (card_id)")
    issuer_id: int = Field(..., description="ID del emisor de la tarjeta")
    installments: int = Field(..., description="Número de cuotas")
    transaction_amount: Decimal = Field(..., description="Monto de la transacción")
    payer_email: EmailStr = Field(..., description="Email del pagador")
    payment_method_id: str = Field(..., description="ID del método de pago (ej. 'visa')") 