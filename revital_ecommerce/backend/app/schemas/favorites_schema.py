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
from typing import Optional, Dict, Any, Union

class FavoritesBase(BaseModel):
    """
    Esquema Base para Favoritos
    
    Contiene los campos comunes para la creación y visualización de favoritos.
    Utilizado como base para otros esquemas de favoritos más específicos.
    
    Atributos:
        id_usuario (DECIMAL(10)): Identificador del usuario que tiene el favorito.
        id_producto (DECIMAL(10)): Identificador del producto (tab_products.id).
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario que tiene el favorito")
    id_producto: Decimal = Field(..., description="Identificador del producto (tab_products.id)")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")

class FavoritesPostBody(BaseModel):
    """Esquema para el cuerpo de la solicitud de creación de favoritos (tab_favoritos usa product_id)."""
    id_producto: Decimal = Field(..., description="Identificador del producto (tab_products.id)")

class FavoritesCreate(BaseModel):
    """Esquema para crear un nuevo favorito (tab_favoritos: id_usuario, product_id)."""
    id_usuario: Decimal = Field(..., description="Identificador del usuario que tiene el favorito")
    id_producto: Decimal = Field(..., description="Identificador del producto (tab_products.id)")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")


class ResponseMessage(BaseModel):
    """
    Esquema para mensajes de respuesta genéricos
    
    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.
    """
    message: str

class FavoriteDetails(FavoritesBase):
    """
    Esquema para devolver los detalles de un favorito, incluyendo
    información del producto obtenido a través de un JOIN.
    """
    nom_producto: str
    img_producto: Optional[Union[str, Dict[str, Any], Any]] = None  # Puede ser string, JSON object o None
    val_precio: Decimal
    
    class Config:
        from_attributes = True