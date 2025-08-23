"""
Módulo de Esquemas de Movimientos de Inventario.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los movimientos de inventario.
Incluye esquemas para visualización de movimientos de inventario
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class MovementInventoryBase(BaseModel):
    """
    Esquema Base para Movimientos de Inventario.
    Contiene los campos comunes para la creación y visualización de movimientos de inventario.
    Atributos:
        id_movimiento (Decimal): Identificador del movimiento de inventario.
        id_categoria_producto (Decimal): Identificador de la categoría del producto.
        id_linea_producto (Decimal): Identificador de la línea del producto.
        id_sublinea_producto (Decimal): Identificador de la sublínea del producto.
        id_producto (Decimal): Identificador del producto.
        tipo_movimiento (str): Tipo de movimiento de inventario.
        cantidad (int): Cantidad de movimiento de inventario.
        costo_unitario_movimiento (Decimal): Costo unitario del movimiento de inventario.
        stock_anterior (int): Stock anterior del movimiento de inventario.
        saldo_costo_total_anterior_mov (Decimal): Saldo de costo total anterior del movimiento de inventario.
        stock_actual (int): Stock actual del movimiento de inventario.
        saldo_costo_total_actual_mov (Decimal): Saldo de costo total actual del movimiento de inventario.
        costo_promedio_ponderado_mov (Decimal): Costo promedio ponderado del movimiento de inventario.
        id_orden_usuario_detalle (Decimal): Identificador de la orden de usuario detalle.
        id_orden_compra (Decimal): Identificador de la orden de compra.
        descripcion (str): Descripción del movimiento de inventario.
        observaciones (str): Observaciones del movimiento de inventario.
        usr_insert (Decimal): Identificador del usuario que insertó el movimiento de inventario.
        fec_insert (datetime): Fecha de inserción del movimiento de inventario.
        usr_update (Decimal): Identificador del usuario que actualizó el movimiento de inventario.
        fec_update (datetime): Fecha de actualización del movimiento de inventario.
    """
    id_movimiento: Decimal = Field(..., description="Identificador del movimiento de inventario.")
    id_categoria_producto: Decimal = Field(..., description="Identificador de la categoría del producto.")
    id_linea_producto: Decimal = Field(..., description="Identificador de la línea del producto.")
    id_sublinea_producto: Decimal = Field(..., description="Identificador de la sublínea del producto.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    tipo_movimiento: str = Field(..., description="Tipo de movimiento de inventario.")
    cantidad: int = Field(..., description="Cantidad de movimiento de inventario.")
    costo_unitario_movimiento: Optional[Decimal] = Field(None, description="Costo unitario del movimiento de inventario.")
    stock_anterior: int = Field(..., description="Stock anterior del movimiento de inventario.")
    saldo_costo_total_anterior_mov: Optional[Decimal] = Field(None, description="Saldo de costo total anterior del movimiento de inventario.")
    stock_actual: int = Field(..., description="Stock actual del movimiento de inventario.")
    saldo_costo_total_actual_mov: Optional[Decimal] = Field(None, description="Saldo de costo total actual del movimiento de inventario.")
    costo_promedio_ponderado_mov: Optional[Decimal] = Field(None, description="Costo promedio ponderado del movimiento de inventario.")
    id_orden_usuario_detalle: Decimal = Field(..., description="Identificador de la orden de usuario detalle.")
    id_orden_compra: Optional[Decimal] = Field(None, description="Identificador de la orden de compra.")
    descripcion: str = Field(..., description="Descripción del movimiento de inventario.")
    observaciones: Optional[str] = Field(None, description="Observaciones del movimiento de inventario.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó el movimiento de inventario.")
    fec_insert: datetime = Field(..., description="Fecha de inserción del movimiento de inventario.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó el movimiento de inventario.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del movimiento de inventario.")
    
    class Config:
        from_attributes = True
        
class MovementInventory(MovementInventoryBase):
    """
    Esquema para la Visualización de Movimientos de Inventario.
    """
