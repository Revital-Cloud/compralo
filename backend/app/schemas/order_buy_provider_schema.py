"""
Módulo de Esquemas para la Gestión de Ordenes de Compra a Proveedores.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con las ordenes de compra a proveedores.
Incluye esquemas para la creación, actualización y visualización de ordenes de compra a proveedores,
así como un esquema para mensajes de respuesta genéricos.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class OrderBuyProviderBase(BaseModel):
    """
    Esquema Base para Ordenes de Compra a Proveedores.
    Contiene los campos comunes para la gestión de ordenes de compra a proveedores.
    Atributos:
        id_orden_compra (Decimal): Identificador de la orden de compra.
        id_proveedor (Decimal): Identificador del proveedor.
        fec_orden_compra (datetime): Fecha de la orden de compra.
        fec_esperada_entrega (datetime): Fecha de entrega esperada.
        observaciones_orden (str): Observaciones generales.
        id_categoria (Decimal): Identificador de la categoría.
        id_linea (Decimal): Identificador de la línea.
        id_sublinea (Decimal): Identificador de la sublínea.
        id_producto (Decimal): Identificador del producto.
        cantidad_solicitada (Decimal): Cantidad solicitada.
        cantidad_recibida (Decimal): Cantidad recibida.
        costo_unitario (Decimal): Costo unitario.
        subtotal_producto (Decimal): Subtotal del producto.
        ind_estado_producto (Decimal): Estado del producto.
        fec_recepcion_completa (datetime): Fecha de recepción completa.
        observaciones_producto (str): Observaciones específicas del producto.
        usr_insert (Decimal): Usuario que insertó el registro.
        fec_insert (datetime): Fecha de inserción.
        usr_update (Decimal): Usuario que actualizó el registro.
        fec_update (datetime): Fecha de actualización.
    """
    id_orden_compra: Decimal = Field(..., description="Identificador de la orden de compra.")
    id_proveedor: Decimal = Field(..., description="Identificador del proveedor.")
    fec_orden_compra: Optional[datetime] = Field(None, description="Fecha de la orden de compra.")
    fec_esperada_entrega: Optional[datetime] = Field(None, description="Fecha de entrega esperada.")
    observaciones_orden: Optional[str] = Field(None, description="Observaciones generales.")
    id_categoria: Decimal = Field(..., description="Identificador de la categoría.")
    id_linea: Decimal = Field(..., description="Identificador de la línea.")
    id_sublinea: Decimal = Field(..., description="Identificador de la sublínea.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    cantidad_solicitada: Decimal = Field(..., description="Cantidad solicitada.")
    cantidad_recibida: Optional[Decimal] = Field(None, description="Cantidad recibida.")
    costo_unitario: Decimal = Field(..., description="Costo unitario.")
    subtotal_producto: Optional[Decimal] = Field(None, description="Subtotal del producto.")
    ind_estado_producto: Optional[Decimal] = Field(None, description="Estado del producto.")
    fec_recepcion_completa: Optional[datetime] = Field(None, description="Fecha de recepción completa.")
    observaciones_producto: Optional[str] = Field(None, description="Observaciones específicas del producto.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    
class OrderBuyProvider(OrderBuyProviderBase):
    """
    Esquema para la Visualización de Ordenes de Compra a Proveedores.
    Hereda de `OrderBuyProviderBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de ordenes de compra a proveedores.

    """


class OrderBuyProviderCreate(BaseModel):
    """
    Esquema para la Creación de Ordenes de Compra a Proveedores.
    """
    id_orden_compra: Optional[Decimal] = Field(None, description="Identificador de la orden de compra.")
    id_proveedor: Decimal = Field(..., description="Identificador del proveedor.")
    fec_esperada_entrega: datetime = Field(..., description="Fecha de entrega esperada.")
    observaciones_orden: Optional[str] = Field(None, description="Observaciones generales.")
    id_categoria: Decimal = Field(..., description="Identificador de la categoría.")
    id_linea: Decimal = Field(..., description="Identificador de la línea.")
    id_sublinea: Decimal = Field(..., description="Identificador de la sublínea.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    cantidad_solicitada: Decimal = Field(..., description="Cantidad solicitada.")
    cantidad_recibida: Optional[Decimal] = Field(None, description="Cantidad recibida.")
    costo_unitario: Decimal = Field(..., description="Costo unitario.")
    ind_estado_producto: Optional[Decimal] = Field(None, description="Estado del producto.")
    observaciones_producto: Optional[str] = Field(None, description="Observaciones específicas del producto.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    
class OrderBuyProviderUpdate(BaseModel):
    """
    Esquema para la Actualización de Ordenes de Compra a Proveedores.
    """
    id_orden_compra: Optional[Decimal] = Field(None, description="Identificador de la orden de compra.")
    id_proveedor: Optional[Decimal] = Field(None, description="Identificador del proveedor.")
    fec_esperada_entrega: Optional[datetime] = Field(None, description="Fecha de entrega esperada.")
    observaciones_orden: Optional[str] = Field(None, description="Observaciones generales.")
    id_categoria: Optional[Decimal] = Field(None, description="Identificador de la categoría.")
    id_linea: Optional[Decimal] = Field(None, description="Identificador de la línea.")
    id_sublinea: Optional[Decimal] = Field(None, description="Identificador de la sublínea.")
    id_producto: Optional[Decimal] = Field(None, description="Identificador del producto.")
    cantidad_solicitada: Optional[Decimal] = Field(None, description="Cantidad solicitada.")
    cantidad_recibida: Optional[Decimal] = Field(None, description="Cantidad recibida.")
    costo_unitario: Optional[Decimal] = Field(None, description="Costo unitario.")
    ind_estado_producto: Optional[Decimal] = Field(None, description="Estado del producto.")
    observaciones_producto: Optional[str] = Field(None, description="Observaciones específicas del producto.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    """
    message: str