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
        id_producto (Decimal): Identificador del producto (tab_comentarios.product_id).
        id_usuario (Decimal): Identificador del usuario.
        comentario (str): Comentario del usuario.
        calificacion (int): Calificación del producto (1-5 estrellas).
    """
    id_producto: Decimal = Field(..., description="Identificador del producto (tab_products.id).")
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    comentario: str = Field(..., description="Comentario del usuario.")
    calificacion: int = Field(..., ge=1, le=5, description="Calificación del producto (1-5 estrellas).")
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
    Esquema para la Creación de Comentarios (tab_comentarios usa product_id).
    El id_usuario se toma del token de autenticación.
    """
    id_producto: Decimal = Field(..., description="Identificador del producto (tab_products.id).")
    id_orden: Decimal = Field(..., description="ID de la orden asociada al comentario.")
    comentario: str = Field(..., description="Comentario del usuario.")
    calificacion: int = Field(..., ge=1, le=5, description="Calificación del producto (1-5 estrellas).")
    
    class Config:
        from_attributes = True
    
class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta Genéricos.
    
    Se utiliza para enviar mensajes simples de confirmación o error desde la API.
    """
    message: str