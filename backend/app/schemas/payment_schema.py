"""
Schemas Pydantic para la gestión de pagos y métodos de pago.

Define los modelos de datos para las peticiones y respuestas de la API
relacionadas con la pasarela de pago (Wompi) y la gestión de tarjetas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

# ==============================================================================
# SCHEMAS PARA MÉTODOS DE PAGO (GUARDAR TARJETA)
# ==============================================================================

class CreatePaymentMethodPayload(BaseModel):
    """
    Payload que el frontend debe enviar para guardar un nuevo método de pago.
    """
    card_token: str = Field(..., 
                            description="Token de la tarjeta generado por el widget de Wompi en el frontend.",
                            example="tok_test_12345_ABCDE")

class PaymentMethodResponse(BaseModel):
    """
    Respuesta de la API al crear o listar un método de pago.
    Muestra información no sensible de la tarjeta.
    """
    id_metodo_pago: int = Field(..., description="ID interno del método de pago.")
    provider_source_id: str = Field(..., description="ID de la fuente de pago en Wompi.")
    brand: str = Field(..., description="Marca de la tarjeta (ej. VISA, MASTERCARD).")
    last_four_digits: str = Field(..., description="Últimos cuatro dígitos de la tarjeta.")
    card_holder: Optional[str] = Field(None, description="Nombre del titular de la tarjeta.")
    is_default: bool = Field(..., description="Indica si es el método de pago por defecto.")

    class Config:
        from_attributes = True

class MetodoPagoUsuario(BaseModel):
    """
    Esquema para representar un método de pago guardado en la base de datos.
    Corresponde a la tabla tab_metodos_pago_usuario.
    """
    # Campos de identificación
    id_metodo_pago: int = Field(..., description="ID interno del método de pago")
    id_usuario: Decimal = Field(..., description="ID del usuario dueño del método de pago")

    # Información del proveedor
    provider_name: str = Field(default="wompi", description="Nombre del proveedor de pagos (por defecto: 'wompi')")
    provider_source_id: str = Field(..., description="ID de la fuente de pago en el proveedor")

    # Detalles de la tarjeta
    brand: Optional[str] = Field(None, description="Marca de la tarjeta (ej. VISA, MASTERCARD)")
    last_four_digits: Optional[str] = Field(None, description="Últimos 4 dígitos de la tarjeta")
    expiration_month: Optional[int] = Field(None, description="Mes de expiración")
    expiration_year: Optional[int] = Field(None, description="Año de expiración")
    card_holder: Optional[str] = Field(None, description="Nombre del titular de la tarjeta")

    # Control y Estado
    is_default: bool = Field(default=False, description="Indica si es el método de pago por defecto")

    # Campos de auditoría
    usr_insert: Decimal = Field(..., description="Usuario que insertó el registro")
    fec_insert: datetime = Field(default_factory=datetime.now, description="Fecha de inserción del registro")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro")

    class Config:
        from_attributes = True

# ==============================================================================
# SCHEMAS PARA PAGAR UNA ORDEN
# ==============================================================================

class PayOrderPayload(BaseModel):
    """
    Payload que el frontend debe enviar para pagar una orden con una tarjeta guardada.
    """
    payment_method_id: int = Field(..., 
                                   description="ID del método de pago (de la tabla tab_metodos_pago_usuario) que el usuario seleccionó.") 