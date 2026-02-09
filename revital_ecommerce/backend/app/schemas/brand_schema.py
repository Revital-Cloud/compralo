"""
Módulo de Esquemas para Marcas.

Este módulo define los esquemas de datos para las marcas, incluyendo
las operaciones de creación, actualización y visualización.
Incluye esquemas para la creación, actualización y visualización de marcas,
así como un esquema para mensajes de respuesta genéricos.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class BrandBase(BaseModel):
    """
    Esquema Base para Marcas.
    
    Contiene los campos comunes para la creación y visualización de marcas.
    Utilizado como base para otros esquemas de marcas más específicos.

    Atributos:
        nom_marca (str): Nombre de la marca.
        ind_activo (Optional[bool]): Indica si la marca está activa.
    """
    nom_marca: str = Field(..., description="Nombre de la marca")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    class Config:
        from_attributes = True
    
class Brand(BrandBase):
    """
    Esquema para la Visualización de Marcas.
    
    Hereda de `BrandBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de marcas.
    Incluye el `id_marca` y los campos de auditoría.
    """
    id_marca: Decimal
    ind_activo: Optional[bool] = Field(None, description="Indica si la marca está activa.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")
    
    
class BrandCreate(BrandBase):
    """
    Esquema para la Creación de Marcas.
    
    Define los campos requeridos para crear una nueva marca.

    """
    pass
    
class BrandUpdate(BaseModel):
    """
    Esquema para la Actualización de Marcas.
    
    Define los campos que pueden ser actualizados para una marca existente.
    Todos los campos son opcionales, permitiendo actualizaciones parciales.
    """
    nom_marca: Optional[str] = Field(None, description="Nombre de la marca.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la marca está activa.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

# Esquema para toggle (activar/desactivar)
class ToggleRequest(BaseModel):
    """
    Esquema para solicitudes de activar/desactivar marcas.
    
    Utilizado en endpoints toggle para activar o desactivar marcas.
    
    Atributos:
        activar (bool): True para activar, False para desactivar.
    """
    activar: bool = Field(..., description="True para activar, False para desactivar.")

class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str
