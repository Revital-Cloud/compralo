"""
Módulo de Esquemas para la Gestión de Órdenes.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con las órdenes.
Incluye esquemas para la creación y visualización de órdenes,
así como un esquema para mensajes de respuesta genéricos.
"""

from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
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
        metodo_pago: Método de pago (1: Tarjeta, 2: Transferencia, 3: Otro).
        id_descuento: Identificador del descuento principal aplicado (legacy).
        detalle_descuentos_aplicados: JSON con el detalle de todos los descuentos aplicados.
        des_observaciones: Observaciones adicionales sobre la orden.
        usr_insert: Identificador del usuario que insertó la orden.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario que realiza la orden.")
    val_total_productos: Decimal = Field(..., description="Valor total de los productos antes de descuentos.")
    val_total_descuentos: Decimal = Field(default=Decimal('0'), description="Valor total de los descuentos aplicados.")
    val_total_pedido: Decimal = Field(..., description="Valor final de la orden (productos - descuentos).")
    ind_estado: int = Field(default=1, description="Estado de la orden (1: Pendiente, 2: Procesada, 3: Enviada/Cancelada).", ge=1, le=3)
    metodo_pago: int = Field(default=1, description="Método de pago (1: Tarjeta, 2: Transferencia, 3: Otro).", ge=1, le=3)
    id_descuento: Optional[int] = Field(None, description="Identificador del descuento principal aplicado (legacy).")
    detalle_descuentos_aplicados: Optional[Dict[str, Any]] = Field(None, description="JSON con el detalle de todos los descuentos aplicados.")
    des_observaciones: Optional[str] = Field(None, description="Observaciones adicionales sobre la orden.")
    usr_insert: Optional[Decimal] = Field(None, description="Identificador del usuario que insertó la orden.")
    
    class Config:
        from_attributes = True
    
class Order(OrderBase):
    """
    Esquema para la Visualización de Órdenes.

    Hereda de `OrderBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de órdenes.
    Incluye el `id_orden` y los campos de auditoría.
    """
    id_orden: Decimal


class OrderCreate(BaseModel):
    """
    Esquema para la Creación de Órdenes.
    
    Atributos:
        id_usuario: Identificador del usuario que realiza la orden.
        metodo_pago: Método de pago.
        id_canje: Identificador del canje de puntos a aplicar.
        des_observaciones: Observaciones adicionales sobre la orden.
        usr_insert: Identificador del usuario que insertó la orden.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario que realiza la orden.")
    metodo_pago: str = Field(..., description="Método de pago")
    id_canje: Optional[int] = Field(None, description="Identificador del canje de puntos a aplicar.")
    des_observaciones: Optional[str] = Field(None, description="Observaciones adicionales sobre la orden.")
    usr_insert: Optional[Decimal] = Field(None, description="Identificador del usuario que insertó la orden.")

    class Config:
        from_attributes = True
        
class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos.
    """
    message: str = Field(..., description="Mensaje de respuesta.")