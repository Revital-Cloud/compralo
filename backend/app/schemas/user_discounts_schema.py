"""
Módulo de Esquemas de Descuentos por Usuario.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los descuentos por usuario.
Incluye esquemas para la creación, actualización y visualización de descuentos por usuario,
así como un esquema para mensajes de respuesta genéricos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class UserDiscountsBase(BaseModel):
    """
    Esquema Base para Descuentos por Usuario.

    Contiene los campos comunes para la creación y visualización de descuentos por usuario.
    Utilizado como base para otros esquemas de descuentos por usuario más específicos.
    Atributos:
        id_usuario (Decimal): Identificador del usuario.
        id_descuento (Decimal): Identificador del descuento.
        usr_insert (Decimal): Identificador del usuario que insertó el registro.
    
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    id_descuento: Decimal = Field(..., description="Identificador del descuento.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó el registro.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó el registro.")

    class Config:
        from_attributes = True

class UserDiscounts(UserDiscountsBase):
    """
    Esquema para la Visualización de Descuentos por Usuario.

    Hereda de `UserDiscountsBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de descuentos por usuario.
    Incluye el `id_usuario` y los campos de auditoría.
    """

class ValidateDiscountRequest(BaseModel):
    id_descuento: Decimal = Field(..., description="Identificador del descuento.")
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    codigo_ingresado: Optional[str] = Field(None, description="Código de descuento ingresado por el usuario.")
    usr_insert: Optional[Decimal] = Field(None, description="Identificador del usuario que insertó el registro.")

class ValidateDiscountResponse(BaseModel):
    aplicable: bool = Field(..., description="Indica si el descuento es aplicable")
    mensaje: str = Field(..., description="Mensaje descriptivo del resultado de la validación")


class ResponseMessage(BaseModel):
    message: str = Field(..., description="Mensaje descriptivo del resultado de la operación")