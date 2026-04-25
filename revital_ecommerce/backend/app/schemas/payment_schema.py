"""
Schemas Pydantic para la gestión de pagos y métodos de pago.

Define los modelos de datos para las peticiones y respuestas de la API
relacionadas con la pasarela de pago (Wompi) y la gestión de tarjetas.

Mapa rápido de uso:
- `payment_router.py`: métodos guardados + webhook
- `payment_widget_router.py`: create/attach/poll/status/reattempt
- `order_router.py`: pago de orden con método guardado (`PayOrderPayload`)
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

    Endpoint:
    - `POST /payment/add-method`
    """
    card_token: str = Field(..., 
                            description="Token de la tarjeta generado por el widget de Wompi en el frontend.",
                            example="tok_test_12345_ABCDE")
    brand: str = Field(...,
                       description="Marca de la tarjeta (VISA, MASTERCARD, etc.) obtenida del token de Wompi.",
                       example="VISA")

class PaymentMethodResponse(BaseModel):
    """
    Respuesta de la API al crear o listar un método de pago.
    Muestra información no sensible de la tarjeta.

    Endpoints:
    - `POST /payment/add-method`
    - `GET /payment/list-methods`
    """
    id_metodo_pago: int = Field(..., description="ID interno del método de pago.")
    provider_source_id: str = Field(..., description="ID de la fuente de pago en Wompi.")
    brand: str = Field(..., description="Marca de la tarjeta (ej. VISA, MASTERCARD).")
    last_four_digits: str = Field(..., description="Últimos cuatro dígitos de la tarjeta.")
    card_holder: Optional[str] = Field(None, description="Nombre del titular de la tarjeta.")
    expiration_month: Optional[int] = Field(None, description="Mes de expiración")
    expiration_year: Optional[int] = Field(None, description="Año de expiración")
    is_default: bool = Field(..., description="Indica si es el método de pago por defecto.")

    class Config:
        from_attributes = True

class MetodoPagoUsuario(BaseModel):
    """
    Esquema para representar un método de pago guardado en la base de datos.
    Corresponde a la tabla tab_metodos_pago_usuario.

    Uso interno:
    - tipo de salida de `payment_service.list_payment_methods`.
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

    Endpoint:
    - `POST /{order_id}/pay` (order router)
    """
    payment_method_id: int = Field(..., 
                                   description="ID del método de pago (de la tabla tab_metodos_pago_usuario) que el usuario seleccionó.") 

# ==============================================================================
# SCHEMAS PARA WIDGET DE WOMPI (CHECKOUT EMBEBIDO)
# ==============================================================================

class PaymentCreateRequest(BaseModel):
    """
    Request para crear un pago con el widget de Wompi.

    Endpoint:
    - `POST /payments/create`
    """
    order_id: int = Field(..., description="ID de la orden a pagar")
    amount_in_cents: Optional[int] = Field(None, description="Monto en centavos (opcional). Si la orden no tiene descuento guardado pero el frontend envía este monto, se usa para Wompi.")


class CheckoutCreateRequest(BaseModel):
    """
    Request para crear una sesión de checkout (sin orden).
    La orden se crea solo cuando el pago Wompi es APPROVED.

    Endpoint:
    - `POST /payments/create-checkout`
    """
    cart_id: int = Field(..., description="ID del carrito")
    id_direccion: int = Field(..., description="ID de la dirección de envío")
    id_canje: Optional[int] = Field(None, description="ID del canje de puntos a aplicar (opcional)")
    codigo_descuento: Optional[str] = Field(None, description="Código de cupón a aplicar al crear la orden (opcional)")


class PaymentCreateResponse(BaseModel):
    """
    Response con la configuración necesaria para abrir el widget de Wompi.

    Se retorna en:
    - `POST /payments/create`
    - `POST /payments/create-checkout`
    - `POST /payments/reattempt`
    """
    reference: str = Field(..., description="Referencia única del pago")
    amount_in_cents: int = Field(..., description="Monto en centavos")
    currency: str = Field(default="COP", description="Moneda del pago")
    public_key: str = Field(..., description="Llave pública de Wompi")
    integrity_signature: str = Field(..., description="Firma de integridad SHA256 generada en backend")


class ConfirmCheckoutRequest(BaseModel):
    """
    Request para confirmar checkout tras pago (respaldo si el webhook no llegó).
    El backend verifica la transacción en Wompi y crea la orden si está APPROVED.

    Endpoint:
    - `POST /payments/confirm-checkout`
    """
    reference: str = Field(..., description="Referencia revital_cart_* del pago")
    transaction_id: str = Field(..., description="ID de la transacción en Wompi")


class AttachTransactionRequest(BaseModel):
    """
    Request para asociar un transaction_id de Wompi a un payment.

    Endpoint:
    - `POST /payments/attach-transaction`
    """
    reference: str = Field(..., description="Referencia única del pago")
    transaction_id: str = Field(..., description="ID de la transacción en Wompi")


class PollPaymentResponse(BaseModel):
    """
    Response del polling de estado de pago.

    Endpoints:
    - `GET /payments/poll`
    - `GET /payments/status`
    """
    status: str = Field(..., description="Estado del pago: CREATED, PENDING, APPROVED, DECLINED, VOIDED, ERROR")
    transaction_id: Optional[str] = Field(None, description="ID de la transacción en Wompi")
    reference: str = Field(..., description="Referencia única del pago")
    message: Optional[str] = Field(None, description="Mensaje adicional (ej: 'Te avisaremos cuando se confirme')")


class ReattemptPaymentRequest(BaseModel):
    """
    Request para reintentar un pago fallido.

    Endpoint:
    - `POST /payments/reattempt`
    """
    order_id: int = Field(..., description="ID de la orden a reintentar") 