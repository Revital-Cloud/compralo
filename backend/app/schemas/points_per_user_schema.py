"""
Módulo de Esquemas de Puntos por Usuario.

Define los modelos Pydantic utilizados para la validación de datos
en las solicitudes y respuestas de la API relacionadas con los puntos por usuario.
Incluye esquemas para la creación, actualización y visualización de puntos por usuario,
así como un esquema para mensajes de respuesta genéricos.
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
class PointsPerUserBase(BaseModel):
    """
    Esquema Base para Puntos por Usuario.

    Contiene los campos comunes para la creación y visualización de puntos por usuario.
    Utilizado como base para otros esquemas de puntos por usuario más específicos.
    Atributos:
        id_usuario (Decimal): Identificador del usuario.
        usr_insert (Decimal): Identificador del usuario que insertó el registro.
    """
    id_usuario: Decimal = Field(..., description="Identificador del usuario.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó el registro.")

    class Config:
        from_attributes = True

class PointsPerUser(PointsPerUserBase):
    """
    Esquema para la Visualización de Puntos por Usuario.

    Hereda de `PointsPerUserBase` y se utiliza como el modelo de respuesta
    principal para los endpoints que devuelven información de puntos por usuario.
    Incluye el `id_usuario` y los campos de auditoría.
    """

class CalculatePointsPerShop(BaseModel):
