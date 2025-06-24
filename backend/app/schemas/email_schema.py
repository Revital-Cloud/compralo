"""
Módulo de Esquemas de Email.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con el envío de emails.
Incluye esquemas para diferentes tipos de emails: autenticación, pedidos,
marketing y administrativos.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime

# ==================== SCHEMAS BASE ====================

class EmailBase(BaseModel):
    """
    Esquema base para emails.
    
    Contiene los campos comunes para todos los tipos de email.
    """
    to: EmailStr = Field(..., description="Email del destinatario")
    subject: str = Field(..., min_length=1, max_length=200, description="Asunto del email")
    
    class Config:
        from_attributes = True

class EmailSend(EmailBase):
    """
    Esquema para envío básico de email.
    
    Utilizado para envíos personalizados y testing.
    """
    html_content: Optional[str] = Field(None, description="Contenido HTML del email")
    text_content: Optional[str] = Field(None, description="Contenido de texto plano del email")
    template_name: Optional[str] = Field(None, description="Nombre del template a utilizar")
    template_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Datos para el template")

class EmailResponse(BaseModel):
    """
    Esquema para respuesta de envío de email.
    """
    success: bool = Field(..., description="Indica si el email se envió exitosamente")
    message: str = Field(..., description="Mensaje descriptivo del resultado")
    email_id: Optional[str] = Field(None, description="ID del email en Resend")

# ==================== SCHEMAS DE AUTENTICACIÓN ====================

class WelcomeEmailData(BaseModel):
    """
    Esquema para email de bienvenida.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., min_length=1, max_length=100, description="Nombre del usuario")
    verify_url: Optional[str] = Field(None, description="URL para verificar email")

class VerificationEmailData(BaseModel):
    """
    Esquema para email de verificación.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., min_length=1, max_length=100, description="Nombre del usuario")
    verification_token: str = Field(..., min_length=1, description="Token de verificación")
    expires_in_hours: int = Field(default=24, description="Horas hasta que expire el token")

class PasswordResetEmailData(BaseModel):
    """
    Esquema para email de reset de contraseña.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., min_length=1, max_length=100, description="Nombre del usuario")
    reset_token: str = Field(..., min_length=1, description="Token de reset")
    expires_in_hours: int = Field(default=1, description="Horas hasta que expire el token")

class PasswordChangedEmailData(BaseModel):
    """
    Esquema para confirmación de cambio de contraseña.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., min_length=1, max_length=100, description="Nombre del usuario")
    change_date: datetime = Field(default_factory=datetime.now, description="Fecha del cambio")
    ip_address: Optional[str] = Field(None, description="IP desde donde se hizo el cambio")

# ==================== SCHEMAS DE PEDIDOS ====================

class OrderItem(BaseModel):
    """
    Esquema para item de pedido en emails.
    """
    product_name: str = Field(..., description="Nombre del producto")
    quantity: int = Field(..., gt=0, description="Cantidad")
    unit_price: Decimal = Field(..., gt=0, description="Precio unitario")
    total_price: Decimal = Field(..., gt=0, description="Precio total del item")
    product_image: Optional[str] = Field(None, description="URL de la imagen del producto")

class OrderEmailData(BaseModel):
    """
    Esquema base para emails de pedidos.
    """
    user_email: EmailStr = Field(..., description="Email del cliente")
    user_name: str = Field(..., description="Nombre del cliente")
    order_id: str = Field(..., description="ID del pedido")
    order_date: datetime = Field(default_factory=datetime.now, description="Fecha del pedido")
    items: List[OrderItem] = Field(..., description="Items del pedido")
    subtotal: Decimal = Field(..., gt=0, description="Subtotal")
    tax: Decimal = Field(default=Decimal("0"), ge=0, description="Impuestos")
    shipping: Decimal = Field(default=Decimal("0"), ge=0, description="Costo de envío")
    total: Decimal = Field(..., gt=0, description="Total del pedido")
    shipping_address: str = Field(..., description="Dirección de envío")
    payment_method: str = Field(..., description="Método de pago")

class OrderConfirmationEmailData(OrderEmailData):
    """
    Esquema para email de confirmación de pedido.
    """
    estimated_delivery: Optional[datetime] = Field(None, description="Fecha estimada de entrega")
    tracking_url: Optional[str] = Field(None, description="URL de seguimiento")

class OrderStatusEmailData(BaseModel):
    """
    Esquema para email de cambio de estado de pedido.
    """
    user_email: EmailStr = Field(..., description="Email del cliente")
    user_name: str = Field(..., description="Nombre del cliente")
    order_id: str = Field(..., description="ID del pedido")
    old_status: str = Field(..., description="Estado anterior")
    new_status: str = Field(..., description="Nuevo estado")
    status_date: datetime = Field(default_factory=datetime.now, description="Fecha del cambio")
    tracking_number: Optional[str] = Field(None, description="Número de seguimiento")
    tracking_url: Optional[str] = Field(None, description="URL de seguimiento")
    estimated_delivery: Optional[datetime] = Field(None, description="Fecha estimada de entrega")
    notes: Optional[str] = Field(None, description="Notas adicionales")

# ==================== SCHEMAS DE MARKETING ====================

class NewsletterEmailData(BaseModel):
    """
    Esquema para newsletter.
    """
    user_email: EmailStr = Field(..., description="Email del suscriptor")
    user_name: Optional[str] = Field(None, description="Nombre del suscriptor")
    subject: str = Field(..., description="Asunto del newsletter")
    featured_products: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Productos destacados")
    promotions: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Promociones")
    content_blocks: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Bloques de contenido")

class AbandonedCartEmailData(BaseModel):
    """
    Esquema para email de carrito abandonado.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., description="Nombre del usuario")
    cart_items: List[OrderItem] = Field(..., description="Items en el carrito")
    cart_total: Decimal = Field(..., gt=0, description="Total del carrito")
    cart_url: str = Field(..., description="URL para recuperar el carrito")
    discount_code: Optional[str] = Field(None, description="Código de descuento")
    discount_percentage: Optional[int] = Field(None, ge=0, le=100, description="Porcentaje de descuento")

