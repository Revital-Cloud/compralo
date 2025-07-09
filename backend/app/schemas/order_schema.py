from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal

class OrderCreate(BaseModel):
    id_orden: Decimal = Field(description="ID de la orden") 
    fec_pedido: datetime = Field(default_factory=datetime.now, description="Fecha del pedido")
    id_usuario: Decimal = Field(..., description="ID del usuario que realiza el pedido, fk a tab_usuarios.id_usuario")
    val_total_productos: Decimal = Field(..., description="Valor total de los productos en la orden")
    val_total_descuentos: Decimal = Field(...)
    val_total_pedido: Decimal = Field(...)
    ind_estado: Decimal = Field(...)
    ind_metodo_pago: Decimal = Field(...)
    id_descuento: Decimal = Field()
    detalle_descuentos_aplicados: Dict = Field()
    des_observaciones: str = Field()
    #auditoria
    usr_insert: Decimal = Field()
    usr_update: Optional[Decimal] = Field(default=None)
     
    