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
from datetime import datetime

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
    puntos_disponibles: Optional[int] = Field(None, description="Puntos disponibles.")
    puntos_totales_ganados: Optional[int] = Field(None, description="Puntos totales ganados.")
    puntos_totales_canjeados: Optional[int] = Field(None, description="Puntos totales canjeados.")
    usr_insert: Decimal = Field(..., description="Identificador del usuario que insertó el registro.")
    usr_update: Optional[Decimal] = Field(None, description="Identificador del usuario que actualizó el registro.")

    class Config:
        from_attributes = True


class PointsPerUser(PointsPerUserBase):
    """
    Esquema para la Visualización de Puntos por Usuario.
    """
    pass

class ResponseMessage(BaseModel):
    """
    Esquema para Mensajes de Respuesta.
    """
    message: str = Field(..., description="Mensaje de respuesta.")

class PointsMovement(BaseModel):
    """
    Esquema para un único movimiento en el historial de puntos.
    """
    id_movimiento_puntos: int
    tipo_movimiento_codigo: int
    tipo_movimiento_descripcion: str
    cantidad_puntos: Decimal
    puntos_disponibles_anterior: Decimal
    puntos_disponibles_actual: Decimal
    descripcion: str
    fec_movimiento: datetime
    id_orden_origen: Optional[int] = None
    id_descuento_canjeado: Optional[int] = None
    nombre_descuento: Optional[str] = None

    class Config:
        from_attributes = True

class PointsHistoryResponse(BaseModel):
    """
    Esquema para la respuesta del historial de puntos de un usuario.
    """
    success: bool
    id_usuario: Decimal
    historial: list[PointsMovement]

    class Config:
        from_attributes = True