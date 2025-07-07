from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

class OrderBase(BaseModel):
    """
    Schema base para una orden. Contiene los campos comunes para la creación y
    visualización de órdenes.
    """
    id_usuario: Decimal = Field(..., description="ID del usuario que realiza la orden.")
    
    val_total_productos: Decimal = Field(..., description="Valor total de los productos antes de descuentos.", ge=Decimal('0'))
    val_total_descuentos: Decimal = Field(default=Decimal('0'), description="Valor total de los descuentos aplicados.", ge=Decimal('0'))
    val_total_pedido: Decimal = Field(..., description="Valor final de la orden (productos - descuentos).", ge=Decimal('0'))
    
    ind_estado: int = Field(default=1, description="Estado de la orden (1: Pendiente, 2: Procesada, 3: Enviada/Cancelada).", ge=1, le=3)
    ind_metodo_pago: int = Field(default=1, description="Método de pago (1: Tarjeta, 2: Transferencia, 3: Otro).", ge=1, le=3)
    
    id_descuento: Optional[int] = Field(None, description="ID del descuento principal aplicado (legacy).")
    detalle_descuentos_aplicados: Optional[Dict[str, Any]] = Field(None, description="JSON con el detalle de todos los descuentos aplicados.")
    des_observaciones: Optional[str] = Field(None, description="Observaciones adicionales sobre la orden.")

    @model_validator(mode='after')
    def check_order_totals(self) -> 'OrderBase':
        """
        Valida que el total del pedido sea consistente con los productos y descuentos.
        """
        if self.val_total_productos is not None and self.val_total_descuentos is not None:
            expected_total = self.val_total_productos - self.val_total_descuentos
            if self.val_total_pedido != expected_total:
                raise ValueError('El valor total del pedido no coincide con productos - descuentos.')
        return self

class OrderCreate(OrderBase):
    """
    Schema para crear una nueva orden. Hereda de OrderBase.
    Los campos de auditoría (usr_insert) se deben obtener del contexto de la petición.
    """
    pass

class OrderUpdate(BaseModel):
    """
    Schema para actualizar una orden existente. Permite modificar campos específicos.
    """
    ind_estado: Optional[int] = Field(None, description="Nuevo estado de la orden.", ge=1, le=3)
    des_observaciones: Optional[str] = Field(None, description="Nuevas observaciones para la orden.")
    # Otros campos que se puedan actualizar...

class OrderInDBBase(OrderBase):
    """
    Schema que representa la orden tal como está en la base de datos, incluyendo
    campos de auditoría y generados por el sistema.
    """
    id_orden: int = Field(..., description="ID único de la orden.")
    fec_pedido: datetime = Field(description="Fecha y hora en que se realizó el pedido.")
    
    usr_insert: Decimal = Field(..., description="Usuario que insertó el registro.")
    fec_insert: datetime = Field(..., description="Fecha de inserción del registro.")
    
    usr_update: Optional[int] = Field(None, description="Usuario que realizó la última actualización.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de la última actualización.")

    class Config:
        from_attributes = True

class Order(OrderInDBBase):
    """
    Schema para devolver una orden completa en la API.
    """
    pass

class OrderList(BaseModel):
    """
    Schema para devolver una lista de órdenes.
    """
    orders: List[Order]
    total: int

class CalculatePointsPerOrder(BaseModel):
    """
    Schema para calcular los puntos por orden.
    """
    val_total_pedido: Decimal = Field(..., description="Valor total de la orden.")