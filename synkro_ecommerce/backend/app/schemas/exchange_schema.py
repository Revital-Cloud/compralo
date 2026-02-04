"""
Módulo de Servicios para la Gestión de Canjes.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los canjes.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class ExchangeBase(BaseModel):
    """
    Esquema Base para Canjes.

    Contiene los campos comunes para la creación y visualización de canjes.
    Utilizado como base para otros esquemas de canjes más específicos.
    Atributos:
        id_usuario (Decimal): Identificador del usuario.
        id_descuento (Decimal): Identificador del descuento.
        puntos_utilizados (Decimal): Cantidad de puntos utilizados.
        id_orden_aplicado (Decimal): Identificador de la orden aplicada.
        fec_expiracion_canje (DateTime): Fecha de expiración del canje.
        fec_utilizacion (DateTime): Fecha de utilización del canje.
        usr_insert (Decimal): Identificador del usuario que insertó el registro.
        fec_insert (DateTime): Fecha de inserción del registro.
        usr_update (Decimal): Identificador del usuario que actualizó el registro.
        fec_update (DateTime): Fecha de actualización del registro.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    id_descuento: Decimal = Field(..., description="Identificador del descuento.")
    puntos_utilizados: Decimal = Field(..., description="Cantidad de puntos utilizados.")
    id_orden_aplicado: Optional[Decimal] = Field(None, description="Identificador de la orden aplicada.")
    fec_expiracion_canje: Optional[datetime] = Field(None, description="Fecha de expiración del canje.")
    fec_utilizacion: Optional[datetime] = Field(None, description="Fecha de utilización del canje.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó el registro.")

    class Config:
        from_attributes = True
        
class Exchange(ExchangeBase):
    """
    Esquema para la Visualización de Canjes.
    """
    id_canje: Decimal = Field(..., description="Identificador del canje.")
    
class ExchangePointsDiscount(BaseModel):
    """
    Esquema para el Canje de Puntos por Descuento.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    id_descuento: Decimal = Field(..., description="Identificador del descuento.")


class ExchangePointsDiscountResponse(BaseModel):
    """
    Esquema para la respuesta del canje de puntos por descuento.
    """
    success: bool = Field(..., description="Indica si el canje fue exitoso.")
    message: str = Field(..., description="Mensaje descriptivo del resultado.")
    id_canje: Optional[int] = Field(None, description="ID del canje creado.")
    descuento: Optional[str] = Field(None, description="Nombre del descuento canjeado.")
    puntos_utilizados: Optional[Decimal] = Field(None, description="Puntos utilizados en el canje.")
    puntos_restantes: Optional[Decimal] = Field(None, description="Puntos restantes del usuario.")
    puntos_necesarios: Optional[Decimal] = Field(None, description="Puntos necesarios para el canje, en caso de error.")
    puntos_disponibles: Optional[Decimal] = Field(None, description="Puntos disponibles del usuario, en caso de error.")

    class Config:
        from_attributes = True
        
    
class ApplyExchangeOrder(BaseModel):
    """
    Esquema para la Aplicación de un Canje de Orden.
    """
    id_canje: Decimal = Field(..., description="Identificador del canje.")
    id_orden: Decimal = Field(..., description="Identificador de la orden.")
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")


class CanjeDisponible(BaseModel):
    """
    Esquema para un canje disponible (canjeado pero no utilizado ni vencido).
    """
    id_canje: int = Field(..., description="Identificador del canje.")
    id_descuento: int = Field(..., description="Identificador del descuento.")
    nom_descuento: str = Field(..., description="Nombre del descuento.")
    puntos_utilizados: Optional[Decimal] = Field(None, description="Puntos utilizados en el canje.")
    fec_expiracion_canje: Optional[datetime] = Field(None, description="Fecha límite para usar el canje.")

    class Config:
        from_attributes = True


class ResponseMessage(BaseModel):
    """
    Esquema para la Respuesta de Mensajes.
    """
    message: str = Field(..., description="Mensaje de la respuesta.")
    
    