class ProductRecommendationEmailData(BaseModel):
    """
    Esquema para email de recomendaciones de productos.
    """
    user_email: EmailStr = Field(..., description="Email del usuario")
    user_name: str = Field(..., description="Nombre del usuario")
    recommended_products: List[Dict[str, Any]] = Field(..., description="Productos recomendados")
    recommendation_reason: str = Field(..., description="Razón de la recomendación")

# ==================== SCHEMAS ADMINISTRATIVOS ====================

class AdminNotificationEmailData(BaseModel):
    """
    Esquema base para notificaciones administrativas.
    """
    admin_emails: List[EmailStr] = Field(..., description="Emails de administradores")
    notification_type: str = Field(..., description="Tipo de notificación")
    priority: str = Field(default="normal", description="Prioridad: low, normal, high, urgent")
    data: Dict[str, Any] = Field(..., description="Datos de la notificación")

class NewOrderNotificationData(AdminNotificationEmailData):
    """
    Esquema para notificación de nuevo pedido a administradores.
    """
    order_data: OrderEmailData = Field(..., description="Datos del pedido")

class LowStockNotificationData(AdminNotificationEmailData):
    """
    Esquema para notificación de stock bajo.
    """
    product_name: str = Field(..., description="Nombre del producto")
    current_stock: int = Field(..., ge=0, description="Stock actual")
    minimum_stock: int = Field(..., gt=0, description="Stock mínimo")
    product_id: str = Field(..., description="ID del producto")

class NewUserNotificationData(AdminNotificationEmailData):
    """
    Esquema para notificación de nuevo usuario.
    """
    user_name: str = Field(..., description="Nombre del usuario")
    user_email: EmailStr = Field(..., description="Email del usuario")
    registration_date: datetime = Field(default_factory=datetime.now, description="Fecha de registro")
    user_id: str = Field(..., description="ID del usuario")

# ==================== SCHEMAS DE RESPUESTA ====================

class EmailStats(BaseModel):
    """
    Esquema para estadísticas de emails.
    """
    total_sent: int = Field(..., description="Total de emails enviados")
    total_delivered: int = Field(..., description="Total de emails entregados")
    total_opened: int = Field(..., description="Total de emails abiertos")
    total_clicked: int = Field(..., description="Total de clicks")
    bounce_rate: float = Field(..., description="Tasa de rebote")
    open_rate: float = Field(..., description="Tasa de apertura")
    click_rate: float = Field(..., description="Tasa de clicks")

class EmailLog(BaseModel):
    """
    Esquema para log de emails.
    """
    email_id: str = Field(..., description="ID del email")
    to: EmailStr = Field(..., description="Destinatario")
    subject: str = Field(..., description="Asunto")
    status: str = Field(..., description="Estado del email")
    sent_at: datetime = Field(..., description="Fecha de envío")
    delivered_at: Optional[datetime] = Field(None, description="Fecha de entrega")
    opened_at: Optional[datetime] = Field(None, description="Fecha de apertura")
    error_message: Optional[str] = Field(None, description="Mensaje de error si aplica")

# ==================== MENSAJE DE RESPUESTA GENÉRICO ====================

class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos.
    """
    message: str = Field(..., description="Mensaje de respuesta")
    success: bool = Field(default=True, description="Indica si la operación fue exitosa")
    data: Optional[Dict[str, Any]] = Field(None, description="Datos adicionales")
