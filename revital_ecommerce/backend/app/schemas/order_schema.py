"""
Módulo de Esquemas para la Gestión de Órdenes.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con las órdenes.
Incluye esquemas para la creación y visualización de órdenes,
así como un esquema para mensajes de respuesta genéricos.

Dónde se usan estos schemas:
- `routers/order_router.py` para endpoints de usuario/admin.
- `services/order_service.py` para entrada/salida de funciones de negocio.
- `services/payment_widget_service.py` cuando crea orden tras pago APPROVED.
"""

from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from decimal import Decimal

class OrderBase(BaseModel):
    """
    Esquema Base para Órdenes.

    Atributos:
        id_usuario: Identificador del usuario que realiza la orden.
        val_total_productos: Valor total de los productos antes de descuentos.
        val_total_descuentos: Valor total de los descuentos aplicados.
        val_total_pedido: Valor final de la orden (productos - descuentos).
        ind_estado: Estado de la orden (1: Pendiente, 2: Procesada, 3: Enviada/Cancelada).
        metodo_pago: Método de pago textual persistido en BD.
        id_descuento: Identificador del descuento principal aplicado (legacy).
        detalle_descuentos_aplicados: JSON con el detalle de todos los descuentos aplicados.
        des_observaciones: Observaciones adicionales sobre la orden.
        usr_insert: Identificador del usuario que insertó la orden.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario que realiza la orden.")
    val_total_productos: Decimal = Field(..., description="Valor total de los productos antes de descuentos.")
    val_total_descuentos: Decimal = Field(default=Decimal('0'), description="Valor total de los descuentos aplicados.")
    val_total_pedido: Decimal = Field(..., description="Valor final de la orden (productos - descuentos).")
    ind_estado: int = Field(..., description="Estado de la orden (1: Pendiente, 2: Procesada, 3: Enviada, 4:Cancelada).")
    metodo_pago: Optional[str] = Field(None, description="Método de pago" )
    id_descuento: Optional[int] = Field(None, description="Identificador del descuento principal aplicado.")
    id_canje: Optional[int] = Field(None, description="Identificador del canje de puntos aplicado.")
    detalle_descuentos_aplicados: Optional[List[Dict[str, Any]]] = Field(None, description="JSON con el detalle de todos los descuentos aplicados.")
    des_observaciones: Optional[str] = Field(None, description="Observaciones adicionales sobre la orden.")
    usr_insert: Optional[Decimal] = Field(None, description="Identificador del usuario que insertó la orden.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha y hora de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha y hora de la última actualización.")
    
    class Config:
        from_attributes = True
    
class Order(OrderBase):
    """
    Esquema para la Visualización de Órdenes.

    Hereda de `OrderBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de órdenes.
    Incluye el `id_orden` y los campos de auditoría.

    Respuesta típica en:
    - `GET /orders`
    - `GET /orders/{order_id}`
    """
    id_orden: Decimal


class OrderCreate(BaseModel):
    """
    Esquema para la Creación de Órdenes.
    
    Atributos:
        id_carrito: Identificador del carrito que realiza la orden.
        id_direccion: Identificador de la dirección de envío.
        codigo_descuento: Código de descuento a aplicar.
        des_observaciones: Observaciones adicionales sobre la orden.
        usr_insert: Identificador del usuario que insertó la orden.

    Se usa en:
    - `POST /order`
    - Flujo interno de checkout aprobado (`create_order_from_checkout_reference`)
    """
    id_carrito: Decimal = Field(..., description="Identificador del carrito que realiza la orden.")
    id_direccion: Decimal = Field(..., description="Identificador de la dirección de envío.")
    codigo_descuento: Optional[str] = Field(None, description="Código de descuento a aplicar.")
    des_observaciones: Optional[str] = Field(None, description="Observaciones adicionales sobre la orden.")
    usr_insert: Optional[Decimal] = Field(None, description="Identificador del usuario que insertó la orden.")
    id_canje: Optional[Decimal] = Field(None, description="Identificador del canje de puntos a aplicar.")

    class Config:
        from_attributes = True
        
class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos.

    Uso:
    - respuestas simples de éxito/error en endpoints admin y operativos.
    """
    message: str = Field(..., description="Mensaje de respuesta.")

class CreateOrderResponse(BaseModel):
    """
    Esquema de respuesta para la creación de órdenes.
    Captura la respuesta completa que devuelve la función SQL fun_crear_orden_desde_carrito.

    Nota:
    - Este schema modela contrato flexible porque la función SQL puede retornar
      campos adicionales según reglas de negocio/descuentos.
    """
    success: Optional[bool] = Field(None, description="Indica si la operación fue exitosa")
    message: Optional[str] = Field(None, description="Mensaje descriptivo de la operación")
    error: Optional[str] = Field(None, description="Mensaje de error si la operación falló")
    id_orden: Optional [Decimal] = Field(None, description="ID de la orden creada")
    datos: Optional[Dict[str, Any]] = Field(None, description="Información adicional de la orden")
    
    class Config:
        from_attributes = True

class OrderStats(BaseModel):
    """
    Esquema para estadísticas de órdenes para el panel de administración.

    Endpoint asociado:
    - `GET /admin/stats`
    """
    total: Optional[int] = Field(default=0, description="Total de órdenes")
    pendiente: Optional[int] = Field(default=0, description="Órdenes pendientes")
    completada: Optional[int] = Field(default=0, description="Órdenes completadas")
    cancelada: Optional[int] = Field(default=0, description="Órdenes canceladas")
    total_ventas: Optional[Decimal] = Field(default=Decimal('0'), description="Total de ventas completadas")
    
    class Config:
        from_attributes = True