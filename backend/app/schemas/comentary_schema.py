"""
Módulo de Esquemas de Comentarios.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los comentarios.
Incluye esquemas para la creación, actualización y visualización de comentarios,
así como un esquema para mensajes de respuesta genéricos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class ComentaryBase(BaseModel):
    """
    Esquema Base para Comentarios.
    
    Contiene los campos comunes para la creación y visualización de comentarios.
    Utilizado como base para otros esquemas de comentarios más específicos.
    Atributos:
        id_categoria (Decimal): Identificador de la categoría.
        id_linea (Decimal): Identificador de la linea.
        id_sublinea(Decimal): Identificador de la sublinea.
        id_producto (Decimal): Identificador del producto.
        id_usuario (Decimal): Identificador del usuario.
        comentario (str): Comentario del usuario.
        usr_insert (Optional[Decimal]): Usuario que insertó el registro.
    """
    id_categoria: Decimal = Field(..., description="Identificador de la categoría.")
    id_linea: Decimal = Field(..., description="Identificador de la linea.")
    id_sublinea: Decimal = Field(..., description="Identificador de la sublinea.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    comentario: str = Field(..., description="Comentario del usuario.")
    usr_insert: Optional[Decimal] = Field(None, description="Usuario que insertó el registro.")
    
    class Config:
        from_attributes = True
        
class Comentary(ComentaryBase):
    """
    Esquema para la Visualización de Comentarios.
    
    Hereda de `ComentaryBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de comentarios.
    Incluye el `id_comentarios`.
    """
    id_comentario: Decimal
class ComentaryCreate(BaseModel):
    """
    Esquema para la Creación de Comentarios.
    
    Solo incluye los campos que el cliente debe enviar para crear un comentario.
    El id_usuario se toma automáticamente del token de autenticación.
    """
    id_categoria: Decimal = Field(..., description="Identificador de la categoría.")
    id_linea: Decimal = Field(..., description="Identificador de la linea.")
    id_sublinea: Decimal = Field(..., description="Identificador de la sublinea.")
    id_producto: Decimal = Field(..., description="Identificador del producto.")
    comentario: str = Field(..., description="Comentario del usuario.")
    
    class Config:
        from_attributes = True
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    
    Se utiliza para enviar mensajes simples de confirmación o error desde la API.
    """
    message: str