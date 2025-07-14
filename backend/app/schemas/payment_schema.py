"""
Schemas Pydantic para la gestión de pagos y métodos de pago.

Define los modelos de datos para las peticiones y respuestas de la API
relacionadas con la pasarela de pago (Wompi) y la gestión de tarjetas.
"""
from pydantic import BaseModel, Field
from typing import Optional

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

# ==============================================================================
# SCHEMAS PARA PAGAR UNA ORDEN
# ==============================================================================

class PayOrderPayload(BaseModel):
    """
    Payload que el frontend debe enviar para pagar una orden con una tarjeta guardada.
    """
    payment_method_id: int = Field(..., 
                                   description="ID del método de pago (de la tabla tab_metodos_pago_usuario) que el usuario seleccionó.") 