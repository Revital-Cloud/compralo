from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal

class OrderBuyProviderBase(BaseModel):
    """
    Esquema para la orden de compra a proveedor.
    """
    id_orden_compra: Decimal = Field(..., description="ID de la orden de compra")
    id_proveedor: Decimal = Field(..., description="ID del proveedor")
    fec_esperada_entrega: date = Field(..., description="Fecha de la orden de compra")
    val_total_compra: Optional[Decimal] = Field(description="Total de la orden de compra")
    ind_estado_compra: Decimal = Field(..., description="Estado de la orden de compra")
    observaciones: str = Field(..., description="Detalles adicionales de la orden de compra")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que inserta la orden de compra")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualiza la orden de compra")

    class Config:
        orm_mode = True
        form_attributes = True
        #schema_extra sirve para mostrarlo en la documentación de OpenAPI
        schema_extra = { 
            "example": {
                "id_orden_compra": 1,
                "id_proveedor": 123,
                "fec_esperada_entrega": "2023-10-01",
                "val_total_compra": 1000.00,
                "ind_estado_compra": 1,
                "observaciones": "Orden de compra para materiales de oficina",
                "usr_insert": 456,
                "usr_update": 456
            }
        }
        
        
#post
class OrderBuyProviderCreate(OrderBuyProviderBase):
    """
    Esquema para la creación de una orden de compra a proveedor.
    Hereda de `OrderBuyProviderBase` y se utiliza para validar los datos
    al crear una nueva orden de compra.
    """
    pass
