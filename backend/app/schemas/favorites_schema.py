"""
Módulo de Esquemas de Favoritos

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los favoritos.
Incluye esquemas para la creación, actualización y visualización de favoritos.
así como un esquema para mensajes de respuesta genéricos.

"""
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional,Dict,Any

class FavoritesBase(BaseModel):
    """
    Esquema Base para Favoritos
    
    Contiene los campos comunes para la creación y visualización de favoritos.
    Utilizado como base para otros esquemas de favoritos más específicos.
    
    Atributos:
        id_usuario (DECIMAL(10)): Identificador del usuario que tiene el favorito.
        id_categoria_producto (DECIMAL(10)): Identificador del producto favorito.
        id_linea_producto (DECIMAL(10)): Identificador de la linea del producto favorito.
        id_sublinea_producto (DECIMAL(10)): Identificador de la sublinea del producto favorito.
        id_producto (DECIMAL(10)): Identificador del producto favorito.
    """
    
    id_usuario: Decimal = Field(..., description="Identificador del usuario que tiene el favorito")
    id_categoria_producto: Decimal = Field(..., description="Identificador del producto favorito")
    id_linea_producto: Decimal = Field(..., description="Identificador de la linea del producto favorito")
    id_sublinea_producto: Decimal = Field(..., description="Identificador de la sublinea del producto favorito")
    id_producto: Decimal = Field(..., description="Identificador del producto favorito")

class FavoritesCreate(BaseModel):
    """
    Esquema para crear un nuevo favorito
    
    Se utiliza para validar los datos antes de crear un nuevo favorito.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario que tiene el favorito")
    id_categoria_producto: Decimal = Field(..., description="Identificador del producto favorito")
    id_linea_producto: Decimal = Field(..., description="Identificador de la linea del producto favorito")
    id_sublinea_producto: Decimal = Field(..., description="Identificador de la sublinea del producto favorito")
    id_producto: Decimal = Field(..., description="Identificador del producto favorito")
    fecha_agregado: date = Field(..., description="Fecha de agregado del favorito")

    
class Favorites(FavoritesBase):
    """
    Esquema para la Visualización de Favoritos
    
    Hereda de 'FavoritesBase' y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de favoritos.
    Incluye la fecha de agregado como campo opcional.
    """
    fecha_agregado: Optional[date] = Field(None, description="Fecha de agregado del favorito")
    
    class Config:
        from_attributes = True  # Para permitir crear desde objetos de SQLAlchemy o diccionarios

class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos
    
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str