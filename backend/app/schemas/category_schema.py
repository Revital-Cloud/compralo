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
        ind_activo (bool): Indica si la categoría está activa.
    """
    nom_categoria: str = Field(..., description="Nombre de la categoría.")
    ind_activo: bool = Field(..., description="Indica si la categoría está activa.")
    
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
    """
    nom_categoria: Optional[str] = Field(None, description="Nombre de la categoría.")
    ind_activo: Optional[bool] = Field(None, description="Indica si la categoría está activa.")

# Esquema para llamar una sola categoría
class Category(CategoryBase):
    """
    Esquema para la respuesta de una categoría.
    Incluye el ID de la categoría junto con los campos base.
    """
    id_categoria: Decimal = Field(..., description="Identificador único para la categoría.")
        
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