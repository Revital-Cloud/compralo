# Esquemas Pydantic (validación de datos, request/response)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any # Usaremos Dict o Any para JSONB
from decimal import Decimal # Para campos DECIMAL si se requiere precisión
from datetime import datetime

# Esquema Base para Categorías
class CategoryBase(BaseModel):
    """
    Esquema Base para Categorías.

    Contiene los campos comunes para la creación y visualización de categorías.
    Utilizado como base para otros esquemas de categorías más específicos.

    Atributos:
        nom_categoria (str): Nombre de la categoría.
        usr_insert (Optional[Decimal]): Usuario que insertó el registro.
    """
    nom_categoria: str = Field(..., description="Nombre de la categoría.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la categoría está activa.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    fec_insert: Optional[datetime] = Field(None, description="Fecha de inserción del registro.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")
    fec_update: Optional[datetime] = Field(None, description="Fecha de actualización del registro.")
    
    class Config:
        from_attributes = True
      
# Esquema para la Creación de Categorías
class CategoryCreate(CategoryBase):
    """
    Esquema para la Creación de Categorías.
    Hereda de `CategoryBase` y se utiliza para validar los datos
    al crear una nueva categoría.
    """ 
    pass

# Esquema para la Actualización de Categorías
class CategoryUpdate(BaseModel):
    """
    Esquema para la Actualización de Categorías.
    Permite actualizar campos opcionales de una categoría existente.

    Atributos:
        nom_categoria (Optional[str]): Nombre de la categoría.
        ind_activo (Optional[bool]): Indica si la categoría está activa.
        usr_update (Optional[Decimal]): Usuario que actualizó el registro.
    """
    nom_categoria: Optional[str] = Field(None, description="Nombre de la categoría.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la categoría está activa.")
    usr_update: Optional[Decimal] = Field(None, description="Usuario que actualizó el registro.")

# Esquema para llamar una sola categoría
class Category(CategoryBase):
    """
    Esquema para la respuesta de una categoría.
    Incluye el ID de la categoría junto con los campos base.
    """
    id_categoria: Decimal = Field(..., description="Identificador único para la categoría.")
        
# Esquema para toggle (activar/desactivar)
class ToggleRequest(BaseModel):
    """
    Esquema para solicitudes de activar/desactivar.
    
    Utilizado en endpoints toggle para activar o desactivar entidades.
    
    Atributos:
        activar (bool): True para activar, False para desactivar.
    """
    activar: bool = Field(..., description="True para activar, False para desactivar.")

# Mensajitos para las respuesta api en categorias
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.

    Se utiliza para enviar mensajes simples de confirmación o error
    desde la API.

    Atributos:
        message (str): El mensaje a ser enviado en la respuesta.
    """
    message: str